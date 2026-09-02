import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPPORT_BOT_TOKEN = process.env.CHINABRIDGE_SUPPORT_BOT_TOKEN ?? "";
const NEW_LK_BOT_TOKEN  = process.env.NEW_LK_BOT_TOKEN ?? "";
const LID_BOT_TOKEN     = process.env.CHINABRIDGE_LID_BOT_TOKEN ?? "";
const PARSER_BOT_TOKEN  = process.env.TELEGRAM_BOT_TOKEN ?? "";
const MANAGER_CHAT_ID   = process.env.TELEGRAM_MANAGER_CHAT_ID ?? "8979087725";
const notifyToken = NEW_LK_BOT_TOKEN || PARSER_BOT_TOKEN || LID_BOT_TOKEN || SUPPORT_BOT_TOKEN;

const GREETING = `👋 Добро пожаловать в ChinaBridge!

Мы занимаемся доставкой товаров из Китая в Россию и Казахстан — WB, Ozon, Kaspi и опт.

Напишите, что хотите привезти — менеджер ответит в течение 5 минут.`;

const GREETING_BUTTONS = {
  inline_keyboard: [
    [
      { text: "📢 Подписаться на канал", url: "https://t.me/chinabridgeline" },
    ],
    [
      { text: "🧮 Рассчитать стоимость", url: "https://chinabridge.pro/ai-calculator" },
    ],
  ],
};

async function sendViaSupport(chatId: number | string, text: string, replyMarkup?: object) {
  if (!SUPPORT_BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${SUPPORT_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      ...(replyMarkup && { reply_markup: replyMarkup }),
    }),
  }).catch(() => null);
}

export async function POST(req: NextRequest) {
  if (!SUPPORT_BOT_TOKEN) return NextResponse.json({ ok: true });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: true });

  const message = body.message ?? body.edited_message;
  if (!message) return NextResponse.json({ ok: true });

  const chatId:    number = message.chat.id;
  const text:      string = message.text ?? "";
  const firstName: string = message.from?.first_name ?? "клиент";
  const username:  string = message.from?.username ? `@${message.from.username}` : `id: ${chatId}`;

  if (!text) return NextResponse.json({ ok: true });

  const h = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // /start — always send greeting with buttons, don't forward to manager
  if (text.startsWith("/start")) {
    await sendViaSupport(chatId, GREETING, GREETING_BUTTONS);
    return NextResponse.json({ ok: true });
  }

  // Track first real message for auto-reply
  let isFirstMessage = false;
  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      CREATE TABLE IF NOT EXISTS support_greeted (
        chat_id BIGINT PRIMARY KEY,
        greeted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    const inserted = await sql`
      INSERT INTO support_greeted (chat_id) VALUES (${chatId})
      ON CONFLICT (chat_id) DO NOTHING
      RETURNING chat_id
    `;
    isFirstMessage = inserted.length > 0;
  } catch { isFirstMessage = true; }

  if (isFirstMessage) {
    await sendViaSupport(chatId, "✅ Сообщение получено! Менеджер ответит в течение 5 минут.");
  }

  // Forward to manager
  const replyLink = message.from?.username ? `t.me/${message.from.username}` : `tg://user?id=${chatId}`;
  await fetch(`https://api.telegram.org/bot${notifyToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: MANAGER_CHAT_ID,
      text: `💬 <b>Клиент в поддержке: ${h(firstName)} (${h(username)})</b>\n\n${h(text)}\n\n📲 Написать: ${replyLink}`,
      parse_mode: "HTML",
    }),
  }).catch(() => null);

  return NextResponse.json({ ok: true });
}
