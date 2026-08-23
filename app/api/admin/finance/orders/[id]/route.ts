import { NextRequest, NextResponse } from "next/server";
import { getFinanceOrderById, updateFinanceOrder } from "@/lib/finance/api";
import { isAuthorized, getTenantId } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = getTenantId(req);
  const { id } = await params;
  const order = await getFinanceOrderById(tenantId, Number(id));
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = getTenantId(req);
  const { id } = await params;
  try {
    const body = await req.json();
    const ok = await updateFinanceOrder(tenantId, Number(id), body);
    if (!ok) return NextResponse.json({ error: "update failed" }, { status: 502 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
