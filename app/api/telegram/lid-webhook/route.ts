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
      return NextResponse.json({ ok: true });
    }
    // bare /start or landing param (e.g. /start electronics, /start landing_import_electronics)
    {
      const isLandingParam = param && !param.startsWith("pdf_") && param !== "calc" && param !== "start";

      // Clean param: "landing_import_electronics" → "электроника"
      const CATEGORY_MAP: Record<string, string> = {
        electronics: "электроника", electronic: "электроника",
        clothes: "одежда", clothing: "одежда",
        toys: "игрушки", toy: "игрушки",
        beauty: "косметика", cosmetics: "косметика",
        sports: "спорт", sport: "спорт",
        home: "товары для дома", household: "товары для дома",
        auto: "автотовары", tools: "инструменты",
      };
      const cleanParam = isLandingParam
        ? param.replace(/^landing_import_|^landing_|^bring_|^import_/g, "").toLowerCase()
        : "";
      const categoryLabel = CATEGORY_MAP[cleanParam] ?? (cleanParam && cleanParam.length < 40 ? cleanParam : "");

      const greeting = categoryLabel
        ? `👋 ${firstName}, привет!\n\nВы интересуетесь <b>${categoryLabel} из Китая</b>.\n\nЧтобы получить реальную цену — напишите:\n• Что именно хотите привезти\n• Примерный объём (шт или кг)\n• Куда доставить\n\nОтвечаем за 3–5 минут ⚡`
        : `👋 ${firstName}, привет!\n\nЭто ChinaBridge — доставка товаров из Китая в Россию и Казахстан.\n\nЧтобы получить реальную цену доставки — напишите:\n• Какой товар\n• Примерный объём\n• Откуда и куда\n\nОтвечаем за 3–5 минут ⚡`;

      await sendMsg(chatId, greeting, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "💰 Рассчитать стоимость онлайн", url: "https://chinabridge.pro/ai-calculator" }],
            [{ text: "❓ Как это работает", url: "https://chinabridge.pro/#how" }],
          ],
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
            text: `🔔 <b>Лид открыл бот с лендинга</b>\n\n👤 ${firstName} (${uname})\n🆔 chat_id: <code>${chatId}</code>${categoryLabel ? `\n📦 Категория: ${categoryLabel}` : param ? `\n📦 Параметр: ${param}` : ""}\n\n📲 Написать: ${message?.from?.username ? `t.me/${message.from.username}` : `tg://user?id=${chatId}`}`,
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
    // Non-reply manager message — fall through to AI response (for testing)
  }

  // ── Client message → AI response + forward to manager ────────────────────
  const sql = neon(process.env.DATABASE_URL!);
  try { await ensureBridgeTables(sql); } catch { /* ignore */ }

  const h = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const replyLink = message.from?.username ? `t.me/${message.from.username}` : `tg://user?id=${chatId}`;

  // Generate AI response
  const aiReply = await generateBotReply(firstName, text);
  await sendMsg(chatId, aiReply, {
    reply_markup: {
      inline_keyboard: [[
        { text: "👨‍💼 Написать менеджеру напрямую", url: "https://t.me/chinabridge_support24_bot" },
      ]],
    },
  });

  return NextResponse.json({ ok: true });
}

