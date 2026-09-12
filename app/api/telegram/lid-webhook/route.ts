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

// ── Telegram API helpers ───────────────────────────────────────────────────

async function sendMsg(chatId: number | string, text: string, extra?: object) {
  const res = await fetch(`https://api.telegram.org/bot${LID_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...extra }),
  });
  return res.json().catch(() => null);
}

async function answerCallback(callbackQueryId: string, text?: string) {
  await fetch(`https://api.telegram.org/bot${LID_BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text: text ?? "" }),
  });
}

async function notifyManager(text: string) {
  const token = PARSER_BOT_TOKEN || LID_BOT_TOKEN;
  if (!token || !MANAGER_CHAT_ID) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: MANAGER_CHAT_ID, text, parse_mode: "HTML" }),
  }).catch(() => null);
}

// ── DB: bot_sessions ────────────────────────────────────────────────────────

interface BotSession {
  chat_id:          number;
  state:            string;
  source:           string;
  campaign:         string;
  vertical:         string;
  country:          string;
  city:             string;
  product:          string;
  supplier_exists:  boolean | null;
  weight_band:      string;
  purchase_timing:  string;
  intent_score:     number;
  lead_score:       number;
  first_name:       string;
  username:         string;
}

async function ensureBotSessions(sql: NeonQueryFunction<false, false>) {
  await sql`
    CREATE TABLE IF NOT EXISTS bot_sessions (
      chat_id          BIGINT PRIMARY KEY,
      state            TEXT    NOT NULL DEFAULT 'start',
      source           TEXT    NOT NULL DEFAULT '',
      campaign         TEXT    NOT NULL DEFAULT '',
      vertical         TEXT    NOT NULL DEFAULT '',
      country          TEXT    NOT NULL DEFAULT '',
      city             TEXT    NOT NULL DEFAULT '',
      product          TEXT    NOT NULL DEFAULT '',
      supplier_exists  BOOLEAN,
      weight_band      TEXT    NOT NULL DEFAULT '',
      purchase_timing  TEXT    NOT NULL DEFAULT '',
      intent_score     INT     NOT NULL DEFAULT 0,
      lead_score       INT     NOT NULL DEFAULT 0,
      first_name       TEXT    NOT NULL DEFAULT '',
      username         TEXT    NOT NULL DEFAULT '',
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

async function getSession(sql: NeonQueryFunction<false, false>, chatId: number): Promise<BotSession | null> {
  try {
    const rows = await sql`SELECT * FROM bot_sessions WHERE chat_id = ${chatId}`;
    return (rows[0] as BotSession) ?? null;
  } catch { return null; }
}

async function upsertSession(sql: NeonQueryFunction<false, false>, chatId: number, data: Partial<BotSession>) {
  try {
    const s = data;
    await sql`
      INSERT INTO bot_sessions (chat_id, state, source, campaign, vertical, country, city, product,
        supplier_exists, weight_band, purchase_timing, intent_score, lead_score, first_name, username, updated_at)
      VALUES (
        ${chatId},
        ${s.state ?? 'start'}, ${s.source ?? ''}, ${s.campaign ?? ''}, ${s.vertical ?? ''},
        ${s.country ?? ''}, ${s.city ?? ''}, ${s.product ?? ''},
        ${s.supplier_exists ?? null}, ${s.weight_band ?? ''}, ${s.purchase_timing ?? ''},
        ${s.intent_score ?? 0}, ${s.lead_score ?? 0},
        ${s.first_name ?? ''}, ${s.username ?? ''}, NOW()
      )
      ON CONFLICT (chat_id) DO UPDATE SET
        state            = COALESCE(EXCLUDED.state,           bot_sessions.state),
        source           = CASE WHEN EXCLUDED.source <> '' THEN EXCLUDED.source ELSE bot_sessions.source END,
        campaign         = CASE WHEN EXCLUDED.campaign <> '' THEN EXCLUDED.campaign ELSE bot_sessions.campaign END,
        vertical         = CASE WHEN EXCLUDED.vertical <> '' THEN EXCLUDED.vertical ELSE bot_sessions.vertical END,
        country          = CASE WHEN EXCLUDED.country <> '' THEN EXCLUDED.country ELSE bot_sessions.country END,
        city             = CASE WHEN EXCLUDED.city <> '' THEN EXCLUDED.city ELSE bot_sessions.city END,
        product          = CASE WHEN EXCLUDED.product <> '' THEN EXCLUDED.product ELSE bot_sessions.product END,
        supplier_exists  = COALESCE(EXCLUDED.supplier_exists, bot_sessions.supplier_exists),
        weight_band      = CASE WHEN EXCLUDED.weight_band <> '' THEN EXCLUDED.weight_band ELSE bot_sessions.weight_band END,
        purchase_timing  = CASE WHEN EXCLUDED.purchase_timing <> '' THEN EXCLUDED.purchase_timing ELSE bot_sessions.purchase_timing END,
        intent_score     = GREATEST(EXCLUDED.intent_score, bot_sessions.intent_score),
        lead_score       = GREATEST(EXCLUDED.lead_score, bot_sessions.lead_score),
        first_name       = CASE WHEN EXCLUDED.first_name <> '' THEN EXCLUDED.first_name ELSE bot_sessions.first_name END,
        username         = CASE WHEN EXCLUDED.username <> '' THEN EXCLUDED.username ELSE bot_sessions.username END,
        updated_at       = NOW()
    `;
  } catch { /* ignore */ }
}

// ── Campaign decode ─────────────────────────────────────────────────────────

interface CampaignCtx {
  source: string;
  campaign: string;
  vertical: string;
  country: string;
}

function decodeCampaign(param: string): CampaignCtx {
  const p = param.toLowerCase();
  const ctx: CampaignCtx = { source: "unknown", campaign: param, vertical: "GENERAL", country: "" };

  // Source
  if (p.startsWith("vk_")) ctx.source = "vk";
  else if (p.startsWith("yt_")) ctx.source = "youtube";
  else if (p.startsWith("seo_")) ctx.source = "seo";
  else if (p.startsWith("calc")) ctx.source = "calculator";
  else if (p.startsWith("landing")) ctx.source = "landing";

  // Country
  if (p.includes("_kz") || p.includes("kz_")) ctx.country = "KZ";
  else if (p.includes("_ru") || p.includes("ru_")) ctx.country = "RU";

  // Vertical
  if (p.includes("auto_acc") || p.includes("autoac") || p.includes("accessories")) ctx.vertical = "AUTO_ACCESSORIES";
  else if (p.includes("auto_part") || p.includes("autopart") || p.includes("zapchast")) ctx.vertical = "AUTO_PARTS";
  else if (p.includes("auto")) ctx.vertical = "AUTO";
  else if (p.includes("elec") || p.includes("electronics")) ctx.vertical = "ELECTRONICS";
  else if (p.includes("cloth") || p.includes("odezhda")) ctx.vertical = "CLOTHING";
  else if (p.includes("home") || p.includes("household")) ctx.vertical = "HOME";
  else if (p.includes("supplier") || p.includes("sourcing")) ctx.vertical = "SOURCING";

  return ctx;
}

// ── Lead scoring ────────────────────────────────────────────────────────────

function calcLeadScore(s: Partial<BotSession>): number {
  let score = 0;
  if (s.product)                              score += 10;
  if (s.supplier_exists === true)             score += 15;
  if (s.supplier_exists === false)            score += 5;
  if (s.weight_band && s.weight_band !== "")  score += 10;
  if (s.country)                              score += 10;
  if (s.city)                                 score += 10;
  if (s.purchase_timing === "NOW")            score += 20;
  else if (s.purchase_timing === "MONTH")     score += 12;
  else if (s.purchase_timing === "3MON")      score += 6;
  if (s.vertical && s.vertical !== "GENERAL") score += 5;
  return Math.min(score, 100);
}

// ── Keyboards ───────────────────────────────────────────────────────────────

const MAIN_MENU_KB = {
  inline_keyboard: [
    [{ text: "🚚 Доставка из Китая",        callback_data: "menu_delivery" },
     { text: "🔎 Найти поставщика",          callback_data: "menu_supplier" }],
    [{ text: "💰 Проверить товар",           callback_data: "menu_product"  },
     { text: "📦 У меня есть поставщик",     callback_data: "menu_has_supplier" }],
    [{ text: "🚗 Автотовары",               callback_data: "menu_auto"     },
     { text: "💬 Задать свой вопрос",        callback_data: "menu_question" }],
    [{ text: "👤 Нужен менеджер",            callback_data: "menu_manager"  }],
  ],
};

const AUTO_SUB_KB = {
  inline_keyboard: [
    [{ text: "🔧 Автозапчасть",             callback_data: "auto_parts"   },
     { text: "🧰 Автоаксессуар",            callback_data: "auto_acc"     }],
    [{ text: "⚙️ Деталь по артикулу/VIN",   callback_data: "auto_artnumber" },
     { text: "🔎 Найти поставщика авто",    callback_data: "auto_supplier" }],
    [{ text: "🏠 Главное меню",              callback_data: "menu_main"    }],
  ],
};

const AUTO_PARTS_KB = {
  inline_keyboard: [
    [{ text: "🔎 Найти деталь",      callback_data: "flow_sourcing" },
     { text: "💰 Узнать цену",       callback_data: "flow_price"   }],
    [{ text: "🚚 Рассчитать доставку", callback_data: "menu_delivery" },
     { text: "📦 Есть поставщик",    callback_data: "menu_has_supplier" }],
    [{ text: "🏠 Главное меню",       callback_data: "menu_main"   }],
  ],
};

const AUTO_ACC_KB = {
  inline_keyboard: [
    [{ text: "🔎 Найти аксессуар",    callback_data: "flow_sourcing" },
     { text: "💰 Узнать стоимость",   callback_data: "flow_price"   }],
    [{ text: "🚚 Рассчитать доставку", callback_data: "menu_delivery" },
     { text: "📦 Есть поставщик",    callback_data: "menu_has_supplier" }],
    [{ text: "🏠 Главное меню",       callback_data: "menu_main"   }],
  ],
};

const ELECTRONICS_KB = {
  inline_keyboard: [
    [{ text: "💰 Рассчитать товар",   callback_data: "flow_product_check" },
     { text: "🔎 Найти поставщика",   callback_data: "menu_supplier"     }],
    [{ text: "🚚 Рассчитать доставку", callback_data: "menu_delivery" },
     { text: "📦 Есть поставщик",    callback_data: "menu_has_supplier"  }],
    [{ text: "🏠 Главное меню",       callback_data: "menu_main"         }],
  ],
};

const COUNTRY_KB = {
  inline_keyboard: [
    [{ text: "🇰🇿 Казахстан", callback_data: "country_kz" },
     { text: "🇷🇺 Россия",    callback_data: "country_ru" }],
    [{ text: "🏠 Главное меню", callback_data: "menu_main" }],
  ],
};

const CITY_KZ_KB = {
  inline_keyboard: [
    [{ text: "Алматы",   callback_data: "city_almaty"  },
     { text: "Астана",   callback_data: "city_astana"  }],
    [{ text: "Шымкент",  callback_data: "city_shymkent"},
     { text: "Другой",   callback_data: "city_other_kz"}],
    [{ text: "← Назад",  callback_data: "menu_delivery"}],
  ],
};

const CITY_RU_KB = {
  inline_keyboard: [
    [{ text: "Москва",       callback_data: "city_moscow"    },
     { text: "Санкт-Петербург", callback_data: "city_spb"   }],
    [{ text: "Хабаровск",   callback_data: "city_khabarovsk"},
     { text: "Другой",      callback_data: "city_other_ru"  }],
    [{ text: "← Назад",     callback_data: "menu_delivery"  }],
  ],
};

const WEIGHT_KB = {
  inline_keyboard: [
    [{ text: "< 50 кг",    callback_data: "weight_lt50"    },
     { text: "50–200 кг",  callback_data: "weight_50_200"  }],
    [{ text: "200–500 кг", callback_data: "weight_200_500" },
     { text: "500+ кг",    callback_data: "weight_gt500"   }],
    [{ text: "Контейнер",  callback_data: "weight_fcl"     },
     { text: "Не знаю",    callback_data: "weight_unknown" }],
    [{ text: "🏠 Главное меню", callback_data: "menu_main" }],
  ],
};

const TIMING_KB = {
  inline_keyboard: [
    [{ text: "🔥 Сейчас",          callback_data: "timing_now"   }],
    [{ text: "📅 В течение месяца", callback_data: "timing_month" }],
    [{ text: "🕐 1–3 месяца",       callback_data: "timing_3mon"  }],
    [{ text: "👀 Пока изучаю",      callback_data: "timing_look"  }],
  ],
};

const SUPPLIER_KB = {
  inline_keyboard: [
    [{ text: "✅ Есть поставщик", callback_data: "supplier_yes" },
     { text: "🔎 Найти поставщика", callback_data: "supplier_no"}],
    [{ text: "🏠 Главное меню",   callback_data: "menu_main"   }],
  ],
};

const CONTACT_KB = {
  inline_keyboard: [
    [{ text: "Telegram / @username", callback_data: "contact_tg"    }],
    [{ text: "📞 Телефон / WhatsApp", callback_data: "contact_phone" }],
    [{ text: "👤 Нужен менеджер",    callback_data: "menu_manager"  }],
  ],
};

const BACK_MAIN_KB = {
  inline_keyboard: [
    [{ text: "🏠 Главное меню", callback_data: "menu_main" },
     { text: "👤 Нужен менеджер", callback_data: "menu_manager" }],
  ],
};

// ── Menu helpers ────────────────────────────────────────────────────────────

function campaignFirstScreen(firstName: string, ctx: CampaignCtx): { text: string; kb: object } {
  const country = ctx.country === "KZ" ? " для Казахстана" : ctx.country === "RU" ? " для России" : "";

  if (ctx.vertical === "AUTO_ACCESSORIES") {
    return {
      text: `👋 ${firstName}!\n\nВижу, вас интересуют <b>автоаксессуары из Китая${country}</b>. Что нужно сделать?`,
      kb: AUTO_ACC_KB,
    };
  }
  if (ctx.vertical === "AUTO_PARTS") {
    return {
      text: `👋 ${firstName}!\n\nВас интересуют <b>автозапчасти из Китая${country}</b>. Как помочь?`,
      kb: AUTO_PARTS_KB,
    };
  }
  if (ctx.vertical === "AUTO") {
    return {
      text: `👋 ${firstName}!\n\nВас интересуют <b>автотовары из Китая${country}</b>. Что нужно?`,
      kb: AUTO_SUB_KB,
    };
  }
  if (ctx.vertical === "ELECTRONICS") {
    return {
      text: `👋 ${firstName}!\n\nВас интересует <b>электроника из Китая${country}</b>. Что нужно?`,
      kb: ELECTRONICS_KB,
    };
  }
  // Generic
  return {
    text: `👋 ${firstName}, привет!\n\n<b>ChinaBridge</b> — доставка товаров из Китая в Россию и Казахстан.\n\nЧем могу помочь?`,
    kb: MAIN_MENU_KB,
  };
}

// ── Manager brief ───────────────────────────────────────────────────────────

function buildBrief(firstName: string, username: string, chatId: number, s: Partial<BotSession>): string {
  const score = s.lead_score ?? 0;
  const intent = s.intent_score ?? 0;
  const hotEmoji = score >= 70 ? "🔥" : score >= 40 ? "🟡" : "🔵";
  const replyLink = username ? `t.me/${username.replace("@", "")}` : `tg://user?id=${chatId}`;
  const timingLabel: Record<string, string> = { NOW: "Сейчас", MONTH: "В течение месяца", "3MON": "1–3 месяца", LOOK: "Пока изучает" };

  return [
    `${hotEmoji} <b>${score >= 70 ? "HOT" : score >= 40 ? "WARM" : "COLD"} LEAD — ${score}/100</b>`,
    ``,
    `👤 ${firstName} (${username || `id: ${chatId}`})`,
    `📲 Написать: ${replyLink}`,
    ``,
    s.country ? `🌍 Страна: <b>${s.country === "KZ" ? "Казахстан 🇰🇿" : "Россия 🇷🇺"}</b>` : "",
    s.city    ? `📍 Город: ${s.city}` : "",
    s.vertical && s.vertical !== "GENERAL" ? `📦 Направление: ${s.vertical}` : "",
    s.product ? `🛒 Товар: ${s.product}` : "",
    s.supplier_exists === true  ? `✅ Поставщик: ЕСТЬ` : s.supplier_exists === false ? `❌ Поставщик: НЕТ` : "",
    s.weight_band ? `⚖️ Объём: ${s.weight_band}` : "",
    s.purchase_timing ? `⏱ Закупка: ${timingLabel[s.purchase_timing] ?? s.purchase_timing}` : "",
    ``,
    `📊 Lead score: ${score} | Intent: ${intent}`,
    s.campaign ? `📣 Кампания: ${s.campaign}` : "",
    s.source   ? `🔗 Источник: ${s.source}` : "",
    ``,
    `🎯 Рекомендация: ${score >= 70 ? "СВЯЗАТЬСЯ СЕЙЧАС" : score >= 40 ? "Подготовить расчёт" : "Отправить информацию"}`,
  ].filter(Boolean).join("\n");
}

