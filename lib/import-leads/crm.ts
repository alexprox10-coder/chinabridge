import type { ImportLead, LeadStatus } from "./types";
import { setLeadStatus, getLeadStatuses, markLeadDeleted } from "./status-store";

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
    return json?.success ? { ...fields, id: Date.now() } as unknown as ImportLead : null;
  } catch {
    return null;
  }
}

export async function saveLead(lead: Omit<ImportLead, "id">): Promise<ImportLead | null> {
  return dtInsert({ ...lead });
}

export async function getAllLeads(companyId?: string): Promise<ImportLead[]> {
  const filters = companyId ? [{ key: "company_id", value: companyId }] : [];
  const leads = await dtQuery(filters);
  try {
    const statuses = await getLeadStatuses();
    return leads
      .filter(l => statuses[l.lead_id] !== ("deleted" as LeadStatus))
      .map(l => statuses[l.lead_id] ? { ...l, status: statuses[l.lead_id] } : l);
  } catch {
    return leads;
  }
}

export async function deleteLeadPermanently(leadId: string): Promise<void> {
  await markLeadDeleted(leadId);
}

export async function getLeadsByScore(minScore: number, companyId?: string): Promise<ImportLead[]> {
  const all = await getAllLeads(companyId);
  return all.filter((l) => l.score >= minScore);
}

export async function getLeadsByStatus(status: LeadStatus, companyId?: string): Promise<ImportLead[]> {
  const all = await getAllLeads(companyId);
  return all.filter((l) => l.status === status);
}

export async function updateLeadStatus(leadId: string, status: LeadStatus): Promise<{ ok: boolean; error?: string }> {
  try {
    await setLeadStatus(leadId, status);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function isDuplicateWebsite(website: string, companyId: string): Promise<boolean> {
  const rows = await dtQuery([{ key: "company_id", value: companyId }]);
  return rows.some((r) => r.website === website);
}
