import type {
  ShippingRate, Route, AdditionalService, PricingRule,
  CalculationInput, CalculationResult, RateCalculationRecord,
} from './types';
import { listRows, createRow, TABLE_IDS } from './db';
import { matchRoute, matchRate, getDefaultTransportType } from './route-matcher';

function calcBaseCost(rate: ShippingRate, input: CalculationInput): number {
  const { rate_type, price_value } = rate;
  switch (rate_type) {
    case 'KG':
      return (input.weight ?? 0) * price_value;
    case 'CBM':
      return (input.volume ?? 0) * price_value;
    case 'BOX':
      return (input.packages ?? 1) * price_value;
    case 'FIXED':
      return price_value;
    default:
      return price_value;
  }
}

function calcServiceCost(
  service: AdditionalService,
  baseCost: number,
): number {
  if (service.price_type === 'PERCENT') {
    return (baseCost * service.price_value) / 100;
  }
  return service.price_value;
}

function applyRules(cost: number, rules: PricingRule[]): number {
  let result = cost;
  const active = rules.filter(r => r.status === 'active');
  for (const rule of active) {
    if (rule.rule_type === 'margin' || rule.rule_type === 'markup') {
      result = result * (1 + rule.value / 100);
    } else if (rule.rule_type === 'discount') {
      result = result * (1 - rule.value / 100);
    }
  }
  return Math.round(result * 100) / 100;
}

export async function calculateDeliveryCost(input: CalculationInput): Promise<CalculationResult> {
  const [rates, routes, services, rules] = await Promise.all([
    listRows<ShippingRate>(TABLE_IDS.shipping_rates),
    listRows<Route>(TABLE_IDS.routes),
    listRows<AdditionalService>(TABLE_IDS.additional_services),
    listRows<PricingRule>(TABLE_IDS.pricing_rules),
  ]);

  const transport_type = input.transport_type ?? getDefaultTransportType(input.weight, input.volume);
  const matchedRoute = matchRoute(routes, { ...input, transport_type });
  const matchedRate = matchRate(rates, { ...input, transport_type, route: matchedRoute ?? undefined });

  const currency = input.currency ?? matchedRate?.currency ?? 'USD';

  // Base transport cost
  let baseCost = 0;
  if (matchedRate) {
    baseCost = calcBaseCost(matchedRate, input);
  }

  // Additional services
  const appliedServices: Array<{ name: string; cost: number }> = [];
  let additionalCost = 0;

  if (input.service_ids?.length) {
    const selectedServices = services.filter(
      s => s.status === 'active' && input.service_ids!.includes(s.id!),
    );
    for (const svc of selectedServices) {
      const cost = calcServiceCost(svc, baseCost);
      additionalCost += cost;
      appliedServices.push({ name: svc.name, cost });
    }
  }

  const transport_cost = applyRules(baseCost, rules);
  const total_cost = Math.round((transport_cost + additionalCost) * 100) / 100;

  const delivery_days_min = matchedRoute?.delivery_days_min ?? matchedRate?.delivery_days_min;
  const delivery_days_max = matchedRoute?.delivery_days_max ?? matchedRate?.delivery_days_max;

  return {
    transport_cost,
    additional_cost: Math.round(additionalCost * 100) / 100,
    total_cost,
    currency,
    delivery_days_min,
    delivery_days_max,
    matched_rate_id: matchedRate?.id,
    applied_service_ids: input.service_ids,
    breakdown: {
      base_cost: Math.round(baseCost * 100) / 100,
      services: appliedServices,
    },
  };
}

export async function saveCalculation(
  result: CalculationResult,
  input: CalculationInput,
): Promise<RateCalculationRecord> {
  const record = {
    lead_id: input.lead_id ?? '',
    route_id: '',
    rate_id: String(result.matched_rate_id ?? ''),
    cargo_weight: input.weight ?? 0,
    cargo_volume: input.volume ?? 0,
    transport_cost: result.transport_cost,
    additional_cost: result.additional_cost,
    total_cost: result.total_cost,
    currency: result.currency,
    created_at: new Date().toISOString(),
  };
  return createRow<RateCalculationRecord>(TABLE_IDS.rate_calculations, record);
}
