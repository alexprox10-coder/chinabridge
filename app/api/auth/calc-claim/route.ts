import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

// POST {operationId} — claim PRO cookie for a no-telegram payment that was auto_verified by webhook
export async function POST(req: NextRequest) {
  let operationId = "";
  try {
    const body = await req.json();
    operationId = String(body?.operationId ?? "").trim();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!operationId) {
    return NextResponse.json({ ok: false, error: "missing_operation_id" }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    const rows = await sql`
      SELECT status, subscribed_until
      FROM calc_pending_payments
      WHERE operation_id = ${operationId}
      LIMIT 1
    ` as Array<{ status: string; subscribed_until: string | null }>;

    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    const row = rows[0];

    if (row.status !== "auto_verified" && row.status !== "claimed") {
      return NextResponse.json({ ok: false, error: "not_verified" }, { status: 400 });
    }

    const until = row.subscribed_until ?? new Date(Date.now() + 30 * 86400_000).toISOString();

    await sql`
      UPDATE calc_pending_payments
      SET status = 'claimed'
      WHERE operation_id = ${operationId} AND status = 'auto_verified'
    `;

    const res = NextResponse.json({ ok: true, paidUntil: until });
    res.cookies.set("cb_anon_paid_until", until, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      expires: new Date(until),
    });
    return res;
  } catch (err) {
    console.error("[calc-claim]", err);
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
}
