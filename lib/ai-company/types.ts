export type DeptStatus = "GOOD" | "WARNING" | "CRITICAL" | "IDLE";
export type Priority = "HIGH" | "MEDIUM" | "LOW";
export type Period = "day" | "week" | "month";

export interface KPIMetric {
  label: string;
  value: string | number;
  target?: string | number;
  trend?: "up" | "down" | "stable";
  unit?: string;
}

export interface AgentInfo {
  name: string;
  function: string;
  connected: boolean;
}

export interface DepartmentReport {
  id: string;
  name: string;
  nameRu: string;
  director: string;
  icon: string;
  status: DeptStatus;
  kpis: KPIMetric[];
  agents: AgentInfo[];
  problems: string[];
  recommendations: string[];
  lastUpdated: string;
}

export interface CeoRecommendation {
  id: string;
  problem: string;
  analysis: string;
  action: string;
  owner: string;
  priority: Priority;
}

export interface CeoTask {
  id: string;
  title: string;
  description: string;
  department: string;
  priority: Priority;
  deadline: string;
  status: "pending" | "in_progress" | "done";
}

export interface CompanyMetrics {
  revenue: number;
  profit: number;
  leads: number;
  conversion: number;
  traffic: number;
  customers: number;
  activeDeals: number;
}

export interface CeoReport {
  companyHealth: DeptStatus;
  healthScore: number;
  summary: string;
  metrics: CompanyMetrics;
  departments: DepartmentReport[];
  recommendations: CeoRecommendation[];
  tasks: CeoTask[];
  generatedAt: string;
  period: Period;
}