// ── Existing helpers ────────────────────────────────────────────────────────

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

// ── AI system prompt ────────────────────────────────────────────────────────

const BOT_SYSTEM_PROMPT = `Ты — Алексей, AI-менеджер компании ChinaBridge по импорту товаров из Китая.
Отвечаешь в Telegram. Говоришь тепло, по-деловому, как живой человек — не как бот.
Максимум 4-5 предложений на ответ. Без воды и лишних приветствий.

═══ О КОМПАНИИ ═══
ChinaBridge — логистическая компания, доставка товаров из Китая в Россию и Казахстан.
Сайт: chinabridge.pro | Основные рынки: WB, Ozon, Kaspi
Услуги: выкуп на 1688/Alibaba, консолидация, доставка под ключ, поиск поставщика, инспекция
Партнёр в Гуанчжоу (АнтонКит): выкупает с 1688/Alibaba/Taobao, проверяет качество на месте.
Можем работать с поставщиком клиента или найти нового — клиенту менять поставщика не нужно.

═══ НАШИ ТАРИФЫ ═══
🚛 АВТО:
  • Казахстан (Алматы): $2.50/кг, срок 5-8 дней, мин. партия 30 кг
  • Россия (Москва, СПб): $3.00/кг, срок 14-18 дней, мин. партия 100 кг

✈️ АВИА:
  • Из Китая: ~$23/кг, срок 5-7 дней, мин. партия 1 кг

🚢 МОРЕ:
  • $200-500 за кубометр, срок 35-50 дней, от 1 CBM

═══ СХЕМА РАБОТЫ ═══
1. Клиент находит товар на 1688/Alibaba или описывает что нужно → скидывает нам
2. Мы/партнёр проверяем поставщика, договариваемся о цене
3. Делаем выкуп (¥ через наш счёт в Китае)
4. Консолидируем груз на складе в Гуанчжоу
5. Доставляем до склада/адреса в РФ или КЗ

═══ ТАМОЖНЯ И ДОКУМЕНТЫ ═══
КЗ (серая схема): лимит €200/50 кг без пошлин, включено в тариф $2.50/кг.
РФ (белая): таможенная стоимость × ставка ТН ВЭД + НДС 20%. Автозапчасти 8708 — 5-15%.

═══ ЭКСПЕРТИЗА: АВТОТОВАРЫ ═══
Марки в КЗ: BYD (Han/Seal/Atto 3), Haval (Jolion/Dargo/H9), Chery (Tiggo 7-8), Geely, FAW.
Марки в РФ: Haval F7/Jolion, Chery, Geely, FAW, Lifan, Jac.
Аналоги запчастей в 2-4 раза дешевле дилерских. Оригинальные чужие бренды — нельзя.
Аксессуары (коврики, чехлы, регистраторы) — без сертификата для Kaspi.
Коды ТН ВЭД: 8708.xx запчасти, 8512.20 оптика (нужна серт.), 8714.xx аксессуары.

═══ ПОПУЛЯРНЫЕ ВОПРОСЫ ═══
Q: Минимальный заказ? A: Авто КЗ — 30 кг. Авто РФ — 100 кг. Авиа — 1 кг.
Q: Как найти товар? A: Скидывайте фото/название — сами ищем поставщика.
Q: Принимаете ¥? A: Выкупаем за ¥, предоплата в ₽ или USDT.
Q: Страхование? A: Да, 1.5% от стоимости груза.
Q: Маркетплейсы? A: WB, Ozon, Kaspi — доставляем прямо на FBO-склад.

═══ ПРАВИЛА ОТВЕТА ═══
- Если спрашивают цену — попроси: товар, кол-во/кг, страну (РФ или КЗ), есть ли поставщик.
- Если клиент готов: "Пришлите ссылку или фото — сделаем расчёт за 15 минут".
- После 2-3 обменов предложи связь с менеджером мягко.
- Не придумывай тарифы, сроки или гарантии сверх того, что в промпте.
- Не называй имена сотрудников кроме "наш менеджер".`;

