export type MarketingStatus = "GOOD" | "WARNING" | "CRITICAL";
export type MarketingPriority = "HIGH" | "MEDIUM" | "LOW";
export type ContentType = "article" | "post" | "shorts" | "video";

export interface TrafficSource {
  name: string;
  label: string;
  sessions: number;
  leads: number;
  conversionRate: number;
  cost: number;
  cpl: number;
  trend: "up" | "down" | "stable";
}

export interface MarketingKPIs {
  visitors: number;
  newUsers: number;
  leads: number;
  costPerLead: number;
  conversion: number;
  bestChannel: string;
  roi: number;
  trafficSources: TrafficSource[];
}

export interface MarketingFunnel {
  visits: number;
  clicks: number;
  leads: number;
  qualified: number;
  deals: number;
}

export interface MarketingHealth {
  score: number;
  status: MarketingStatus;
  reasons: string[];
}

export interface AdCampaign {
  id: string;
  name: string;
  platform: "yandex" | "google" | "vk" | "telegram";
  spend: number;
  leads: number;
  cpl: number;
  conversion: number;
  status: MarketingStatus;
  trend: "up" | "down" | "stable";
  aiAnalysis: string;
  recommendation: string;
}

export interface SEOQuery {
  query: string;
  position: number;
  clicks: number;
  impressions: number;
}

export interface SEOOpportunity {
  query: string;
  currentPosition: number;
  volume: number;
  recommendation: string;
}

export interface SEOData {
  articles: number;
  organicVisits: number;
  growthPercent: number;
  topQueries: SEOQuery[];
  opportunities: SEOOpportunity[];
}

export interface ChannelStats {
  subscribers: number;
  growth: number;
  reach: number;
  leads: number;
  bestContent: string;
}

export interface ChannelData {
  telegram: ChannelStats;
  max: ChannelStats;
  vk: ChannelStats & { posts: number };
  youtube: ChannelStats & { videos: number };
}

export interface MarketingRecommendation {
  id: string;
  problem: string;
  analysis: string;
  action: string;
  owner: string;
  priority: MarketingPriority;
}

export interface MarketingTask {
  id: string;
  title: string;
  description: string;
  department: "Content" | "Marketing" | "Sales";
  priority: MarketingPriority;
  deadline: string;
  status: "pending" | "in_progress" | "done";
}

export interface ContentRequest {
  type: ContentType;
  title: string;
  topic: string;
  channel: string;
  priority: MarketingPriority;
  reason: string;
}

export interface MarketingDirectorReport {
  summary: string;
  health: MarketingHealth;
  kpis: MarketingKPIs;
  funnel: MarketingFunnel;
  ads: AdCampaign[];
  seo: SEOData;
  channels: ChannelData;
  recommendations: MarketingRecommendation[];
  tasks: MarketingTask[];
  contentRequests: ContentRequest[];
  generatedAt: string;
}
