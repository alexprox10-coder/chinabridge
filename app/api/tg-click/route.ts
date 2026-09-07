import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const source = (body.source ?? "unknown").slice(0, 100);
  const category = (body.category ?? "").slice(0, 50);
  const button = (body.button ?? "").slice(0, 50);

  const token = process.env.NEW_LK_BOT_TOKEN ?? process.env.CHINABRIDGE_LID_BOT_TOKEN ?? "";
  const chatId = process.env.TELEGRAM_MANAGER_CHAT_ID ?? "8979087725";

  if (token) {
    const categoryLine = category ? `\n📂 Категория: ${category}` : "";
    const buttonLine = button ? `\n🔘 Кнопка: ${button}` : "";
    const text = `👆 <b>Клик по Telegram-кнопке!</b>${categoryLine}${buttonLine}\n🌐 Источник: ${source}\n\n⚡ Клиент открыл бот — зайди и напиши ему!`;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
      signal: AbortSignal.timeout(5000),
    }).catch(() => null);
  }

  return NextResponse.json({ ok: true });
}
