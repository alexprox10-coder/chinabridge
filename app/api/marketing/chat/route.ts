import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { saveMessage, getConversation } from "@/lib/marketing/db";
import { buildMarketingSystemPrompt } from "@/lib/marketing/ai-context";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("cb_admin")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { message?: string; sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  const sessionId = (body.sessionId ?? "").trim() || "default";
  if (!message) return NextResponse.json({ error: "empty" }, { status: 400 });

  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ error: "missing_openrouter_key" }, { status: 500 });
  }

  // Persist the user message first so it survives a failed generation.
  await saveMessage(sessionId, "user", message);

  const systemPrompt = await buildMarketingSystemPrompt(sessionId);

  // Recent history for the API call — drop the message we just saved.
  const history = await getConversation(sessionId, 10);
  const conversationHistory = history
    .slice(0, -1)
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));

  let openrouterRes: Response;
  try {
    openrouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://chinabridge.pro",
        "X-Title": "ChinaBridge Marketing AI",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        stream: true,
        max_tokens: 2500,
        temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory,
          { role: "user", content: message },
        ],
      }),
    });
  } catch {
    return NextResponse.json({ error: "ai_unreachable" }, { status: 502 });
  }

  if (!openrouterRes.ok || !openrouterRes.body) {
    return NextResponse.json({ error: "ai_error" }, { status: 502 });
  }

  let fullResponse = "";
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = openrouterRes.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Keep the trailing partial line in the buffer.
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (!data || data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const delta: string | undefined = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                fullResponse += delta;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(delta)}\n\n`));
              }
            } catch {
              /* skip keep-alive comments and malformed chunks */
            }
          }
        }
      } catch {
        /* upstream aborted — fall through and close cleanly */
      } finally {
        try {
          reader.releaseLock();
        } catch {
          /* already released */
        }
        if (fullResponse.trim()) {
          await saveMessage(sessionId, "assistant", fullResponse.trim()).catch(() => {});
        }
        try {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch {
          /* controller already closed by client disconnect */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
