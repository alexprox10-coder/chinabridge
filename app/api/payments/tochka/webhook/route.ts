import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { updatePaymentStatus } from "@/lib/tochka/db";
import { updateTenant } from "@/lib/multitenant/store";

export const runtime = "nodejs";

const sql = neon(process.env.DATABASE_URL!);

async function ensureLinksTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS tochka_payment_links (
      id           SERIAL PRIMARY KEY,
      operation_id TEXT    UNIQUE NOT NULL,
      amount       NUMERIC(12,2) NOT NULL,
      purpose      TEXT    NOT NULL,
      payment_link TEXT    NOT NULL,
      status       TEXT    NOT NULL DEFAULT 'CREATED',
      created_by   TEXT,
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      updated_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

/* ── POST /api/payments/tochka/webhook ───────────────────────────────────── */
/*
  Tochka sends webhook events when payment status changes.
  Event type: acquiringInternetPayment
  Body example:
  {
    "Data": {
      "eventType": "acquiringInternetPayment",
      "operationId": "...",
      "status": "APPROVED" | "DECLINED" | "EXPIRED",
      "amount": 9900,
      ...
    }
  }
*/

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const data        = body?.Data as Record<string, unknown> | undefined;
  const eventType   = data?.eventType as string | undefined;
  const operationId = data?.operationId as string | undefined;
  const status      = data?.status as string | undefined;

  // Only process acquiring events
  if (eventType !== "acquiringInternetPayment") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  if (!operationId || !status) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  try {
    // 1. Update in tochka_payments table (billing plan payments)
    await updatePaymentStatus(operationId, status);

    // 2. Update in tochka_payment_links table (manager-created links)
    await ensureLinksTable();
    await sql`
      UPDATE tochka_payment_links
      SET status = ${status}, updated_at = NOW()
      WHERE operation_id = ${operationId}
    `;

    // 3. If APPROVED — check if this is a billing plan payment and activate tenant
    if (status === "APPROVED") {
      const rows = await sql`
        SELECT tenant_id, plan, amount
        FROM tochka_payments
        WHERE operation_id = ${operationId}
        LIMIT 1
      ` as Record<string, unknown>[];

      const payment = rows[0];
      if (payment?.tenant_id && payment?.plan) {
        await updateTenant(String(payment.tenant_id), {
          plan:   String(payment.plan) as import("@/lib/multitenant/types").BillingPlan,
          status: "active",
          mrr:    Number(payment.amount) || 0,
        });
      }
    }

    return NextResponse.json({ ok: true, operationId, status });
  } catch (err) {
    // Return 200 to prevent Tochka from retrying endlessly for DB errors
    console.error("Tochka webhook error:", err);
    return NextResponse.json({ ok: false, error: String(err) });
  }
}
