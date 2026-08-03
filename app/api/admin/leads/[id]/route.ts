import { NextRequest, NextResponse } from "next/server";
import { getLead, updateLead, deleteLead } from "@/lib/crm/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await getLead(Number(id));
  if (!lead) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const ok = await updateLead(Number(id), body);
  if (!ok) return NextResponse.json({ error: "update_failed" }, { status: 502 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = await deleteLead(Number(id));
  if (!ok) return NextResponse.json({ error: "delete_failed" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
