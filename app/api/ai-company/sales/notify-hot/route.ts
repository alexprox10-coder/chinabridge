import { NextRequest, NextResponse } from "next/server";
import { fetchImportLeads } from "@/lib/ai-company/sales/data";
import { notifyHotLeads } from "@/lib/ai-company/sales/director";
import { isAuthorized } from "@/lib/api-auth";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const leads = await fetchImportLeads();
  const sent = await notifyHotLeads(leads);
  return NextResponse.json({ ok: true, sent, hotLeads: leads.filter(l => l.temperature === "HOT").length });
}
