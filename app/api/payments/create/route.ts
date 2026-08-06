import { NextRequest, NextResponse } from "next/server";
import { isAuthorized, getTenantId } from "@/lib/api-auth";
import { createTochkaPayment } from "@/lib/tochka/client";
import { savePayment } from "@/lib/tochka/db";
import { PLAN_CONFIG } from "@/lib/multitenant/types";
import type { BillingPlan } from "@/lib/multitenant/types";

export const runtime     = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { plan, tenantId: bodyTenantId } = await req.json().catch(() => ({})) as { plan?: string; tenantId?: string };

  if (!plan || !(plan in PLAN_CONFIG)) {
    return NextResponse.json({ ok: false, error: "invalid plan" }, { status: 400 });
  }

  const config = PLAN_CONFIG[plan as BillingPlan];
  if (config.price === 0) return NextResponse.json({ ok: false, error: "trial is free" }, { status: 400 });

  const tenantId = bodyTenantId ?? getTenantId(req);
  const origin   = req.headers.get("origin") ?? "https://chinabridge.pro";

  try {
    const payment = await createTochkaPayment({
      amount:      config.price,
      purpose:     `ChinaBridge ${config.label} — ежемесячная подписка`,
      tenantId,
      plan,
      redirectUrl: `${origin}/admin/settings/billing?paid=1&plan=${plan}`,
      failUrl:     `${origin}/admin/settings/billing?paid=0`,
    });

    await savePayment({
      operationId:  payment.operationId,
      tenantId,
      plan,
      amount:       config.price,
      paymentLink:  payment.paymentLink,
    });

    return NextResponse.json({ ok: true, paymentLink: payment.paymentLink, operationId: payment.operationId });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
