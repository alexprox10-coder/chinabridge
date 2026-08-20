import type {
  RevenueData, CostData, ProfitData, SaaSMetrics, FinanceDirectorReport,
} from "./types";
import { calculateFinanceHealth, calculateUnitEconomics, calculateROI } from "./calculations";
import { generateForecast } from "./forecast";

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

// ── Smart mock (реалистичные данные импортной B2B компании) ────────────────

const MOCK_REVENUE_BY_CHANNEL = [
  { channel: "import_b2b",  label: "Импорт B2B",    revenue: 2600000, deals: 18, avgDeal: 144444, margin: 28, growth: 23 },
  { channel: "cargo",       label: "Карго клиенты",  revenue: 780000,  deals: 12, avgDeal: 65000,  margin: 22, growth: 12 },
  { channel: "consulting",  label: "Консалтинг",     revenue: 280000,  deals: 8,  avgDeal: 35000,  margin: 65, growth: 31 },
  { channel: "platform",    label: "SaaS (пилот)",   revenue: 140000,  deals: 4,  avgDeal: 35000,  margin: 85, growth: 45 },
];

const MOCK_COSTS = [
  { category: "ads" as const,        label: "Реклама (Яндекс/VK)",  amount: 120000, budget: 150000, overspend: false },
  { category: "salaries" as const,   label: "Зарплаты",             amount: 380000, budget: 380000, overspend: false },
  { category: "logistics" as const,  label: "Логистика (опер.)",    amount: 95000,  budget: 100000, overspend: false },
  { category: "servers" as const,    label: "Инфраструктура",       amount: 22000,  budget: 25000,  overspend: false },
  { category: "ai_services" as const, label: "AI-сервисы",          amount: 18000,  budget: 20000,  overspend: false },
  { category: "operations" as const, label: "Операционные",         amount: 65000,  budget: 60000,  overspend: true  },
  { category: "other" as const,      label: "Прочее",               amount: 30000,  budget: 30000,  overspend: false },
];

// ── Builders ───────────────────────────────────────────────────────────────

function buildRevenueFromOrders(
  orders: Record<string, unknown>[],
): RevenueData {
  if (orders.length === 0) {
    const total = MOCK_REVENUE_BY_CHANNEL.reduce((s, c) => s + c.revenue, 0);
    const deals = MOCK_REVENUE_BY_CHANNEL.reduce((s, c) => s + c.deals, 0);
    return {
      total,
      deals,
      avgDeal: Math.round(total / deals),
      growth: 18,
      mrr: total,
      arr: total * 12,
      byChannel: MOCK_REVENUE_BY_CHANNEL,
      repeatRevenue: Math.round(total * 0.42),
      newRevenue: Math.round(total * 0.58),
      connected: false,
    };
  }

  let total = 0;
  const channelMap: Record<string, number> = {};
  for (const o of orders) {
    const amt = Number(o.amount ?? o.total ?? o.revenue ?? 0);
    total += amt;
    const ch = String(o.channel ?? o.source ?? "other");
    channelMap[ch] = (channelMap[ch] ?? 0) + amt;
  }

  const byChannel = Object.entries(channelMap).map(([ch, rev]) => ({
    channel: ch,
    label: ch,
    revenue: rev,
    deals: orders.filter(o => String(o.channel ?? "other") === ch).length,
    avgDeal: Math.round(rev / Math.max(1, orders.filter(o => String(o.channel ?? "other") === ch).length)),
    margin: 25,
    growth: 0,
  }));

  return {
    total,
    deals: orders.length,
    avgDeal: orders.length > 0 ? Math.round(total / orders.length) : 0,
    growth: 0,
    mrr: total,
    arr: total * 12,
    byChannel,
    repeatRevenue: Math.round(total * 0.4),
    newRevenue: Math.round(total * 0.6),
    connected: true,
  };
}

