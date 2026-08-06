import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { neon } from "@neondatabase/serverless";

export const dynamic     = "force-dynamic";
export const maxDuration = 60;

const N8N_BASE = process.env.N8N_BASE_URL  ?? "";
const N8N_KEY  = process.env.N8N_API_KEY   ?? "";
const TABLE_ID = process.env.N8N_IMPORT_LEADS_TABLE_ID ?? "";

export async function DELETE(req: NextRequest) {
  const store   = await cookies();
  const isAdmin = store.get("cb_admin")?.value;
  if (!isAdmin) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const db = neon(process.env.DATABASE_URL!);
  const results: Record<string, string> = {};

  // 1. Clear import_lead_statuses (Neon)
  try {
    await db`TRUNCATE TABLE import_lead_statuses`;
    results.import_statuses = "✅ очищено";
  } catch (e) {
    results.import_statuses = `❌ ${String(e).slice(0, 100)}`;
  }

  // 2. Clear mi_leads (Neon)
  try {
    await db`TRUNCATE TABLE mi_leads`;
    results.mi_leads = "✅ очищено";
  } catch (e) {
    results.mi_leads = `❌ ${String(e).slice(0, 100)}`;
  }

  // 3. Clear mi_radar (Neon)
  try {
    await db`TRUNCATE TABLE mi_radar`;
    results.mi_radar = "✅ очищено";
  } catch (e) {
    results.mi_radar = `❌ (не критично) ${String(e).slice(0, 80)}`;
  }

  // 4. Clear n8n import leads table — fetch all rows then delete each
  if (N8N_BASE && N8N_KEY && TABLE_ID) {
    try {
      const res = await fetch(`${N8N_BASE}/api/v1/data-tables/${TABLE_ID}/rows`, {
        headers: { "X-N8N-API-KEY": N8N_KEY },
        signal: AbortSignal.timeout(15000),
      });
      const json = await res.json().catch(() => ({}));
      const rows: Array<{ id?: number }> = Array.isArray(json) ? json : (json.data ?? json.rows ?? []);

      if (rows.length === 0) {
        results.n8n_table = "✅ уже пусто";
      } else {
        let deleted = 0;
        let failed  = 0;
        await Promise.allSettled(rows.map(async row => {
          if (!row.id) return;
          const r = await fetch(`${N8N_BASE}/api/v1/data-tables/${TABLE_ID}/rows/${row.id}`, {
            method: "DELETE",
            headers: { "X-N8N-API-KEY": N8N_KEY },
            signal: AbortSignal.timeout(5000),
          });
          if (r.ok) deleted++; else failed++;
        }));
        results.n8n_table = `✅ удалено ${deleted} из ${rows.length}${failed ? ` (ошибок: ${failed})` : ""}`;
      }
    } catch (e) {
      results.n8n_table = `❌ ${String(e).slice(0, 100)}`;
    }
  } else {
    results.n8n_table = "⚠️ n8n не настроен";
  }

  return NextResponse.json({ ok: true, results });
}
