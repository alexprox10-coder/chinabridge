import { NextRequest, NextResponse } from "next/server";
import { getAllLeads, updateLeadStatus } from "@/lib/import-leads/crm";
import type { LeadStatus } from "@/lib/import-leads/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("cb_admin")?.value;
  if (!token) return NextResponse.json({ ok: false }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("company_id") ?? "chinabridge";
  const leads = await getAllLeads(companyId);
  return NextResponse.json({ ok: true, leads });
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get("cb_admin")?.value;
  if (!token) return NextResponse.json({ ok: false }, { status: 401 });

  let body: { id: number; status: LeadStatus };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const ok = await updateLeadStatus(body.id, body.status);
  return NextResponse.json({ ok });
}
