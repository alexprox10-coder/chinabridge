import { NextRequest, NextResponse } from "next/server";
import { getAllExpenses, createExpense } from "@/lib/finance/api";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("lead_id");
  const all = await getAllExpenses();
  const filtered = leadId ? all.filter((e) => e.lead_id === leadId) : all;
  return NextResponse.json({ expenses: filtered });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const expense = await createExpense({
      expense_id:       randomUUID(),
      lead_id:          body.lead_id ?? "",
      order_id:         body.order_id ?? "",
      finance_order_id: body.finance_order_id ?? "",
      category:         body.category ?? "Прочее",
      amount:           Number(body.amount) || 0,
      currency:         body.currency ?? "USD",
      expense_date:     body.expense_date ?? new Date().toISOString().slice(0, 10),
      description:      body.description ?? "",
      receipt_url:      body.receipt_url ?? "",
    });
    if (!expense) return NextResponse.json({ error: "insert failed" }, { status: 502 });
    return NextResponse.json({ expense }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
