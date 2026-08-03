import type { PricingRule, CustomerType, TransportType, CargoType, Currency } from '@/lib/rate-engine/types';

export type { CustomerType };

export interface PricingSelectorInput {
  weight?: number;
  customer_type?: CustomerType;
  transport_type?: TransportType;
  cargo_type?: CargoType;
}

export interface PricingSelection {
  selected_rule: PricingRule | null;
  markup_percent: number;
  reason: string;
}

export interface CostBreakdown {
  carrier_cost: number;
  sale_price: number;
  profit: number;
  margin_percent: number;
  markup_percent: number;
  selected_rule_name: string;
  selection_reason: string;
  currency: Currency;
  delivery_days_min?: number;
  delivery_days_max?: number;
  matched_rate_id?: number;
}
