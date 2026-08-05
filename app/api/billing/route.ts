import { NextRequest, NextResponse } from "next/server";

export const runtime     = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { action, plan } = body;

  if (action === "upgrade") {
    // In a real integration: redirect to YuKassa/Stripe/CloudPayments
    // For now: return ok so UI can update state optimistically
    const response = NextResponse.json({ ok: true, plan, message: "Тариф обновлён" });
    if (plan) {
      response.cookies.set("cb_plan", plan, { path: "/", maxAge: 60 * 60 * 24 * 30 });
    }
    return response;
  }

  if (action === "portal") {
    // Customer billing portal URL (YuKassa/Stripe)
    return NextResponse.json({ ok: true, url: "https://chinabridge.pro/billing-portal" });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    plans: [
      { id: "trial",      price: 0,     label: "Trial" },
      { id: "starter",    price: 4900,  label: "Starter" },
      { id: "pro",        price: 9900,  label: "Pro" },
      { id: "enterprise", price: 29900, label: "Enterprise" },
    ],
  });
}
