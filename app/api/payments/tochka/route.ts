import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { neon } from "@neondatabase/serverless";
import { createTochkaPayment, getTochkaPaymentStatus } from "@/lib/tochka/client";

export const runtime     = "nodejs";
export const maxDuration = 30;

async function requireAdmin(): Promise<boolean> {
  const store = await cookies();
  return Boolean(store.get("cb_admin")?.value);
}

function getSql() {
  return neon(process.env.DATABASE_URL!);
}

async function ensureLinksTable() {
  const sql = getSql();
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

/* ── POST /api/payments/tochka — create payment link ─────────────────────── */

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let amount: number, purpose: string;
  try {
    const body = await req.json();
    amount  = Number(body.amount);
    purpose = String(body.purpose ?? "").trim();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  if (!amount || amount <= 0) {
    return NextResponse.json({ ok: false, error: "amount_required" }, { status: 400 });
  }
  if (!purpose) {
    return NextResponse.json({ ok: false, error: "purpose_required" }, { status: 400 });
  }

  const origin     = req.headers.get("origin") ?? "https://chinabridge.pro";
  const redirectUrl = `${origin}/admin/finance/payments`;
  const failUrl     = `${origin}/admin/finance/payments`;

  try {
    const payment = await createTochkaPayment({
      amount,
      purpose,
      tenantId:    "tenant-chinabridge",
      plan:        "manual",
      redirectUrl,
      failUrl,
    });

    await ensureLinksTable();
    const sql = getSql();
    await sql`
      INSERT INTO tochka_payment_links (operation_id, amount, purpose, payment_link)
      VALUES (${payment.operationId}, ${amount}, ${purpose}, ${payment.paymentLink})
      ON CONFLICT (operation_id) DO NOTHING
    `;

    return NextResponse.json({
      ok:          true,
      operationId: payment.operationId,
      paymentLink: payment.paymentLink,
      status:      payment.status,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

/* ── GET /api/payments/tochka — list all links OR check status ───────────── */
/*
  No  operationId → returns list of all payment links (for finance page)
  With operationId → checks and returns status for that operation
*/

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const operationId = req.nextUrl.searchParams.get("operationId");
  await ensureLinksTable();
  const sql = getSql();

  // --- List mode ---
  if (!operationId) {
    try {
      const rows = await sql`
        SELECT id, operation_id, amount, purpose, payment_link, status, created_at
        FROM tochka_payment_links
        ORDER BY created_at DESC
        LIMIT 50
      ` as Record<string, unknown>[];
      return NextResponse.json({ ok: true, links: rows });
    } catch (err) {
      return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
    }
  }

  // --- Status check mode ---
  try {
    const status = await getTochkaPaymentStatus(operationId);

    await sql`
      UPDATE tochka_payment_links
      SET status = ${status}, updated_at = NOW()
      WHERE operation_id = ${operationId}
    `;

    return NextResponse.json({ ok: true, operationId, status });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
