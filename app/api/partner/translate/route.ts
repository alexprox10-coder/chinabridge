import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { text, target } = await req.json().catch(() => ({ text: "", target: "ru" }));
  if (!text?.trim()) return NextResponse.json({ translation: "" });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return NextResponse.json({ translation: "" });

  const prompt = target === "zh"
    ? `Translate the following Russian text to Chinese (Simplified). Return only the translation, no explanations:\n\n${text}`
    : `Translate the following Chinese text to Russian. Return only the translation, no explanations:\n\n${text}`;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
      }),
    });

    if (!res.ok) return NextResponse.json({ translation: "" });
    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    const translation = data.choices?.[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ translation });
  } catch {
    return NextResponse.json({ translation: "" });
  }
}
