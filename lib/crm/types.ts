export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "QUALIFICATION"
  | "CALCULATION"
  | "OFFER_SENT"
  | "NEGOTIATION"
  | "PAYMENT"
  | "DELIVERY"
  | "SUCCESS"
  | "LOST";

export type LeadPriority = "HOT" | "WARM" | "COLD";

export const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "Новый",
  CONTACTED: "Связались",
  QUALIFICATION: "Квалификация",
  CALCULATION: "Расчёт",
  OFFER_SENT: "КП отправлено",
  NEGOTIATION: "Переговоры",
  PAYMENT: "Оплата",
  DELIVERY: "Доставка",
  SUCCESS: "Сделка",
  LOST: "Отказ",
};

export const STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  CONTACTED: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  QUALIFICATION: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  CALCULATION: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  OFFER_SENT: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  NEGOTIATION: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  PAYMENT: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  DELIVERY: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  SUCCESS: "bg-green-500/20 text-green-300 border-green-500/30",
  LOST: "bg-red-500/20 text-red-300 border-red-500/30",
};

export const PRIORITY_COLORS: Record<LeadPriority, string> = {
  HOT: "bg-red-500/20 text-red-300 border-red-500/30",
  WARM: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  COLD: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

export const PRIORITY_EMOJI: Record<LeadPriority, string> = {
  HOT: "🔥",
  WARM: "🌡️",
  COLD: "❄️",
};

export interface CRMLead {
  // n8n row ID (auto-generated)
  id: number;
  // Custom fields
  lead_id: string;
  created_at: string;
  updated_at: string;
  // Client
  name: string;
  phone: string;
  telegram: string;
  email: string;
  company: string;
  // Product
  product: string;
  product_link: string;
  category: string;
  quantity: string;
  weight: string;
  volume: string;
  // Logistics
  country_destination: string;
  city_destination: string;
  delivery_type: string;
  service_type: string;
  // Sales
  status: LeadStatus;
  priority: LeadPriority;
  estimated_value: number;
  manager: string;
  comment: string;
  // Source
  source: string;
  utm_source: string;
  utm_campaign: string;
  // Cost Engine (optional — present when rate was calculated)
  delivery_cost?: number;
  carrier_cost?: number;
  markup_percent?: number;
  profit?: number;
  margin_percent?: number;
  pricing_rule?: string;
}

export type LeadUpdate = Partial<Pick<CRMLead, "status" | "priority" | "manager" | "comment" | "estimated_value">>;
