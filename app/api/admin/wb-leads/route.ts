import { NextRequest, NextResponse } from "next/server";
import { getAllLeads } from "@/lib/import-leads/crm";

export const runtime = "nodejs";

const N8N_BASE = process.env.N8N_BASE_URL ?? "https://n8n.arendadom24.ru";
const N8N_KEY  = process.env.N8N_API_KEY  ?? "";
const WB_WORKFLOW_ID = "ptPvBMZXCYAWnUr6";

function isAuthorized(req: NextRequest) {
  return !!(req.cookies.get("cb_admin")?.value || req.cookies.get("cb_tenant_session")?.value);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });

  const leads = await getAllLeads("chinabridge");
  const wbLeads = leads.filter(l => String(l.source ?? "").includes("WB_SELLER"));

  return NextResponse.json({ ok: true, leads: wbLeads });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const res = await fetch(`${N8N_BASE}/api/v1/workflows/${WB_WORKFLOW_ID}/run`, {
      method: "POST",
      headers: { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: "n8n_error" }, { status: 502 });
    }
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ ok: true, executionId: data.data?.id ?? null });
  } catch (e) {
    console.error("[POST /api/admin/wb-leads]", e);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
