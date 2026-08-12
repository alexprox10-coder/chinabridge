import { calculateCostBreakdown } from '@/lib/cost-engine';
import type {
  EconomicsResult, EconomicsScenario, ProductScore,
  TargetPrice, SupplierRiskResult,
} from '@/lib/calculator/types';
import { getMarketplace, calcMarketplaceLogisticsPerUnit } from './marketplaces';

const CNY_RATE = () => Number(process.env.CNY_TO_RUB ?? '12.5');
const USD_RATE = () => Number(process.env.USD_TO_RUB ?? '92');

export interface EconomicsInput {
  unitPrice:      number;
  priceCurrency:  'CNY' | 'USD';
  salePrice:      number;
  quantity:       number;
  commissionPct?: number;       // если не задан — берётся из marketplaceId
  marketplaceId?: string;       // wb | ozon | kaspi | yandex | shop | opt
  adSpend?:       number;       // ₽ на партию
  otherCosts?:    number;       // ₽ на партию
  cityTo?:        string;
  countryTo?:     string;
  weightKg?:      number;
  productName?:   string;
  moq?:           number;       // minimum order quantity поставщика
}

export interface EconomicsOutput {
  economics: EconomicsResult;
  delivery: {
    hasRate:      boolean;
    deliveryRub:  number;
    deliveryCost?: number;
    currency?:    string;
    daysMin?:     number;
    daysMax?:     number;
    pricingRule?: string;
  };
  priority: 'HOT' | 'WARM' | 'COLD';
}

// ── Product Score 0–10 ────────────────────────────────────────────────────────

function computeProductScore(
  marginPct: number,
  roiPct:    number,
  unitPriceRub: number,
  salePrice:    number,
  deliveryRub:  number,
  moq:          number,
): ProductScore {
  // Маржа (0–3)
  const ms = marginPct >= 25 ? 3 : marginPct >= 20 ? 2.5 : marginPct >= 15 ? 2
           : marginPct >= 10 ? 1.5 : marginPct >= 5 ? 0.8 : 0;

  // ROI (0–2)
  const rs = roiPct >= 80 ? 2 : roiPct >= 50 ? 1.5 : roiPct >= 30 ? 1
           : roiPct >= 10 ? 0.5 : 0;

  // Цена закупки / цена продажи (0–1.5) — чем меньше, тем лучше
  const ratio = salePrice > 0 ? unitPriceRub / salePrice : 1;
  const ps = ratio < 0.15 ? 1.5 : ratio < 0.25 ? 1.2 : ratio < 0.35 ? 1
           : ratio < 0.45 ? 0.7 : 0.3;

  // Доставка как % от цены продажи (0–1.5) — чем меньше, тем лучше
  const lratio = salePrice > 0 ? deliveryRub / salePrice : 1;
  const ls = lratio < 0.05 ? 1.5 : lratio < 0.10 ? 1.2 : lratio < 0.15 ? 1
           : lratio < 0.20 ? 0.7 : 0.3;

  // MOQ (0–1)
  const moqs = moq <= 10 ? 1 : moq <= 50 ? 0.8 : moq <= 100 ? 0.6
             : moq <= 500 ? 0.4 : 0.2;

  // Поставщик по умолчанию MEDIUM (данных нет)
  const sups = 0.6;

  const raw   = ms + rs + ps + ls + moqs + sups;
  const total = Math.min(10, Math.round(raw * 10) / 10);

  return {
    total,
    margin_score:    ms,
    roi_score:       rs,
    price_score:     ps,
    logistics_score: ls,
    supplier_score:  sups,
    moq_score:       moqs,
    label: total >= 8 ? 'Отличный товар' : total >= 6 ? 'Хороший потенциал'
         : total >= 4 ? 'Средний товар' : 'Слабая экономика',
    explanation: `Score ${total}: маржа ${marginPct.toFixed(1)}%, ROI ${roiPct.toFixed(0)}%, цена/${salePrice > 0 ? Math.round(ratio * 100) : '?'}% от продажи`,
  };
}

// ── Three Scenarios ───────────────────────────────────────────────────────────

function buildScenario(
  name:         EconomicsScenario['name'],
  baseSaleRub:  number,
  baseUnitCost: number,
  saleMul:      number,
  costMul:      number,
  commissionPct: number,
  adSpend:       number,
  qty:           number,
  mpLogisticsPerUnit: number,
): EconomicsScenario {
  const salePrice   = Math.round(baseSaleRub * saleMul);
  const unitCost    = Math.round(baseUnitCost * costMul);
  const grossRev    = salePrice * qty;
  const totalCost   = unitCost  * qty;
  const mpFee       = grossRev * (commissionPct / 100);
  const mpLog       = mpLogisticsPerUnit * qty;
  const netProfit   = grossRev - totalCost - mpFee - mpLog - adSpend;
  const marginPct   = grossRev > 0 ? (netProfit / grossRev) * 100 : 0;
  const roiPct      = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

  return {
    name,
    label:          name === 'conservative' ? 'Осторожный' : name === 'base' ? 'Базовый' : 'Оптимистичный',
    sale_price_rub: salePrice,
    unit_cost_rub:  unitCost,
    net_profit_rub: Math.round(netProfit),
    margin_pct:     Math.round(marginPct * 10) / 10,
    roi_pct:        Math.round(roiPct * 10) / 10,
    verdict:        marginPct >= 25 ? 'green' : marginPct >= 10 ? 'yellow' : 'red',
  };
}

