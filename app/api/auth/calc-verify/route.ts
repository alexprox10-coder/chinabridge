import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let operationId = "";
  let code = "";
  try {
    const body = await req.json();
    operationId = String(body?.operationId ?? "").trim();
    code        = String(body?.code ?? "").trim().replace(/\s/g, "");
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!operationId || !code) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    const rows = await sql`
      SELECT auth_code, auth_code_expires, status, subscribed_until
      FROM calc_pending_payments
      WHERE operation_id = ${operationId}
      LIMIT 1
    ` as Array<{
      auth_code: string | null;
      auth_code_expires: string | null;
      status: string;
      subscribed_until: string | null;
    }>;

    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    const row = rows[0];

    if (row.status === "verified") {
      // Already verified — just re-issue cookie
      const until = row.subscribed_until ?? new Date(Date.now() + 30 * 86400_000).toISOString();
      return issueSubscription(until);
    }

    if (!row.auth_code) {
      return NextResponse.json({ ok: false, error: "code_not_sent" }, { status: 400 });
    }

    if (row.auth_code_expires && new Date(row.auth_code_expires) < new Date()) {
      return NextResponse.json({ ok: false, error: "code_expired" }, { status: 400 });
    }

    if (row.auth_code !== code) {
      return NextResponse.json({ ok: false, error: "wrong_code" }, { status: 400 });
    }

    // Mark verified + return until
    const until = row.subscribed_until ?? new Date(Date.now() + 30 * 86400_000).toISOString();
    await sql`
      UPDATE calc_pending_payments
      SET status = 'verified'
      WHERE operation_id = ${operationId}
    `;

    return issueSubscription(until);
  } catch (err) {
    console.error("[calc-verify]", err);
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
}

function issueSubscription(paidUntil: string) {
  const expires = new Date(paidUntil);
  const res = NextResponse.json({ ok: true, paidUntil });
  res.cookies.set("cb_anon_paid_until", paidUntil, {
    httpOnly: true,
    secure:   true,
    sameSite: "lax",
    path:     "/",
    expires,
  });
  return res;
}