async function generateBotReply(
  firstName: string,
  userMessage: string,
  session?: Partial<BotSession> | null
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY ?? "";
  const model  = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
  const baseURL = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

  if (!apiKey) return `${firstName}, получил ваш вопрос. Менеджер ответит в течение 5 минут ⚡`;

  // Add session context to system prompt if available
  let contextBlock = "";
  if (session) {
    const parts: string[] = [];
    if (session.country)  parts.push(`Страна клиента: ${session.country}`);
    if (session.vertical && session.vertical !== "GENERAL") parts.push(`Категория: ${session.vertical}`);
    if (session.product)  parts.push(`Товар: ${session.product}`);
    if (session.city)     parts.push(`Город: ${session.city}`);
    if (session.supplier_exists != null) parts.push(`Поставщик: ${session.supplier_exists ? "есть" : "нет"}`);
    if (session.weight_band) parts.push(`Объём: ${session.weight_band}`);
    if (session.purchase_timing) parts.push(`Сроки: ${session.purchase_timing}`);
    if (parts.length > 0) contextBlock = `\n\n═══ КОНТЕКСТ КЛИЕНТА ═══\n${parts.join("\n")}`;
  }

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
          { role: "system", content: BOT_SYSTEM_PROMPT + contextBlock },
          { role: "user", content: `Клиент ${firstName} написал: ${userMessage}` },
        ],
      }),
    });
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data?.choices?.[0]?.message?.content?.trim() ?? `${firstName}, менеджер скоро свяжется с вами ⚡`;
  } catch {
    return `${firstName}, получил ваш запрос. Менеджер ответит в течение 5 минут ⚡`;
  }
}

