import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { ensureFunnelTable } from "@/lib/telegram/funnel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LID_BOT_TOKEN   = process.env.CHINABRIDGE_LID_BOT_TOKEN ?? "";
const MANAGER_CHAT_ID = process.env.TELEGRAM_MANAGER_CHAT_ID  ?? "8979087725";

async function sendMsg(chatId: number | string, text: string, extra?: object) {
  await fetch(`https://api.telegram.org/bot${LID_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown", ...extra }),
  });
}

async function answerCallback(callbackQueryId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${LID_BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

export async function POST(req: NextRequest) {
  if (!LID_BOT_TOKEN) return NextResponse.json({ ok: true });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: true });

  // ── Callback query (inline button press) ──────────────────────────────────
  if (body.callback_query) {
    const cq     = body.callback_query;
    const cqId   = cq.id as string;
    const data   = cq.data as string;
    const chatId = cq.from?.id as number;

    if (data === "drip_stop") {
      try {
        const sql = neon(process.env.DATABASE_URL!);
        await sql`UPDATE funnel_subscribers SET opted_out = TRUE WHERE chat_id = ${chatId}`;
      } catch { /* ignore */ }
      await answerCallback(cqId, "Вы отписались от рассылки.");
    }
    return NextResponse.json({ ok: true });
  }

  // ── Regular message ────────────────────────────────────────────────────────
  const message = body.message ?? body.edited_message;
  if (!message) return NextResponse.json({ ok: true });

  const chatId:    number = message.chat.id;
  const text:      string = message.text ?? "";
  const firstName: string = message.from?.first_name ?? "клиент";
  const username:  string = message.from?.username ? `@${message.from.username}` : `id: ${chatId}`;

  if (!text) return NextResponse.json({ ok: true });

  // ── /start handler ─────────────────────────────────────────────────────────
  if (text.startsWith("/start")) {
    const param = text.split(" ")[1] ?? "";
    const isCalcFunnel = param === "calc" || param.startsWith("calc");

    if (isCalcFunnel) {
      // Save to drip funnel
      try {
        await ensureFunnelTable(process.env.DATABASE_URL!);
        const sql = neon(process.env.DATABASE_URL!);
        await sql`
          INSERT INTO funnel_subscribers (chat_id, first_name, source)
          VALUES (${chatId}, ${firstName}, 'calc')
          ON CONFLICT (chat_id) DO UPDATE
            SET opted_out    = FALSE,
                drip_step    = 0,
                next_drip_at = NOW() + INTERVAL '2 days'
        `;
      } catch { /* ignore — don't break the UX */ }

      await sendMsg(chatId,
        `👋 Привет, ${firstName}!\n\nОтлично — вы теперь в теме 📬\n\nВ ближайшие дни пришлю:\n• Кейс с реальными цифрами доставки из Китая\n• Наши ставки карго (от $2.5/кг)\n• Спецпредложение для подписчиков\n\nА пока можете рассчитать свой товар 👇`,
        {
          reply_markup: {
            inline_keyboard: [[
              { text: "🔢 Калькулятор маржи", url: "https://chinabridge.pro/ai-calculator" },
            ]],
          },
        }
      );
    } else {
      // Default /start — лид с вопросом
      await sendMsg(chatId,
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
    }
    return NextResponse.json({ ok: true });
  }

  // ── Incoming message — forward to manager ──────────────────────────────────
  await sendMsg(chatId, "✅ Сообщение получено! Менеджер ответит вам в течение 5 минут.");

  if (MANAGER_CHAT_ID) {
    const h = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const replyLink = message.from?.username
      ? `t.me/${message.from.username}`
      : `tg://user?id=${chatId}`;
    await fetch(`https://api.telegram.org/bot${LID_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: MANAGER_CHAT_ID,
        text: `💬 <b>Сообщение от клиента</b>\n\n👤 ${h(firstName)} (${h(username)})\n🆔 chat_id: <code>${chatId}</code>\n\n📝 <b>Текст:</b>\n${h(text)}\n\n📲 Ответить: ${replyLink}`,
        parse_mode: "HTML",
      }),
    });
  }

  return NextResponse.json({ ok: true });
}
