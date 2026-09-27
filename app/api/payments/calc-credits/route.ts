import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { createTochkaPayment } from "@/lib/tochka/client";
import { getOrCreateSessionId, setSessionCookie, getIp } from "@/lib/credits/session";
import { CREDIT_PACKAGES, type PackageId } from "@/lib/credits/types";

export const runtime     = "nodejs";
export const maxDuration = 30;

const CREATE_PENDING_SQL = `
  CREATE TABLE IF NOT EXISTS calc_credit_pending (
    operation_id TEXT PRIMARY KEY,
    session_id   TEXT NOT NULL,
    package_id   TEXT NOT NULL,
    credits      INT  NOT NULL,
    amount_rub   INT  NOT NULL,
    status       TEXT NOT NULL DEFAULT 'pending',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

export async function POST(req: NextRequest) {
  let packageId: PackageId | undefined;
  try {
    const body = await req.json();
    packageId = body?.packageId as PackageId | undefined;
  } catch { /* ignore */ }

  if (!packageId || !(packageId in CREDIT_PACKAGES)) {
    return NextResponse.json({ ok: false, error: "invalid_package" }, { status: 400 });
  }

  const pkg = CREDIT_PACKAGES[packageId];
  const { session_id, isNew } = getOrCreateSessionId(req);
  const ip  = getIp(req);
  const origin = req.headers.get("origin") ?? "https://chinabridge.pro";

  const purpose = `ChinaBridge Кредиты — ${pkg.label} (${pkg.credits} расч.), ${pkg.price} ₽`;

  try {
    const payment = await createTochkaPayment({
      amount:      pkg.price,
      purpose,
      tenantId:    session_id,
      plan:        `calc_credit_${packageId}`,
      redirectUrl: `${origin}/calc-credits-success?pkg=${packageId}`,
      failUrl:     `${origin}/ai-calculator?pay=cancel`,
    });

    if (process.env.DATABASE_URL) {
      try {
        const sql = neon(process.env.DATABASE_URL);
        await sql.unsafe(CREATE_PENDING_SQL);
        await sql`
          INSERT INTO calc_credit_pending
            (operation_id, session_id, package_id, credits, amount_rub)
          VALUES
            (${payment.operationId}, ${session_id}, ${packageId}, ${pkg.credits}, ${pkg.price})
          ON CONFLICT (operation_id) DO NOTHING
        `;
        // Track source IP for the session
        await sql`
          INSERT INTO calculator_sessions (session_id, ip)
          VALUES (${session_id}, ${ip})
          ON CONFLICT (session_id) DO UPDATE SET last_seen = NOW()
        `.catch(() => null);
      } catch (dbErr) {
        console.error("[calc-credits] DB error:", dbErr);
      }
    }

    const res = NextResponse.json({
      ok:          true,
      paymentLink: payment.paymentLink,
      operationId: payment.operationId,
      credits:     pkg.credits,
      price:       pkg.price,
    });
    if (isNew) setSessionCookie(res, session_id);
    return res;
  } catch (err) {
    console.error("[calc-credits] Tochka error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
