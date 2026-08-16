import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const N8N_BASE = process.env.N8N_BASE_URL ?? "https://n8n.arendadom24.ru";
const N8N_KEY = process.env.N8N_API_KEY ?? "";
const WB_TABLE_ID = "ZUdd2z8BpyvePLeX";

function isAuthorized(req: NextRequest) {
  return !!(req.cookies.get("cb_admin")?.value || req.cookies.get("cb_tenant_session")?.value);
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { company, category, score, phone, email } = body;

  if (!company?.trim()) return NextResponse.json({ error: "company required" }, { status: 400 });

  const row = {
    company: String(company).trim(),
    category: String(category || "").trim(),
    score: Number(score) || 0,
    phone: String(phone || "").trim(),
    email: String(email || "").trim(),
  };

  const res = await fetch(`${N8N_BASE}/api/v1/data-tables/${WB_TABLE_ID}/rows`, {
    method: "POST",
    headers: { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ data: [row] }),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json({ error: `n8n ${res.status}: ${text}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const res = await fetch(`${N8N_BASE}/api/v1/data-tables/${WB_TABLE_ID}/rows`, {
    headers: { "X-N8N-API-KEY": N8N_KEY },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) return NextResponse.json({ sellers: [], count: 0 });

  const json = await res.json().catch(() => ({}));
  const rows = Array.isArray(json) ? json : (json.data ?? json.rows ?? []);
  return NextResponse.json({ sellers: rows, count: rows.length });
}
