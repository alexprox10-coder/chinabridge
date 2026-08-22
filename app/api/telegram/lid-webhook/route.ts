import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LID_BOT_TOKEN = process.env.CHINABRIDGE_LID_BOT_TOKEN ?? "";
const NOTIFY_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const MANAGER_CHAT_ID = process.env.TELEGRAM_MANAGER_CHAT_ID ?? "8979087725";

async function sendMessage(token: string, chatId: number | string, text: string, extra?: object) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      ...extra,
    }),
  });
}

export async function POST(req: NextRequest) {
  if (!LID_BOT_TOKEN) return NextResponse.json({ ok: true });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: true });

  const message = body.message ?? body.edited_message;
  if (!message) return NextResponse.json({ ok: true });

  const chatId: number = message.chat.id;
  const text: string = message.text ?? "";
  const firstName: string = message.from?.first_name ?? "клиент";
  const username: string = message.from?.username ? `@${message.from.username}` : `id: ${chatId}`;

  if (!text) return NextResponse.json({ ok: true });

  // Auto-reply to user
  if (text.startsWith("/start")) {
    await sendMessage(LID_BOT_TOKEN, chatId,
      `👋 Привет, ${firstName}!\n\nЯ бот ChinaBridge 🇨🇳\n\nНапишите ваш вопрос или товар который хотите доставить из Китая — менеджер ответит в течение 5 минут.`,
      {
        reply_markup: {
          inline_keyboard: [[
            { text: "🌐 Сайт", url: "https://chinabridge.pro" },
            { text: "📊 Калькулятор", url: "https://chinabridge.pro/ai-calculator" },
          ]],
        },
      }
    );
  } else {
    // Confirm receipt to user
    await sendMessage(LID_BOT_TOKEN, chatId,
      "✅ Сообщение получено! Менеджер ответит вам в течение 5 минут."
    );
  }

  // Forward to manager via notification bot
  if (NOTIFY_BOT_TOKEN && MANAGER_CHAT_ID && text !== "/start") {
    const tg = (s: string) => s.replace(/[_*[\]()~`>#+=|{}.!-]/g, "\\$&");
    await fetch(`https://api.telegram.org/bot${NOTIFY_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: MANAGER_CHAT_ID,
        text: `💬 *Сообщение от клиента*\n\n👤 ${tg(firstName)} (${tg(username)})\n🆔 chat\\_id: \`${chatId}\`\n\n📝 *Текст:*\n${tg(text)}\n\n[Ответить клиенту](https://t.me/${chatId})`,
        parse_mode: "MarkdownV2",
      }),
    });
  }

  return NextResponse.json({ ok: true });
}
