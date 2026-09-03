import type {
  ShippingRate, Route, AdditionalService, PricingRule,
  CalculationInput, CalculationResult, RateCalculationRecord,
} from './types';
import { listRows, createRow, TABLE_IDS } from './db';
import { matchRoute, matchRate, getDefaultTransportType } from './route-matcher';

// Air/express: 1 m³ = 200 kg (L×W×H / 5000 cm³ rule)
// Road/rail/sea: 1 m³ = 167 kg (L×W×H / 6000 cm³ rule)
function computeChargeableWeight(actualKg: number, volumeM3: number, transport_type?: string): number {
  if (!volumeM3 || volumeM3 <= 0) return actualKg;
  const kgPerM3 = (transport_type === 'air' || transport_type === 'express') ? 200 : 167;
  return Math.max(actualKg, volumeM3 * kgPerM3);
}

function calcBaseCost(rate: ShippingRate, input: CalculationInput, transport_type?: string): number {
  const { rate_type, price_value } = rate;
  switch (rate_type) {
    case 'KG': {
      const chargeable = computeChargeableWeight(input.weight ?? 0, input.volume ?? 0, transport_type);
      return chargeable * price_value;
    }
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

function applyRules(cost: number, rules: PricingRule[], weight?: number): number {
  // Apply only the single best-matching rule for the cargo weight.
  // Skipping customer_type-specific rules (VIP etc.) since input has no customer context.
  const matching = rules
    .filter(r => r.status === 'active' && !r.customer_type)
    .filter(r => {
      if (!weight) return true;
      const aboveMin = !r.min_weight || r.min_weight === 0 || weight >= r.min_weight;
      const belowMax = !r.max_weight || r.max_weight >= 999999 || weight <= r.max_weight;
      return aboveMin && belowMax;
    })
    .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));

  const rule = matching[0];
  if (!rule) return Math.round(cost * 100) / 100;

  let result = cost;
  if (rule.rule_type === 'margin' || rule.rule_type === 'markup') {
    result = cost * (1 + rule.value / 100);
  } else if (rule.rule_type === 'discount') {
    result = cost * (1 - rule.value / 100);
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
  if (transport_type === 'sea' && matchedRate?.rate_type === 'FIXED') {
    // FCL rates ($4250/$6500) apply only to full containers (≥5 CBM or ≥2000 kg).
    // For smaller cargo, estimate LCL (сборный): max($2.5/kg, $150/CBM), min $200.
    const vol = input.volume ?? 0;
    const wt = computeChargeableWeight(input.weight ?? 0, vol, transport_type);
    const isFCL = vol >= 5 || wt >= 2000;
    if (isFCL) {
      baseCost = calcBaseCost(matchedRate, input, transport_type);
    } else {
      baseCost = Math.max(200, Math.max(wt * 2.5, vol * 150));
    }
  } else if (matchedRate) {
    baseCost = calcBaseCost(matchedRate, input, transport_type);
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

  const transport_cost = applyRules(baseCost, rules, input.weight);
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
