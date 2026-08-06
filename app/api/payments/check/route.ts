import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/api-auth";
import { getTochkaPaymentStatus } from "@/lib/tochka/client";
import { getPaymentByOperation, updatePaymentStatus } from "@/lib/tochka/db";
import { updateTenant } from "@/lib/multitenant/store";

export const runtime     = "nodejs";
export const maxDuration = 15;

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });

  const operationId = req.nextUrl.searchParams.get("operationId");
  if (!operationId) return NextResponse.json({ ok: false, error: "missing operationId" }, { status: 400 });

  try {
    const status  = await getTochkaPaymentStatus(operationId);
    const payment = await getPaymentByOperation(operationId);

    if (status !== payment?.status) {
      await updatePaymentStatus(operationId, status);
    }

    if (status === "APPROVED" && payment?.tenant_id && payment?.plan) {
      await updateTenant(payment.tenant_id, {
        plan:   payment.plan,
        status: "active",
        mrr:    payment.amount,
      });
    }

    return NextResponse.json({ ok: true, status, plan: payment?.plan ?? null });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
