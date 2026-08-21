import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAllClients } from "@/lib/client-portal/api";

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
