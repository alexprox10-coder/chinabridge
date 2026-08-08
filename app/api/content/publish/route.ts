import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPosts, updatePost } from "@/lib/content/db";

export const runtime = "nodejs";

/* Fallback channel for ChinaBridge if TELEGRAM_CHANNEL_ID is not set. */
const DEFAULT_TELEGRAM_CHANNEL = "@chinabridgeline";

async function requireAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get("cb_admin")?.value);
}

/* Honest publishing: only Telegram has a real API path here. VK and MAX have
   no automated publishing — the UI offers copy-to-clipboard for those.      */
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { postId?: number; platform?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const postId = Number(body.postId);
  const platform = (body.platform ?? "telegram").trim();

  if (!Number.isFinite(postId) || postId <= 0) {
    return NextResponse.json({ error: "post_id_required" }, { status: 400 });
  }

  if (platform !== "telegram") {
    return NextResponse.json({
      ok: false,
      reason: "manual_only",
      message:
        "Автопубликация доступна только для Telegram. Для VK и MAX скопируйте текст и опубликуйте вручную.",
    });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHANNEL_ID || DEFAULT_TELEGRAM_CHANNEL;

  if (!botToken) {
    return NextResponse.json({
      ok: false,
      reason: "token_not_configured",
      message:
        "Добавьте TELEGRAM_BOT_TOKEN и TELEGRAM_CHANNEL_ID (@chinabridgeline) в переменные окружения Vercel.",
    });
  }

  /* Load the post text from the DB — never trust a body-supplied text. */
  let text = "";
  try {
    const all = await getPosts(undefined, undefined, 500);
    const post = all.find((p) => p.id === postId);
    if (!post) return NextResponse.json({ error: "post_not_found" }, { status: 404 });

    text = post.body;
    if (post.cta_url) text += `\n\n${post.cta_url}`;
  } catch (e) {
    return NextResponse.json({ error: "db_error", detail: String(e) }, { status: 500 });
  }

  let tgJson: { ok?: boolean; description?: string; result?: { message_id?: number } };
  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: false,
      }),
    });
    tgJson = await tgRes.json();
  } catch (e) {
    return NextResponse.json(
      { ok: false, reason: "telegram_unreachable", message: String(e) },
      { status: 502 },
    );
  }

  if (!tgJson?.ok) {
    return NextResponse.json(
      {
        ok: false,
        reason: "telegram_error",
        message: tgJson?.description ?? "Telegram отклонил запрос.",
      },
      { status: 502 },
    );
  }

  await updatePost(postId, {
    status: "published",
    published_at: new Date().toISOString(),
  }).catch(() => {});

  return NextResponse.json({
    ok: true,
    messageId: tgJson.result?.message_id ?? null,
    channel: chatId,
  });
}

/* Lets the UI decide whether to show a real "Опубликовать" button. */
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    telegramConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    channel: process.env.TELEGRAM_CHANNEL_ID || DEFAULT_TELEGRAM_CHANNEL,
    channelUrl: "https://t.me/chinabridgeline",
  });
}
