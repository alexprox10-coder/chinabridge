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

  // 2. PATCH row 1 — test update format
  try {
    const patchRes = await fetch(`${N8N_BASE}/api/v1/data-tables/${TABLE_ID}/rows/1`, {
      method: "PATCH",
      headers: { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ data: { is_read: true } }),
      signal: AbortSignal.timeout(10000),
    });
    const patchText = await patchRes.text();
    report.patch_data_status = patchRes.status;
    try { report.patch_data_body = JSON.parse(patchText); } catch { report.patch_data_raw = patchText.slice(0, 500); }
  } catch (e) {
    report.patch_data_error = String(e);
  }

  // 3. PATCH row 1 — alternative format (flat fields)
  try {
    const patchRes2 = await fetch(`${N8N_BASE}/api/v1/data-tables/${TABLE_ID}/rows/1`, {
      method: "PATCH",
      headers: { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ is_read: false }),
      signal: AbortSignal.timeout(10000),
    });
    const patchText2 = await patchRes2.text();
    report.patch_flat_status = patchRes2.status;
    try { report.patch_flat_body = JSON.parse(patchText2); } catch { report.patch_flat_raw = patchText2.slice(0, 500); }
  } catch (e) {
    report.patch_flat_error = String(e);
  }

  return NextResponse.json(report, { status: 200 });
}
