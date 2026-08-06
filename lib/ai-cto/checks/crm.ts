import { neon } from "@neondatabase/serverless";
import type { CheckResult } from "../types";

const sql = neon(process.env.DATABASE_URL!);

async function checkLeadsExist(): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    const rows = await sql`SELECT COUNT(*) AS cnt FROM crm_leads` as { cnt: unknown }[];
    const cnt  = Number(rows[0]?.cnt ?? 0);
    return { name: "CRM leads table", status: "OK", message: `${cnt} leads`, ms: Date.now() - t0 };
  } catch (e) {
    return { name: "CRM leads table", status: "ERROR", message: String(e), ms: Date.now() - t0 };
  }
}

async function checkLeadCrud(): Promise<CheckResult[]> {
  const testLeadId = `cto-audit-${Date.now()}`;
  const results: CheckResult[] = [];

  // Look up a real tenant_id (FK constraint requires it)
  let tenantId: string | null = null;
  try {
    const rows = await sql`SELECT id FROM tenants LIMIT 1` as { id: string }[];
    tenantId = rows[0]?.id ?? null;
  } catch { /* skip */ }

  if (!tenantId) {
    results.push({ name: "Lead CREATE", status: "WARNING", message: "No tenants in DB — skipping CRUD test" });
    results.push({ name: "Lead READ",   status: "WARNING", message: "Skipped" });
    results.push({ name: "Lead DELETE", status: "WARNING", message: "Skipped" });
    return results;
  }

  // CREATE
  try {
    await sql`
      INSERT INTO crm_leads (lead_id, tenant_id, created_at, updated_at, name, source)
      VALUES (${testLeadId}, ${tenantId}, NOW()::text, NOW()::text, 'AI CTO Test', 'cto_audit')
      ON CONFLICT (lead_id) DO NOTHING
    `;
    results.push({ name: "Lead CREATE", status: "OK", message: "Test lead inserted" });
  } catch (e) {
    results.push({ name: "Lead CREATE", status: "ERROR", message: String(e) });
    return results;
  }

  // READ
  try {
    const rows = await sql`SELECT lead_id FROM crm_leads WHERE lead_id = ${testLeadId}` as { lead_id: string }[];
    results.push({ name: "Lead READ", status: rows.length > 0 ? "OK" : "ERROR", message: rows.length > 0 ? "Found" : "Not found" });
  } catch (e) {
    results.push({ name: "Lead READ", status: "ERROR", message: String(e) });
  }

  // DELETE
  try {
    await sql`DELETE FROM crm_leads WHERE lead_id = ${testLeadId}`;
    results.push({ name: "Lead DELETE", status: "OK", message: "Deleted test lead" });
  } catch (e) {
    results.push({ name: "Lead DELETE", status: "ERROR", message: String(e) });
  }

  return results;
}

async function checkTenantsTable(): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    const rows = await sql`SELECT COUNT(*) AS cnt FROM tenants` as { cnt: unknown }[];
    return { name: "Tenants table", status: "OK", message: `${Number(rows[0]?.cnt)} tenants`, ms: Date.now() - t0 };
  } catch (e) {
    return { name: "Tenants table", status: "ERROR", message: String(e), ms: Date.now() - t0 };
  }
}

export async function checkCrm(): Promise<CheckResult[]> {
  const [exists, tenants, crudResults] = await Promise.all([
    checkLeadsExist(),
    checkTenantsTable(),
    checkLeadCrud(),
  ]);
  return [exists, tenants, ...crudResults];
}
