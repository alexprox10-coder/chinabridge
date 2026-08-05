export type OperationsStatus = "GOOD" | "WARNING" | "CRITICAL";
export type RiskLevel = "HIGH" | "MEDIUM" | "LOW";
export type DealStatus =
  | "NEW" | "PURCHASE" | "CHINA_WAREHOUSE" | "SHIPPING" | "CUSTOMS" | "DELIVERED";
export type DocStatus = "READY" | "MISSING" | "PENDING" | "EXPIRED";
export type DocType =
  | "INVOICE" | "PACKING_LIST" | "CONTRACT" | "CERTIFICATE" | "CUSTOMS_DECL";

// ── Core entities ──────────────────────────────────────────────────────────

export interface Deal {
  id: string;
  clientName: string;
  supplierName: string;
  product: string;
  status: DealStatus;
  weight: number;
  route: string;
  eta: number;
  value: number;
  startDate: string;
  riskLevel: RiskLevel;
  notes?: string;
}

export interface Partner {
  id: string;
  name: string;
  city: string;
  status: "ACTIVE" | "AT_RISK" | "INACTIVE";
  ordersCount: number;
  avgDeliveryDays: number;
  rating: number;
  lastContactDays: number;
  responseTime: string;
  aiAnalysis: string;
  recommendation: string;
}

export interface CargoItem {
  id: string;
  dealId: string;
  clientName: string;
  product: string;
  weight: number;
  route: string;
  status: DealStatus;
  eta: number;
  value: number;
  carrier: string;
  riskLevel: RiskLevel;
}

export interface DocumentRecord {
  id: string;
  type: DocType;
  dealId: string;
  clientName: string;
  product: string;
  status: DocStatus;
  riskLevel: RiskLevel;
  action: string;
}

export interface ClientRecord {
  id: string;
  name: string;
  status: "ACTIVE" | "AT_RISK" | "CHURNED";
  lastContactDays: number;
  satisfaction: number;
  repeatOrders: number;
  activeDeals: number;
  recommendation: string;
  riskLevel: RiskLevel;
}

export interface RiskAlert {
  id: string;
  type:
    | "SUPPLIER_DELAY"
    | "SHIPPING_COST"
    | "MISSING_DOCS"
    | "CLIENT_UNHAPPY"
    | "PAYMENT_OVERDUE"
    | "CUSTOMS_HOLD";
  title: string;
  description: string;
  dealId?: string;
  probability: number;
  solution: string;
  priority: RiskLevel;
}

// ── Aggregates ─────────────────────────────────────────────────────────────

export interface OperationsKPIs {
  activeDeals: number;
  activeCargo: number;
  inPurchase: number;
  inLogistics: number;
  inCustoms: number;
  delivered: number;
  problems: number;
  avgDeliveryDays: number;
}

export interface OperationsHealth {
  score: number;
  status: OperationsStatus;
  positives: string[];
  risks: string[];
}

export interface OperationsRecommendation {
  id: string;
  text: string;
  priority: RiskLevel;
  department: string;
  deadline: string;
}

export interface OperationsDirectorReport {
  summary: string;
  health: OperationsHealth;
  kpis: OperationsKPIs;
  deals: Deal[];
  partners: Partner[];
  cargos: CargoItem[];
  documents: DocumentRecord[];
  clients: ClientRecord[];
  risks: RiskAlert[];
  recommendations: OperationsRecommendation[];
  topAction: string;
  generatedAt: string;
}
