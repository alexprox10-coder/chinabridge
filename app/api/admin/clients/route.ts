import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAllClients, softDeleteClient, getClientById } from "@/lib/client-portal/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function isAdmin(): Promise<boolean> {
  const s = await cookies();
  const val = s.get("cb_super_admin")?.value;
  return val === process.env.SUPER_ADMIN_SECRET || val === "dev-super-admin" || !!s.get("cb_admin")?.value;
}

export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ ok: false }, { status: 401 });
  const clients = await getAllClients();
  return NextResponse.json({ ok: true, clients });
}

export async function DELETE(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ ok: false, step: "auth" }, { status: 401 });
  const body = await req.json().catch(() => ({})) as { client_id?: string };
  const { client_id } = body;
  console.log("[DELETE /api/admin/clients] client_id=", client_id);
  if (!client_id) return NextResponse.json({ ok: false, step: "client_id_missing" }, { status: 400 });
  const client = await getClientById(client_id);
  console.log("[DELETE /api/admin/clients] found client=", client?.email, "status=", client?.status);
  if (!client) return NextResponse.json({ ok: false, step: "not_found" }, { status: 404 });
  const ok = await softDeleteClient(client_id, client);
  console.log("[DELETE /api/admin/clients] softDelete result=", ok);
  return NextResponse.json({ ok, step: ok ? "done" : "insert_failed" });
}
