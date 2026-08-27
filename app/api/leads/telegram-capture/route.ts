import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

let tableReady = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureTable(sql: any) {
  if (tableReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS calculator_leads (
      id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      telegram     TEXT NOT NULL,
      source       TEXT NOT NULL,
      context_hint TEXT,
      ip           TEXT,
      status       TEXT DEFAULT 'new',
      UNIQUE (telegram, source)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_calc_leads_created ON calculator_leads(created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_calc_leads_status ON calculator_leads(status)`;
  tableReady = true;
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const MANAGER_CHAT_ID = process.env.TELEGRAM_MANAGER_CHAT_ID || process.env.TELEGRAM_CHAT_ID || "8979087725";

async function notifyManager(username: string, source: string, hint?: string) {
  if (!BOT_TOKEN) return;
  const sourceLabel = source === "wb-margin-calculator"
    ? "📊 Калькулятор маржи WB"
    : "📦 Калькулятор доставки";

  const text =
    `🔥 *Новый лид с калькулятора*\n\n` +
    `${sourceLabel}\n` +
    `Telegram: @${username}\n` +
    (hint ? `Контекст: ${hint}\n` : "") +
    `\n→ Написать: https://t.me/${username}`;

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: MANAGER_CHAT_ID,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { username, source, contextHint } = await req.json();
    if (!username || username.length < 3) {
      return NextResponse.json({ error: "invalid_username" }, { status: 400 });
    }

    const clean = username.replace(/^@/, "").trim();
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;

    const sql = neon(process.env.DATABASE_URL!);
    await ensureTable(sql);

    await sql`
      INSERT INTO calculator_leads (telegram, source, context_hint, ip)
      VALUES (${clean}, ${source}, ${contextHint || null}, ${ip})
      ON CONFLICT (telegram, source) DO NOTHING
    `;

    await notifyManager(clean, source, contextHint);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("telegram-capture error:", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