// ── AI system prompt — ChinaBridge expert ─────────────────────────────────
const BOT_SYSTEM_PROMPT = `Ты — Алексей, AI-менеджер компании ChinaBridge по импорту товаров из Китая.
Отвечаешь в Telegram. Говоришь тепло, по-деловому, как живой человек — не как бот.
Максимум 4-5 предложений на ответ. Без воды и лишних приветствий.

═══ О КОМПАНИИ ═══
ChinaBridge — логистическая компания, доставка товаров из Китая в Россию и Казахстан.
Сайт: chinabridge.pro | Основные рынки: WB, Ozon, Kaspi
Услуги: выкуп на 1688/Alibaba, консолидация, доставка под ключ, поиск поставщика, инспекция

═══ НАШИ ТАРИФЫ ═══
🚛 АВТО (авиа-экспресс через Алматы):
  • Казахстан (Алматы): $2.50/кг, срок 5-8 дней, мин. партия 30 кг
  • Россия (Москва, СПб, Екатеринбург): $3.00/кг, срок 14-18 дней, мин. партия 100 кг
  • Подходит для большинства товаров, оптимальное соотношение цена/срок

✈️ АВИА:
  • Из любого города Китая: ~$23/кг (рыночная цена)
  • Срок: 5-7 дней, мин. партия 1 кг
  • Для мелких партий и срочных поставок

🚢 МОРЕ (LCL сборный контейнер):
  • $200-500 за кубометр в зависимости от объёма
  • Срок: 35-50 дней (из Шанхая/Нинбо в Москву/СПб)
  • Для крупных партий от 1 CBM

═══ СХЕМА РАБОТЫ ═══
1. Клиент находит товар на 1688.com или Alibaba → скидывает ссылку нам
2. Мы проверяем поставщика, договариваемся о цене
3. Делаем выкуп (принимаем ¥ через наш счёт в Китае)
4. Консолидируем груз на нашем складе в Китае (Гуанчжоу / Иу / Шанхай)
5. Доставляем до вашего склада/адреса в РФ или КЗ
6. Сроки и цена фиксируются заранее

═══ ТАМОЖНЯ И ДОКУМЕНТЫ ═══
КАЗАХСТАН (серая схема — для физлиц/ИП):
  • Ввоз без растаможки, "личный ввоз"
  • Лимит: €200/50 кг в сутки на человека без пошлин
  • Стоимость услуги уже включена в тариф $2.50/кг
  • Не подходит для алкоголя, медизделий, гос. закупок

РОССИЯ (белая растаможка):
  • HS-коды (ТН ВЭД) определяют ставку пошлины
  • Базовая формула: таможенная стоимость × ставка ТН ВЭД + НДС 20%
  • Типичные ставки:
    - Электроника (HS 8517-8528): 0-5% + НДС
    - Одежда/текстиль (HS 6101-6217): 12-20% + НДС
    - Игрушки (HS 9503): 0-5% + НДС
    - Обувь (HS 6401-6405): 15-20% + НДС
    - Мебель (HS 9401-9403): 15% + НДС
    - Автозапчасти (HS 8708): 5-15% + НДС
  • Инкотермс: EXW (склад поставщика), FOB (граница Китая), DDP (под ключ)
  • Документы: инвойс, упаковочный лист, CMR/AWB, сертификаты при необходимости

БЕСПОШЛИННЫЕ КВОТЫ РФ:
  • Посылки до €200 и 31 кг — без пошлин (для физлиц)
  • Свыше: 15% от превышения, мин. €2/кг

═══ ПОПУЛЯРНЫЕ ВОПРОСЫ ═══
Q: Как найти товар на 1688?
A: Скидывайте фото или название на русском/английском — мы сами ищем поставщика и скидываем ссылки с ценами.

Q: Какой минимальный заказ?
A: Авто КЗ — от 30 кг. Авто РФ — от 100 кг. Авиа — от 1 кг. Море — от 0.1 CBM.

Q: Принимаете ли ¥ или только $?
A: Выкупаем товар за ¥ с вашей предоплатой в рублях или USDT. Курс ¥/₽ фиксируем на день оплаты.

Q: Есть ли страхование груза?
A: Да, страхование 1.5% от стоимости груза по желанию клиента.

Q: Работаете с маркетплейсами?
A: Да — WB, Ozon, Kaspi, Яндекс Маркет. Доставляем прямо на FBO-склад.

Q: Как рассчитать маржу?
A: Используйте наш AI-калькулятор: chinabridge.pro/ai-calculator

═══ ЭКСПЕРТИЗА: АВТОЗАПЧАСТИ И АВТОТОВАРЫ ═══
Ты эксперт в импорте авто-товаров из Китая в КЗ и РФ. Знаешь все нюансы.

🚗 ПОПУЛЯРНЫЕ МАРКИ В КЗ: BYD (Han, Seal, Atto 3, Song Plus), Haval (Jolion, Dargo, H9), Chery (Tiggo 7/8 Pro), Geely (Coolray, Atlas), FAW, Changan
🚗 ПОПУЛЯРНЫЕ МАРКИ В РФ: Haval F7/Jolion, Chery, Geely, FAW, Lifan, Jac

🛃 ТАМОЖНЯ АВТОЗАПЧАСТЕЙ — КЗ:
• Серая схема: ввоз без растаможки, входит в тариф $2.50/кг
• НДС КЗ: 12% | Пошлина: 0-15% (ЕАЭС, зависит от кода)
• Для продажи на Kaspi: авто-аксессуары не требуют сертификата (кроме световых приборов и тормозов)
• Китайские авто (BYD/Haval/Chery) — запчасти ввозятся без проблем, минимум требований
• Лимит для физлиц без пошлин: €200/посылка

🛃 ТАМОЖНЯ АВТОЗАПЧАСТЕЙ — РФ:
• Белая схема: пошлина по ТН ВЭД группа 8708 (автозапчасти)
• Код 8708 — ставка 5-15% + НДС 20%
• Световые приборы (8512.20 — фары, ДХО) — нужна сертификация ТР ТС 018/2011
• Тормозные компоненты — нужна сертификация
• Аналоги (совместимые) запчасти — продаются легально, в отличие от брендовых копий
• Оригинальные детали с чужим брендом (Toyota, BMW) — НЕЛЬЗЯ без разрешения
• Б/у запчасти — нужны отдельные разрешения

📦 КОДЫ ТН ВЭД АВТО:
8708.10 бамперы · 8708.29 кузов · 8708.30 тормоза/суппорты
8708.40 КПП · 8708.50 мосты · 8708.70 колёса
8708.80 подвеска · 8708.91 радиаторы · 8708.92 глушители
8708.94 рулевое · 8708.99 прочее · 8512.20 оптика
8714.xx авто-аксессуары

💡 ЧТО ХОРОШО ВЕЗТИ ИЗ КИТАЯ:
Запчасти-аналоги для BYD/Haval/Chery: дешевле оригинала в 2-4 раза, одинаковое производство
Аксессуары (маржа 150-300%): EVA-коврики, авто-чехлы, видеорегистраторы, LED-лампы, органайзеры
Расходники: масляные/воздушные/салонные фильтры — аналоги продаются без сертификата

⚠️ НЕЛЬЗЯ: подушки безопасности, брендовые копии, б/у запчасти в РФ без разрешений
✅ МОЖНО: все аналоги и совместимые запчасти, любые авто-аксессуары, расходники

💰 ЭКОНОМИКА: купить на 1688 в 3-5 раз дешевле дилерской цены в КЗ/РФ
Доставка: $2.50/кг в КЗ · $3.00/кг в РФ · от 1 кг авиа за $23/кг

═══ ПРАВИЛА ОТВЕТА ═══
- Если спрашивают цену конкретного товара — попроси: количество (шт или кг), страну доставки (РФ или КЗ), и есть ли уже поставщик
- Если клиент готов работать — скажи: "Пришлите ссылку на товар или фото — сделаем расчёт за 15 минут"
- После 2-3 обменов мягко предложи связаться с менеджером: "Для точного расчёта нажмите кнопку «Написать менеджеру» ниже"
- Не называй конкретные имена сотрудников кроме "наш менеджер"
- Если не знаешь ответа — скажи честно и предложи уточнить у менеджера
- Не обещай то, чего нет в этом промпте`;

async function generateBotReply(userName: string, userMessage: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY ?? "";
  const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
  const baseURL = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

  if (!apiKey) return `${userName}, привет! Получил ваш вопрос. Менеджер ответит в течение 5 минут ⚡`;

  try {
    const res = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://chinabridge.pro",
        "X-Title": "ChinaBridge TG Bot",
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 500,
        messages: [
          { role: "system", content: BOT_SYSTEM_PROMPT },
          { role: "user", content: `Клиент ${userName} написал: ${userMessage}` },
        ],
      }),
    });

    if (!res.ok) throw new Error(`LLM ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? `${userName}, получил! Менеджер ответит через 5 минут.`;
  } catch {
    return `${userName}, получил ваш вопрос! Менеджер свяжется с вами в течение 5 минут ⚡`;
  }
}
