import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const maxDuration = 60;

/* Builds a system prompt tailored to the subscriber's business context */
function buildSystemPrompt(companyName?: string): string {
  const company = companyName ? `Компания подписчика: ${companyName}. ` : "";
  return `Ты — AI-директор по маркетингу для бизнеса, который использует платформу ChinaBridge.

${company}Твоя задача — помогать подписчику развивать его бизнес на основе импортных товаров из Китая.

О платформе ChinaBridge (используй как инструмент):
- Импорт под ключ: поиск поставщика, проверка, выкуп, логистика, таможня
- AI Product Finder: находит товары с ценами и поставщиками
- AI Supplier Finder: проверяет поставщиков на 1688 и Alibaba
- Калькулятор поставки: считает полную себестоимость
- Тарифы: комиссия от 5%, доставка от $2.5/кг, таможня от 11 000 ₽

Твои обязанности как Marketing AI директора:
1. Анализировать текущую маркетинговую ситуацию подписчика
2. Предлагать стратегии продвижения товаров на WB, Ozon, Kaspi, в офлайне
3. Помогать с выбором ниш и товаров для продажи
4. Советовать по SEO на маркетплейсах (контент, карточки, цены, отзывы)
5. Строить медиапланы и рекламные стратегии
6. Находить B2B-клиентов и каналы сбыта
7. Помогать с позиционированием, брендингом, ценообразованием
8. Анализировать конкурентов и рыночные тренды
9. Планировать контент для соцсетей и Telegram-канала
10. Рассчитывать юнит-экономику (себестоимость → маркетплейс → прибыль)

ПРАВИЛА:
- Отвечай на русском языке
- Давай конкретные практические советы с цифрами
- Когда считаешь юнит-экономику — показывай расчёт пошагово
- Не выдумывай факты о рынке — если не знаешь точно, скажи "по открытым данным"
- Если тема не связана с маркетингом/продажами/бизнесом — мягко верни к делу
- Учитывай особенности российского и казахстанского рынков
- Предлагай реальные каналы продвижения (конкретные Telegram-каналы, блогеров, рекламные инструменты)`;
}

export async function POST(req: NextRequest) {
  /* Check subscriber plan cookie — any non-empty cb_plan is acceptable */
  const cookieStore = await cookies();
  const plan = cookieStore.get("cb_plan")?.value;
  const sessionToken = cookieStore.get("cb_tenant_session")?.value;
  if (!plan && !sessionToken) {
    return NextResponse.json({ error: "subscription_required" }, { status: 403 });
  }

  let body: { message?: string; history?: { role: string; content: string }[]; company?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (!message) return NextResponse.json({ error: "empty" }, { status: 400 });

  const history = (body.history ?? [])
    .slice(-10)
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ error: "missing_key" }, { status: 500 });
  }

  let openrouterRes: Response;
  try {
    openrouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://chinabridge.pro",
        "X-Title": "ChinaBridge Marketing AI — Subscriber",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        stream: true,
        max_tokens: 2000,
        temperature: 0.45,
        messages: [
          { role: "system", content: buildSystemPrompt(body.company) },
          ...history,
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
              if (delta) controller.enqueue(encoder.encode(`data: ${JSON.stringify(delta)}\n\n`));
            } catch {}
          }
        }
      } catch { /* upstream abort */ } finally {
        try { reader.releaseLock(); } catch {}
        try {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch {}
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
