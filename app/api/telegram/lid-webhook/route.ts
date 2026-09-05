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
      return NextResponse.json({ ok: true });
    }

    // ── Tripwire 2 000 ₽ ────────────────────────────────────────────────────
    if (data.startsWith("tripwire_")) {
      const leadId = data.replace("tripwire_", "");
      await answerCallback(cqId, "Генерируем ссылку оплаты...");
      try {
        const payResp = await fetch(
          "https://chinabridge.pro/api/payments/create-tripwire",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lead_id: leadId, chat_id: String(chatId) }),
          }
        );
        const payData = await payResp.json() as { paymentLink?: string };

        if (payData.paymentLink) {
          await sendMsg(chatId,
            [
              `💳 <b>Аудит партии — 2 000 ₽</b>`,
              ``,
              `✅ Точный расчёт таможни и пошлин по ТН ВЭД`,
              `✅ НДС при ввозе + акцизы`,
              `✅ Проверка поставщика по 5 критериям`,
              `✅ Сравнение 3 маршрутов доставки`,
              `✅ Оценка рисков партии (брак, задержки)`,
              ``,
              `⏱ Готово в течение 24 часов`,
              `💡 При первой поставке через ChinaBridge — стоимость аудита вычитается`,
            ].join("\n"),
            {
              reply_markup: {
                inline_keyboard: [
                  [{ text: "💳 Оплатить 2 000 ₽", url: payData.paymentLink }],
                  [{ text: "📲 Написать менеджеру", url: "https://t.me/chinabridge_support24_bot" }],
                ],
              },
            }
          );
        } else {
          await sendMsg(chatId,
            `📋 <b>Аудит партии — 2 000 ₽</b>\n\nСвяжитесь с менеджером для оплаты и запуска аудита:`,
            {
              reply_markup: {
                inline_keyboard: [[
                  { text: "📲 Написать менеджеру", url: "https://t.me/chinabridge_support24_bot" },
                ]],
              },
            }
          );
        }
      } catch (e) {
        console.error("[lid-webhook] tripwire error:", e);
        await sendMsg(chatId, `Напишите менеджеру для оплаты аудита: @chinabridge_support24_bot`);
      }
      return NextResponse.json({ ok: true });
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
    const isPdfReport  = param.startsWith("pdf_");

    // ── PDF report delivery ─────────────────────────────────────────────────
    if (isPdfReport) {
      const reportCode = param.replace(/^pdf_/, "").replace(/_/g, "-");
      try {
        const sql = neon(process.env.DATABASE_URL!);
        const rows = await sql`
          SELECT * FROM calculator_leads WHERE report_code = ${reportCode}::uuid LIMIT 1
        `;
        const lead = rows[0] as Record<string, unknown> | undefined;

        if (lead) {
          await sql`ALTER TABLE calculator_leads ADD COLUMN IF NOT EXISTS chat_id TEXT`.catch(() => null);
          await sql`
            UPDATE calculator_leads
            SET pdf_sent_at = NOW(), status = 'pdf_sent', chat_id = ${String(chatId)}
            WHERE report_code = ${reportCode}::uuid
          `;

          const fmtN = (n: unknown) => n ? Math.round(Number(n)).toLocaleString("ru-RU") : "—";
          const verdictEmoji = lead.verdict === "green" ? "🟢" : lead.verdict === "red" ? "🔴" : "🟡";
          const verdictLabel = lead.verdict === "green" ? "Выгодный товар" : lead.verdict === "red" ? "Требует оптимизации" : "Осторожный потенциал";

          const reportText = [
            `📊 <b>АУДИТ ПАРТИИ — ChinaBridge</b>`,
            `━━━━━━━━━━━━━━━━━━`,
            lead.product_name ? `📦 Товар: ${lead.product_name}` : "",
            lead.product_url ? `🔗 ${lead.product_url}` : "",
            `━━━━━━━━━━━━━━━━━━`,
            ``,
            `${verdictEmoji} <b>${verdictLabel}</b>`,
            `📈 Маржа: <b>${lead.margin ? Number(lead.margin).toFixed(1) : "—"}%</b>`,
            `💰 Прибыль/шт: <b>${fmtN(lead.profit)} ₽</b>`,
            `🛍 Маркетплейс: ${lead.marketplace ?? "—"}`,
            ``,
            `━━━━━━━━━━━━━━━━━━`,
            `⚠️ <b>НЕ УЧТЕНО в предварительном расчёте:</b>`,
            `• Таможенные пошлины — зависят от ТН ВЭД кода`,
            `• НДС при ввозе — 20% для большинства товаров`,
            `• Реальный объёмный вес — нужен точный замер`,
            `• Риск брака партии — без инспекции фабрики`,
            `• Маркировка под WB/Ozon — требует проверки`,
            `━━━━━━━━━━━━━━━━━━`,
            ``,
            `✅ <b>Следующие шаги:</b>`,
            `1. Уточните ставки доставки у менеджера`,
            `2. Закажите проверку поставщика в Китае`,
            `3. Рассчитайте точные таможенные платежи`,
            ``,
            `<i>ChinaBridge — доставка из Китая под ключ</i>`,
            `<i>chinabridge.pro · Гуанчжоу · Суньфэньхэ</i>`,
          ].filter(s => s !== undefined).join("\n");

          await sendMsg(chatId, reportText, {
            reply_markup: {
              inline_keyboard: [
                [{ text: "🚀 Привезти этот товар из Китая", url: "https://t.me/chinabridge_support24_bot" }],
                [{ text: "📋 Заказать аудит за 2 000 ₽", callback_data: `tripwire_${String(lead.id)}` }],
                [{ text: "📊 Рассчитать другой товар", url: "https://chinabridge.pro/ai-calculator" }],
              ],
            },
          });

          // Notify manager
          const notifyToken = PARSER_BOT_TOKEN || LID_BOT_TOKEN;
          if (notifyToken && MANAGER_CHAT_ID) {
            const uname = message?.from?.username ? `@${message.from.username}` : `id: ${chatId}`;
            await fetch(`https://api.telegram.org/bot${notifyToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: MANAGER_CHAT_ID,
                text: `📨 <b>Лид получил PDF-отчёт</b>\n\n👤 ${firstName} (${uname})\n🆔 chat_id: <code>${chatId}</code>\n📊 Маржа: ${lead.margin ? Number(lead.margin).toFixed(1) : "—"}%\n\n📲 Написать: ${message?.from?.username ? `t.me/${message.from.username}` : `tg://user?id=${chatId}`}`,
                parse_mode: "HTML",
              }),
            }).catch(() => null);
          }
        } else {
          await sendMsg(chatId, `👋 ${firstName}, привет!\n\nЭто ChinaBridge — доставка из Китая.\n\nНапишите какой товар хотите привезти — менеджер ответит в течение 5 минут 📦`);
        }
      } catch (e) {
        console.error("[lid-webhook] pdf handler error:", e);
        await sendMsg(chatId, `👋 ${firstName}, привет!\n\nЭто ChinaBridge — доставка из Китая.\n\nНапишите какой товар хотите привезти — менеджер ответит в течение 5 минут 📦`);
      }
      return NextResponse.json({ ok: true });
    }

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
    }
    // bare /start or landing param (e.g. /start electronics, /start наушники)
    {
      const isLandingParam = param && !param.startsWith("pdf_") && param !== "calc";
      const greeting = isLandingParam
        ? `👋 ${firstName}, привет!\n\nМы получили вашу заявку на <b>${param}</b>.\n\nМенеджер ответит вам в течение 5 минут с реальной ценой доставки 📦`
        : `👋 ${firstName}, привет!\n\nЭто ChinaBridge — доставка из Китая в Россию и Казахстан.\n\nНапишите какой товар хотите привезти — менеджер ответит в течение 5 минут 📦`;

      await sendMsg(chatId, greeting, {
        reply_markup: {
          inline_keyboard: [[
            { text: "📊 Рассчитать маржу", url: "https://chinabridge.pro/ai-calculator" },
          ]],
        },
      });

      // Notify manager about new landing lead
      const notifyToken = PARSER_BOT_TOKEN || LID_BOT_TOKEN;
      if (notifyToken && MANAGER_CHAT_ID) {
        const uname = message?.from?.username ? `@${message.from.username}` : `id: ${chatId}`;
        await fetch(`https://api.telegram.org/bot${notifyToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: MANAGER_CHAT_ID,
            text: `🔔 <b>Лид открыл бот с лендинга</b>\n\n👤 ${firstName} (${uname})\n🆔 chat_id: <code>${chatId}</code>${param ? `\n📦 Товар/категория: ${param}` : ""}\n\n📲 Написать: ${message?.from?.username ? `t.me/${message.from.username}` : `tg://user?id=${chatId}`}`,
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
  console.log(`[lid-webhook] forwarding msg from ${chatId} to manager ${MANAGER_CHAT_ID}`);
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
    if (!notifData?.ok) console.error("[lid-webhook] forward TG error:", JSON.stringify(notifData));
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
