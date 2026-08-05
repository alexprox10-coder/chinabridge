export type FinanceStatus = "GOOD" | "WARNING" | "CRITICAL";
export type FinancePriority = "HIGH" | "MEDIUM" | "LOW";
export type CostCategory =
  | "ads" | "servers" | "ai_services" | "salaries" | "logistics" | "operations" | "other";

// ── Revenue ────────────────────────────────────────────────────────────────

export interface RevenueByChannel {
  channel: string;
  label: string;
  revenue: number;
  deals: number;
  avgDeal: number;
  margin: number;
  growth: number;
}

export interface RevenueData {
  total: number;
  deals: number;
  avgDeal: number;
  growth: number;
  mrr: number;
  arr: number;
  byChannel: RevenueByChannel[];
  repeatRevenue: number;
  newRevenue: number;
  connected: boolean;
}

// ── Costs ──────────────────────────────────────────────────────────────────

export interface CostItem {
  category: CostCategory;
  label: string;
  amount: number;
  budget: number;
  overspend: boolean;
}

export interface CostData {
  total: number;
  byCategory: CostItem[];
  adSpend: number;
  fixedCosts: number;
  variableCosts: number;
  connected: boolean;
}

// ── Profit ─────────────────────────────────────────────────────────────────

export interface ProfitByProduct {
  product: string;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

export interface ProfitData {
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
  roi: number;
  netProfit: number;
  grossProfit: number;
  byProduct: ProfitByProduct[];
  bestChannel: string;
  bestChannelCAC: number;
  bestChannelLTV: number;
}

// ── Unit Economics ─────────────────────────────────────────────────────────

export type UnitEcoRating = "EXCELLENT" | "GOOD" | "WARNING" | "CRITICAL";

export interface UnitEconomics {
  cac: number;
  ltv: number;
  arpu: number;
  paybackDays: number;
  churn: number;
  ltvToCac: number;
  rating: UnitEcoRating;
  ratingReason: string;
  byChannel: Array<{ channel: string; cac: number; ltv: number; ratio: number }>;
}

// ── Forecast ───────────────────────────────────────────────────────────────

export interface ForecastPoint {
  month: string;
  revenue: number;
  mrr: number;
  profit: number;
}

export interface ForecastScenario {
  label: string;
  description: string;
  mrr3m: number;
  arr: number;
  revenue3m: number;
  conditions: string[];
  growthRate: number;
}

export interface ForecastData {
  currentMRR: number;
  base: ForecastScenario;
  optimistic: ForecastScenario;
  pessimistic: ForecastScenario;
  timeline: ForecastPoint[];
  keyDriver: string;
}

// ── SaaS Metrics ───────────────────────────────────────────────────────────

export interface SaaSMetrics {
  activeCompanies: number;
  trials: number;
  paidCustomers: number;
  mrr: number;
  arr: number;
  churn: number;
  expansionRevenue: number;
  nps: number;
}

// ── Health ─────────────────────────────────────────────────────────────────

export interface FinanceHealth {
  score: number;
  status: FinanceStatus;
  positives: string[];
  problems: string[];
}

// ── Recommendations ────────────────────────────────────────────────────────

export interface FinanceRecommendation {
  id: string;
  problem: string;
  solution: string;
  impact: string;
  priority: FinancePriority;
  deadline: string;
}

// ── Director Report ────────────────────────────────────────────────────────

export interface FinanceDirectorReport {
  summary: string;
  health: FinanceHealth;
  revenue: RevenueData;
  costs: CostData;
  profit: ProfitData;
  unitEconomics: UnitEconomics;
  forecast: ForecastData;
  saas: SaaSMetrics;
  recommendations: FinanceRecommendation[];
  ceoSummary: {
    revenue: number;
    profit: number;
    margin: number;
    mrr: number;
    topDecision: string;
  };
  generatedAt: string;
}