// ── Target Price ──────────────────────────────────────────────────────────────

function computeTargetPrice(
  unitPrice:    number,
  rate:         number,
  salePrice:    number,
  qty:          number,
  commissionPct: number,
  deliveryRub:  number,
  adSpend:      number,
  mpLogisticsTotal: number,
  priceCurrency: 'CNY' | 'USD',
  targetMargin = 0.25,
): TargetPrice {
  // Для целевой маржи targetMargin:
  // netProfit = grossRev * targetMargin
  // netProfit = S*q - cost - S*q*c/100 - mpLog - ad
  // cost = P*q*r*1.2 + delivery  (где 1.2 = 1 + customs 20%)
  // S*q*(targetMargin) = S*q - P*q*r*1.2 - delivery - S*q*c/100 - mpLog - ad
  // P = [S*q*(1 - targetMargin - c/100) - delivery - mpLog - ad] / (q*r*1.2)
  const grossRev  = salePrice * qty;
  const commFrac  = commissionPct / 100;
  const numerator = grossRev * (1 - targetMargin - commFrac) - deliveryRub - mpLogisticsTotal - adSpend;
  const maxPurchaseTotalRub = Math.max(0, numerator);
  const maxPurchaseUnitRub  = maxPurchaseTotalRub / qty / 1.2; // без таможни
  const maxPurchaseCny      = priceCurrency === 'CNY' ? maxPurchaseUnitRub / rate : maxPurchaseUnitRub / (USD_RATE() / CNY_RATE());
  const maxPurchaseUsd      = priceCurrency === 'USD' ? maxPurchaseUnitRub / rate : undefined;

  // Минимальная цена продажи при текущей закупке для targetMargin
  // S*q*(1 - targetMargin - c/100) = P*q*r*1.2 + delivery + mpLog + ad
  const denom = 1 - targetMargin - commFrac;
  const purchaseTotalRub = unitPrice * qty * rate;
  const minSalePerUnit = denom > 0.01
    ? (purchaseTotalRub * 1.2 + deliveryRub + mpLogisticsTotal + adSpend) / (qty * denom)
    : 0;

  const currentAchievable = maxPurchaseCny > 0 && unitPrice <= maxPurchaseCny + 0.01;

  return {
    max_purchase_price_cny:  Math.max(0, Math.round(maxPurchaseCny * 10) / 10),
    max_purchase_price_rub:  Math.max(0, Math.round(maxPurchaseUnitRub)),
    min_sale_price_rub:      Math.max(0, Math.round(minSalePerUnit)),
    target_margin_pct:       targetMargin * 100,
    current_is_achievable:   currentAchievable,
  };
}

// ── Supplier Risk (базовая оценка без данных поставщика) ─────────────────────

