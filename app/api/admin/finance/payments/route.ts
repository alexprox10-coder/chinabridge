import { NextRequest, NextResponse } from "next/server";
import { getAllPayments, createPayment } from "@/lib/finance/api";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("lead_id");
  const all = await getAllPayments();
  const filtered = leadId ? all.filter((p) => p.lead_id === leadId) : all;
  return NextResponse.json({ payments: filtered });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payment = await createPayment({
      payment_id:       randomUUID(),
      lead_id:          body.lead_id ?? "",
      order_id:         body.order_id ?? "",
      finance_order_id: body.finance_order_id ?? "",
      client_name:      body.client_name ?? "",
      type:             body.type ?? "prepayment",
      amount:           Number(body.amount) || 0,
      currency:         body.currency ?? "USD",
      payment_date:     body.payment_date ?? new Date().toISOString().slice(0, 10),
      payment_method:   body.payment_method ?? "",
      status:           body.status ?? "pending",
      comment:          body.comment ?? "",
    });
    if (!payment) return NextResponse.json({ error: "insert failed" }, { status: 502 });
    return NextResponse.json({ payment }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
