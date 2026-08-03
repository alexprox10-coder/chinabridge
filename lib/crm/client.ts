import type { CRMLead, LeadUpdate } from "./types";

const N8N_BASE = process.env.N8N_BASE_URL ?? "https://n8n.arendadom24.ru";
const TABLE_ID = process.env.N8N_TABLE_ID ?? "DrRONX1C3uf4Igx4";
const N8N_KEY = process.env.N8N_API_KEY ?? "";

async function n8nFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${N8N_BASE}${path}`, {
    ...init,
    headers: {
      "X-N8N-API-KEY": N8N_KEY,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`n8n ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

export type LeadFilters = {
  status?: string;
  priority?: string;
  search?: string;
  lead_id?: string;
};

export async function getLeads(filters: LeadFilters = {}): Promise<CRMLead[]> {
  // Build filter conditions
  const conditions: object[] = [];
  if (filters.status) {
    conditions.push({ keyName: "status", condition: "eq", keyValue: filters.status });
  }
  if (filters.priority) {
    conditions.push({ keyName: "priority", condition: "eq", keyValue: filters.priority });
  }
  if (filters.lead_id) {
    conditions.push({ keyName: "lead_id", condition: "eq", keyValue: filters.lead_id });
  }

  const payload = {
    dataTableId: TABLE_ID,
    returnAll: true,
    orderBy: "created_at",
    orderByDirection: "DESC",
    filters: conditions.length ? { conditions } : {},
  };

  // Use n8n CRM query webhook
  const res = await fetch(`${N8N_BASE}/webhook/crm-leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => []);
  const all: CRMLead[] = Array.isArray(data) ? data : (data.rows ?? []);
  return all.filter((l) => {
    if (filters.status && l.status !== filters.status) return false;
    if (filters.priority && l.priority !== filters.priority) return false;
    return true;
  });
}

// Find by UUID string field (when n8n row ID is not available)
export async function getLeadByLeadId(leadId: string): Promise<CRMLead | null> {
  const leads = await getLeads({ lead_id: leadId });
  return leads[0] ?? null;
}

export async function getLead(id: number): Promise<CRMLead | null> {
  const res = await fetch(`${N8N_BASE}/webhook/crm-get-lead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rowId: id }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  if (!data) return null;
  const rows = Array.isArray(data) ? data : (data.rows ?? [data]);
  return rows[0] ?? null;
}

export async function updateLead(id: number, update: LeadUpdate): Promise<boolean> {
  try {
    const res = await fetch(`${N8N_BASE}/webhook/crm-update-lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dataTableId: TABLE_ID,
        rowId: id,
        fields: { ...update, updated_at: new Date().toISOString() },
      }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteLead(id: number): Promise<boolean> {
  try {
    const res = await fetch(`${N8N_BASE}/webhook/crm-delete-lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rowId: id }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Dashboard stats computed from all leads
export async function getDashboardStats() {
  const leads = await getLeads();
  const today = new Date().toISOString().slice(0, 10);
  const now = Date.now();
  const h24 = 24 * 60 * 60 * 1000;
  const d3  = 3  * h24;
  const d7  = 7  * h24;

  const todayLeads    = leads.filter((l) => (l.created_at ?? "").startsWith(today));
  const successLeads  = leads.filter((l) => l.status === "SUCCESS");
  const openLeads     = leads.filter((l) => !["SUCCESS", "LOST"].includes(l.status ?? ""));

  const totalRevenue  = successLeads.reduce((s, l) => s + (Number(l.estimated_value) || 0), 0);
  const potentialValue = openLeads.reduce((s, l) => s + (Number(l.estimated_value) || 0), 0);
  const conversion    = leads.length > 0 ? Math.round((successLeads.length / leads.length) * 100) : 0;

  // Stale lead detection
  const msAgo = (iso: string) => now - new Date(iso || 0).getTime();
  const newLeads = leads.filter((l) => l.status === "NEW");
  const unanswered = newLeads.filter((l) => msAgo(l.created_at) > h24);
  const stale3d    = openLeads.filter((l) => msAgo(l.updated_at || l.created_at) > d3);
  const sleeping   = openLeads.filter((l) => msAgo(l.updated_at || l.created_at) > d7);

  return {
    total: leads.length,
    today: todayLeads.length,
    today_new:         todayLeads.filter((l) => l.status === "NEW").length,
    today_unanswered:  unanswered.length,
    today_calculations: leads.filter((l) => l.status === "CALCULATION").length,
    today_proposals:   leads.filter((l) => l.status === "OFFER_SENT").length,
    today_paid:        leads.filter((l) => l.status === "PAYMENT").length,
    today_completed:   leads.filter((l) => l.status === "SUCCESS").length,
    hot:          leads.filter((l) => l.priority === "HOT").length,
    open:         openLeads.length,
    closed_success: successLeads.length,
    closed_lost:  leads.filter((l) => l.status === "LOST").length,
    potential_value: potentialValue,
    total_revenue: totalRevenue,
    conversion,
    unanswered_count: unanswered.length,
    stale3d_count:    stale3d.length,
    sleeping_count:   sleeping.length,
    by_status: Object.fromEntries(
      ["NEW","CONTACTED","QUALIFICATION","CALCULATION","OFFER_SENT","NEGOTIATION","PAYMENT","DELIVERY","SUCCESS","LOST"]
        .map((s) => [s, leads.filter((l) => l.status === s).length])
    ) as Record<string, number>,
  };
}
