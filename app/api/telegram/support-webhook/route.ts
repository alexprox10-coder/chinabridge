import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPPORT_BOT_TOKEN = process.env.CHINABRIDGE_SUPPORT_BOT_TOKEN ?? "";
const MONITOR_BOT_TOKEN = process.env.MONITOR_BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN ?? "";
const MANAGER_CHAT_ID   = process.env.TELEGRAM_MANAGER_CHAT_ID ?? "8979087725";

async function sendViaSupport(chatId: number | string, text: string) {
  if (!SUPPORT_BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${SUPPORT_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
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

  // Track first message for auto-reply
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
    await sendViaSupport(chatId, "✅ Сообщение получено! Менеджер ChinaBridge ответит в течение 5 минут.");
  }

  // Forward to manager
  const notifyToken = MONITOR_BOT_TOKEN || SUPPORT_BOT_TOKEN;
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
