import { NextRequest, NextResponse } from "next/server";
import { getAllCashFlow, createCashFlowEntry } from "@/lib/finance/api";
import { isAuthorized, getTenantId } from "@/lib/api-auth";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = getTenantId(req);
  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("lead_id");
  const all = await getAllCashFlow(tenantId);
  const filtered = leadId ? all.filter((e) => e.lead_id === leadId) : all;
  return NextResponse.json({ cashflow: filtered });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const tenantId = getTenantId(req);
    const body = await req.json();
    const entry = await createCashFlowEntry(tenantId, {
      cashflow_id:      randomUUID(),
      type:             body.type ?? "income",
      category:         body.category ?? "",
      amount:           Number(body.amount) || 0,
      currency:         body.currency ?? "USD",
      account:          body.account ?? "bank",
      lead_id:          body.lead_id ?? "",
      order_id:         body.order_id ?? "",
      description:      body.description ?? "",
      transaction_date: body.transaction_date ?? new Date().toISOString().slice(0, 10),
    });
    if (!entry) return NextResponse.json({ error: "insert failed" }, { status: 502 });
    return NextResponse.json({ entry }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
