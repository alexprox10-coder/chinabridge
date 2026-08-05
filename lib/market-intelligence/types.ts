// ─── Lead Finder ─────────────────────────────────────────────────────────────

export type MILeadSource = "google" | "yandex" | "telegram" | "vk" | "website" | "manual";
export type MILeadType =
  | "importer" | "wb_seller" | "ozon_seller" | "manufacturer"
  | "wholesaler" | "logistics" | "ved" | "unknown";
export type MILeadTemp = "HOT" | "WARM" | "COLD";
export type MILeadPipeline = "NEW" | "REVIEW" | "CONTACT" | "NEGOTIATION" | "CLIENT" | "LOST";

export const MI_LEAD_TYPE_LABELS: Record<MILeadType, string> = {
  importer:     "Импортёр",
  wb_seller:    "Продавец WB",
  ozon_seller:  "Продавец Ozon",
  manufacturer: "Производство",
  wholesaler:   "Оптовик",
  logistics:    "Логистика",
  ved:          "ВЭД",
  unknown:      "Не определено",
};

export const MI_PIPELINE_LABELS: Record<MILeadPipeline, string> = {
  NEW:         "Новый",
  REVIEW:      "На проверке",
  CONTACT:     "Контакт",
  NEGOTIATION: "Переговоры",
  CLIENT:      "Клиент",
  LOST:        "Отказ",
};

export interface MILead {
  id?: number;
  leadId: string;
  tenantId: string;
  source: MILeadSource;
  sourceUrl?: string;
  sourceChannel?: string;
  company: string;
  contact?: string;
  phone?: string;
  email?: string;
  telegram?: string;
  website?: string;
  city?: string;
  country?: string;
  type: MILeadType;
  temperature: MILeadTemp;
  score: number;
  scoreReason: string;
  description: string;
  nextAction?: string;
  pipeline: MILeadPipeline;
  createdAt: string;
  updatedAt: string;
}

// ─── Market Radar ─────────────────────────────────────────────────────────────

export type RadarType =
  | "telegram_channel" | "telegram_group"
  | "vk_community" | "competitor"
  | "trend" | "supplier" | "opportunity";

export const RADAR_TYPE_LABELS: Record<RadarType, string> = {
  telegram_channel: "Telegram-канал",
  telegram_group:   "Telegram-группа",
  vk_community:     "VK сообщество",
  competitor:       "Конкурент",
  trend:            "Тренд",
  supplier:         "Поставщик",
  opportunity:      "Возможность",
};

export interface MIRadarSignal {
  id?: number;
  signalId: string;
  tenantId: string;
  type: RadarType;
  name: string;
  description?: string;
  url?: string;
  subscribers?: number;
  growth?: number;
  activity?: string;
  country?: string;
  opportunityScore: number;
  aiAnalysis?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Deal Intelligence ────────────────────────────────────────────────────────

export interface DealScore {
  leadId: number;
  leadDbId: string;
  company: string;
  product: string;
  status: string;
  priority: string;
  estimatedValue: number;
  score: number;
  winProbability: number;
  expectedRevenue: number;
  estimatedMargin: number;
  decisionDate?: string;
  nextAction: string;
  reasons: string[];
  risk: "low" | "medium" | "high";
  alert?: "stale" | "closing" | "urgent" | "hot";
  daysInStatus: number;
  manager?: string;
}

export interface RevenueForecast {
  d7:  number;
  d30: number;
  d90: number;
}

export interface DealIntelligenceResult {
  deals: DealScore[];
  topDeals: DealScore[];
  urgentDeals: DealScore[];
  staleDeals: DealScore[];
  forecast: RevenueForecast;
  totalPipeline: number;
  avgScore: number;
}

// ─── Daily Report ─────────────────────────────────────────────────────────────

export interface MIDailyReport {
  id?: number;
  tenantId: string;
  reportId: string;
  date: string;
  leadsFound: number;
  leadsGoogle: number;
  leadsTelegram: number;
  leadsVk: number;
  hotLeads: number;
  newCompanies: number;
  newTelegramChannels: number;
  newVkCommunities: number;
  topDealCompany?: string;
  topDealScore?: number;
  topDealProbability?: number;
  topDealRevenue?: number;
  trendOfWeek?: string;
  trendGrowth?: number;
  recommendations: string[];
  fullText: string;
  createdAt: string;
}