// ── Contextual buttons after AI reply ─────────────────────────────────────

function contextualKb(state: string, vertical: string) {
  if (state === "awaiting_product" || state === "flow_sourcing") {
    return {
      inline_keyboard: [
        [{ text: "📦 Есть поставщик",    callback_data: "supplier_yes" },
         { text: "🔎 Найти поставщика",  callback_data: "supplier_no"  }],
        [{ text: "🚚 Рассчитать доставку", callback_data: "menu_delivery" },
         { text: "👤 Нужен менеджер",    callback_data: "menu_manager"  }],
        [{ text: "🏠 Главное меню",       callback_data: "menu_main"    }],
      ],
    };
  }
  if (state === "awaiting_country") return COUNTRY_KB;
  if (state === "awaiting_weight")  return WEIGHT_KB;
  if (state === "awaiting_timing")  return TIMING_KB;

  // Default after AI reply
  return {
    inline_keyboard: [
      [{ text: "🚚 Рассчитать доставку",  callback_data: "menu_delivery" },
       { text: "📦 У меня есть поставщик", callback_data: "menu_has_supplier" }],
      [{ text: "👤 Нужен менеджер",        callback_data: "menu_manager"  },
       { text: "🏠 Главное меню",           callback_data: "menu_main"    }],
    ],
  };
}

