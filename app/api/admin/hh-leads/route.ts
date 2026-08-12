import { NextRequest, NextResponse } from "next/server";
import { getAllLeads } from "@/lib/import-leads/crm";

export const runtime = "nodejs";

const HH_WEBHOOK_URL =
  process.env.N8N_HH_PARSER_WEBHOOK_URL ??
  "https://n8n.arendadom24.ru/webhook/hh-parser-start";

function isAuthorized(req: NextRequest) {
  return !!(req.cookies.get("cb_admin")?.value || req.cookies.get("cb_tenant_session")?.value);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const leads = await getAllLeads("chinabridge");
  const hhLeads = leads.filter(l => String(l.source ?? "").includes("HHRU"));
  return NextResponse.json({ ok: true, leads: hhLeads });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const res = await fetch(HH_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "admin_ui" }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[POST /api/admin/hh-leads] webhook error", res.status, errText);
      return NextResponse.json({ ok: false, error: "n8n_error", status: res.status }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[POST /api/admin/hh-leads]", e);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
