export type ImportStatus = "yes" | "no" | "likely";
export type LeadStatus = "new" | "reviewed" | "approved" | "rejected" | "contacted";
export type LeadScore = 1 | 2 | 3 | 4 | 5;

export interface ImportLead {
  id?: number;
  lead_id: string;
  company: string;
  website: string;
  category: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  telegram: string;
  source: string;
  imports: ImportStatus;
  score: LeadScore;
  score_stars: string;
  why: string;
  offer: string;
  message: string;
  company_id: string;
  created_at: string;
  status: LeadStatus;
}

export interface SearchResult {
  url: string;
  title: string;
  description: string;
  source: string;
}

export interface AnalysisResult {
  company: string;
  category: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  telegram: string;
  imports: ImportStatus;
  china_signals: string[];
  description: string;
}

export interface ScoreResult {
  score: LeadScore;
  why: string;
  offer: string;
  message: string;
}

export interface PipelineResult {
  found: number;
  analyzed: number;
  saved: number;
  errors: string[];
}