// ── Main POST handler ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!LID_BOT_TOKEN) return NextResponse.json({ ok: true });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: true });

  // ── Callback query handler ─────────────────────────────────────────────
  if (body.callback_query) {
    const cq     = body.callback_query;
    const cqId   = cq.id as string;
    const data   = cq.data as string;
    const chatId = cq.from?.id as number;
    const firstName = cq.from?.first_name ?? "клиент";
    const username  = cq.from?.username ? `@${cq.from.username}` : "";

    // Legacy: drip_stop
    if (data === "drip_stop") {
      try {
        const sql = neon(process.env.DATABASE_URL!);
        await sql`UPDATE funnel_subscribers SET opted_out = TRUE WHERE chat_id = ${chatId}`;
      } catch { /* ignore */ }
      await answerCallback(cqId, "Вы отписались от рассылки.");
      return NextResponse.json({ ok: true });
    }

    // Legacy: tripwire payment
    if (data.startsWith("tripwire_")) {
      const leadId = data.replace("tripwire_", "");
      await answerCallback(cqId, "Генерируем ссылку оплаты...");
      try {
        const payResp = await fetch("https://chinabridge.pro/api/payments/create-tripwire", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lead_id: leadId, chat_id: String(chatId) }),
        });
        const payData = await payResp.json() as { paymentLink?: string };
        if (payData.paymentLink) {
          await sendMsg(chatId,
            `💳 <b>Аудит партии — 2 000 ₽</b>\n\n✅ Точный расчёт таможни\n✅ Проверка поставщика\n✅ Сравнение 3 маршрутов\n\n⏱ Готово в течение 24 часов`,
            { reply_markup: { inline_keyboard: [[{ text: "💳 Оплатить 2 000 ₽", url: payData.paymentLink }]] } }
          );
        } else {
          await sendMsg(chatId, `Свяжитесь с менеджером для оплаты аудита:`,
            { reply_markup: { inline_keyboard: [[{ text: "📲 Написать менеджеру", url: "https://t.me/chinabridge_support24_bot" }]] } }
          );
        }
      } catch {
        await sendMsg(chatId, `Напишите менеджеру для оплаты аудита: @chinabridge_support24_bot`);
      }
      return NextResponse.json({ ok: true });
    }

    // ── v2 Menu callbacks ──────────────────────────────────────────────────
    await answerCallback(cqId);

    const sql = neon(process.env.DATABASE_URL!);
    await ensureBotSessions(sql).catch(() => null);
    const session = await getSession(sql, chatId) ?? {} as Partial<BotSession>;

    // Main menu
    if (data === "menu_main") {
      await upsertSession(sql, chatId, { state: "menu" });
      await sendMsg(chatId, `Чем могу помочь, ${firstName}?`, { reply_markup: MAIN_MENU_KB });
      return NextResponse.json({ ok: true });
    }

    if (data === "menu_delivery") {
      if (session.country) {
        // Already know country → ask city
        const kb = session.country === "KZ" ? CITY_KZ_KB : CITY_RU_KB;
        await upsertSession(sql, chatId, { state: "awaiting_city" });
        await sendMsg(chatId, `📍 Куда доставляем?`, { reply_markup: kb });
      } else {
        await upsertSession(sql, chatId, { state: "awaiting_country" });
        await sendMsg(chatId, `🚚 Отлично. Куда доставляем?`, { reply_markup: COUNTRY_KB });
      }
      return NextResponse.json({ ok: true });
    }

    if (data === "menu_supplier") {
      await upsertSession(sql, chatId, { state: "flow_sourcing", supplier_exists: false });
      await sendMsg(chatId,
        `🔎 Можем найти поставщика в Китае или проверить вашего.\n\nОпишите товар или скиньте ссылку с 1688/Alibaba — рассчитаем цену за 15 минут.`,
        { reply_markup: BACK_MAIN_KB }
      );
      return NextResponse.json({ ok: true });
    }

    if (data === "menu_product") {
      await upsertSession(sql, chatId, { state: "menu" });
      await sendMsg(chatId,
        `💰 Для проверки товара и расчёта маржи используйте AI-калькулятор:`,
        { reply_markup: {
            inline_keyboard: [
              [{ text: "📊 Открыть AI-калькулятор", url: "https://chinabridge.pro/ai-calculator" }],
              [{ text: "🚚 Или сразу рассчитать доставку", callback_data: "menu_delivery" }],
              [{ text: "🏠 Главное меню", callback_data: "menu_main" }],
            ],
          },
        }
      );
      return NextResponse.json({ ok: true });
    }

    if (data === "menu_has_supplier" || data === "supplier_yes") {
      await upsertSession(sql, chatId, { state: "flow_has_supplier", supplier_exists: true, lead_score: calcLeadScore({ ...session, supplier_exists: true }) });
      await sendMsg(chatId,
        `📦 Отлично. Поставщика менять не нужно — работаем с вашим текущим.\n\nСкиньте ссылку на поставщика или опишите товар, я рассчитаю доставку до вашего города.`,
        { reply_markup: {
            inline_keyboard: [
              [{ text: "🚚 Рассчитать доставку", callback_data: "menu_delivery" }],
              [{ text: "👤 Нужен менеджер",      callback_data: "menu_manager"  }],
              [{ text: "🏠 Главное меню",         callback_data: "menu_main"    }],
            ],
          },
        }
      );
      return NextResponse.json({ ok: true });
    }

    if (data === "supplier_no") {
      await upsertSession(sql, chatId, { supplier_exists: false });
      await sendMsg(chatId,
        `🔎 Найдём поставщика в Китае. Опишите товар или скиньте ссылку с 1688/Alibaba.`,
        { reply_markup: BACK_MAIN_KB }
      );
      return NextResponse.json({ ok: true });
    }

    if (data === "menu_auto") {
      await upsertSession(sql, chatId, { state: "auto_menu", vertical: "AUTO" });
      await sendMsg(chatId, `🚗 Авто-товары из Китая. Что именно?`, { reply_markup: AUTO_SUB_KB });
      return NextResponse.json({ ok: true });
    }

    if (data === "auto_parts") {
      await upsertSession(sql, chatId, { state: "flow_auto_parts", vertical: "AUTO_PARTS" });
      await sendMsg(chatId,
        `🔧 <b>Автозапчасти из Китая</b>\n\nНапишите марку, модель, год и название детали (или артикул/VIN).\n\nПример: <i>BYD Song Plus 2024, передняя левая фара, 2 шт.</i>`,
        { reply_markup: AUTO_PARTS_KB }
      );
      return NextResponse.json({ ok: true });
    }

    if (data === "auto_acc") {
      await upsertSession(sql, chatId, { state: "flow_auto_acc", vertical: "AUTO_ACCESSORIES" });
      await sendMsg(chatId,
        `🧰 <b>Автоаксессуары из Китая</b>\n\nНапишите что нужно — или выберите направление:`,
        { reply_markup: AUTO_ACC_KB }
      );
      return NextResponse.json({ ok: true });
    }

    if (data === "auto_artnumber") {
      await upsertSession(sql, chatId, { state: "flow_auto_parts", vertical: "AUTO_PARTS" });
      await sendMsg(chatId,
        `⚙️ Напишите артикул детали или VIN автомобиля — найдём на 1688 и рассчитаем стоимость.`,
        { reply_markup: BACK_MAIN_KB }
      );
      return NextResponse.json({ ok: true });
    }

    if (data === "auto_supplier" || data === "flow_sourcing" || data === "flow_price") {
      await upsertSession(sql, chatId, { state: "flow_sourcing" });
      await sendMsg(chatId,
        `🔎 Опишите что нужно найти или привезти — отвечу с ценой и сроками.`,
        { reply_markup: BACK_MAIN_KB }
      );
      return NextResponse.json({ ok: true });
    }

    if (data === "flow_product_check") {
      await sendMsg(chatId, `📊 Рассчитайте маржу и себестоимость в AI-калькуляторе:`,
        { reply_markup: {
            inline_keyboard: [
              [{ text: "📊 AI-калькулятор", url: "https://chinabridge.pro/ai-calculator?country=" + (session.country ?? "KZ") }],
              [{ text: "🏠 Главное меню", callback_data: "menu_main" }],
            ],
          },
        }
      );
      return NextResponse.json({ ok: true });
    }

    if (data === "menu_question") {
      await upsertSession(sql, chatId, { state: "free_chat" });
      await sendMsg(chatId, `💬 Задайте ваш вопрос — отвечу по импорту, таможне, доставке.`, { reply_markup: BACK_MAIN_KB });
      return NextResponse.json({ ok: true });
    }

    if (data === "menu_manager") {
      const brief = buildBrief(firstName, username, chatId, session);
      await notifyManager(`🙋 <b>Клиент запросил менеджера</b>\n\n${brief}`);
      const newScore = Math.min((session.lead_score ?? 0) + 15, 100);
      await upsertSession(sql, chatId, { state: "manager_requested", lead_score: newScore });
      await sendMsg(chatId,
        `👤 Передал ваш запрос менеджеру. Он свяжется в течение 5–15 минут.\n\nПока ждёте — можете написать напрямую:`,
        { reply_markup: {
            inline_keyboard: [
              [{ text: "📲 Написать менеджеру", url: "https://t.me/chinabridge_support24_bot" }],
              [{ text: "🏠 Главное меню", callback_data: "menu_main" }],
            ],
          },
        }
      );
      return NextResponse.json({ ok: true });
    }

    // Country selection
    if (data === "country_kz" || data === "country_ru") {
      const country = data === "country_kz" ? "KZ" : "RU";
      await upsertSession(sql, chatId, { country, state: "awaiting_city" });
      const kb = country === "KZ" ? CITY_KZ_KB : CITY_RU_KB;
      await sendMsg(chatId, `📍 Куда именно доставить?`, { reply_markup: kb });
      return NextResponse.json({ ok: true });
    }

    // City selection
    if (data.startsWith("city_")) {
      const cityMap: Record<string, string> = {
        city_almaty: "Алматы", city_astana: "Астана", city_shymkent: "Шымкент",
        city_moscow: "Москва", city_spb: "Санкт-Петербург", city_khabarovsk: "Хабаровск",
        city_other_kz: "другой город (KZ)", city_other_ru: "другой город (RU)",
      };
      const city = cityMap[data] ?? data.replace("city_", "");
      const newScore = calcLeadScore({ ...session, city });
      await upsertSession(sql, chatId, { city, state: "awaiting_weight", lead_score: newScore });
      await sendMsg(chatId, `⚖️ Примерный вес или объём партии?`, { reply_markup: WEIGHT_KB });
      return NextResponse.json({ ok: true });
    }

    // Weight selection
    if (data.startsWith("weight_")) {
      const weightMap: Record<string, string> = {
        weight_lt50: "< 50 кг", weight_50_200: "50–200 кг",
        weight_200_500: "200–500 кг", weight_gt500: "500+ кг",
        weight_fcl: "Контейнер", weight_unknown: "Не знаю",
      };
      const weight_band = weightMap[data] ?? data;
      const newScore = calcLeadScore({ ...session, weight_band });
      await upsertSession(sql, chatId, { weight_band, state: "awaiting_timing", lead_score: newScore });
      await sendMsg(chatId, `⏱ Когда планируете закупку?`, { reply_markup: TIMING_KB });
      return NextResponse.json({ ok: true });
    }

    // Timing selection
    if (data.startsWith("timing_")) {
      const timingMap: Record<string, string> = {
        timing_now: "NOW", timing_month: "MONTH", timing_3mon: "3MON", timing_look: "LOOK",
      };
      const purchase_timing = timingMap[data] ?? data;
      const intentScore = purchase_timing === "NOW" ? 90 : purchase_timing === "MONTH" ? 65 : purchase_timing === "3MON" ? 40 : 20;
      const newScore = calcLeadScore({ ...session, purchase_timing });
      await upsertSession(sql, chatId, { purchase_timing, intent_score: intentScore, lead_score: newScore, state: "qualified" });

      const finalScore = newScore;
      const isHot = finalScore >= 55;

      // Notify manager if HOT
      if (isHot) {
        const brief = buildBrief(firstName, username, chatId, { ...session, purchase_timing, intent_score: intentScore, lead_score: finalScore });
        await notifyManager(`🔥 <b>АВТОКВАЛИФИКАЦИЯ</b>\n\n${brief}`);
      }

      await sendMsg(chatId,
        `✅ Принял. Подготовлю расчёт по вашей партии.\n\nКуда отправить результат?`,
        { reply_markup: CONTACT_KB }
      );
      return NextResponse.json({ ok: true });
    }

    // Contact request
    if (data === "contact_tg") {
      await upsertSession(sql, chatId, { state: "awaiting_contact_tg" });
      await sendMsg(chatId, `📲 Напишите ваш Telegram @username или можно просто написать здесь — я передам менеджеру.`, { reply_markup: BACK_MAIN_KB });
      return NextResponse.json({ ok: true });
    }

    if (data === "contact_phone") {
      await upsertSession(sql, chatId, { state: "awaiting_contact_phone" });
      await sendMsg(chatId, `📞 Напишите телефон или WhatsApp в формате +7...`, { reply_markup: BACK_MAIN_KB });
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
      await notifyManager(`🔥 <b>Горячий лид из группы</b>\n\n📢 <b>Группа:</b> ${groupName}\n👤 <b>Автор:</b> ${h(firstName)} (${senderLink})\n\n💬 <b>Сообщение:</b>\n${h(text)}\n\n🔑 <i>Ключ: «${h(matched)}»</i>`);
    }
    return NextResponse.json({ ok: true });
  }

  // ── /start handler ─────────────────────────────────────────────────────────
  if (text.startsWith("/start")) {
    const param = text.split(" ")[1] ?? "";
    const sql = neon(process.env.DATABASE_URL!);
    await ensureBotSessions(sql).catch(() => null);
    await ensureBridgeTables(sql).catch(() => null);

    // Legacy: PDF report
    if (param.startsWith("pdf_")) {
      const reportCode = param.replace(/^pdf_/, "").replace(/_/g, "-");
      try {
        const rows = await sql`SELECT * FROM calculator_leads WHERE report_code = ${reportCode}::uuid LIMIT 1`;
        const lead = rows[0] as Record<string, unknown> | undefined;
        if (lead) {
          await sql`ALTER TABLE calculator_leads ADD COLUMN IF NOT EXISTS chat_id TEXT`.catch(() => null);
          await sql`UPDATE calculator_leads SET pdf_sent_at = NOW(), status = 'pdf_sent', chat_id = ${String(chatId)} WHERE report_code = ${reportCode}::uuid`;
          const fmtN = (n: unknown) => n ? Math.round(Number(n)).toLocaleString("ru-RU") : "—";
          const verdictEmoji = lead.verdict === "green" ? "🟢" : lead.verdict === "red" ? "🔴" : "🟡";
          const verdictLabel = lead.verdict === "green" ? "Выгодный товар" : lead.verdict === "red" ? "Требует оптимизации" : "Осторожный потенциал";
          const reportText = [
            `📊 <b>АУДИТ ПАРТИИ — ChinaBridge</b>`,
            `━━━━━━━━━━━━━━━━━━`,
            lead.product_name ? `📦 Товар: ${lead.product_name}` : "",
            `━━━━━━━━━━━━━━━━━━`,
            `${verdictEmoji} <b>${verdictLabel}</b>`,
            `📈 Маржа: <b>${lead.margin ? Number(lead.margin).toFixed(1) : "—"}%</b>`,
            `💰 Прибыль/шт: <b>${fmtN(lead.profit)} ₽</b>`,
            `🛍 Маркетплейс: ${lead.marketplace ?? "—"}`,
            ``,
            `⚠️ <b>НЕ УЧТЕНО в предварительном расчёте:</b>`,
            `• Таможенные пошлины — зависят от ТН ВЭД кода`,
            `• НДС при ввозе — 20% для большинства товаров`,
            `• Реальный объёмный вес — нужен точный замер`,
            `<i>ChinaBridge — доставка из Китая под ключ</i>`,
          ].filter(Boolean).join("\n");
          await sendMsg(chatId, reportText, {
            reply_markup: {
              inline_keyboard: [
                [{ text: "🚀 Привезти этот товар из Китая", callback_data: "menu_delivery" }],
                [{ text: "📋 Заказать аудит за 2 000 ₽", callback_data: `tripwire_${String(lead.id)}` }],
                [{ text: "📊 Рассчитать другой товар", url: "https://chinabridge.pro/ai-calculator" }],
              ],
            },
          });
          await notifyManager(`📨 <b>Лид получил PDF-отчёт</b>\n\n👤 ${firstName} (${username})\n🆔 chat_id: <code>${chatId}</code>\n📊 Маржа: ${lead.margin ? Number(lead.margin).toFixed(1) : "—"}%\n\n📲 Написать: ${message?.from?.username ? `t.me/${message.from.username}` : `tg://user?id=${chatId}`}`);
        } else {
          await sendMsg(chatId, `👋 ${firstName}! Это ChinaBridge — доставка из Китая.`, { reply_markup: MAIN_MENU_KB });
        }
      } catch {
        await sendMsg(chatId, `👋 ${firstName}! Это ChinaBridge — доставка из Китая.`, { reply_markup: MAIN_MENU_KB });
      }
      return NextResponse.json({ ok: true });
    }

    // calc funnel (legacy)
    if (param === "calc" || param.startsWith("calc_")) {
      try {
        await ensureFunnelTable(process.env.DATABASE_URL!);
        await sql`
          INSERT INTO funnel_subscribers (chat_id, first_name, source)
          VALUES (${chatId}, ${firstName}, 'calc')
          ON CONFLICT (chat_id) DO UPDATE SET opted_out = FALSE, drip_step = 0, next_drip_at = NOW() + INTERVAL '2 days'
        `;
      } catch { /* ignore */ }
      await upsertSession(sql, chatId, { source: "calculator", first_name: firstName, username });
      await notifyManager(`🔔 <b>Лид с калькулятора</b>\n\n👤 ${firstName} (${username})\n🆔 chat_id: <code>${chatId}</code>`);
      await sendMsg(chatId,
        `👋 ${firstName}!\n\nЭто ChinaBridge — доставка из Китая в Россию и Казахстан.\n\nЧем могу помочь?`,
        { reply_markup: MAIN_MENU_KB }
      );
      return NextResponse.json({ ok: true });
    }

    // v2: campaign-aware start
    const ctx = param ? decodeCampaign(param) : { source: "direct", campaign: "", vertical: "GENERAL", country: "" };

    // Check returning user
    const existingSession = await getSession(sql, chatId);
    const isReturning = existingSession && existingSession.product;

    await upsertSession(sql, chatId, {
      source: ctx.source,
      campaign: ctx.campaign,
      vertical: ctx.vertical !== "GENERAL" ? ctx.vertical : (existingSession?.vertical ?? "GENERAL"),
      country: ctx.country || (existingSession?.country ?? ""),
      first_name: firstName,
      username,
      state: "start",
    });

    if (isReturning && existingSession?.product) {
      await sendMsg(chatId,
        `👋 ${firstName}, снова привет!\n\nВ прошлый раз вас интересовало: <b>${existingSession.product}</b>${existingSession.city ? ` → ${existingSession.city}` : ""}.\n\nПродолжим или нужно что-то другое?`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "✅ Продолжить",        callback_data: "menu_delivery"   }],
              [{ text: "🔄 Другой запрос",      callback_data: "menu_main"       }],
              [{ text: "👤 Нужен менеджер",     callback_data: "menu_manager"    }],
            ],
          },
        }
      );
    } else {
      const screen = campaignFirstScreen(firstName, ctx);
      await sendMsg(chatId, screen.text, { reply_markup: screen.kb });
    }

    // Notify manager about new lead
    await notifyManager(`🔔 <b>Новый лид открыл бот</b>\n\n👤 ${firstName} (${username})\n🆔 chat_id: <code>${chatId}</code>${ctx.vertical !== "GENERAL" ? `\n📦 Категория: ${ctx.vertical}` : ""}${ctx.country ? `\n🌍 Страна: ${ctx.country}` : ""}${ctx.campaign ? `\n📣 Кампания: ${ctx.campaign}` : ""}\n\n📲 Написать: ${message?.from?.username ? `t.me/${message.from.username}` : `tg://user?id=${chatId}`}`);
    return NextResponse.json({ ok: true });
  }

  // ── Manager reply bridge ───────────────────────────────────────────────────
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
    return NextResponse.json({ ok: true });
  }

  // ── Client free-text message → AI + buttons ────────────────────────────────
  const sql = neon(process.env.DATABASE_URL!);
  await ensureBotSessions(sql).catch(() => null);
  await ensureBridgeTables(sql).catch(() => null);

  const session = await getSession(sql, chatId) ?? {} as Partial<BotSession>;

  // Extract product from free text if not set
  const newSession: Partial<BotSession> = { first_name: firstName, username };
  if (!session.product && text.length > 5) {
    newSession.product = text.slice(0, 200);
    newSession.lead_score = calcLeadScore({ ...session, product: text });
  }

  // Detect country from text
  if (!session.country) {
    const lc = text.toLowerCase();
    if (lc.includes("казахстан") || lc.includes("алматы") || lc.includes("астана") || lc.includes("kz")) newSession.country = "KZ";
    else if (lc.includes("россия") || lc.includes("москва") || lc.includes("питер") || lc.includes("ru")) newSession.country = "RU";
  }

  await upsertSession(sql, chatId, newSession);

  const updatedSession = { ...session, ...newSession };
  const aiReply = await generateBotReply(firstName, text, updatedSession);
  const kb = contextualKb(updatedSession.state ?? "", updatedSession.vertical ?? "");

  await sendMsg(chatId, aiReply, { reply_markup: kb });

  // Forward to manager
  const h = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const replyLink = message.from?.username ? `t.me/${message.from.username}` : `tg://user?id=${chatId}`;
  const score = updatedSession.lead_score ?? 0;
  await notifyManager(
    `💬 <b>${score >= 70 ? "🔥 HOT" : score >= 40 ? "🟡 WARM" : "💬"} Клиент пишет</b>\n\n👤 ${firstName} (${username})\n📲 ${replyLink}\n\n<i>${h(text.slice(0, 300))}</i>${updatedSession.campaign ? `\n\n📣 ${updatedSession.campaign}` : ""}${updatedSession.country ? ` · ${updatedSession.country}` : ""}`
  );

  return NextResponse.json({ ok: true });
}
