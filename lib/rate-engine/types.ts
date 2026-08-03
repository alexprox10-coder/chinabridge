export type TransportType = 'air' | 'rail' | 'truck' | 'sea' | 'express';
export type CargoType = 'general' | 'fragile' | 'dangerous' | 'oversized';
export type RateType = 'KG' | 'CBM' | 'BOX' | 'FIXED';
export type Currency = 'USD' | 'CNY' | 'RUB' | 'KZT';
export type PriceType = 'FIXED' | 'PERCENT';
export type RuleType = 'margin' | 'discount' | 'markup';
export type ItemStatus = 'active' | 'inactive';
export type RateSource = 'MARKET' | 'PARTNER' | 'MANUAL';
export type CustomerType = 'B2C' | 'SMALL_BUSINESS' | 'BUSINESS' | 'VIP';

export interface ShippingRate {
  id?: number;
  carrier_name: string;
  transport_type: TransportType;
  route_id?: string;
  cargo_type: CargoType;
  rate_type: RateType;
  price_value: number;
  currency: Currency;
  min_weight?: number;
  max_weight?: number;
  min_volume?: number;
  max_volume?: number;
  delivery_days_min?: number;
  delivery_days_max?: number;
  status: ItemStatus;
  rate_source?: RateSource;
  created_at?: string;
  updated_at?: string;
}

export interface Route {
  id?: number;
  country_from: string;
  city_from: string;
  country_to: string;
  city_to: string;
  transport_type: TransportType;
  delivery_days_min?: number;
  delivery_days_max?: number;
  status: ItemStatus;
  created_at?: string;
}

export interface AdditionalService {
  id?: number;
  name: string;
  description?: string;
  price_type: PriceType;
  price_value: number;
  currency: Currency;
  status: ItemStatus;
}

export interface PricingRule {
  id?: number;
  name: string;
  rule_type: RuleType;
  value: number;
  status: ItemStatus;
  // Smart pricing selectors (optional — null means "match any")
  min_weight?: number;
  max_weight?: number;
  customer_type?: CustomerType;
  transport_type?: TransportType;
  cargo_type?: CargoType;
  priority?: number;
}

export interface RateCalculationRecord {
  id?: number;
  lead_id?: string;
  route_id?: string;
  rate_id?: string;
  cargo_weight?: number;
  cargo_volume?: number;
  transport_cost: number;
  additional_cost: number;
  total_cost: number;
  currency: Currency;
  created_at?: string;
}

export interface CalculationInput {
  country_from?: string;
  city_from?: string;
  country_to: string;
  city_to: string;
  transport_type?: TransportType;
  weight?: number;
  volume?: number;
  packages?: number;
  service_ids?: number[];
  currency?: Currency;
  lead_id?: string;
}

export interface CalculationResult {
  transport_cost: number;
  additional_cost: number;
  total_cost: number;
  currency: Currency;
  delivery_days_min?: number;
  delivery_days_max?: number;
  matched_rate_id?: number;
  applied_service_ids?: number[];
  breakdown: {
    base_cost: number;
    services: Array<{ name: string; cost: number }>;
  };
}

export interface MarginResult {
  sale_price: number;
  cost_price: number;
  profit: number;
  margin_percent: number;
}

export const TRANSPORT_LABELS: Record<TransportType, string> = {
  air: 'Авиа',
  rail: 'ЖД',
  truck: 'Авто',
  sea: 'Море',
  express: 'Экспресс',
};

export const CARGO_LABELS: Record<CargoType, string> = {
  general: 'Обычный',
  fragile: 'Хрупкий',
  dangerous: 'Опасный',
  oversized: 'Негабарит',
};

export const RATE_TYPE_LABELS: Record<RateType, string> = {
  KG: 'за кг',
  CBM: 'за м³',
  BOX: 'за место',
  FIXED: 'фиксированная',
};
