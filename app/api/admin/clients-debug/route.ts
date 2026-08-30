import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const N8N_BASE   = process.env.N8N_BASE_URL ?? "";
const N8N_KEY    = process.env.N8N_API_KEY ?? "";
const TABLE_ID   = process.env.N8N_CLIENTS_TABLE_ID ?? "";

export async function GET() {
  const report: Record<string, unknown> = {
    env: {
      n8n_base_set: !!N8N_BASE,
      n8n_key_set:  !!N8N_KEY,
      table_id_set: !!TABLE_ID,
      table_id_len: TABLE_ID.length,
    },
  };

  // 1. Read rows count
  try {
    const res = await fetch(`${N8N_BASE}/api/v1/data-tables/${TABLE_ID}/rows`, {
      headers: { "X-N8N-API-KEY": N8N_KEY },
      signal: AbortSignal.timeout(10000),
    });
    const raw = await res.json().catch(() => null);
    const rows = Array.isArray(raw) ? raw : (raw?.rows ?? raw?.data ?? []);
    report.read_status = res.status;
    report.read_count = rows.length;
    report.last_row = rows[rows.length - 1] ?? null;
  } catch (e) {
    report.read_error = String(e);
  }

  // 2. Test insert
  const testId = randomUUID();
  const now = new Date().toISOString();
  try {
    const res = await fetch(`${N8N_BASE}/api/v1/data-tables/${TABLE_ID}/rows`, {
      method: "POST",
      headers: { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ data: [{
        client_id: testId,
        email: `debug-test-${Date.now()}@test.internal`,
        name: "DEBUG TEST - DELETE ME",
        password_hash: "",
        company: "",
        phone: "",
        telegram: "",
        inn: "",
        country: "",
        role: "CLIENT",
        status: "INACTIVE",
        created_at: now,
        updated_at: now,
      }]}),
      signal: AbortSignal.timeout(10000),
    });
    const body = await res.text();
    report.insert_status = res.status;
    report.insert_ok = res.ok;
    report.insert_response = body.slice(0, 300);
  } catch (e) {
    report.insert_error = String(e);
  }

  return NextResponse.json(report);
}
