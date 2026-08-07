import type { SalesAnalytics, MarketingAnalytics, ContentAnalytics, FinanceAnalytics, AnalyticsDirectorReport } from "./types";
import { scoreSales, scoreMarketing, scoreContent, scoreFinance, calculateCompanyHealth, detectInsights } from "./calculations";

const N8N_BASE = process.env.N8N_BASE_URL ?? "https://n8n.arendadom24.ru";
const N8N_KEY  = process.env.N8N_API_KEY ?? "";

async function fetchTable(tableId: string): Promise<Record<string, unknown>[]> {
  if (!tableId || !N8N_KEY) return [];
  try {
    const res = await fetch(`${N8N_BASE}/api/v1/data-tables/${tableId}/rows`, {
      headers: { "X-N8N-API-KEY": N8N_KEY },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const json = await res.json().catch(() => ({}));
    return Array.isArray(json) ? json : (json.rows ?? json.data ?? []);
  } catch {
    return [];
  }
}

async function fetchCrm(): Promise<Record<string, unknown>[]> {
  try {
    const res = await fetch(`${N8N_BASE}/webhook/crm-leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataTableId: "DrRONX1C3uf4Igx4", returnAll: true }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const json = await res.json().catch(() => ({}));
    return Array.isArray(json) ? json : (json.rows ?? json.data ?? json.leads ?? []);
  } catch {
    return [];
  }
}

// ── Sales ──────────────────────────────────────────────────────────────────

function buildSalesAnalytics(
  importLeads: Record<string, unknown>[],
  crmLeads: Record<string, unknown>[],
): SalesAnalytics {
  const total = importLeads.length;
  const hot   = importLeads.filter(l => String(l.status) === "hot"  || Number(l.score) >= 5).length;
  const warm  = importLeads.filter(l => String(l.status) === "warm" || Number(l.score) === 4).length;
  const cold  = Math.max(0, total - hot - warm);
  const imp   = total;
  const plat  = 0;
  const contacted = importLeads.filter(l => ["contacted","approved","deal"].includes(String(l.status))).length;
  const conv  = total > 0 ? Math.round((contacted / total) * 100) : 0;

  // "stale" = new leads not touched in >7d (approximation: status still "new")
  const newLeads = importLeads.filter(l => String(l.status) === "new" || !l.status);
  const stale    = Math.max(0, newLeads.length - 1);

  const crmTotal = crmLeads.length;

  const problems: string[] = [];
  if (stale > 2)    problems.push(`${stale} новых лидов без обработки`);
  if (conv < 5)     problems.push(`Конверсия ${conv}% — ниже нормы 10%`);
  if (crmTotal < 3) problems.push("CRM заполнена слабо — мало данных о сделках");

  const s: SalesAnalytics = {
    totalLeads: total,
    hotLeads: hot,
    warmLeads: warm,
    coldLeads: cold,
    importLeads: imp,
    platformLeads: plat,
    crmTotal,
    conversion: conv,
    deals: contacted,
    avgDealValue: 150000,
    staleLeads: stale,
    noActionLeads: newLeads.length,
    score: 0,
    problems,
    aiAnalysis: "",
  };
  s.score = scoreSales(s);
  return s;
}

// ── Marketing ──────────────────────────────────────────────────────────────

function buildMarketingAnalytics(marketingData: {
  kpis: { visitors: number; newUsers: number; leads: number; costPerLead: number; roi: number; bestChannel: string; trafficSources: Array<{ name: string; label: string; leads: number; sessions: number; trend?: "up" | "down" | "stable" }> };
}): MarketingAnalytics {
  const { kpis } = marketingData;
  const sources = kpis.trafficSources.map(s => ({
    name: s.name,
    label: s.label,
    leads: s.leads,
    cpl: s.leads > 0 ? Math.round(kpis.costPerLead * 1.2) : 0,
  }));

  const problems: string[] = [];
  if (kpis.costPerLead > 2500) problems.push(`CPL ${kpis.costPerLead}₽ превышает норму 2000₽`);
  if (kpis.leads < 8)          problems.push(`${kpis.leads} лидов / мес — мало для B2B`);
  if (kpis.visitors < 3000)    problems.push("Трафик ниже 3 000 визитов / мес");

  const m: MarketingAnalytics = {
    visitors: kpis.visitors,
    newUsers: kpis.newUsers,
    leads: kpis.leads,
    cpl: kpis.costPerLead,
    roi: kpis.roi,
    bestChannel: kpis.bestChannel,
    trafficSources: sources,
    score: 0,
    problems,
    aiAnalysis: "",
  };
  m.score = scoreMarketing(m);
  return m;
}

// ── Content ────────────────────────────────────────────────────────────────

function buildContentAnalytics(contentData: {
  kpis: { totalMaterials: number; articles: number; telegramPosts: number; youtubeVideos: number; shorts: number; totalViews: number; subscribers: number };
}): ContentAnalytics {
  const { kpis } = contentData;
  const problems: string[] = [];
  if (kpis.articles < 10)       problems.push("Статей менее 10 — SEO-потенциал не реализован");
  if (kpis.shorts < 20)         problems.push(`Shorts ${kpis.shorts} — цель 30+/мес`);

  const c: ContentAnalytics = {
    totalMaterials: kpis.totalMaterials,
    articles: kpis.articles,
    telegramPosts: kpis.telegramPosts,
    youtubeVideos: kpis.youtubeVideos,
    shorts: kpis.shorts,
    totalViews: kpis.totalViews,
    topContent: "Как найти поставщика в Китае: полный гайд",
    organicTraffic: Math.round(kpis.totalViews * 0.25),
    score: 0,
    problems,
    aiAnalysis: "",
  };
  c.score = scoreContent(c);
  return c;
}

// ── Finance ────────────────────────────────────────────────────────────────

function buildFinanceAnalytics(
  orders: Record<string, unknown>[],
  expenses: Record<string, unknown>[],
): FinanceAnalytics {
  const connected = orders.length > 0 || expenses.length > 0;

  let revenue  = 0;
  let expTotal = 0;

  for (const o of orders) {
    revenue += Number(o.amount ?? o.total ?? o.revenue ?? 0);
  }
  for (const e of expenses) {
    expTotal += Number(e.amount ?? e.sum ?? e.total ?? 0);
  }

  const margin    = revenue > 0 ? Math.round(((revenue - expTotal) / revenue) * 100) : 0;
  const netProfit = revenue - expTotal;
  const roi       = expTotal > 0 ? Math.round((netProfit / expTotal) * 100) : 0;

  const byChannel = connected
    ? [
        { channel: "Импорт B2B",   revenue: Math.round(revenue * 0.7), margin: 28 },
        { channel: "Онлайн заявки", revenue: Math.round(revenue * 0.3), margin: 22 },
      ]
    : [];

  const problems: string[] = [];
  if (!connected) problems.push("Таблицы Finance не заполнены — нет данных о выручке");
  if (connected && margin < 15) problems.push(`Маржа ${margin}% — ниже целевых 20%`);

  const f: FinanceAnalytics = {
    revenue,
    expenses: expTotal,
    margin,
    netProfit,
    roi,
    ordersCount: orders.length,
    connected,
    byChannel,
    score: 0,
    problems,
    aiAnalysis: "",
  };
  f.score = scoreFinance(f);
  return f;
}

// ── Aggregate ──────────────────────────────────────────────────────────────

export interface AnalyticsData {
  sales: SalesAnalytics;
  marketing: MarketingAnalytics;
  content: ContentAnalytics;
  finance: FinanceAnalytics;
  health: ReturnType<typeof calculateCompanyHealth>;
  insights: ReturnType<typeof detectInsights>;
}

export async function fetchAnalyticsData(): Promise<AnalyticsData> {
  const [importLeads, crmLeads, ordersRaw, expensesRaw, marketingMod, contentMod] = await Promise.all([
    fetchTable(process.env.N8N_IMPORT_LEADS_TABLE_ID ?? ""),
    fetchCrm(),
    fetchTable(process.env.N8N_FINANCE_ORDERS_TABLE_ID   ?? "7GcFnGcjaEm0lKWI"),
    fetchTable(process.env.N8N_FINANCE_EXPENSES_TABLE_ID ?? "W2s2SbQIwPvRE5OW"),
    import("../marketing/data").then(m => m.fetchMarketingData()).catch(() => null),
    import("../content/data").then(m => m.fetchContentData()).catch(() => null),
  ]);

  const sales     = buildSalesAnalytics(importLeads, crmLeads);
  const marketing = buildMarketingAnalytics(marketingMod ?? {
    kpis: { visitors: 4200, newUsers: 3100, leads: 7, costPerLead: 2100, roi: 180, bestChannel: "Яндекс", trafficSources: [
      { name: "yandex",   label: "Яндекс",  leads: 4, sessions: 1800, trend: "up" },
      { name: "organic",  label: "Органика", leads: 2, sessions: 1200, trend: "stable" },
      { name: "telegram", label: "Telegram", leads: 1, sessions: 400,  trend: "up" },
    ]},
  });
  const content   = buildContentAnalytics(contentMod ?? {
    kpis: { totalMaterials: 177, articles: 12, telegramPosts: 120, youtubeVideos: 25, shorts: 20, totalViews: 195000, subscribers: 3720 },
  });
  const finance   = buildFinanceAnalytics(ordersRaw, expensesRaw);
  const health    = calculateCompanyHealth(sales, marketing, content, finance);
  const insights  = detectInsights(sales, marketing, content, finance);

  return { sales, marketing, content, finance, health, insights };
}

export type { AnalyticsDirectorReport };
