export type CargoCategory =
  | 'Оборудование'
  | 'Автозапчасти'
  | 'Электроника'
  | 'Одежда'
  | 'Мебель'
  | 'Товары для дома'
  | 'Другое';

export type ServiceType =
  | 'delivery_only'
  | 'supplier_search'
  | 'buyout'
  | 'inspection'
  | 'full_service';

export type CargoType = 'consolidation' | 'container' | 'air' | 'special';

export interface DeliveryCalculation {
  id: string;
  created_at: string;
  client: {
    name: string;
    phone: string;
    telegram: string;
    email: string;
  };
  cargo: {
    product_name: string;
    category: string;
    product_link: string;
    quantity: string;
    weight_kg: string;
    volume_m3: string;
    packages_count: string;
  };
  route: {
    country_from: string;
    city_from: string;
    country_to: string;
    city_to: string;
  };
  service_type: ServiceType;
  source: 'delivery_calculator';
}

export interface CalculatorFormData {
  // Step 1
  product_name: string;
  category: string;
  product_link: string;
  quantity: string;
  // Step 2
  weight_kg: string;
  volume_m3: string;
  packages_count: string;
  // Step 3
  country_from: string;
  city_from: string;
  country_to: string;
  city_to: string;
  // Step 4
  service_type: string;
  // Step 5
  name: string;
  phone: string;
  telegram: string;
  email: string;
}

export interface EconomicsResult {
  quantity: number;
  unit_price_rub: number;
  purchase_total_rub: number;
  delivery_total_rub: number;
  customs_rub: number;
  marketplace_logistics_rub: number;
  tax_rub: number;
  other_costs_rub: number;
  total_cost_rub: number;
  unit_cost_rub: number;
  sale_price_rub: number;
  gross_revenue_rub: number;
  marketplace_fee_rub: number;
  ad_cost_rub: number;
  net_profit_rub: number;
  margin_pct: number;
  roi_pct: number;
  verdict: "green" | "yellow" | "red";
  verdict_emoji: string;
  verdict_label: string;
  ai_analysis?: string;
  cny_rate: number;
  usd_rate: number;
  // Extended
  product_score?: ProductScore;
  target_price?: TargetPrice;
  scenarios?: EconomicsScenario[];
  supplier_risk?: SupplierRiskResult;
}

export interface EconomicsScenario {
  name: 'conservative' | 'base' | 'optimistic';
  label: string;
  sale_price_rub: number;
  unit_cost_rub: number;
  net_profit_rub: number;
  margin_pct: number;
  roi_pct: number;
  verdict: 'green' | 'yellow' | 'red';
}

export interface ProductScore {
  total: number;
  margin_score: number;
  roi_score: number;
  price_score: number;
  logistics_score: number;
  supplier_score: number;
  moq_score: number;
  label: string;
  explanation: string;
}

export interface TargetPrice {
  max_purchase_price_cny: number;
  max_purchase_price_rub: number;
  min_sale_price_rub: number;
  target_margin_pct: number;
  current_is_achievable: boolean;
}

export type SupplierRisk = 'low' | 'medium' | 'high';

export interface SupplierRiskResult {
  level: SupplierRisk;
  emoji: string;
  label: string;
  factors: string[];
}

export interface CalculatorResult {
  ok: boolean;
  cargo_type?: CargoType;
  priority?: string;
  reason?: string;
  lead_id?: string;
  error?: string;
  // Rate Engine
  delivery_cost?: number;
  delivery_days_min?: number;
  delivery_days_max?: number;
  rate_currency?: string;
  // Cost Engine (Smart Pricing)
  pricing_rule?: string;
  markup_percent?: number;
  profit?: number;
  margin_percent?: number;
  // AI Economics (optional)
  economics?: EconomicsResult;
  rate_limit_remaining?: number;
}

export const CARGO_TYPE_LABELS: Record<CargoType, string> = {
  consolidation: 'Сборный груз (LCL)',
  container: 'Контейнер (FCL)',
  air: 'Авиадоставка',
  special: 'Спецперевозка',
};

export const CARGO_TYPE_ICONS: Record<CargoType, string> = {
  consolidation: '📦',
  container: '🚢',
  air: '✈️',
  special: '🏗️',
};

export const SERVICE_LABELS: Record<ServiceType, string> = {
  delivery_only: 'Только доставка',
  supplier_search: 'Поиск поставщика',
  buyout: 'Выкуп товара',
  inspection: 'Инспекция качества',
  full_service: 'Полный сервис',
};

export const SERVICE_DESCRIPTIONS: Record<ServiceType, string> = {
  delivery_only: 'Поставщик уже есть, нужна доставка',
  supplier_search: 'Найдем надежного производителя',
  buyout: 'Выкупим товар с 1688/Taobao',
  inspection: 'Проверим качество перед отправкой',
  full_service: 'Всё под ключ: поиск, выкуп, доставка',
};
