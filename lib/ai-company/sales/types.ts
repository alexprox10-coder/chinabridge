import type { ImportLead } from "@/lib/import-leads/types";

export type LeadTemperature = "HOT" | "WARM" | "COLD";
export type SalesPriority = "HIGH" | "MEDIUM" | "LOW";
export type PlatformOpportunity = "HIGH" | "MEDIUM" | "LOW";
export type PlatformStatus = "new" | "contacted" | "negotiation" | "demo" | "won" | "lost";

export interface ImportLeadEnhanced extends ImportLead {
  score100: number;
  temperature: LeadTemperature;
  probability: number;
  nextAction: string;
  potentialValue: number;
}

export interface PlatformLead {
  id?: number;
  lead_id: string;
  company: string;
  website: string;
  city: string;
  country: string;
  business_type: string;
  contact_name: string;
  email: string;
  telegram: string;
  phone: string;
  lead_score: number;
  opportunity: PlatformOpportunity;
  status: PlatformStatus;
  ai_comment: string;
  ai_offer: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface PipelineHealth {
  total: number;
  hot: number;
  active: number;
  stale7d: number;
  noNextAction: number;
  avgDealDays: number;
  byStatus: Record<string, number>;
  problems: string[];
}

export interface FollowupItem {
  id: number;
  company: string;
  name: string;
  phone: string;
  telegram: string;
  status: string;
  priority: string;
  daysSince: number;
  lastContactDate: string;
  nextAction: string;
}

export interface SalesKPI {
  newLeads: number;
  hotLeads: number;
  contacted: number;
  negotiation: number;
  proposals: number;
  deals: number;
  revenue: number;
  conversion: number;
  importLeadsTotal: number;
  importLeadsHot: number;
  platformLeadsTotal: number;
}

export interface SalesRecommendation {
  id: string;
  problem: string;
  analysis: string;
  action: string;
  priority: SalesPriority;
}

export interface SalesTask {
  id: string;
  title: string;
  description: string;
  priority: SalesPriority;
  deadline: string;
  status: "pending" | "in_progress" | "done";
}

export interface SalesDirectorReport {
  summary: string;
  kpis: SalesKPI;
  pipelineHealth: PipelineHealth;
  importLeads: ImportLeadEnhanced[];
  platformLeads: PlatformLead[];
  followupQueue: FollowupItem[];
  recommendations: SalesRecommendation[];
  tasks: SalesTask[];
  generatedAt: string;
}
