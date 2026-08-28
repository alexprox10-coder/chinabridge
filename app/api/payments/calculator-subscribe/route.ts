import { NextRequest, NextResponse } from "next/server";
import { createTochkaPayment } from "@/lib/tochka/client";

export const runtime     = "nodejs";
export const maxDuration = 30;

const PRICE_RUB = 1990;

export async function POST(req: NextRequest) {
  const origin      = req.headers.get("origin") ?? "https://chinabridge.pro";
  const redirectUrl = `${origin}/calculator-success`;
  const isLoggedIn  = !!req.cookies.get("cb_client")?.value;
  const failUrl     = isLoggedIn
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
