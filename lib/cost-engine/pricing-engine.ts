import { calculateDeliveryCost } from '@/lib/rate-engine/rate-calculator';
import { selectPricingRule } from './pricing-selector';
import { calculateMargin } from '@/lib/rate-engine/margin-calculator';
import { listRows, TABLE_IDS } from '@/lib/rate-engine/db';
import type { CalculationInput } from '@/lib/rate-engine/types';
import type { PricingRule } from '@/lib/rate-engine/types';
import type { CostBreakdown, PricingSelectorInput } from './types';

export type CostEngineInput = CalculationInput & Pick<PricingSelectorInput, 'customer_type' | 'cargo_type'>;

export async function calculateCostBreakdown(input: CostEngineInput): Promise<CostBreakdown | null> {
  // Load pricing_rules and rate data in parallel — avoids a second sequential n8n round-trip
  const [rateResult, pricingRules] = await Promise.all([
    calculateDeliveryCost(input).catch(() => null),
    listRows<PricingRule>(TABLE_IDS.pricing_rules).catch(() => [] as PricingRule[]),
  ]);
  if (!rateResult || !rateResult.matched_rate_id) return null;

  // carrier_cost = raw rate before any DB-level markup rules
  const carrier_cost = rateResult.breakdown.base_cost;

  const selection = await selectPricingRule({
    weight: input.weight,
    customer_type: input.customer_type,
    transport_type: input.transport_type,
    cargo_type: input.cargo_type,
  }, pricingRules);

  const markup = selection.markup_percent;
  const sale_price = Math.round(carrier_cost * (1 + markup / 100) * 100) / 100;

  const { profit, margin_percent } = calculateMargin(sale_price, carrier_cost);

  return {
    carrier_cost,
    sale_price,
    profit,
    margin_percent,
    markup_percent: markup,
    selected_rule_name: selection.selected_rule?.name ?? 'Базовая наценка',
    selection_reason: selection.reason,
    currency: rateResult.currency,
    delivery_days_min: rateResult.delivery_days_min,
    delivery_days_max: rateResult.delivery_days_max,
    matched_rate_id: rateResult.matched_rate_id,
  };
}
