export type IntentTier = "HOT" | "WARM" | "COLD" | "IRRELEVANT";

export interface VkPost {
  post_id: string;
  text: string;
  author_name: string;
  author_id: string | number;
  date: number; // unix timestamp
  link: string;
  likes_count: number;
  reposts_count: number;
  query: string;
}

export interface IntentLead {
  post_id: string;
  query: string;
  text: string;
  author_name: string;
  author_link: string;
  posted_at: string;
  tier: IntentTier;
  score: number;
  intent: string;
  product: string;
  location: string;
  contact: string;
  urgency: string;
  confidence: number;
  source: "vk";
}

export interface IntentPipelineResult {
  scraped: number;
  classified: number;
  hot: number;
  warm: number;
  saved: number;
  errors: string[];
}
