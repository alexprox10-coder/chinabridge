export type PartnerRole = "PARTNER" | "MANAGER" | "ADMIN";
export type TaskType = "SEARCH" | "BUYOUT" | "INSPECTION";
export type TaskStatus = "NEW" | "IN_PROGRESS" | "WAITING_REPLY" | "COMPLETED";
export type Lang = "ru" | "zh";

export interface PartnerAccount {
  id: number;
  partner_id: string;
  email: string;
  password_hash: string;
  name_ru: string;
  name_cn: string;
  company: string;
  country: string;
  city: string;
  phone: string;
  wechat: string;
  language: Lang;
  role: PartnerRole;
  status: "ACTIVE" | "INACTIVE";
  created_at: string;
}

export interface PartnerTask {
  id: number;
  task_id: string;
  partner_id: string;
  type: TaskType;
  status: TaskStatus;
  product_display: string;
  quantity: number;
  quantity_unit: string;
  deadline_hours: number;
  description?: string;
  response_product_name?: string;
  response_price_usd?: string;
  response_moq?: string;
  response_factory?: string;
  response_production_time?: string;
  response_in_stock?: string;
  response_comment?: string;
  response_photos?: string;
  response_factory_photos?: string;
  response_video_url?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface PartnerSession {
  partnerId: string;
  email: string;
  role: PartnerRole;
  name: string;
  language: Lang;
}
