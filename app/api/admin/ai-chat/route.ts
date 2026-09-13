import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const OR_KEY = () => process.env.OPENROUTER_API_KEY ?? "";

const SYSTEM = `Ты — AI-ассистент команды ChinaBridge. Помогаешь с:
- Настройкой трафика (VK Ads, таргетинг, кампании, аналитика)
- CRM и продажами (лиды, воронка, Outbound AI)
- Разработкой (Next.js, PostgreSQL, API routes, Vercel)
- Бизнес-стратегией (Казахстан, Россия, логистика из Китая)
- Любыми задачами по проекту chinabridge.pro

Отвечай по-русски. Код и технические термины — на английском. Будь конкретным и практичным.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, model = "anthropic/claude-opus-4-5" } = await req.json() as {
      messages: { role: "user" | "assistant"; content: string }[];
      model?: string;
    };

    if (!messages?.length) {
      return NextResponse.json({ ok: false, error: "messages required" }, { status: 400 });
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OR_KEY()}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://chinabridge.pro",
        "X-Title": "ChinaBridge Admin AI Chat",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: SYSTEM }, ...messages],
        max_tokens: 4096,
        stream: true,
      }),
    });

    if (!res.ok || !res.body) {
      const err = await res.text();
      return NextResponse.json({ ok: false, error: err }, { status: res.status });
    }

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (data === "[DONE]") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                continue;
              }
              try {
                const parsed = JSON.parse(data);
                const text = parsed.choices?.[0]?.delta?.content ?? "";
                if (text) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                }
              } catch { /* ignore */ }
            }
          }
          controller.close();
        } catch (e) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(e) })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
