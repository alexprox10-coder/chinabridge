// Tender Intelligence — shared types

export type LawType = "44fz" | "223fz" | "commercial" | "other";
export type TenderStream = "winners" | "second_place" | "repeat_winners" | "new_winners";
export type OpportunityStatus =
  | "NEW" | "ANALYZING" | "QUALIFIED" | "HOT"
  | "ASSIGNED" | "CONTACTED" | "IN_PROGRESS"
  | "WON" | "LOST" | "IRRELEVANT";
export type ChinaFitCategory = "HIGH" | "MEDIUM" | "LOW" | "IRRELEVANT";

export interface TenderSource {
  id: string;
  name: string;
  url: string;
  source_type: "government" | "commercial";
  active: boolean;
  crawl_frequency: number; // hours
  last_checked: string | null;
  last_success: string | null;
}

export interface RawTender {
  tender_id: string;
  source: string;
  purchase_number: string;
  purchase_type: string;
  law_type: LawType;
  customer: string;
  customer_inn: string | null;
  customer_region: string | null;
  subject: string;
  category: string | null;
  description: string | null;
  quantity: number | null;
  unit: string | null;
  initial_price: number;
  final_price: number;
  currency: string;
  publication_date: string;
  end_date: string | null;
  contract_date: string | null;
  delivery_deadline: number | null; // days
  delivery_region: string | null;
  winner: string;
  winner_inn: string;
  winner_price: number;
  winner_rank: number;
  source_url: string;
}

export interface ChinaFitResult {
  score: number;           // 0–100
  category: ChinaFitCategory;
  product_category: string;
  reasoning: string;
  chinese_analogs: boolean;
  import_restrictions: boolean;
  certification_needed: boolean;
  official_import_possible: boolean;
  // factor breakdown
  factors: {
    chinese_manufacturable: number;  // 0–25
    commodity_product: number;       // 0–15
    import_likelihood: number;       // 0–20
    contract_volume: number;         // 0–10
    sourcing_margin: number;         // 0–10
    delivery_geography: number;      // 0–10
    repeat_procurement: number;      // 0–10
  };
}

export interface TenderCompany {
  inn: string;
  name: string;
  region: string | null;
  win_count: number;
  win_count_30d: number;
  win_count_90d: number;
  win_count_365d: number;
  total_amount: number;
  categories: string[];
  repeat_winner: boolean;
  is_new_winner: boolean;  // first win in 90d
  contact_phone: string | null;
  contact_email: string | null;
  website: string | null;
  updated_at: string;
}

export interface TenderOpportunity {
  id: string;
  tender_id: string;
  company_id: string;
  source: string;
  purchase_number: string;
  subject: string;
  category: string;
  law_type: LawType;
  contract_value: number;
  winner_price: number;
  delivery_deadline: number | null;
  urgency: "HIGH" | "MEDIUM" | "LOW";
  china_import_fit: number;
  opportunity_score: number;
  lead_score: number;
  intent_score: number;
  priority: ChinaFitCategory;
  status: OpportunityStatus;
  stream: TenderStream;
  repeat_winner: boolean;
  win_count: number;
  ai_summary: string | null;
  recommended_offer: string | null;
  next_best_action: string | null;
  // economics estimate
  estimated_china_cost: number | null;
  estimated_logistics: number | null;
  estimated_customs: number | null;
  estimated_margin: number | null;
  estimated_margin_percent: number | null;
  scoring_model_version: string;
  source_url: string;
  created_at: string;
  updated_at: string;
}

export interface ScoringWeights {
  chinese_manufacturable: number;
  commodity_product: number;
  import_likelihood: number;
  contract_volume: number;
  sourcing_margin: number;
  delivery_geography: number;
  repeat_procurement: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  chinese_manufacturable: 25,
  commodity_product: 15,
  import_likelihood: 20,
  contract_volume: 10,
  sourcing_margin: 10,
  delivery_geography: 10,
  repeat_procurement: 10,
};

export const SCORING_MODEL_VERSION = "tender_scoring_v1.0";

// Configurable thresholds
export const CONFIG = {
  MIN_CONTRACT_VALUE: 500_000,       // ₽ — filter below this
  HOT_OPPORTUNITY_THRESHOLD: 80,     // opportunity_score >= → HOT
  CRM_LEAD_THRESHOLD: 75,            // lead_score >= → create CRM lead
  DEEP_AI_THRESHOLD: 60,             // china_fit >= OR repeat_winner → deep research
  URGENT_DEADLINE_DAYS: 30,          // deadline <= → HIGH urgency
  MEDIUM_DEADLINE_DAYS: 60,          // deadline <= → MEDIUM urgency
  REPEAT_WINNER_MIN_COUNT: 3,        // win_count_365d >= → repeat_winner
  NEW_WINNER_MAX_COUNT: 1,           // win_count_365d <= → new_winner
  HIGH_VALUE_CONTRACT: 5_000_000,    // ₽ — always trigger deep research
} as const;

// ОКПД2 prefixes mapped to product category labels (high China fit)
export const CHINA_FIT_OKPD2: Record<string, string> = {
  "26": "Электроника и компьютеры",
  "27": "Электрооборудование",
  "28": "Машины и оборудование",
  "29": "Автомобили и транспорт",
  "30": "Прочие транспортные средства",
  "31": "Мебель",
  "32": "Прочие готовые изделия",
  "13": "Текстиль",
  "14": "Одежда",
  "15": "Кожа и обувь",
  "22": "Резина и пластмасса",
  "23": "Стекло и керамика",
  "25": "Металлические изделия",
  "33": "Ремонт и монтаж оборудования",
};

export const HIGH_PRIORITY_CATEGORIES = [
  "оборудование", "электроника", "электротехника", "светотехника",
  "мебель", "комплектующие", "автозапчасти", "инструменты",
  "промышленное оборудование", "спецтехника", "расходные материалы",
  "текстиль", "товары для дома", "упаковка", "производственные компоненты",
  "запчасти", "светильники", "кабель", "провод", "насос", "компрессор",
  "станок", "генератор", "трансформатор", "котел", "радиатор",
];
