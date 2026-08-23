import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOT_TOKEN  = process.env.CHINABRIDGE_LID_BOT_TOKEN ?? "";
const MANAGER_ID = process.env.TELEGRAM_MANAGER_CHAT_ID  ?? "";

async function sendTelegram(text: string) {
  if (!BOT_TOKEN || !MANAGER_ID) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: MANAGER_ID,
      text,
      parse_mode: "HTML",
    }),
    signal: AbortSignal.timeout(5000),
  }).catch(() => {});
}

export async function POST(req: NextRequest) {
  let body: Record<string, string> = {};
  try { body = await req.json(); } catch { /**/ }

  const { contact, name, page, type } = body;

  const now = new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" });

  if (type === "click") {
    // Just tracking a click on WhatsApp/Telegram link
    await sendTelegram(
      `🔔 <b>Клиент перешёл в ${contact}</b>\n` +
      `📄 Страница: ${page || "?"}\n` +
      `🕐 ${now} МСК\n\n` +
      `<i>Клиент открыл мессенджер — возможно, напишет. Будь готов.</i>`
    );
    return NextResponse.json({ ok: true });
  }

  // Form submission
  if (!contact?.trim()) {
    return NextResponse.json({ ok: false, error: "contact_required" }, { status: 400 });
  }

  await sendTelegram(
    `🔥 <b>Новая заявка с сайта!</b>\n\n` +
    `📞 Контакт: <b>${contact.trim()}</b>\n` +
    (name?.trim() ? `👤 Имя: ${name.trim()}\n` : "") +
    `📄 Страница: ${page || "не указана"}\n` +
    `🕐 ${now} МСК\n\n` +
    `👉 Напиши клиенту в течение 15 минут!`
  );

  return NextResponse.json({ ok: true });
}
