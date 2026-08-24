import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LID_BOT_TOKEN = process.env.CHINABRIDGE_LID_BOT_TOKEN ?? "";

async function sendTg(chatId: number | string, text: string, keyboard?: object[][]) {
  await fetch(`https://api.telegram.org/bot${LID_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}),
    }),
  });
}

const DRIP: Array<{
  text: string;
  keyboard: object[][];
  daysNext: number;
}> = [
  {
    // step 0 — D+2
    text: `📦 *Кейс: Наушники TWS из Китая → WB Москва*

Клиент закупил 100 шт по ¥38 на 1688.
Карго: ~$2.8/кг, итого 1 480₽ за партию.
Продавал по 1 990₽ на WB.

*Итог:*
→ Маржа: 28.6%
→ ROI: 107%
→ Прибыль: +57 200₽ с партии

Такой товар можно найти через наш калькулятор за 2 минуты 👇`,
    keyboard: [[{ text: "🔢 Рассчитать свой товар", url: "https://chinabridge.pro/ai-calculator" }]],
    daysNext: 2,
  },
  {
    // step 1 — D+4
    text: `🚚 *Реальные ставки карго ChinaBridge*

Возим напрямую, без посредников:

• Авто сборный груз: от *$2.5/кг*
• Авиа (срочно): от *$6/кг*
• Транзит через KZ: без проблем

Среднее время: *14–21 день* из любого города Китая в Алматы или Москву.

Рассчитайте доставку вашего товара 👇`,
    keyboard: [[{ text: "📊 Калькулятор доставки", url: "https://chinabridge.pro/delivery-calculator" }]],
    daysNext: 3,
  },
  {
    // step 2 — D+7
    text: `💡 *Безлимитные расчёты — 490₽/мес*

Вы уже пробовали калькулятор.
Подписка убирает лимит и открывает:

✓ Безлимитные расчёты AI-калькулятора
✓ AI-парсинг ссылок с 1688 и Alibaba
✓ История всех расчётов в личном кабинете
✓ Реальные ставки карго в каждом расчёте

*≈ 16₽/день* — дешевле чашки кофе.`,
    keyboard: [
      [{ text: "🔓 Подключить за 490₽/мес", url: "https://chinabridge.pro/ai-calculator" }],
      [{ text: "Нет, не нужно", callback_data: "drip_stop" }],
    ],
    daysNext: 3,
  },
  {
    // step 3 — D+10
    text: `👋 *Последнее сообщение*

Если найдёте интересный товар — напишите нам.
Менеджер проверит расчёт, найдёт поставщика на 1688 и предложит реальную стоимость закупки и доставки.

Отвечаем в течение 15 минут.`,
    keyboard: [[{ text: "✈️ Написать менеджеру", url: "https://t.me/ChinaBridgeLID_bot" }]],
    daysNext: 0,
  },
];

export async function ensureFunnelTable(sql: ReturnType<typeof neon>) {
  await sql`
    CREATE TABLE IF NOT EXISTS funnel_subscribers (
      id            SERIAL PRIMARY KEY,
      chat_id       BIGINT UNIQUE NOT NULL,
      first_name    TEXT,
      source        TEXT DEFAULT 'calc',
      drip_step     INT DEFAULT 0,
      subscribed_at TIMESTAMPTZ DEFAULT NOW(),
      next_drip_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '2 days',
      opted_out     BOOLEAN DEFAULT FALSE
    )
  `;
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET ?? "";
  const auth = req.headers.get("authorization") ?? "";
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  if (!LID_BOT_TOKEN) return NextResponse.json({ ok: false, error: "no token" });

  const sql = neon(process.env.DATABASE_URL!);
  await ensureFunnelTable(sql);

  const due = await sql`
    SELECT id, chat_id, first_name, drip_step
    FROM funnel_subscribers
    WHERE opted_out = FALSE
      AND drip_step < ${DRIP.length}
      AND next_drip_at <= NOW()
    ORDER BY next_drip_at ASC
    LIMIT 100
  `;

  let sent = 0;
  for (const row of due) {
    const step = Number(row.drip_step);
    const msg  = DRIP[step];
    if (!msg) continue;

    try {
      await sendTg(row.chat_id as number, msg.text, msg.keyboard);

      const nextStep = step + 1;
      const nextAt   = msg.daysNext > 0
        ? new Date(Date.now() + msg.daysNext * 86_400_000).toISOString()
        : new Date(Date.now() + 9999 * 86_400_000).toISOString();

      await sql`
        UPDATE funnel_subscribers
        SET drip_step = ${nextStep}, next_drip_at = ${nextAt}
        WHERE id = ${row.id as number}
      `;
      sent++;
    } catch { /* skip failed sends */ }
  }

  return NextResponse.json({ ok: true, sent, total: due.length });
}
