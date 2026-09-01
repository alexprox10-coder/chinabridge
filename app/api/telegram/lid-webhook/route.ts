import { NextRequest, NextResponse } from "next/server";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { ensureFunnelTable } from "@/lib/telegram/funnel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LID_BOT_TOKEN     = process.env.CHINABRIDGE_LID_BOT_TOKEN ?? "";
const NEW_LK_BOT_TOKEN  = process.env.NEW_LK_BOT_TOKEN ?? LID_BOT_TOKEN;
const MONITOR_BOT_TOKEN = process.env.MONITOR_BOT_TOKEN ?? LID_BOT_TOKEN;
const PARSER_BOT_TOKEN  = process.env.TELEGRAM_BOT_TOKEN ?? "";
const MANAGER_CHAT_ID   = process.env.TELEGRAM_MANAGER_CHAT_ID ?? "8979087725";

async function sendMsg(chatId: number | string, text: string, extra?: object) {
  const res = await fetch(`https://api.telegram.org/bot${LID_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...extra }),
  });
  return res.json().catch(() => null);
}

async function answerCallback(callbackQueryId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${LID_BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

async function ensureBridgeTables(sql: NeonQueryFunction<false, false>) {
  await sql`
    CREATE TABLE IF NOT EXISTS bot_greeted (
      chat_id BIGINT PRIMARY KEY,
      greeted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS bot_message_map (
      manager_msg_id BIGINT PRIMARY KEY,
      client_chat_id BIGINT NOT NULL,
      client_name    TEXT,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function POST(req: NextRequest) {
  if (!LID_BOT_TOKEN) return NextResponse.json({ ok: true });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: true });

  // ── Callback query ─────────────────────────────────────────────────────────
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

  // ── Group monitoring ───────────────────────────────────────────────────────
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
      const senderLink = message.from?.username ? `@${message.from.username}` : `tg://user?id=${chatId}`;
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
    return NextResponse.json({ ok: true });
  }

  // ── /start handler ─────────────────────────────────────────────────────────
  if (text.startsWith("/start")) {
    const param = text.split(" ")[1] ?? "";
    const isCalcFunnel = param === "calc" || param.startsWith("calc");

    if (isCalcFunnel) {
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
      } catch { /* ignore */ }

      if (PARSER_BOT_TOKEN && MANAGER_CHAT_ID) {
        const uname = message?.from?.username ? `@${message.from.username}` : `id: ${chatId}`;
        await fetch(`https://api.telegram.org/bot${PARSER_BOT_TOKEN}/sendMessage`, {
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
      // Greeting to client — they opened bot from niche page
      await sendMsg(chatId,
        `👋 ${firstName}, привет!\n\nЭто ChinaBridge — доставка из Китая в Россию и Казахстан.\n\n📦 Напишите:\n— Какой товар хотите привезти?\n— Откуда (город в Китае или 1688/Alibaba ссылка)?\n— Куда доставка?\n\nМенеджер ответит в течение 5 минут с расчётом стоимости 🚀`,
        {
          reply_markup: {
            inline_keyboard: [[
              { text: "💰 Рассчитать стоимость", url: "https://chinabridge.pro/ai-calculator" },
            ]],
          },
        }
      );

      if (MANAGER_CHAT_ID) {
        const uname = message?.from?.username ? `@${message.from.username}` : `id: ${chatId}`;
        const replyLink = message.from?.username ? `t.me/${message.from.username}` : `tg://user?id=${chatId}`;
        const source = param ? ` (источник: ${param})` : " (с сайта)";
        await fetch(`https://api.telegram.org/bot${NEW_LK_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: MANAGER_CHAT_ID,
            text: `👁 <b>Новый лид открыл бота</b>${source}\n\n👤 ${firstName} (${uname})\n🆔 chat_id: <code>${chatId}</code>\n\n📲 Написать: ${replyLink}\n\n⚠️ Приветствие отправлено — ждите сообщения!`,
            parse_mode: "HTML",
          }),
        }).catch(() => null);
      }
    }
    return NextResponse.json({ ok: true });
  }

  // ── Manager reply bridge ──────────────────────────────────────────────────
  // When manager replies to a forwarded notification → send reply to client
  if (String(chatId) === String(MANAGER_CHAT_ID)) {
    if (message.reply_to_message) {
      try {
        const sql = neon(process.env.DATABASE_URL!);
        await ensureBridgeTables(sql);
        const replyToMsgId = message.reply_to_message.message_id as number;
        const rows = await sql`SELECT client_chat_id, client_name FROM bot_message_map WHERE manager_msg_id = ${replyToMsgId}`;
        if (rows.length > 0) {
          const clientChatId = rows[0].client_chat_id;
          const clientName   = rows[0].client_name ?? "клиент";
          await sendMsg(clientChatId, `<b>Менеджер ChinaBridge:</b>\n${text}`);
          await sendMsg(MANAGER_CHAT_ID, `✅ Ответ отправлен → ${clientName}`);
          return NextResponse.json({ ok: true });
        }
      } catch { /* ignore */ }
    }
    // Non-reply manager message — ignore silently
    return NextResponse.json({ ok: true });
  }

  // ── Client message → auto-reply once + forward to manager ─────────────────
  const sql = neon(process.env.DATABASE_URL!);
  let isFirstMessage = false;
  try {
    await ensureBridgeTables(sql);
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

  // Forward to manager via LID_BOT_TOKEN so replies can be bridged back
  const h = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const replyLink = message.from?.username ? `t.me/${message.from.username}` : `tg://user?id=${chatId}`;
  const notifRes = await fetch(`https://api.telegram.org/bot${LID_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: MANAGER_CHAT_ID,
      text: `💬 <b>Клиент: ${h(firstName)} (${h(username)})</b>\n\n${h(text)}\n\n<i>↩️ Ответьте реплаем на это сообщение</i>`,
      parse_mode: "HTML",
    }),
  });

  // Save mapping: manager notification message_id → client chat_id
  try {
    const notifData = await notifRes.json();
    if (notifData?.ok && notifData?.result?.message_id) {
      await sql`
        INSERT INTO bot_message_map (manager_msg_id, client_chat_id, client_name)
        VALUES (${notifData.result.message_id}, ${chatId}, ${`${firstName} (${username})`})
        ON CONFLICT (manager_msg_id) DO NOTHING
      `;
    }
  } catch { /* ignore */ }

  return NextResponse.json({ ok: true });
}
