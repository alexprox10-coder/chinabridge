export type OrderStatus =
  | "NEW"
  | "CALCULATION"
  | "PROPOSAL_SENT"
  | "WAITING_PAYMENT"
  | "PURCHASE"
  | "INSPECTION"
  | "CONSOLIDATION"
  | "IN_TRANSIT"
  | "CUSTOMS"
  | "DELIVERED"
  | "COMPLETED";

export type ClientRole = "CLIENT" | "MANAGER" | "ADMIN";
export type DocumentType = "CONTRACT" | "INVOICE" | "CUSTOMS" | "DELIVERY" | "INSPECTION" | "OTHER";
export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID";

export const ORDER_STATUSES: OrderStatus[] = [
  "NEW", "CALCULATION", "PROPOSAL_SENT", "WAITING_PAYMENT",
  "PURCHASE", "INSPECTION", "CONSOLIDATION", "IN_TRANSIT",
  "CUSTOMS", "DELIVERED", "COMPLETED",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "Новая заявка",
  CALCULATION: "Расчёт",
  PROPOSAL_SENT: "КП отправлено",
  WAITING_PAYMENT: "Ожидание оплаты",
  PURCHASE: "Закупка",
  INSPECTION: "Инспекция",
  CONSOLIDATION: "Консолидация",
  IN_TRANSIT: "В пути",
  CUSTOMS: "Таможня",
  DELIVERED: "Доставлено",
  COMPLETED: "Выполнено",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, { badge: string; dot: string }> = {
  NEW: { badge: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  CALCULATION: { badge: "bg-yellow-50 text-yellow-700 border-yellow-200", dot: "bg-yellow-500" },
  PROPOSAL_SENT: { badge: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  WAITING_PAYMENT: { badge: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
  PURCHASE: { badge: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500" },
  INSPECTION: { badge: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-500" },
  CONSOLIDATION: { badge: "bg-cyan-50 text-cyan-700 border-cyan-200", dot: "bg-cyan-500" },
  IN_TRANSIT: { badge: "bg-sky-50 text-sky-700 border-sky-200", dot: "bg-sky-500" },
  CUSTOMS: { badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  DELIVERED: { badge: "bg-teal-50 text-teal-700 border-teal-200", dot: "bg-teal-500" },
  COMPLETED: { badge: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
};

export const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  CONTRACT: "Договор",
  INVOICE: "Счёт / Инвойс",
  CUSTOMS: "Таможенные документы",
  DELIVERY: "Транспортные документы",
  INSPECTION: "Акт инспекции",
  OTHER: "Прочее",
};

export interface ClientAccount {
  id: number;
  client_id: string;
  email: string;
  password_hash: string;
  name: string;
  company?: string;
  phone?: string;
  telegram?: string;
  inn?: string;
  country?: string;
  role: ClientRole;
  status: "ACTIVE" | "INACTIVE" | "DELETED";
  created_at: string;
  updated_at: string;
}

export interface ClientOrder {
  id: number;
  order_id: string;
  client_id: string;
  title: string;
  product_description?: string;
  status: OrderStatus;
  product_cost?: number;
  logistics_cost?: number;
  customs_cost?: number;
  total_cost?: number;
  currency?: string;
  payment_status?: PaymentStatus;
  cargo_weight?: number;
  cargo_volume?: number;
  cargo_type?: string;
  origin_country?: string;
  destination_city?: string;
  estimated_delivery?: string;
  actual_delivery?: string;
  manager_name?: string;
  manager_telegram?: string;
  inspection_photos?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderTracking {
  id: number;
  order_id: string;
  status: OrderStatus;
  description: string;
  location?: string;
  timestamp: string;
  created_at: string;
}

export interface ClientDocument {
  id: number;
  order_id: string;
  client_id: string;
  name: string;
  file_url: string;
  doc_type: DocumentType;
  created_at: string;
}

export interface ClientMessage {
  id: number;
  order_id?: string;
  client_id: string;
  author_role: "CLIENT" | "MANAGER";
  author_name: string;
  text: string;
  is_read: boolean;
  created_at: string;
}

export interface SessionPayload {
  clientId: string;
  email: string;
  role: ClientRole;
  name: string;
}
