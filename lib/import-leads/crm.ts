import type { ImportLead, LeadStatus } from "./types";

const N8N_BASE = process.env.N8N_BASE_URL ?? "https://n8n.arendadom24.ru";
const N8N_KEY = process.env.N8N_API_KEY ?? "";
const TABLE_ID = process.env.N8N_IMPORT_LEADS_TABLE_ID ?? "";

async function dtQuery(filters: { key: string; value: string }[] = []): Promise<ImportLead[]> {
  if (!TABLE_ID || !N8N_KEY) return [];
  try {
    const res = await fetch(`${N8N_BASE}/api/v1/data-tables/${TABLE_ID}/rows`, {
      headers: { "X-N8N-API-KEY": N8N_KEY },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const json = await res.json().catch(() => ({}));
    let rows: ImportLead[] = Array.isArray(json) ? json : (json.data ?? json.rows ?? []);

    for (const f of filters) {
      rows = rows.filter((r) => String((r as unknown as Record<string, unknown>)[f.key] ?? "") === f.value);
    }

    rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return rows;
  } catch {
    return [];
  }
}

async function dtInsert(fields: Record<string, unknown>): Promise<ImportLead | null> {
  if (!TABLE_ID || !N8N_KEY) return null;
  try {
    const res = await fetch(`${N8N_BASE}/api/v1/data-tables/${TABLE_ID}/rows`, {
      method: "POST",
      headers: { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ data: [fields] }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    // Response: { success: true, insertedRows: 1 } — return fields with fake id
    return json?.success ? { ...fields, id: Date.now() } as unknown as ImportLead : null;
  } catch {
    return null;
  }
}

async function dtPatch(rowId: number, fields: Record<string, unknown>): Promise<boolean> {
  if (!TABLE_ID || !N8N_KEY) return false;
  try {
    const res = await fetch(`${N8N_BASE}/api/v1/data-tables/${TABLE_ID}/rows/${rowId}`, {
      method: "PATCH",
      headers: { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ data: fields }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function saveLead(lead: Omit<ImportLead, "id">): Promise<ImportLead | null> {
  return dtInsert({ ...lead });
}

export async function getAllLeads(companyId?: string): Promise<ImportLead[]> {
  const filters = companyId ? [{ key: "company_id", value: companyId }] : [];
  return dtQuery(filters);
}

export async function getLeadsByScore(minScore: number, companyId?: string): Promise<ImportLead[]> {
  const all = await getAllLeads(companyId);
  return all.filter((l) => l.score >= minScore);
}

export async function getLeadsByStatus(status: LeadStatus, companyId?: string): Promise<ImportLead[]> {
  const filters: { key: string; value: string }[] = [{ key: "status", value: status }];
  if (companyId) filters.push({ key: "company_id", value: companyId });
  return dtQuery(filters);
}

export async function updateLeadStatus(rowId: number, status: LeadStatus): Promise<boolean> {
  return dtPatch(rowId, { status, updated_at: new Date().toISOString() });
}

export async function isDuplicateWebsite(website: string, companyId: string): Promise<boolean> {
  const rows = await dtQuery([{ key: "company_id", value: companyId }]);
  return rows.some((r) => r.website === website);
}
