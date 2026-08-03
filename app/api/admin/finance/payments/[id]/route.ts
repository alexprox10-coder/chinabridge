import { NextRequest, NextResponse } from "next/server";
import { updatePayment } from "@/lib/finance/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const ok = await updatePayment(Number(id), body);
    if (!ok) return NextResponse.json({ error: "update failed" }, { status: 502 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
