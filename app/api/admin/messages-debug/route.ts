import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const N8N_BASE = process.env.N8N_BASE_URL ?? "";
  const N8N_KEY  = process.env.N8N_API_KEY ?? "";
  const TABLE_ID = process.env.N8N_MESSAGES_TABLE_ID ?? "";

  const report: Record<string, unknown> = {
    n8n_base_set: !!N8N_BASE,
    n8n_key_set:  !!N8N_KEY,
    table_id:     TABLE_ID || "(not set)",
  };

  if (!TABLE_ID || !N8N_KEY || !N8N_BASE) {
    report.error = "missing env vars";
    return NextResponse.json(report);
  }

  // 1. GET rows — verify table is readable
  try {
    const res = await fetch(`${N8N_BASE}/api/v1/data-tables/${TABLE_ID}/rows`, {
      headers: { "X-N8N-API-KEY": N8N_KEY },
      signal: AbortSignal.timeout(10000),
    });
    const text = await res.text();
    report.get_status = res.status;
    try { report.get_body = JSON.parse(text); } catch { report.get_body_raw = text.slice(0, 500); }
  } catch (e) {
    report.get_error = String(e);
  }

  // 2. PATCH /rows/{id} — format A: { data: { field: val } }
  try {
    const r = await fetch(`${N8N_BASE}/api/v1/data-tables/${TABLE_ID}/rows/1`, {
      method: "PATCH",
      headers: { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ data: { is_read: true } }),
      signal: AbortSignal.timeout(10000),
    });
    const t = await r.text();
    report.patch_a_url = `${N8N_BASE}/api/v1/data-tables/${TABLE_ID}/rows/1`;
    report.patch_a_status = r.status;
    try { report.patch_a_body = JSON.parse(t); } catch { report.patch_a_raw = t.slice(0, 300); }
  } catch (e) { report.patch_a_error = String(e); }

  // 3. PATCH /rows — format B: ID in body as { data: [{ id: 1, ... }] }
  try {
    const r = await fetch(`${N8N_BASE}/api/v1/data-tables/${TABLE_ID}/rows`, {
      method: "PATCH",
      headers: { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ data: [{ id: 1, is_read: false }] }),
      signal: AbortSignal.timeout(10000),
    });
    const t = await r.text();
    report.patch_b_status = r.status;
    try { report.patch_b_body = JSON.parse(t); } catch { report.patch_b_raw = t.slice(0, 300); }
  } catch (e) { report.patch_b_error = String(e); }

  // 4. PUT /rows/1 — format C: full replacement
  try {
    const r = await fetch(`${N8N_BASE}/api/v1/data-tables/${TABLE_ID}/rows/1`, {
      method: "PUT",
      headers: { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ data: { is_read: true } }),
      signal: AbortSignal.timeout(10000),
    });
    const t = await r.text();
    report.put_status = r.status;
    try { report.put_body = JSON.parse(t); } catch { report.put_raw = t.slice(0, 300); }
  } catch (e) { report.put_error = String(e); }

  // 5. OPTIONS /rows/1 — discover allowed methods
  try {
    const r = await fetch(`${N8N_BASE}/api/v1/data-tables/${TABLE_ID}/rows/1`, {
      method: "OPTIONS",
      headers: { "X-N8N-API-KEY": N8N_KEY },
      signal: AbortSignal.timeout(10000),
    });
    report.options_status = r.status;
    report.options_allow = r.headers.get("Allow") ?? r.headers.get("access-control-allow-methods") ?? "(not set)";
  } catch (e) { report.options_error = String(e); }

  return NextResponse.json(report, { status: 200 });
}
