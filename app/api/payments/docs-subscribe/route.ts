import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { createTochkaPayment } from "@/lib/tochka/client";
import { getOrCreateSessionId, setSessionCookie } from "@/lib/credits/session";

export const runtime     = "nodejs";
export const maxDuration = 30;

const DOCS_PACKAGES = {
  docs_starter: { label: "Старт",  price: 2990,  docs: 10   },
  docs_pro:     { label: "Про",    price: 7990,  docs: 50   },
  docs_broker:  { label: "Брокер", price: 19990, docs: 1000 },
} as const;

type DocsPlanId = keyof typeof DOCS_PACKAGES;

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS docs_subscriptions (
    operation_id TEXT PRIMARY KEY,
    session_id   TEXT NOT NULL,
    plan         TEXT NOT NULL,
    docs_total   INT  NOT NULL,
    docs_used    INT  NOT NULL DEFAULT 0,
    amount_rub   INT  NOT NULL,
    status       TEXT NOT NULL DEFAULT 'pending',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

export async function POST(req: NextRequest) {
  let planId: DocsPlanId | undefined;
  try {
    const body = await req.json();
    planId = body?.planId as DocsPlanId | undefined;
  } catch { /* ignore */ }

  if (!planId || !(planId in DOCS_PACKAGES)) {
    return NextResponse.json({ ok: false, error: "invalid_plan" }, { status: 400 });
  }

  const pkg = DOCS_PACKAGES[planId];
  const { session_id, isNew } = getOrCreateSessionId(req);
  const origin = req.headers.get("origin") ?? "https://chinabridge.pro";
  const purpose = `ChinaBridge Docs — ${pkg.label} (${pkg.docs} документов), ${pkg.price} ₽`;

  try {
    const payment = await createTochkaPayment({
      amount:      pkg.price,
      purpose,
      tenantId:    session_id,
      plan:        planId,
      redirectUrl: `${origin}/docs/upload?paid=1&plan=${planId}`,
      failUrl:     `${origin}/docs/upload?pay=cancel`,
    });

    if (process.env.DATABASE_URL) {
      try {
        const sql = neon(process.env.DATABASE_URL);
        await sql.unsafe(CREATE_TABLE_SQL);
        await sql`
          INSERT INTO docs_subscriptions (operation_id, session_id, plan, docs_total, amount_rub)
          VALUES (${payment.operationId}, ${session_id}, ${planId}, ${pkg.docs}, ${pkg.price})
          ON CONFLICT (operation_id) DO NOTHING
        `;
      } catch (dbErr) {
        console.error("[docs-subscribe] DB error:", dbErr);
      }
    }

    const res = NextResponse.json({
      ok:          true,
      paymentLink: payment.paymentLink,
      operationId: payment.operationId,
      docs:        pkg.docs,
      price:       pkg.price,
    });
    if (isNew) setSessionCookie(res, session_id);
    return res;
  } catch (err) {
    console.error("[docs-subscribe] Tochka error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
