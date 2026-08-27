import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const MANAGER_CHAT_ID = process.env.MANAGER_CHAT_ID || "8979087725";

async function notifyManager(username: string, source: string, hint?: string) {
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

    // Save to Supabase
    const { error } = await supabase.from("calculator_leads").insert({
      telegram: clean,
      source,
      context_hint: contextHint || null,
      ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
    });

    // Ignore duplicate error (unique constraint on telegram+source)
    if (error && !error.message.includes("unique")) {
      console.error("Supabase insert error:", error);
    }

    // Notify manager
    await notifyManager(clean, source, contextHint);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("telegram-capture error:", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
