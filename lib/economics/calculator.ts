import { calculateCostBreakdown } from '@/lib/cost-engine';
import type { EconomicsResult } from '@/lib/calculator/types';

const CNY_RATE = () => Number(process.env.CNY_TO_RUB ?? '12.5');
const USD_RATE = () => Number(process.env.USD_TO_RUB ?? '92');

export interface EconomicsInput {
  unitPrice: number;
  priceCurrency: 'CNY' | 'USD';
  salePrice: number;
  quantity: number;
  commissionPct: number;
  adSpend?: number;
  otherCosts?: number;
  cityTo?: string;
  countryTo?: string;
  weightKg?: number;
  productName?: string;
}

export interface EconomicsOutput {
  economics: EconomicsResult;
  delivery: {
    hasRate: boolean;
    deliveryRub: number;
    deliveryCost?: number;
    currency?: string;
    daysMin?: number;
    daysMax?: number;
    pricingRule?: string;
  };
  priority: 'HOT' | 'WARM' | 'COLD';
}

export async function calculateUnitEconomics(input: EconomicsInput): Promise<EconomicsOutput> {
  const cnyRate = CNY_RATE();
  const usdRate = USD_RATE();

  const {
    unitPrice,
    priceCurrency,
    salePrice,
    quantity,
    commissionPct,
    adSpend = 0,
    otherCosts = 0,
    cityTo = '',
    countryTo = 'Russia',
    weightKg,
  } = input;

  const qty = Math.max(1, quantity);

  // Try rate engine (best-effort)
  const cost = await calculateCostBreakdown({
    country_from: 'China',
    city_from: '',
    country_to: countryTo,
    city_to: cityTo,
    weight: weightKg,
  }).catch(() => null);

  const hasRate = !!(cost && cost.sale_price > 0);
  const deliveryRub = hasRate
    ? cost!.currency === 'RUB' ? cost!.sale_price
    : cost!.currency === 'CNY' ? cost!.sale_price * cnyRate
    : cost!.sale_price * usdRate
    : 0;

  // P&L
  const unitPriceRub     = unitPrice * (priceCurrency === 'CNY' ? cnyRate : usdRate);
  const purchaseTotalRub = unitPriceRub * qty;
  const customsRub       = purchaseTotalRub * 0.20;
  const totalCostRub     = purchaseTotalRub + deliveryRub + customsRub + otherCosts;
  const unitCostRub      = totalCostRub / qty;
  const grossRevenue     = salePrice * qty;
  const marketplaceFee   = grossRevenue * (commissionPct / 100);
  const netProfit        = grossRevenue - totalCostRub - marketplaceFee - adSpend;
  const marginPct        = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
  const roiPct           = totalCostRub > 0 ? (netProfit / totalCostRub) * 100 : 0;

  const verdict      = marginPct >= 25 ? 'green'  as const : marginPct >= 10 ? 'yellow' as const : 'red' as const;
  const verdictEmoji = marginPct >= 25 ? '🟢' : marginPct >= 10 ? '🟡' : '🔴';
  const verdictLabel = marginPct >= 25 ? 'Перспективная' : marginPct >= 10 ? 'Требует проверки' : 'Слабая экономика';
  const priority     = marginPct >= 25 ? 'HOT' as const : marginPct >= 10 ? 'WARM' as const : 'COLD' as const;

  const economics: EconomicsResult = {
    quantity:            qty,
    unit_price_rub:      Math.round(unitPriceRub),
    purchase_total_rub:  Math.round(purchaseTotalRub),
    delivery_total_rub:  Math.round(deliveryRub),
    customs_rub:         Math.round(customsRub),
    other_costs_rub:     Math.round(otherCosts),
    total_cost_rub:      Math.round(totalCostRub),
    unit_cost_rub:       Math.round(unitCostRub),
    sale_price_rub:      salePrice,
    gross_revenue_rub:   Math.round(grossRevenue),
    marketplace_fee_rub: Math.round(marketplaceFee),
    ad_cost_rub:         Math.round(adSpend),
    net_profit_rub:      Math.round(netProfit),
    margin_pct:          Math.round(marginPct * 10) / 10,
    roi_pct:             Math.round(roiPct * 10) / 10,
    verdict,
    verdict_emoji:       verdictEmoji,
    verdict_label:       verdictLabel,
    cny_rate:            cnyRate,
    usd_rate:            usdRate,
  };

  return {
    economics,
    priority,
    delivery: {
      hasRate,
      deliveryRub: Math.round(deliveryRub),
      deliveryCost:  hasRate ? cost!.sale_price    : undefined,
      currency:      hasRate ? cost!.currency       : undefined,
      daysMin:       hasRate ? cost!.delivery_days_min : undefined,
      daysMax:       hasRate ? cost!.delivery_days_max : undefined,
      pricingRule:   hasRate ? cost!.selected_rule_name : undefined,
    },
  };
}