function buildCostsFromExpenses(
  expenses: Record<string, unknown>[],
): CostData {
  if (expenses.length === 0) {
    const total = MOCK_COSTS.reduce((s, c) => s + c.amount, 0);
    return {
      total,
      byCategory: MOCK_COSTS,
      adSpend: MOCK_COSTS.find(c => c.category === "ads")?.amount ?? 0,
      fixedCosts: MOCK_COSTS.filter(c => ["salaries", "servers", "ai_services"].includes(c.category))
        .reduce((s, c) => s + c.amount, 0),
      variableCosts: MOCK_COSTS.filter(c => ["ads", "logistics", "operations"].includes(c.category))
        .reduce((s, c) => s + c.amount, 0),
      connected: false,
    };
  }

  let total = 0;
  const byCategory = MOCK_COSTS.map(c => ({ ...c }));
  for (const e of expenses) {
    total += Number(e.amount ?? e.sum ?? 0);
  }

  return {
    total,
    byCategory,
    adSpend: 0,
    fixedCosts: Math.round(total * 0.55),
    variableCosts: Math.round(total * 0.45),
    connected: true,
  };
}

function buildProfit(revenue: RevenueData, costs: CostData): ProfitData {
  const profit     = revenue.total - costs.total;
  const margin     = revenue.total > 0 ? Math.round((profit / revenue.total) * 100) : 0;
  const roi        = calculateROI(revenue.total, costs.total);
  const byProduct  = revenue.byChannel.map(c => ({
    product: c.label,
    revenue: c.revenue,
    cost: Math.round(c.revenue * (1 - c.margin / 100)),
    profit: Math.round(c.revenue * c.margin / 100),
    margin: c.margin,
  }));

  const bestCh = revenue.byChannel.reduce((a, b) => b.margin > a.margin ? b : a, revenue.byChannel[0] ?? { label: "—", margin: 0 });

  return {
    revenue: revenue.total,
    costs: costs.total,
    profit,
    margin,
    roi,
    netProfit: Math.round(profit * 0.87),
    grossProfit: profit,
    byProduct,
    bestChannel: bestCh?.label ?? "—",
    bestChannelCAC: 2700,
    bestChannelLTV: 360000,
  };
}

const SAAS_METRICS: SaaSMetrics = {
  activeCompanies: 1,
  trials: 3,
  paidCustomers: 1,
  mrr: 140000,
  arr: 1680000,
  churn: 0,
  expansionRevenue: 0,
  nps: 72,
};

// ── Aggregate ──────────────────────────────────────────────────────────────

export interface FinanceData {
  revenue: RevenueData;
  costs: CostData;
  profit: ProfitData;
  unitEconomics: ReturnType<typeof calculateUnitEconomics>;
  forecast: ReturnType<typeof generateForecast>;
  saas: SaaSMetrics;
  health: ReturnType<typeof calculateFinanceHealth>;
  /** true when N8N_API_KEY is absent and figures come from smart-mock */
  isDemo: boolean;
}

export async function fetchFinanceData(): Promise<FinanceData> {
  const [ordersRaw, expensesRaw] = await Promise.all([
    fetchTable(process.env.N8N_FINANCE_ORDERS_TABLE_ID   ?? "7GcFnGcjaEm0lKWI"),
    fetchTable(process.env.N8N_FINANCE_EXPENSES_TABLE_ID ?? "W2s2SbQIwPvRE5OW"),
  ]);

  const revenue = buildRevenueFromOrders(ordersRaw);
  const costs   = buildCostsFromExpenses(expensesRaw);
  const profit  = buildProfit(revenue, costs);

  const customersCount = revenue.deals > 0
    ? Math.max(4, Math.round(revenue.deals * 0.6))
    : 4;

  const unitEconomics = calculateUnitEconomics(revenue, costs, customersCount);
  const forecast      = generateForecast(revenue.mrr, revenue.growth);
  const health        = calculateFinanceHealth(revenue, costs, profit.margin, unitEconomics.ltvToCac);

  return {
    revenue, costs, profit, unitEconomics, forecast,
    saas: SAAS_METRICS, health,
    isDemo: !revenue.connected,
  };
}

export type { FinanceDirectorReport };
