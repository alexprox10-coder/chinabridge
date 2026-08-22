export type LeadSource =
  | "website_form" | "website_chat" | "api" | "LEAD_MAGNET_FREE" | "telegram_bot"
  | "kaspi_landing" | "vk_kz" | "VK-KZ" | "lp_kz" | "b2bchina_landing"
  | "wb_landing" | "supplier_landing" | "kz_import_landing" | "phone_click";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  telegram?: string;
  product: string;
  link?: string;
  weight?: string;
  volume?: string;
  from_city?: string;
  to_city?: string;
  service?: string;
  source: LeadSource;
  created_at: string;
}

// What the client sends — id and created_at generated server-side
export type LeadInput = Omit<Lead, "id" | "created_at">;

export interface LeadApiResponse {
  ok: true;
  id: string;
}

export interface LeadApiError {
  ok: false;
  error: string;
  details?: Record<string, string>;
}
