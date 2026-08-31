import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { ensureFunnelTable } from "@/lib/telegram/funnel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LID_BOT_TOKEN     = process.env.CHINABRIDGE_LID_BOT_TOKEN ?? "";
const NEW_LK_BOT_TOKEN  = process.env.NEW_LK_BOT_TOKEN ?? LID_BOT_TOKEN;
const MONITOR_BOT_TOKEN = process.env.MONITOR_BOT_TOKEN ?? LID_BOT_TOKEN;
const PARSER_BOT_TOKEN  = process.env.TELEGRAM_BOT_TOKEN ?? "";  // @ParserLid_n8n_bot
const MANAGER_CHAT_ID   = process.env.TELEGRAM_MANAGER_CHAT_ID  ?? "8979087725";

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

  // ── Group / supergroup message monitoring ──────────────────────────────────
  const chatType = message.chat?.type as string;
  if (chatType === "group" || chatType === "supergroup") {
    const HOT_KEYWORDS = [
      "ищу карго", "карго доставка", "нужна доставка из китая", "доставка из китая",
      "поставщик из китая", "нужен поставщик", "1688", "alibaba", "алибаба",
      "растаможка", "таможня", "карго из китая", "везу из китая", "закупка китай",
      "доставка товара из китая", "freight china", "фулфилмент", "wb поставщик",
      "ozon поставщик", "маркетплейс китай", "байер китай", "закупщик китай",
      "cargo china", "cargo доставка", "карго служба", "логистика китай",
      "отправка из китая", "посредник китай", "выкуп на 1688", "выкуп alibaba",
    ];

    const lowerText = text.toLowerCase();
    const matched = HOT_KEYWORDS.find(kw => lowerText.includes(kw));

    if (matched && MANAGER_CHAT_ID) {
      const h = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const groupName = h(message.chat?.title ?? "группа");
      const senderLink = message.from?.username
        ? `@${message.from.username}`
        : `tg://user?id=${chatId}`;

      await fetch(`https://api.telegram.org/bot${MONITOR_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: MANAGER_CHAT_ID,
          text: `🔥 <b>Горячий лид из группы</b>\n\n📢 <b>Группа:</b> ${groupName}\n👤 <b>Автор:</b> ${h(firstName)} (${senderLink})\n\n💬 <b>Сообщение:</b>\n${h(text)}\n\n🔑 <i>Ключ: «${h(matched)}»</i>`,
          parse_mode: "HTML",
        }),
      });
    }

    // Бот молчит в группе — не отвечает
    return NextResponse.json({ ok: true });
  }

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

      // Notify manager via @ParserLid_n8n_bot
      if (PARSER_BOT_TOKEN && MANAGER_CHAT_ID) {
        const uname = message?.from?.username ? `@${message.from.username}` : `id: ${chatId}`;
        fetch(`https://api.telegram.org/bot${PARSER_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id:    MANAGER_CHAT_ID,
            text:       `🔔 <b>Лид с калькулятора</b>\n\n👤 ${firstName} (${uname})\n🆔 chat_id: <code>${chatId}</code>\n\n📲 Написать: ${message?.from?.username ? `t.me/${message.from.username}` : `tg://user?id=${chatId}`}`,
            parse_mode: "HTML",
          }),
        }).catch(() => null);
      }

      await sendMsg(chatId,
        `👋 ${firstName}, привет!\n\nЭто ChinaBridge — доставка из Китая в Россию и Казахстан.\n\nНапишите какой товар везёте и откуда — менеджер ответит в течение 5 минут с реальной ценой 📦`,
        {
          reply_markup: {
            inline_keyboard: [[
              { text: "📊 Вернуться к расчёту", url: "https://chinabridge.pro/ai-calculator" },
            ]],
          },
        }
      );
    } else {
      // Default /start — notify manager immediately (don't wait for a message)
      if (MANAGER_CHAT_ID) {
        const uname = message?.from?.username ? `@${message.from.username}` : `id: ${chatId}`;
        const replyLink = message.from?.username
          ? `t.me/${message.from.username}`
          : `tg://user?id=${chatId}`;
        const source = param ? ` (источник: ${param})` : " (с сайта)";
        fetch(`https://api.telegram.org/bot${NEW_LK_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: MANAGER_CHAT_ID,
            text: `👁 <b>Новый лид открыл бота</b>${source}\n\n👤 ${firstName} (${uname})\n🆔 chat_id: <code>${chatId}</code>\n\n📲 Написать: ${replyLink}\n\n⚠️ Ещё не написал — напишите первым!`,
            parse_mode: "HTML",
          }),
        }).catch(() => null);
      }

      // No auto-greeting to client — leads from niche pages go to @New_LK_chinabridge_bot
    }
    return NextResponse.json({ ok: true });
  }

  // ── Incoming message — forward to manager ──────────────────────────────────
  // Auto-reply only on first message (not on every subsequent message)
  let isFirstMessage = false;
  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      CREATE TABLE IF NOT EXISTS bot_greeted (
        chat_id BIGINT PRIMARY KEY,
        greeted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    const inserted = await sql`
      INSERT INTO bot_greeted (chat_id) VALUES (${chatId})
      ON CONFLICT (chat_id) DO NOTHING
      RETURNING chat_id
    `;
    isFirstMessage = inserted.length > 0;
  } catch { isFirstMessage = true; }

  if (isFirstMessage) {
    await sendMsg(chatId, "✅ Сообщение получено! Менеджер ответит вам в течение 5 минут.");
  }

  if (MANAGER_CHAT_ID) {
    const h = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const replyLink = message.from?.username
      ? `t.me/${message.from.username}`
      : `tg://user?id=${chatId}`;
    await fetch(`https://api.telegram.org/bot${NEW_LK_BOT_TOKEN}/sendMessage`, {
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
