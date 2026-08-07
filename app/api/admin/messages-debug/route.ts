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

  // 2. POST a test row
  const testFields = {
    client_id:   "__debug_test__",
    author_role: "CLIENT",
    author_name: "Debug Test",
    text:        "Debug message — delete me",
    is_read:     false,
    created_at:  new Date().toISOString(),
  };
  try {
    const res = await fetch(`${N8N_BASE}/api/v1/data-tables/${TABLE_ID}/rows`, {
      method: "POST",
      headers: { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ data: [testFields] }),
      signal: AbortSignal.timeout(10000),
    });
    const text = await res.text();
    report.post_status = res.status;
    try { report.post_body = JSON.parse(text); } catch { report.post_body_raw = text.slice(0, 500); }
  } catch (e) {
    report.post_error = String(e);
  }

  return NextResponse.json(report, { status: 200 });
}
