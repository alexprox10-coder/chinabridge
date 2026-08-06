import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { isAuthorized } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sql = neon(process.env.DATABASE_URL!);
  const report: Record<string, unknown> = {};

  // 1. Check tables exist
  try {
    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('tenants', 'crm_leads', 'mi_leads', 'import_lead_statuses')
      ORDER BY table_name
    `;
    report.tables = tables.map(r => r.table_name);
  } catch (e) { report.tables_error = String(e); }

  // 2. Check tenant-chinabridge exists
  try {
    const rows = await sql`SELECT id, slug, status FROM tenants WHERE id = 'tenant-chinabridge'`;
    report.owner_tenant = rows[0] ?? null;
  } catch (e) { report.owner_tenant_error = String(e); }

  // 3. Count CRM leads
  try {
    const rows = await sql`SELECT COUNT(*)::int AS cnt FROM crm_leads WHERE tenant_id = 'tenant-chinabridge'`;
    report.crm_leads_count = rows[0]?.cnt ?? 0;
  } catch (e) { report.crm_leads_error = String(e); }

  // 4. Last 5 CRM leads
  try {
    const rows = await sql`
      SELECT id, lead_id, name, source, status, created_at
      FROM crm_leads WHERE tenant_id = 'tenant-chinabridge'
      ORDER BY created_at DESC LIMIT 5
    `;
    report.crm_leads_sample = rows;
  } catch (e) { report.crm_leads_sample_error = String(e); }

  // 5. Try test insert (then delete)
  const testId = `debug-test-${Date.now()}`;
  try {
    await sql`
      INSERT INTO crm_leads (lead_id, tenant_id, created_at, updated_at, name, status, priority, estimated_value)
      VALUES (${testId}, 'tenant-chinabridge', NOW()::text, NOW()::text, 'DEBUG TEST', 'NEW', 'WARM', '0')
    `;
    await sql`DELETE FROM crm_leads WHERE lead_id = ${testId}`;
    report.test_insert = "OK";
  } catch (e) {
    report.test_insert = `FAILED: ${String(e)}`;
  }

  return NextResponse.json(report, { status: 200 });
}
