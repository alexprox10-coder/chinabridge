import { NextRequest, NextResponse } from "next/server";
import { getAllFinanceOrders, createFinanceOrder } from "@/lib/finance/api";
import { calcFinancials } from "@/lib/finance/types";
import { randomUUID } from "crypto";
import { isAuthorized } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("lead_id");
  const all = await getAllFinanceOrders();
  const filtered = leadId ? all.filter((o) => o.lead_id === leadId) : all;
  return NextResponse.json({ orders: filtered });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const computed = calcFinancials(body);
    const order = await createFinanceOrder({
      lead_id:        body.lead_id ?? "",
      order_id:       body.order_id ?? randomUUID(),
      client_id:      body.client_id ?? "",
      client_name:    body.client_name ?? "",
      manager:        body.manager ?? "",
      currency:       body.currency ?? "USD",
      goods_cost:     Number(body.goods_cost) || 0,
      delivery_cost:  Number(body.delivery_cost) || 0,
      services_cost:  Number(body.services_cost) || 0,
      bank_fee:       Number(body.bank_fee) || 0,
      customs_cost:   Number(body.customs_cost) || 0,
      other_expenses: Number(body.other_expenses) || 0,
      client_price:   Number(body.client_price) || 0,
      ...computed,
      notes:  body.notes ?? "",
      status: body.status ?? "active",
    });
    if (!order) return NextResponse.json({ error: "insert failed" }, { status: 502 });
    return NextResponse.json({ order }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
