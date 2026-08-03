import type { CompanyInfo, DocumentMeta, DocumentType, DEFAULT_COMPANY } from "./types";
import { DEFAULT_COMPANY as DEF } from "./types";

const N8N_BASE  = process.env.N8N_BASE_URL   ?? "https://n8n.arendadom24.ru";
const N8N_KEY   = process.env.N8N_API_KEY     ?? "";
const DOCS_TBL  = process.env.N8N_ADMIN_DOCUMENTS_TABLE_ID  ?? "nygdTON30DvcZv6l";
const CO_TBL    = process.env.N8N_COMPANY_SETTINGS_TABLE_ID ?? "dMe0cVsemUKfYzvx";

async function dtQuery<T>(tableId: string): Promise<T[]> {
  const res = await fetch(`${N8N_BASE}/api/v1/data-tables/${tableId}/rows`, {
    headers: { "X-N8N-API-KEY": N8N_KEY },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({}));
  return (data?.data?.rows ?? data?.data ?? data?.rows ?? []) as T[];
}

async function dtInsert<T>(tableId: string, row: Record<string, unknown>): Promise<T | null> {
  const res = await fetch(`${N8N_BASE}/api/v1/data-tables/${tableId}/rows`, {
    method: "POST",
    headers: { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ data: [row] }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return (data?.data?.[0] ?? data ?? null) as T;
}

async function dtPatch<T>(tableId: string, rowId: number, row: Record<string, unknown>): Promise<T | null> {
  const res = await fetch(`${N8N_BASE}/api/v1/data-tables/${tableId}/rows/${rowId}`, {
    method: "PATCH",
    headers: { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: row }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return (data?.data ?? data ?? null) as T;
}

// ── Documents ─────────────────────────────────────────────────────────────────

export async function getDocumentsByLead(leadId: string): Promise<DocumentMeta[]> {
  const rows = await dtQuery<DocumentMeta>(DOCS_TBL);
  return rows.filter((r) => r.lead_id === leadId);
}

export async function createDocument(doc: Omit<DocumentMeta, "id">): Promise<DocumentMeta | null> {
  return dtInsert<DocumentMeta>(DOCS_TBL, {
    ...doc,
    created_at: doc.created_at ?? new Date().toISOString(),
    status: doc.status ?? "draft",
  });
}

export async function updateDocumentStatus(id: number, status: string): Promise<DocumentMeta | null> {
  return dtPatch<DocumentMeta>(DOCS_TBL, id, { status });
}

/** Generate sequential document number: INV-2026-001, etc. */
export function genDocNumber(type: DocumentType, index: number): string {
  const prefix: Record<DocumentType, string> = {
    invoice:        "INV",
    contract:       "CNT",
    act:            "ACT",
    invoice_import: "IMP",
    packing_list:   "PKL",
    power_attorney: "POA",
  };
  const year = new Date().getFullYear();
  return `${prefix[type]}-${year}-${String(index).padStart(3, "0")}`;
}

// ── Company Settings ──────────────────────────────────────────────────────────

export async function getCompanySettings(): Promise<CompanyInfo> {
  const rows = await dtQuery<CompanyInfo & { id?: number }>(CO_TBL);
  if (rows.length === 0) return { ...DEF };
  const r = rows[0];
  return {
    company_name: r.company_name || DEF.company_name,
    inn:          r.inn          || DEF.inn,
    ogrnip:       r.ogrnip       || DEF.ogrnip,
    bank_account: r.bank_account || DEF.bank_account,
    bank_name:    r.bank_name    || DEF.bank_name,
    bik:          r.bik          || DEF.bik,
    bank_corr:    r.bank_corr    || DEF.bank_corr,
    address:      r.address      || DEF.address,
    phone:        r.phone        || DEF.phone,
    email:        r.email        || DEF.email,
    director:     r.director     || DEF.director,
  };
}

export async function saveCompanySettings(data: CompanyInfo): Promise<boolean> {
  const rows = await dtQuery<CompanyInfo & { id?: number }>(CO_TBL);
  const payload: Record<string, unknown> = { ...data };
  if (rows.length === 0) {
    const res = await dtInsert(CO_TBL, payload);
    return res !== null;
  }
  const id = (rows[0] as { id?: number }).id;
  if (!id) return false;
  const res = await dtPatch(CO_TBL, id, payload);
  return res !== null;
}
