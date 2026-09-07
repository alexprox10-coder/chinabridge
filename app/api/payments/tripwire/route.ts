import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TG_TOKEN   = process.env.TELEGRAM_BOT_TOKEN ?? process.env.CHINABRIDGE_LID_BOT_TOKEN ?? "";
const MANAGER_ID = process.env.TELEGRAM_MANAGER_CHAT_ID ?? "8979087725";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureTable(sql: any) {
  await sql`
    CREATE TABLE IF NOT EXISTS tripwire_orders (
      id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      amount       INTEGER DEFAULT 490,
      product_url  TEXT,
      product_name TEXT,
      margin       DECIMAL,
      payment_id   TEXT,
      status       TEXT DEFAULT 'pending',
      paid_at      TIMESTAMPTZ,
      telegram     TEXT,
      report_sent_at TIMESTAMPTZ,
      notes        TEXT
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_tripwire_payment ON tripwire_orders(payment_id)`.catch(() => null);
  await sql`CREATE INDEX IF NOT EXISTS idx_tripwire_status  ON tripwire_orders(status)`.catch(() => null);
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const sql   = neon(process.env.DATABASE_URL!);

    await ensureTable(sql);

    // Создаём заказ в Neon
    const rows = await sql`
      INSERT INTO tripwire_orders (amount, product_url, product_name, margin, status)
      VALUES (490, ${data.product_url ?? null}, ${data.product_name ?? null}, ${data.margin ?? null}, 'pending')
      RETURNING id
    `;
    const orderId = (rows[0] as { id: string }).id;

    const shopId = process.env.YOOKASSA_SHOP_ID;
    const secret = process.env.YOOKASSA_SECRET;

    if (!shopId || !secret) {
      // Нет креденшалов — возвращаем fallback (TG-ссылка)
      return NextResponse.json({
        payment_url: `https://t.me/ChinaBridgeLID_bot?start=tripwire_${orderId.replace(/-/g,"_")}`,
        fallback: true,
      });
    }

    const auth = Buffer.from(`${shopId}:${secret}`).toString("base64");
    const productName = data.product_name
      ? String(data.product_name).slice(0, 60)
      : "товар из Китая";

    const yooRes = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        Authorization:   `Basic ${auth}`,
        "Content-Type":  "application/json",
        "Idempotence-Key": orderId,
      },
      body: JSON.stringify({
        amount:       { value: "490.00", currency: "RUB" },
        confirmation: {
          type:       "redirect",
          return_url: `${process.env.NEXT_PUBLIC_URL ?? "https://chinabridge.pro"}/thank-you?order=${orderId}`,
        },
        description: `Аудит фабрик ChinaBridge · ${productName}`,
        metadata:    { order_id: orderId },
        capture:     true,
      }),
      signal: AbortSignal.timeout(10000),
    });

    const yooData = await yooRes.json() as { id?: string; confirmation?: { confirmation_url?: string } };

    if (yooData.id) {
      await sql`UPDATE tripwire_orders SET payment_id = ${yooData.id} WHERE id = ${orderId}`.catch(() => null);
    }

    // Уведомление менеджеру о новом заказе (до оплаты — для контекста)
    if (TG_TOKEN && MANAGER_ID) {
      const text = [
        `🛒 <b>Новый заказ трипвайера 490₽</b>`,
        ``,
        `📦 Товар: ${productName}`,
        data.product_url ? `🔗 ${data.product_url}` : "",
        data.margin ? `📊 Маржа по расчёту: ${Number(data.margin).toFixed(1)}%` : "",
        ``,
        `⏳ Ожидаем оплату...`,
        `🆔 ${orderId}`,
      ].filter(Boolean).join("\n");

      await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: MANAGER_ID, text, parse_mode: "HTML" }),
        signal: AbortSignal.timeout(6000),
      }).catch(() => null);
    }

    return NextResponse.json({
      payment_url: yooData.confirmation?.confirmation_url ?? null,
      order_id: orderId,
    });
  } catch (e) {
    console.error("[tripwire]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
