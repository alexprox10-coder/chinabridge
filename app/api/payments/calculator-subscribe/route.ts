import { NextRequest, NextResponse } from "next/server";
import { createTochkaPayment } from "@/lib/tochka/client";
import { neon } from "@neondatabase/serverless";

export const runtime     = "nodejs";
export const maxDuration = 30;

const PRICE_RUB = 490;

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS calc_pending_payments (
    operation_id       TEXT PRIMARY KEY,
    telegram_username  TEXT,
    auth_code          TEXT,
    auth_code_expires  TIMESTAMPTZ,
    status             TEXT NOT NULL DEFAULT 'pending',
    subscribed_until   TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin") ?? "https://chinabridge.pro";
  const isLoggedIn = !!req.cookies.get("cb_client")?.value;

  let telegram = "";
  try {
    const body = await req.json();
    telegram = (body?.telegram ?? "").trim().replace(/^@/, "");
  } catch { /* no body — anonymous payment */ }

  const redirectUrl = `${origin}/calculator-success`;
  const failUrl = isLoggedIn
    ? `${origin}/client/plans?pay=cancel`
    : `${origin}/ai-calculator?pay=cancel`;

  try {
    const payment = await createTochkaPayment({
      amount:      PRICE_RUB,
      purpose:     "Подписка на AI-калькулятор маржи ChinaBridge — 1 месяц",
      tenantId:    "tenant-chinabridge",
      plan:        "calculator",
      redirectUrl,
      failUrl,
    });

    // Persist pending record so Tochka webhook can send the code
    if (process.env.DATABASE_URL) {
      try {
        const sql = neon(process.env.DATABASE_URL);
        await sql.unsafe(CREATE_TABLE_SQL);
        await sql`
          INSERT INTO calc_pending_payments (operation_id, telegram_username)
          VALUES (${payment.operationId}, ${telegram || null})
          ON CONFLICT (operation_id) DO NOTHING
        `;
      } catch (dbErr) {
        console.error("[calculator-subscribe] DB error:", dbErr);
      }
    }

    return NextResponse.json({
      ok:          true,
      paymentLink: payment.paymentLink,
      operationId: payment.operationId,
    });
  } catch (err) {
    console.error("[calculator-subscribe] Tochka error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
