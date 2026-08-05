export type StrategyStatus   = "GOOD" | "WARNING" | "CRITICAL";
export type StrategyPriority = "HIGH" | "MEDIUM" | "LOW";
export type MarketPotential  = "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW";
export type CompetitorThreat = "HIGH" | "MEDIUM" | "LOW";
export type OpportunityCategory = "market" | "product" | "partnership" | "technology";
export type TrendCategory    = "ai" | "logistics" | "marketplace" | "trade" | "legal";
export type IdeaSource       = "clients" | "market" | "competitors" | "team";

export interface MarketData {
  id: string;
  name: string;
  size: string;
  growth: number;
  competition: "HIGH" | "MEDIUM" | "LOW";
  potential: MarketPotential;
  entryDifficulty: "HIGH" | "MEDIUM" | "LOW";
  whyEnter: string[];
  recommendation: string;
  score: number;
}

export interface Competitor {
  id: string;
  name: string;
  category: "cargo" | "logistics" | "saas" | "marketplace";
  strengths: string[];
  weaknesses: string[];
  threat: CompetitorThreat;
  opportunity: string;
  marketShare?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  category: OpportunityCategory;
  potential: MarketPotential;
  why: string;
  score: number;
  timeToMarket: string;
  revenueEstimate: string;
  effort: "HIGH" | "MEDIUM" | "LOW";
}

export interface ProductIdea {
  id: string;
  title: string;
  priority: StrategyPriority;
  source: IdeaSource;
  description: string;
  impact: string;
  effort: "HIGH" | "MEDIUM" | "LOW";
  revenueModel?: string;
}

export interface GrowthAction {
  id: string;
  timeframe: "30d" | "60d" | "90d";
  title: string;
  description: string;
  owner: string;
  kpi: string;
  priority: StrategyPriority;
}

export interface Trend {
  id: string;
  category: TrendCategory;
  title: string;
  description: string;
  opportunity: string;
  priority: StrategyPriority;
  impact: "HIGH" | "MEDIUM" | "LOW";
}

export interface StrategyHealth {
  score: number;
  status: StrategyStatus;
  marketScore: number;
  innovationScore: number;
  competitiveScore: number;
  opportunitiesCount: number;
  risks: string[];
  strengths: string[];
}

export interface StrategyRecommendation {
  id: string;
  title: string;
  description: string;
  impact: string;
  priority: StrategyPriority;
  timeline: string;
}

export interface StrategyDirectorReport {
  summary: string;
  health: StrategyHealth;
  markets: MarketData[];
  competitors: Competitor[];
  opportunities: Opportunity[];
  productIdeas: ProductIdea[];
  growthActions: GrowthAction[];
  trends: Trend[];
  recommendations: StrategyRecommendation[];
  ceoInsight: {
    topOpportunity: string;
    topRisk: string;
    topDecision: string;
    saasReadiness: number;
  };
  generatedAt: string;
}
