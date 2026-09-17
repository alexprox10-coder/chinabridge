import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

// POST {operationId} — claim PRO cookie for a no-telegram payment (auto_verified by webhook)
// Atomic: uses UPDATE...RETURNING to prevent race conditions (single-use claim)
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

  // Basic format guard — Tochka operationIds are 36-char UUIDs
  if (operationId.length > 64 || !/^[a-zA-Z0-9\-_]+$/.test(operationId)) {
    return NextResponse.json({ ok: false, error: "invalid_operation_id" }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });
  }

  const sql = neon(process.env.DATABASE_URL);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  try {
    // Ensure audit table exists
    await sql`
      CREATE TABLE IF NOT EXISTS pro_activation_audit (
        id               BIGSERIAL PRIMARY KEY,
        operation_id     TEXT,
        activation_source TEXT NOT NULL,
        ip               TEXT,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `.catch(() => null);

    // Atomic single-use claim: UPDATE only succeeds if status='auto_verified'
    const claimed = await sql`
      UPDATE calc_pending_payments
      SET status = 'claimed'
      WHERE operation_id = ${operationId} AND status = 'auto_verified'
      RETURNING subscribed_until
    ` as Array<{ subscribed_until: string | null }>;

    let until: string;

    if (claimed.length > 0) {
      // First successful claim
      until = claimed[0].subscribed_until ?? new Date(Date.now() + 30 * 86400_000).toISOString();

      // Audit log
      await sql`
        INSERT INTO pro_activation_audit
          (operation_id, activation_source, ip, created_at)
        VALUES
          (${operationId}, 'calc-claim-auto', ${ip}, NOW())
        ON CONFLICT DO NOTHING
      `.catch(() => null);
    } else {
      // Either already claimed (idempotent) or not verified — check current status
      const rows = await sql`
        SELECT status, subscribed_until
        FROM calc_pending_payments
        WHERE operation_id = ${operationId}
        LIMIT 1
      ` as Array<{ status: string; subscribed_until: string | null }>;

      if (rows.length === 0) {
        return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
      }

      if (rows[0].status === "claimed") {
        // Idempotent: already claimed by this user (e.g. cookie lost, page refresh)
        until = rows[0].subscribed_until ?? new Date(Date.now() + 30 * 86400_000).toISOString();
      } else {
        return NextResponse.json({ ok: false, error: "not_verified" }, { status: 400 });
      }
    }

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
