export type ContentStatus = "GOOD" | "WARNING" | "CRITICAL";
export type ContentPriority = "HIGH" | "MEDIUM" | "LOW";
export type ContentType = "article" | "post" | "shorts" | "video" | "image" | "prompt";
export type ContentChannel = "telegram" | "youtube" | "vk" | "blog" | "ads" | "max";

export interface ContentKPIs {
  totalMaterials: number;
  articles: number;
  telegramPosts: number;
  youtubeVideos: number;
  shorts: number;
  totalViews: number;
  subscribers: number;
  bestContent: string;
}

export interface ContentHealth {
  score: number;
  status: ContentStatus;
  reasons: string[];
}

export interface ArticleData {
  title: string;
  views: number;
  position: number;
  published: string;
  traffic: number;
}

export interface SEOOpportunity {
  query: string;
  position: number;
  volume: number;
  recommendation: string;
  priority: ContentPriority;
}

export interface SEOContent {
  totalArticles: number;
  published: number;
  organicTraffic: number;
  topArticles: ArticleData[];
  opportunities: SEOOpportunity[];
}

export interface TelegramPostTemplate {
  type: "expert" | "case" | "sales";
  typeLabel: string;
  title: string;
  body: string;
  cta: string;
  emoji: string;
}

export interface TelegramStats {
  totalPosts: number;
  monthlyPosts: number;
  subscribersGrowth: number;
  bestPost: string;
  reach: number;
  templates: TelegramPostTemplate[];
}

export interface ScriptIdea {
  id: string;
  title: string;
  hook: string;
  problem: string;
  solution: string;
  cta: string;
  estimatedViews: number;
}

export interface YouTubeStats {
  totalVideos: number;
  totalViews: number;
  avgRetention: number;
  bestVideo: string;
  bestViews: number;
  ideas: ScriptIdea[];
}

export interface ShortsIdea {
  id: string;
  title: string;
  hook: string;
  script: string;
  cta: string;
  targetChannel: string;
}

export interface ShortsStats {
  totalShorts: number;
  totalViews: number;
  avgViews: number;
  pool: ShortsIdea[];
}

export interface PromptTemplate {
  id: string;
  channel: ContentChannel;
  title: string;
  prompt: string;
  tags: string[];
}

export interface ImageAI {
  totalPrompts: number;
  byChannel: { telegram: number; youtube: number; ads: number; blog: number };
  templates: PromptTemplate[];
}

export interface ContentRecommendation {
  id: string;
  problem: string;
  analysis: string;
  action: string;
  owner: string;
  priority: ContentPriority;
}

export interface ContentTask {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  channel: ContentChannel;
  priority: ContentPriority;
  deadline: string;
  status: "pending" | "in_progress" | "done";
  source: "director" | "marketing" | "seo" | "sales";
}

export interface ContentDirectorReport {
  summary: string;
  health: ContentHealth;
  kpis: ContentKPIs;
  seo: SEOContent;
  telegram: TelegramStats;
  youtube: YouTubeStats;
  shorts: ShortsStats;
  imageAI: ImageAI;
  recommendations: ContentRecommendation[];
  tasks: ContentTask[];
  generatedAt: string;
}
