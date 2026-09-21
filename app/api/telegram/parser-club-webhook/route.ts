// Parser Club → Intake Pipeline
// Receives Telegram notifications from ParserClubLid_bot
// Forwards each message to /api/outbound/intake for AI qualification

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOT_TOKEN = process.env.PARSER_CLUB_BOT_TOKEN ?? "";
const INTAKE_SECRET = process.env.OUTBOUND_WEBHOOK_SECRET ?? "";
const INTAKE_URL = "https://chinabridge.pro/api/outbound/intake";

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!BOT_TOKEN) return NextResponse.json({ ok: true });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: true });

  const message = body.message ?? body.channel_post ?? body.edited_message;
  if (!message) return NextResponse.json({ ok: true });

  const text: string = message.text ?? message.caption ?? "";
  if (!text || text.length < 5) return NextResponse.json({ ok: true });

  // Skip bot commands
  if (text.startsWith("/")) return NextResponse.json({ ok: true });

  const username = message.from?.username ?? message.chat?.username ?? "";
  const firstName = message.from?.first_name ?? "";
  const chatTitle = message.chat?.title ?? message.chat?.username ?? "parser_club";
  const messageId = String(message.message_id ?? "");
  const chatId = String(message.chat?.id ?? "");

  // Build source URL if possible
  const sourceUrl = username
    ? `https://t.me/${username}/${messageId}`
    : message.chat?.username
    ? `https://t.me/${message.chat.username}/${messageId}`
    : "";

  await fetch(INTAKE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": INTAKE_SECRET,
    },
    body: JSON.stringify({
      text,
      source: "parser_club",
      source_type: "telegram_parser",
      message_id: `pc_${chatId}_${messageId}`,
      username,
      author_name: firstName,
      chat_name: chatTitle,
      chat_id: chatId,
      source_url: sourceUrl,
      chat_url: message.chat?.username ? `https://t.me/${message.chat.username}` : "",
    }),
  }).catch(() => null);

  return NextResponse.json({ ok: true });
}

// Telegram webhook registration helper
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (!BOT_TOKEN) return NextResponse.json({ error: "PARSER_CLUB_BOT_TOKEN not set" }, { status: 500 });

  if (action === "register") {
    const webhookUrl = "https://chinabridge.pro/api/telegram/parser-club-webhook";
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl, drop_pending_updates: true }),
      }
    );
    const data = await res.json();
    return NextResponse.json(data);
  }

  if (action === "info") {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
    const data = await res.json();
    return NextResponse.json(data);
  }

  return NextResponse.json({ ok: true, hint: "?action=register | ?action=info" });
}
