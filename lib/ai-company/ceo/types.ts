export type TaskStatus     = "PENDING" | "IN_PROGRESS" | "DONE" | "BLOCKED";
export type DecisionStatus = "NEW" | "APPROVED" | "IN_PROGRESS" | "DONE" | "REJECTED";
export type NotifLevel     = "INFO" | "WARNING" | "CRITICAL";
export type Priority       = "HIGH" | "MEDIUM" | "LOW";
export type DeptId         = "sales" | "marketing" | "content" | "analytics" | "operations" | "finance" | "strategy";

export interface CeoTask {
  id: string;
  title: string;
  description: string;
  deptId: string;
  deptName: string;
  assignee: string;
  priority: Priority;
  status: TaskStatus;
  createdAt: string;
  deadline?: string;
  completedAt?: string;
  decisionId?: string;
}

export interface CeoDecision {
  id: string;
  source: string;
  deptId: string;
  title: string;
  reason: string;
  expectedEffect: string;
  priority: Priority;
  status: DecisionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CeoNotification {
  id: string;
  level: NotifLevel;
  title: string;
  body: string;
  source: string;
  createdAt: string;
  read: boolean;
}

export interface KpiTarget {
  deptId: string;
  deptName: string;
  icon: string;
  metric: string;
  current: string | number;
  target: string | number;
  unit: string;
  trend: "up" | "down" | "stable";
  progress?: number;
}

export interface HistoryEntry {
  id: string;
  date: string;
  title: string;
  description: string;
  deptId?: string;
  deptName?: string;
  status: "DONE" | "IN_PROGRESS" | "REJECTED";
  impact?: string;
}

export interface InboxMessage {
  id: string;
  from: string;
  fromDeptId: string;
  content: string;
  timestamp: string;
  reply?: string;
}

export interface CeoAiReport {
  morningBriefing: string;
  highlights: string[];
  problems: string[];
  opportunities: string[];
  todayActions: string[];
}

export interface DeptSummary {
  id: string;
  nameRu: string;
  icon: string;
  director: string;
  status: "GOOD" | "WARNING" | "CRITICAL" | "IDLE";
  kpis: Array<{ label: string; value: string | number; target?: string | number; trend?: "up" | "down" | "stable" }>;
  problems: string[];
  recommendations: string[];
  agents: Array<{ name: string; connected: boolean }>;
  lastUpdated: string;
}

export interface CeoMetrics {
  revenue: string;
  mrr: string;
  leads: number;
  conversion: number;
  activeDeals: number;
  openTasks: number;
  criticalCount: number;
  deptsOnline: number;
}

export interface CeoApiReport {
  healthScore: number;
  companyStatus: "GOOD" | "WARNING" | "CRITICAL";
  depts: DeptSummary[];
  metrics: CeoMetrics;
  decisions: CeoDecision[];
  notifications: CeoNotification[];
  kpis: KpiTarget[];
  aiReport: CeoAiReport;
  generatedAt: string;
}
