export type DocumentType =
  | "invoice"
  | "contract"
  | "act"
  | "invoice_import"
  | "packing_list"
  | "power_attorney";

export interface CompanyInfo {
  company_name: string;
  inn: string;
  ogrnip: string;
  bank_account: string;
  bank_name: string;
  bik: string;
  bank_corr: string;
  address: string;
  phone: string;
  email: string;
  director: string;
}

export const DEFAULT_COMPANY: CompanyInfo = {
  company_name: "ИП Попков Виталий Михайлович",
  inn: "280114439648",
  ogrnip: "",
  bank_account: "",
  bank_name: "",
  bik: "",
  bank_corr: "",
  address: "Россия, г. Благовещенск",
  phone: "",
  email: "info@chinabridge.pro",
  director: "Попков Виталий Михайлович",
};

export interface DocumentMeta {
  id?: number;
  lead_id: string;
  document_type: DocumentType;
  document_number: string;
  created_at?: string;
  status: "draft" | "sent" | "signed";
  file_url?: string;
}

export const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  invoice:         "Счёт на оплату",
  contract:        "Договор оказания услуг",
  act:             "Акт выполненных работ",
  invoice_import:  "Инвойс (международный)",
  packing_list:    "Упаковочный лист",
  power_attorney:  "Доверенность",
};

export const DOC_TYPE_ICONS: Record<DocumentType, string> = {
  invoice:         "🧾",
  contract:        "📝",
  act:             "✅",
  invoice_import:  "🌐",
  packing_list:    "📦",
  power_attorney:  "🔏",
};

export const DOC_STATUS_LABELS: Record<string, string> = {
  draft:  "Создан",
  sent:   "Отправлен",
  signed: "Подписан",
};

export const DOC_STATUS_COLORS: Record<string, string> = {
  draft:  "text-slate-400 bg-slate-800 border-slate-700",
  sent:   "text-blue-400 bg-blue-500/10 border-blue-500/30",
  signed: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
};

export const CURRENCY_SYMBOLS_DOC: Record<string, string> = {
  USD: "$", RUB: "₽", CNY: "¥", KZT: "₸",
};

/** All info needed to render any document PDF */
export interface DocRenderData {
  company: CompanyInfo;
  document_number: string;
  document_date: string;
  // Client
  client_name: string;
  client_inn?: string;
  client_phone?: string;
  client_email?: string;
  client_address?: string;
  client_company?: string;
  // Cargo
  product: string;
  quantity?: string;
  weight?: number;
  volume?: number;
  route?: string;
  packaging?: string;
  // Financial
  goods_cost: number;
  delivery_cost: number;
  services_cost: number;
  bank_fee: number;
  customs_cost: number;
  client_price: number;
  currency: string;
  // Meta
  lead_id: string;
  manager?: string;
}
