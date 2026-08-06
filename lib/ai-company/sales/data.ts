import type { ImportLeadEnhanced, PlatformLead, PipelineHealth, FollowupItem, SalesKPI } from "./types";
import type { ImportLead } from "@/lib/import-leads/types";
import { getLeads } from "@/lib/crm/client";
import { getDeletedLeadIds } from "@/lib/import-leads/status-store";

const N8N_BASE = process.env.N8N_BASE_URL ?? "https://n8n.arendadom24.ru";
const N8N_KEY = process.env.N8N_API_KEY ?? "";
const IMPORT_TABLE = process.env.N8N_IMPORT_LEADS_TABLE_ID ?? "ZUdd2z8BpyvePLeX";
const PLATFORM_TABLE = process.env.N8N_PLATFORM_LEADS_TABLE_ID ?? "qIt6WfrUTVWsi1pV";

async function n8nRows(tableId: string): Promise<Record<string, unknown>[]> {
  if (!tableId || !N8N_KEY) return [];
  try {
    const res = await fetch(`${N8N_BASE}/api/v1/data-tables/${tableId}/rows`, {
      headers: { "X-N8N-API-KEY": N8N_KEY },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const json = await res.json().catch(() => ({}));
    return Array.isArray(json) ? json : (json.data ?? []);
  } catch {
    return [];
  }
}

function enhanceLead(lead: ImportLead): ImportLeadEnhanced {
  const score = Number(lead.score ?? 1);
  const score100 = Math.min(100, score * 20);
  const temperature = score100 >= 80 ? "HOT" : score100 >= 40 ? "WARM" : "COLD";
  const probability = score100 >= 80 ? 75 : score100 >= 60 ? 50 : score100 >= 40 ? 30 : 10;
  const potentialValue = score100 >= 80 ? 180000 : score100 >= 60 ? 90000 : 40000;
  const nextAction =
    lead.status === "new"
      ? score100 >= 80
        ? "Позвонить сегодня"
        : score100 >= 60
        ? "Отправить КП"
        : "Написать в Telegram"
      : lead.status === "contacted"
      ? "Уточнить потребности"
      : lead.status === "approved"
      ? "Подготовить расчёт"
      : "Повторный контакт";
  return { ...lead, score100, temperature, probability, nextAction, potentialValue };
}

export async function fetchImportLeads(): Promise<ImportLeadEnhanced[]> {
  const [rows, deletedIds] = await Promise.all([
    n8nRows(IMPORT_TABLE),
    getDeletedLeadIds().catch(() => new Set<string>()),
  ]);
  return rows
    .map(r => {
      const lead = r as unknown as ImportLead;
      // Use n8n row id as fallback when lead_id is absent
      const lid = lead.lead_id || (lead.id != null ? `n8n_${lead.id}` : "");
      return lid !== lead.lead_id ? { ...lead, lead_id: lid } : lead;
    })
    .filter(l => {
      const lid = l.lead_id ?? "";
      return !lid || !deletedIds.has(lid);
    })
    .map(l => enhanceLead(l))
    .sort((a, b) => b.score100 - a.score100);
}

export async function fetchPlatformLeads(): Promise<PlatformLead[]> {
  const rows = await n8nRows(PLATFORM_TABLE);
  return rows as unknown as PlatformLead[];
}

async function fetchCrmLeads(): Promise<Record<string, unknown>[]> {
  try {
    const leads = await getLeads();
    return leads as unknown as Record<string, unknown>[];
  } catch {
    return [];
  }
}

export async function buildPipelineHealth(crmLeads: Record<string, unknown>[]): Promise<PipelineHealth> {
  const now = Date.now();
  const d7 = 7 * 24 * 3600000;
  const open = crmLeads.filter(l => !["SUCCESS","LOST"].includes(String(l.status ?? "")));
  const stale7d = open.filter(l => {
    const updated = String(l.updated_at ?? l.created_at ?? "");
    return updated && now - new Date(updated).getTime() > d7;
  });
  const noNextAction = open.filter(l => !l.comment && !l.manager);
  const hot = crmLeads.filter(l => l.priority === "HOT");
  const successes = crmLeads.filter(l => l.status === "SUCCESS");
  const avgDealDays = successes.length > 0 ? 21 : 0;

  const statuses = ["NEW","CONTACTED","QUALIFICATION","CALCULATION","OFFER_SENT","NEGOTIATION","PAYMENT","SUCCESS","LOST"];
  const byStatus: Record<string, number> = {};
  for (const s of statuses) {
    byStatus[s] = crmLeads.filter(l => l.status === s).length;
  }

  const problems: string[] = [];
  if (stale7d.length > 0) problems.push(`${stale7d.length} лидов без активности более 7 дней`);
  if (noNextAction.length > 5) problems.push(`${noNextAction.length} сделок без следующего действия`);
  if (hot.length > 3 && byStatus["CONTACTED"] < 2) problems.push("Горячие лиды не обрабатываются вовремя");

  return {
    total: crmLeads.length,
    hot: hot.length,
    active: open.length,
    stale7d: stale7d.length,
    noNextAction: noNextAction.length,
    avgDealDays,
    byStatus,
    problems,
  };
}

export async function buildFollowupQueue(crmLeads: Record<string, unknown>[]): Promise<FollowupItem[]> {
  const now = Date.now();
  const open = crmLeads.filter(l => !["SUCCESS","LOST"].includes(String(l.status ?? "")));
  return open
    .map(l => {
      const updated = String(l.updated_at ?? l.created_at ?? "");
      const daysSince = updated ? Math.floor((now - new Date(updated).getTime()) / 86400000) : 0;
      const priority = String(l.priority ?? "COLD");
      const status = String(l.status ?? "NEW");
      const nextAction =
        status === "NEW" ? "Первый контакт" :
        status === "CONTACTED" ? "Уточнить потребности" :
        status === "CALCULATION" ? "Отправить расчёт" :
        status === "OFFER_SENT" ? "Согласовать КП" :
        status === "NEGOTIATION" ? "Закрыть сделку" : "Follow-up";
      return {
        id: Number(l.id ?? 0),
        company: String(l.company ?? "—"),
        name: String(l.name ?? "—"),
        phone: String(l.phone ?? ""),
        telegram: String(l.telegram ?? ""),
        status,
        priority,
        daysSince,
        lastContactDate: updated.slice(0, 10) || "—",
        nextAction,
      } satisfies FollowupItem;
    })
    .sort((a, b) => {
      const pScore = (p: string) => p === "HOT" ? 3 : p === "WARM" ? 2 : 1;
      if (pScore(b.priority) !== pScore(a.priority)) return pScore(b.priority) - pScore(a.priority);
      return b.daysSince - a.daysSince;
    })
    .slice(0, 30);
}

export async function buildSalesKPIs(
  importLeads: ImportLeadEnhanced[],
  platformLeads: PlatformLead[],
  crmLeads: Record<string, unknown>[]
): Promise<SalesKPI> {
  const hot = crmLeads.filter(l => l.priority === "HOT").length;
  const contacted = crmLeads.filter(l => l.status === "CONTACTED").length;
  const negotiation = crmLeads.filter(l => l.status === "NEGOTIATION").length;
  const proposals = crmLeads.filter(l => l.status === "OFFER_SENT").length;
  const deals = crmLeads.filter(l => l.status === "SUCCESS").length;
  const revenue = crmLeads
    .filter(l => l.status === "SUCCESS")
    .reduce((s, l) => s + Number(l.estimated_value ?? 0), 0);
  const conversion = crmLeads.length > 0 ? Math.round((deals / crmLeads.length) * 100) : 0;

  return {
    newLeads: crmLeads.filter(l => l.status === "NEW").length,
    hotLeads: hot,
    contacted,
    negotiation,
    proposals,
    deals,
    revenue,
    conversion,
    importLeadsTotal: importLeads.length,
    importLeadsHot: importLeads.filter(l => l.temperature === "HOT").length,
    platformLeadsTotal: platformLeads.length,
  };
}

export async function fetchAllSalesData() {
  const [importLeads, platformLeads, crmLeads] = await Promise.all([
    fetchImportLeads(),
    fetchPlatformLeads(),
    fetchCrmLeads(),
  ]);
  const [pipelineHealth, followupQueue, kpis] = await Promise.all([
    buildPipelineHealth(crmLeads),
    buildFollowupQueue(crmLeads),
    buildSalesKPIs(importLeads, platformLeads, crmLeads),
  ]);
  return { importLeads, platformLeads, crmLeads, pipelineHealth, followupQueue, kpis };
}
