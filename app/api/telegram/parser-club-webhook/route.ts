// Parser Club → Intake Pipeline
// Handles two integration modes:
//   A) Parser Club API webhook notification: {task_id, status, result_count, result_url}
//      → fetches results from result_url, sends each message to /api/outbound/intake
//   B) Telegram bot updates from @ParserClubLid_bot (fallback)

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOT_TOKEN     = process.env.PARSER_CLUB_BOT_TOKEN ?? "";
const PC_API_KEY    = process.env.PARSER_CLUB_API_KEY ?? "";
const INTAKE_SECRET = process.env.OUTBOUND_WEBHOOK_SECRET ?? "";
const INTAKE_URL    = "https://chinabridge.pro/api/outbound/intake";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function sendToIntake(payload: {
  text: string;
  message_id: string;
  username: string;
  author_name: string;
  chat_name: string;
  chat_id: string;
  source_url: string;
  chat_url: string;
}) {
  await fetch(INTAKE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": INTAKE_SECRET,
    },
    body: JSON.stringify({
      ...payload,
      source: "parser_club",
      source_type: "telegram_parser",
    }),
  }).catch(() => null);
}

// ── Mode A: Parser Club API webhook notification ───────────────────────────────
// Receives: {task_id, status, result_count, result_url}
// Fetches results from result_url and processes each item

type PcResultItem = {
  text?: string;
  message?: string;
  content?: string;
  author?: string;
  author_name?: string;
  username?: string;
  from?: string;
  chat?: string;
  chat_title?: string;
  chat_id?: string | number;
  group?: string;
  message_id?: string | number;
  id?: string | number;
  url?: string;
  link?: string;
  chat_url?: string;
  [key: string]: unknown;
};

async function handleParserClubWebhook(body: Record<string, unknown>): Promise<number> {
  const { task_id, status, result_url } = body;

  if (!result_url || typeof result_url !== "string") return 0;
  if (status !== "done" && status !== "completed" && status !== "ready") return 0;

  // Fetch results from Parser Club
  const apiKey = PC_API_KEY || BOT_TOKEN;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  const res = await fetch(result_url, { headers }).catch(() => null);
  if (!res?.ok) return 0;

  const data = await res.json().catch(() => null);
  if (!data) return 0;

  const items: PcResultItem[] = Array.isArray(data) ? data : (data.items ?? data.results ?? data.data ?? []);

  let processed = 0;
  for (const item of items) {
    const text = String(item.text ?? item.message ?? item.content ?? "");
    if (!text || text.length < 5) continue;

    const username   = String(item.username ?? item.from ?? "");
    const authorName = String(item.author_name ?? item.author ?? "");
    const chatName   = String(item.chat_title ?? item.chat ?? item.group ?? "parser_club");
    const chatId     = String(item.chat_id ?? "");
    const messageId  = String(item.message_id ?? item.id ?? Date.now());
    const sourceUrl  = String(item.url ?? item.link ?? "");
    const chatUrl    = String(item.chat_url ?? "");

    await sendToIntake({
      text,
      message_id: `pc_${task_id}_${messageId}`,
      username,
      author_name: authorName,
      chat_name: chatName,
      chat_id: chatId,
      source_url: sourceUrl,
      chat_url: chatUrl,
    });
    processed++;
  }

  return processed;
}

// ── Mode B: Telegram bot update from @ParserClubLid_bot ──────────────────────

async function handleTelegramUpdate(body: Record<string, unknown>): Promise<boolean> {
  const message = (body.message ?? body.channel_post ?? body.edited_message) as Record<string, unknown> | undefined;
  if (!message) return false;

  const text: string = String(message.text ?? message.caption ?? "");
  if (!text || text.length < 5 || text.startsWith("/")) return true;

  const from      = (message.from as Record<string, unknown>) ?? {};
  const chat      = (message.chat as Record<string, unknown>) ?? {};
  const username   = String(from.username ?? chat.username ?? "");
  const firstName  = String(from.first_name ?? "");
  const chatTitle  = String(chat.title ?? chat.username ?? "parser_club");
  const messageId  = String(message.message_id ?? "");
  const chatId     = String(chat.id ?? "");
  const chatUsername = String(chat.username ?? "");

  await sendToIntake({
    text,
    message_id: `pc_${chatId}_${messageId}`,
    username,
    author_name: firstName,
    chat_name: chatTitle,
    chat_id: chatId,
    source_url: chatUsername ? `https://t.me/${chatUsername}/${messageId}` : "",
    chat_url: chatUsername ? `https://t.me/${chatUsername}` : "",
  });

  return true;
}

// ── Main POST handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ ok: true });
  }

  const b = body as Record<string, unknown>;

  // Mode A: Parser Club API webhook (has task_id + result_url)
  if (b.task_id && b.result_url) {
    const processed = await handleParserClubWebhook(b);
    return NextResponse.json({ ok: true, mode: "api_webhook", processed });
  }

  // Mode B: Telegram bot update (has update_id or message/channel_post)
  if (b.update_id || b.message || b.channel_post || b.edited_message) {
    await handleTelegramUpdate(b);
    return NextResponse.json({ ok: true, mode: "telegram" });
  }

  // Unknown format — return ok so Parser Club doesn't retry
  return NextResponse.json({ ok: true, mode: "unknown" });
}

// ── GET: Telegram webhook registration + debug ────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (action === "register") {
    if (!BOT_TOKEN) return NextResponse.json({ error: "PARSER_CLUB_BOT_TOKEN not set" }, { status: 500 });
    const webhookUrl = "https://chinabridge.pro/api/telegram/parser-club-webhook";
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl, drop_pending_updates: true }),
    });
    return NextResponse.json(await res.json());
  }

  if (action === "info") {
    if (!BOT_TOKEN) return NextResponse.json({ error: "PARSER_CLUB_BOT_TOKEN not set" }, { status: 500 });
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
    return NextResponse.json(await res.json());
  }

  return NextResponse.json({ ok: true, hint: "?action=register | ?action=info" });
}
