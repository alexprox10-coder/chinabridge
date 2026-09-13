import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const maxDuration = 60;

const OR_KEY = () => process.env.OPENROUTER_API_KEY ?? "";

const SYSTEM = `Ты — Claude, AI-ассистент команды ChinaBridge (alexprox10@gmail.com).
Ты работаешь через chinabridge.pro/admin/ai-chat когда недоступен Claude Code.
Помни: ты имеешь ПОЛНЫЙ контекст проекта и должен работать как полноценная замена Claude Code.

=== ПРОЕКТ ===
ChinaBridge — AI-платформа для импорта товаров из Китая в KZ и RU.
Сайт: chinabridge.pro
Стек: Next.js 15.5 App Router, Neon Postgres (@neondatabase/serverless), Vercel, OpenRouter API
Репо: github.com/alexprox10-coder/chinabridge
Admin: chinabridge.pro/admin

=== АРХИТЕКТУРА ===
- /app/admin/* — все admin страницы (CRM, Outbound, AI Sales, Analytics)
- /app/api/* — API routes (Next.js Route Handlers)
- /lib/outbound/* — Outbound AI engine (scoring, messaging, china-match, economics)
- /lib/db/schema.ts — Drizzle ORM schema
- Neon Postgres — основная БД
- OpenRouter — AI вызовы (claude-haiku-4-5, gpt-4o-mini)

=== OUTBOUND CRM v1.1 (только что сделали) ===
Стадии лида: FOUND→ENRICHED→ANALYZED→PRODUCTS_FOUND→CHINA_MATCHED→ECONOMICS_READY→SCORED→PERSONALIZED→READY_TO_CONTACT→APPROVED→CONTACTED→REPLIED→QUALIFIED→HOT→QUOTE→DEAL
Новые поля: evidence_score(0-100), evidence_data, recommended_offer, next_best_action, lead_quality
Evidence Score: CONFIRMED(≥80), PROBABLE(≥60), INFERRED(≥35), WEAK
Approve → APPROVED, отдельная кнопка Send → CONTACTED
Opportunity Score: исправлена инфляция (без partial credit при отсутствии данных)

=== ТРАФИК (текущие задачи) ===
- VK Ads: кампании для KZ авто-аксессуары и RU электроника
- Главная проблема: 7.9K users/неделю НО 16с активного времени, 1.15 страниц/сеанс
- CPA трафик 84% от VK — попадает на главную, не конвертит
- Нужен отдельный лендинг для CPA трафика
- Kaspi, WB, Ozon — три маркетплейса (всегда упоминать все три)
- KZ = серая доставка только; RU белая через Суньфэньхэ

=== ПАРТНЁРЫ ===
- АнтонКит (Гуанчжоу) — выкупает товар с 1688/Alibaba/Taobao
- Тарифы авто: $1.30-1.90/кг→клиенту $2.50/кг (KZ, 5-8 дней)
- Тарифы авиа: ~$20/кг→клиенту $23/кг

=== ПРИОРИТЕТЫ СЕЙЧАС ===
1. Настройка трафика VK Ads + отдельный лендинг CPA
2. Outbound AI — запустить enrich v2 на лидах, проверить Evidence Score
3. Telegram боты: основной (@8979087725) + LID бот (Chinabridge лиды)
4. AI Sales Department — главный долгосрочный приоритет

=== ПРАВИЛА ===
- Отвечай по-русски
- Код и технические термины — на английском
- Конкретные действия, не абстракции
- Если просят изменить код — пиши готовый код для вставки
- Помни всю нашу историю разговоров (она хранится в БД и передаётся в контексте)`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureTable(sql: any) {
  await sql`
    CREATE TABLE IF NOT EXISTS ai_chat_history (
      id SERIAL PRIMARY KEY,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      model TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

// GET — load history
export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    await ensureTable(sql);
    const rows = await sql`
      SELECT id, role, content, model, created_at
      FROM ai_chat_history
      ORDER BY created_at ASC
      LIMIT 500
    ` as { id: number; role: string; content: string; model: string; created_at: string }[];
    return NextResponse.json({ ok: true, messages: rows });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

// DELETE — clear history
export async function DELETE() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`TRUNCATE TABLE ai_chat_history RESTART IDENTITY`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

// POST — send message, stream response, save both to DB
export async function POST(req: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    await ensureTable(sql);

    const { message, model = "anthropic/claude-opus-4-5" } = await req.json() as {
      message: string;
      model?: string;
    };

    if (!message?.trim()) {
      return NextResponse.json({ ok: false, error: "message required" }, { status: 400 });
    }

    // Save user message first
    await sql`INSERT INTO ai_chat_history (role, content, model) VALUES ('user', ${message}, ${model})`;

    // Load last 80 messages for context (enough for 3 days of work)
    const history = await sql`
      SELECT role, content FROM ai_chat_history
      ORDER BY created_at DESC LIMIT 80
    ` as { role: string; content: string }[];
    history.reverse();

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OR_KEY()}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://chinabridge.pro",
        "X-Title": "ChinaBridge Admin AI",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM },
          ...history.map(m => ({ role: m.role, content: m.content })),
        ],
        max_tokens: 4096,
        stream: true,
      }),
    });

    if (!res.ok || !res.body) {
      const err = await res.text();
      return NextResponse.json({ ok: false, error: err }, { status: res.status });
    }

    const encoder = new TextEncoder();
    let fullText = "";

    const readable = new ReadableStream({
      async start(controller) {
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split("\n")) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (data === "[DONE]") {
                if (fullText) {
                  await sql`INSERT INTO ai_chat_history (role, content, model) VALUES ('assistant', ${fullText}, ${model})`.catch(() => {});
                }
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                continue;
              }
              try {
                const parsed = JSON.parse(data);
                const text = parsed.choices?.[0]?.delta?.content ?? "";
                if (text) {
                  fullText += text;
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
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
