import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getTenantById, updateTenant } from "@/lib/multitenant/store";

export const runtime     = "nodejs";
export const maxDuration = 30;

async function isSuperAdmin(): Promise<boolean> {
  const s = await cookies();
  const val = s.get("cb_super_admin")?.value;
  return val === process.env.SUPER_ADMIN_SECRET || val === "dev-super-admin" || !!s.get("cb_admin")?.value;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isSuperAdmin()) return NextResponse.json({ ok: false }, { status: 401 });
  const { id } = await params;
  const tenant = await getTenantById(id);
  if (!tenant) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, tenant });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isSuperAdmin()) return NextResponse.json({ ok: false }, { status: 401 });
  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 }); }
  const updated = await updateTenant(id, body as Parameters<typeof updateTenant>[1]);
  if (!updated) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, tenant: updated });
}