function computeSupplierRisk(moq?: number): SupplierRiskResult {
  const factors: string[] = [];
  let score = 0;

  if (!moq || moq === 0) {
    factors.push('MOQ не указан');
    score += 1;
  } else if (moq > 500) {
    factors.push(`Высокий MOQ: ${moq} шт — большой капитал`);
    score += 2;
  } else if (moq > 100) {
    factors.push(`MOQ ${moq} шт`);
    score += 1;
  }

  factors.push('Данные поставщика не проверены');
  score += 1;

  const level: SupplierRiskResult['level'] = score >= 3 ? 'high' : score >= 2 ? 'medium' : 'low';

  return {
    level,
    emoji: level === 'low' ? '🟢' : level === 'medium' ? '🟡' : '🔴',
    label: level === 'low' ? 'Низкий риск' : level === 'medium' ? 'Средний риск' : 'Высокий риск',
    factors,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

export async function calculateUnitEconomics(input: EconomicsInput): Promise<EconomicsOutput> {
  const cnyRate = CNY_RATE();
  const usdRate = USD_RATE();
  const rate    = input.priceCurrency === 'CNY' ? cnyRate : usdRate;

  const {
    unitPrice,
    priceCurrency,
    salePrice,
    quantity,
    adSpend    = 0,
    otherCosts = 0,
    cityTo     = '',
    countryTo  = 'Russia',
    weightKg,
    moq,
    marketplaceId,
  } = input;

  const qty = Math.max(1, quantity);

  // Определяем комиссию и логистику маркетплейса
  const mp = marketplaceId ? getMarketplace(marketplaceId) : undefined;
  const commissionPct = input.commissionPct ?? mp?.commission_pct ?? 15;
  const mpLogPerUnit  = mp
    ? calcMarketplaceLogisticsPerUnit(mp, weightKg ?? 0.5, salePrice)
    : 0;
  const mpLogTotal = mpLogPerUnit * qty;

  // Международная доставка (Rate Engine, best-effort)
  const cost = await calculateCostBreakdown({
    country_from: 'China',
    city_from:    '',
    country_to:   countryTo,
    city_to:      cityTo,
    weight:       weightKg,
  }).catch(() => null);

  const hasRate    = !!(cost && cost.sale_price > 0);
  const deliveryRub = hasRate
    ? cost!.currency === 'RUB' ? cost!.sale_price
    : cost!.currency === 'CNY' ? cost!.sale_price * cnyRate
    : cost!.sale_price * usdRate
    : 0;

  // P&L
  const unitPriceRub     = unitPrice * rate;
  const purchaseTotalRub = unitPriceRub * qty;
  const customsRub       = purchaseTotalRub * 0.20;
  const totalCostRub     = purchaseTotalRub + deliveryRub + customsRub + mpLogTotal + otherCosts;
  const unitCostRub      = totalCostRub / qty;
  const grossRevenue     = salePrice * qty;
  const marketplaceFee   = grossRevenue * (commissionPct / 100);
  const netProfit        = grossRevenue - totalCostRub - marketplaceFee - adSpend;
  const marginPct        = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
  const roiPct           = totalCostRub > 0 ? (netProfit / totalCostRub) * 100 : 0;

  const verdict      = marginPct >= 25 ? 'green'  as const : marginPct >= 10 ? 'yellow' as const : 'red' as const;
  const verdictEmoji = marginPct >= 25 ? '🟢' : marginPct >= 10 ? '🟡' : '🔴';
  const verdictLabel = marginPct >= 25 ? 'Перспективная' : marginPct >= 10 ? 'Требует проверки' : 'Слабая экономика';
  const priority     = marginPct >= 25 ? 'HOT' as const  : marginPct >= 10 ? 'WARM' as const  : 'COLD' as const;

  // Расширенные метрики
  const productScore  = computeProductScore(marginPct, roiPct, unitPriceRub, salePrice, deliveryRub + mpLogPerUnit, moq ?? 0);
  const targetPrice   = computeTargetPrice(unitPrice, rate, salePrice, qty, commissionPct, deliveryRub, adSpend, mpLogTotal, priceCurrency);
  const supplierRisk  = computeSupplierRisk(moq);

  // Three scenarios: цена продажи ±15%, себестоимость ±5%
  const scenarios: EconomicsScenario[] = [
    buildScenario('conservative', salePrice, unitCostRub, 0.85, 1.05, commissionPct, adSpend, qty, mpLogPerUnit),
    buildScenario('base',         salePrice, unitCostRub, 1.00, 1.00, commissionPct, adSpend, qty, mpLogPerUnit),
    buildScenario('optimistic',   salePrice, unitCostRub, 1.15, 0.95, commissionPct, adSpend, qty, mpLogPerUnit),
  ];

  const economics: EconomicsResult = {
    quantity:                    qty,
    unit_price_rub:              Math.round(unitPriceRub),
    purchase_total_rub:          Math.round(purchaseTotalRub),
    delivery_total_rub:          Math.round(deliveryRub),
    customs_rub:                 Math.round(customsRub),
    marketplace_logistics_rub:   Math.round(mpLogTotal),
    tax_rub:                     0,
    other_costs_rub:             Math.round(otherCosts),
    total_cost_rub:              Math.round(totalCostRub),
    unit_cost_rub:               Math.round(unitCostRub),
    sale_price_rub:              salePrice,
    gross_revenue_rub:           Math.round(grossRevenue),
    marketplace_fee_rub:         Math.round(marketplaceFee),
    ad_cost_rub:                 Math.round(adSpend),
    net_profit_rub:              Math.round(netProfit),
    margin_pct:                  Math.round(marginPct * 10) / 10,
    roi_pct:                     Math.round(roiPct * 10) / 10,
    verdict,
    verdict_emoji:               verdictEmoji,
    verdict_label:               verdictLabel,
    cny_rate:                    cnyRate,
    usd_rate:                    usdRate,
    product_score:               productScore,
    target_price:                targetPrice,
    scenarios,
    supplier_risk:               supplierRisk,
  };

  return {
    economics,
    priority,
    delivery: {
      hasRate,
      deliveryRub:   Math.round(deliveryRub),
      deliveryCost:  hasRate ? cost!.sale_price        : undefined,
      currency:      hasRate ? cost!.currency           : undefined,
      daysMin:       hasRate ? cost!.delivery_days_min  : undefined,
      daysMax:       hasRate ? cost!.delivery_days_max  : undefined,
      pricingRule:   hasRate ? cost!.selected_rule_name : undefined,
    },
  };
}
