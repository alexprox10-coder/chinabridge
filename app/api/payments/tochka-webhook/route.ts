import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LID_BOT_TOKEN    = process.env.CHINABRIDGE_LID_BOT_TOKEN ?? "";
const PARSER_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const MANAGER_CHAT_ID  = process.env.TELEGRAM_MANAGER_CHAT_ID ?? "8979087725";

export async function POST(req: Request) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const data = (body.Data ?? body) as Record<string, unknown>;
    const operationId = (data.operationId ?? data.OperationId) as string | undefined;
    const status      = (data.status ?? data.Status) as string | undefined;

    if (!operationId || (status !== "PAID" && status !== "APPROVED")) {
      return NextResponse.json({ ok: true });
    }

    const sql          = neon(process.env.DATABASE_URL!);
    const notifyToken  = PARSER_BOT_TOKEN || LID_BOT_TOKEN;

    // ── 1. Попытка: tripwire_orders (490₽) ──────────────────────────────────
    const tripwireRows = await sql`
      UPDATE tripwire_orders
      SET status  = 'paid',
          paid_at = NOW()
      WHERE operation_id = ${operationId}
        AND status = 'pending'
      RETURNING id, product_url, product_name, margin
    `.catch(() => [] as unknown[]);

    const tripwire = (tripwireRows as Array<Record<string, unknown>>)[0];
    if (tripwire) {
      const productName = tripwire.product_name ? String(tripwire.product_name) : "товар из Китая";
      const productUrl  = tripwire.product_url  ? String(tripwire.product_url)  : "";
      const margin      = tripwire.margin ? Number(tripwire.margin).toFixed(1) + "%" : "—";
      const orderId     = String(tripwire.id);

      // Менеджеру — срочное задание
      if (notifyToken && MANAGER_CHAT_ID) {
        await fetch(`https://api.telegram.org/bot${notifyToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: MANAGER_CHAT_ID,
            text: [
              `💰 <b>ОПЛАТА 490₽ — «3 ФАБРИКИ»</b>`,
              ``,
              `📦 ${productName}`,
              productUrl ? `🔗 ${productUrl}` : "",
              `📊 Маржа: ${margin}`,
              ``,
              `⚡ <b>ЗАДАЧА: найти 3 фабрики, прислать отчёт за 24 ч!</b>`,
              ``,
              `🆔 <code>${orderId}</code>`,
              `→ После отправки: UPDATE tripwire_orders SET report_sent_at = NOW() WHERE id = '${orderId}'`,
            ].filter(Boolean).join("\n"),
            parse_mode: "HTML",
          }),
        }).catch(() => null);
      }

      // n8n напоминание через 23 ч
      const n8nWebhook = process.env.N8N_WEBHOOK_TRIPWIRE_PAID;
      if (n8nWebhook) {
        await fetch(n8nWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event:        "tripwire_paid",
            order_id:     orderId,
            product_name: productName,
            product_url:  productUrl,
            margin,
          }),
          signal: AbortSignal.timeout(5000),
        }).catch(() => null);
      }

      return NextResponse.json({ ok: true });
    }

    // ── 2. Fallback: calculator_leads (2000₽ audit) ──────────────────────────
    const leadRows = await sql`
      UPDATE calculator_leads
      SET status = 'tripwire_paid',
          notes  = COALESCE(notes, '') || ' [paid 2000₽]'
      WHERE tochka_operation_id = ${operationId}
      RETURNING id, telegram, chat_id, product_name, margin
    `;
    const lead = (leadRows as Array<Record<string, unknown>>)[0];
    if (!lead) return NextResponse.json({ ok: true });

    // Клиенту
    if (lead.chat_id && notifyToken) {
      await fetch(`https://api.telegram.org/bot${notifyToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: lead.chat_id,
          text: [
            `✅ <b>Оплата получена!</b>`,
            ``,
            `Ваш аудит партии принят в работу.`,
            lead.product_name ? `📦 Товар: ${lead.product_name}` : "",
            ``,
            `⏱ Рассчитываем таможню, поставщиков и маршруты доставки.`,
            `Готово в течение 24 часов.`,
            ``,
            `📲 Менеджер свяжется: @chinabridge_support24_bot`,
          ].filter(Boolean).join("\n"),
          parse_mode: "HTML",
        }),
      }).catch(() => null);
    }

    // Менеджеру
    if (notifyToken && MANAGER_CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${notifyToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: MANAGER_CHAT_ID,
          text: [
            `💰 <b>ОПЛАТА АУДИТА 2 000 ₽</b>`,
            ``,
            `👤 ${lead.telegram ?? "—"}`,
            `🆔 chat_id: <code>${lead.chat_id ?? "—"}</code>`,
            lead.product_name ? `📦 ${lead.product_name}` : "",
            `📊 Маржа: ${lead.margin ? Number(lead.margin).toFixed(1) + "%" : "—"}`,
            ``,
            `→ Выполнить аудит в течение 24 ч`,
          ].filter(Boolean).join("\n"),
          parse_mode: "HTML",
        }),
      }).catch(() => null);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[tochka-webhook]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
