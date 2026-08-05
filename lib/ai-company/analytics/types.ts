export type AnalyticsStatus = "GOOD" | "WARNING" | "CRITICAL";
export type AnalyticsPriority = "HIGH" | "MEDIUM" | "LOW";
export type InsightType = "problem" | "opportunity" | "trend";

// ── Department score ───────────────────────────────────────────────────────

export interface DepartmentScore {
  id: string;
  name: string;
  score: number;
  status: AnalyticsStatus;
  trend: "up" | "down" | "stable";
  keyMetric: string;
  weight: number;
}

export interface CompanyHealth {
  score: number;
  status: AnalyticsStatus;
  trend: "up" | "down" | "stable";
  departments: DepartmentScore[];
  positives: string[];
  problems: string[];
  companyId?: string;
}

// ── Sales analytics ────────────────────────────────────────────────────────

export interface SalesAnalytics {
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  importLeads: number;
  platformLeads: number;
  crmTotal: number;
  conversion: number;
  deals: number;
  avgDealValue: number;
  staleLeads: number;
  noActionLeads: number;
  score: number;
  problems: string[];
  aiAnalysis: string;
}

// ── Marketing analytics ────────────────────────────────────────────────────

export interface MarketingAnalytics {
  visitors: number;
  newUsers: number;
  leads: number;
  cpl: number;
  roi: number;
  bestChannel: string;
  trafficSources: Array<{ name: string; label: string; leads: number; cpl: number }>;
  score: number;
  problems: string[];
  aiAnalysis: string;
}

// ── Content analytics ──────────────────────────────────────────────────────

export interface ContentAnalytics {
  totalMaterials: number;
  articles: number;
  telegramPosts: number;
  youtubeVideos: number;
  shorts: number;
  totalViews: number;
  topContent: string;
  organicTraffic: number;
  score: number;
  problems: string[];
  aiAnalysis: string;
}

// ── Finance analytics ──────────────────────────────────────────────────────

export interface FinanceChannelBreakdown {
  channel: string;
  revenue: number;
  margin: number;
}

export interface FinanceAnalytics {
  revenue: number;
  expenses: number;
  margin: number;
  netProfit: number;
  roi: number;
  ordersCount: number;
  connected: boolean;
  byChannel: FinanceChannelBreakdown[];
  score: number;
  problems: string[];
  aiAnalysis: string;
}

// ── BI Intelligence ────────────────────────────────────────────────────────

export interface BIInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  dataPoint: string;
  recommendation: string;
  department: string;
  priority: AnalyticsPriority;
  impact: "HIGH" | "MEDIUM" | "LOW";
}

// ── Recommendations ────────────────────────────────────────────────────────

export interface AnalyticsRecommendation {
  id: string;
  problem: string;
  cause: string;
  solution: string;
  department: string;
  priority: AnalyticsPriority;
  deadline: string;
}

// ── Director report ────────────────────────────────────────────────────────

export interface AnalyticsDirectorReport {
  summary: string;
  health: CompanyHealth;
  sales: SalesAnalytics;
  marketing: MarketingAnalytics;
  content: ContentAnalytics;
  finance: FinanceAnalytics;
  insights: BIInsight[];
  recommendations: AnalyticsRecommendation[];
  bestDepartment: string;
  problemDepartment: string;
  todayActions: string[];
  generatedAt: string;
}
