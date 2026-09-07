import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TG_TOKEN   = process.env.TELEGRAM_BOT_TOKEN ?? process.env.CHINABRIDGE_LID_BOT_TOKEN ?? "";
const MANAGER_ID = process.env.TELEGRAM_MANAGER_CHAT_ID ?? "8979087725";

export async function POST(req: Request) {
  try {
    const event = await req.json() as {
      event: string;
      object: { id: string; metadata?: { order_id?: string }; amount?: { value: string } };
    };

    if (event.event !== "payment.succeeded") {
      return NextResponse.json({ ok: true });
    }

    const paymentId = event.object.id;
    const orderId   = event.object.metadata?.order_id;
    const sql       = neon(process.env.DATABASE_URL!);

    // Обновляем статус в БД
    const rows = await sql`
      UPDATE tripwire_orders
      SET status = 'paid', paid_at = NOW()
      WHERE payment_id = ${paymentId}
      RETURNING id, product_url, product_name, margin, telegram
    `;
    const order = rows[0] as {
      id: string; product_url: string; product_name: string;
      margin: number; telegram: string;
    } | undefined;

    const resolvedOrderId = orderId ?? order?.id ?? paymentId;
    const productName = order?.product_name ?? "товар";
    const productUrl  = order?.product_url ?? "";
    const margin      = order?.margin ? Number(order.margin).toFixed(1) : "—";

    // Срочное уведомление менеджеру
    if (TG_TOKEN && MANAGER_ID) {
      const text = [
        `💰 <b>ОПЛАТА 490₽ ПОЛУЧЕНА!</b>`,
        ``,
        `📦 Товар: ${productName}`,
        productUrl ? `🔗 ${productUrl}` : "",
        `📊 Маржа: ${margin}%`,
        ``,
        `⚡ <b>ЗАДАЧА: найти 3 фабрики и прислать отчёт клиенту за 24 часа!</b>`,
        ``,
        `🆔 ${resolvedOrderId}`,
        ``,
        `→ После отправки отчёта обновить статус в БД (report_sent_at)`,
      ].filter(Boolean).join("\n");

      await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: MANAGER_ID, text, parse_mode: "HTML" }),
        signal: AbortSignal.timeout(8000),
      }).catch(() => null);
    }

    // Если есть n8n вебхук — запускаем напоминание через 23ч
    const n8nWebhook = process.env.N8N_WEBHOOK_TRIPWIRE_PAID ?? process.env.N8N_WEBHOOK_URL;
    if (n8nWebhook) {
      await fetch(n8nWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event:        "tripwire_paid",
          order_id:     resolvedOrderId,
          product_name: productName,
          product_url:  productUrl,
          margin,
          time:         new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(5000),
      }).catch(() => null);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[yukassa-webhook]", e);
    return NextResponse.json({ ok: true }); // всегда 200 для ЮKassa
  }
}
