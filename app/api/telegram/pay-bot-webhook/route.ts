import { NextRequest, NextResponse } from "next/server";
import { createTochkaPayment } from "@/lib/tochka/client";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const maxDuration = 30;

const TOKEN = process.env.CHINABRIDGE_PAY_BOT_TOKEN!;
const TG_API = `https://api.telegram.org/bot${TOKEN}`;

const PLANS = {
  start:  { name: "Старт",  price: 2990,  limit: "20 документов",          emoji: "📦" },
  pro:    { name: "Про",    price: 7990,  limit: "100 документов + API",    emoji: "🚀" },
  broker: { name: "Брокер", price: 19990, limit: "Безлимит + white-label",  emoji: "🏢" },
} as const;

type PlanKey = keyof typeof PLANS;

async function tg(method: string, body: object) {
  return fetch(`${TG_API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
}

async function sendMenu(chatId: number, firstName: string) {
  await tg("sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text: [
      `👋 <b>Привет, ${firstName}!</b>`,
      ``,
      `Я помогу подключить тариф <b>ChinaBridge Docs</b> — AI-автоматизация таможенных документов для работы с Китаем.`,
      ``,
      `🇨🇳 Читает иероглифы · 📋 Определяет ТН ВЭД · 💰 Считает пошлины`,
      ``,
      `Выберите тариф:`,
    ].join("\n"),
    reply_markup: {
      inline_keyboard: [
        [{ text: "📦 Старт — 2 990 ₽/мес · 20 документов",       callback_data: "plan_start"  }],
        [{ text: "🚀 Про — 7 990 ₽/мес · 100 документов + API",  callback_data: "plan_pro"    }],
        [{ text: "🏢 Брокер — 19 990 ₽/мес · Безлимит",          callback_data: "plan_broker" }],
        [{ text: "🆓 Попробовать бесплатно (3 документа)",        url: "https://chinabridge.pro/docs/upload" }],
      ],
    },
  });
}

async function handlePlanCallback(chatId: number, planKey: PlanKey, telegramUsername: string) {
  const plan = PLANS[planKey];

  let paymentLink: string | null = null;
  try {
    const payment = await createTochkaPayment({
      amount:      plan.price,
      purpose:     `ChinaBridge Docs — тариф "${plan.name}" (${plan.limit})`,
      tenantId:    `tg-${chatId}`,
      plan:        `docs_${planKey}`,
      redirectUrl: "https://chinabridge.pro/docs?paid=1",
      failUrl:     "https://chinabridge.pro/docs?paid=0",
    });
    paymentLink = payment.paymentLink;

    // Save pending payment
    if (process.env.DATABASE_URL) {
      const sql = neon(process.env.DATABASE_URL);
      await sql`
        CREATE TABLE IF NOT EXISTS docs_pending_payments (
          operation_id       TEXT PRIMARY KEY,
          telegram_chat_id   BIGINT,
          telegram_username  TEXT,
          plan_key           TEXT,
          amount_rub         INT,
          status             TEXT NOT NULL DEFAULT 'pending',
          created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `.catch(() => null);
      await sql`
        INSERT INTO docs_pending_payments (operation_id, telegram_chat_id, telegram_username, plan_key, amount_rub)
        VALUES (${payment.operationId}, ${chatId}, ${telegramUsername || null}, ${planKey}, ${plan.price})
        ON CONFLICT (operation_id) DO NOTHING
      `.catch(() => null);
    }
  } catch {
    await tg("sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text: `⚠️ Не удалось создать ссылку на оплату. Напишите менеджеру: <a href="https://t.me/chinabridgeline">@chinabridgeline</a>`,
      reply_markup: { inline_keyboard: [[{ text: "← Назад к тарифам", callback_data: "menu" }]] },
    });
    return;
  }

  await tg("sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text: [
      `${plan.emoji} <b>Тариф: ${plan.name}</b>`,
      ``,
      `💰 <b>${plan.price.toLocaleString("ru-RU")} ₽/мес</b>`,
      `📄 ${plan.limit}`,
      ``,
      `Нажмите кнопку для перехода к оплате:`,
    ].join("\n"),
    reply_markup: {
      inline_keyboard: [
        [{ text: `💳 Оплатить ${plan.price.toLocaleString("ru-RU")} ₽`, url: paymentLink }],
        [{ text: "← Назад к тарифам", callback_data: "menu" }],
      ],
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: true });

  const msg = body.message;
  const cb  = body.callback_query;

  if (msg) {
    const chatId    = msg.chat.id as number;
    const firstName = (msg.from?.first_name as string) ?? "друг";
    await sendMenu(chatId, firstName);
  }

  if (cb) {
    const chatId   = cb.message.chat.id as number;
    const data     = cb.data as string;
    const firstName = (cb.from?.first_name as string) ?? "друг";
    const username  = (cb.from?.username as string) ?? "";

    await tg("answerCallbackQuery", { callback_query_id: cb.id });

    if (data === "menu") {
      await sendMenu(chatId, firstName);
    } else if (data.startsWith("plan_")) {
      const planKey = data.replace("plan_", "") as PlanKey;
      if (planKey in PLANS) await handlePlanCallback(chatId, planKey, username);
      else await sendMenu(chatId, firstName);
    }
  }

  return NextResponse.json({ ok: true });
}
