// FINANCE AI — себестоимость, маржа, ROI.
// Переиспользует реальные комиссии маркетплейсов из lib/economics/marketplaces.ts
// (WB 23%, Ozon 20%, Kaspi 12.6% — актуальные тарифы, не выдуманные), и курсы валют
// из lib/economics/rates.ts — того же единого источника (intel_facts / finance_settings,
// обновляемого n8n), которым пользуется остальной сайт, чтобы не разойтись с калькулятором.
import { getMarketplace, detectCommissionPct, calcMarketplaceLogisticsPerUnit } from "@/lib/economics/marketplaces";
import { getExchangeRates } from "@/lib/economics/rates";

export const financeToolDefinition = {
  type: "function" as const,
  function: {
    name: "calculate_finance_scenarios",
    description:
      "Считает полную себестоимость товара (закупка + логистика + таможня + комиссия " +
      "маркетплейса), маржу и ROI за единицу товара.",
    parameters: {
      type: "object",
      properties: {
        factory_price_cny_total: { type: "number", description: "Общая закупочная цена партии в юанях" },
        quantity: { type: "number" },
        logistics_cost_total: { type: "number", description: "Стоимость доставки партии целиком (в валюте, указанной в logistics_currency)" },
        logistics_currency: { type: "string", enum: ["USD", "CNY", "RUB", "KZT"] },
        customs_total_duties_rub: { type: "number", description: "Итого пошлина+НДС+сбор из calculate_customs" },
        target_sell_price_rub: { type: "number" },
        marketplace: { type: "string", enum: ["wb", "ozon", "kaspi", "yandex", "shop", "opt"] },
        product_name: { type: "string" },
      },
      required: ["factory_price_cny_total", "quantity", "customs_total_duties_rub"],
    },
  },
};

interface FinanceInput {
  factory_price_cny_total: number;
  quantity: number;
  logistics_cost_total?: number;
  logistics_currency?: "USD" | "CNY" | "RUB" | "KZT";
  customs_total_duties_rub: number;
  target_sell_price_rub?: number;
  marketplace?: string;
  product_name?: string;
}

function toRub(amount: number, currency: string | undefined, rates: { usd: number; cny: number }): number {
  switch (currency) {
    case "USD": return amount * rates.usd;
    case "CNY": return amount * rates.cny;
    case "RUB": return amount;
    default: return amount; // KZT не конвертируем здесь — редкий случай для logistics
  }
}

export async function runFinanceCalculation(input: FinanceInput) {
  const rates = await getExchangeRates();
  const factoryTotalRub = input.factory_price_cny_total * rates.cny;
  const logisticsRub = toRub(input.logistics_cost_total || 0, input.logistics_currency, rates);

  const landedCostTotal = factoryTotalRub + logisticsRub + input.customs_total_duties_rub;
  const landedCostPerUnit = landedCostTotal / input.quantity;

  let marginPercent: number | null = null;
  let profitPerUnit: number | null = null;
  let commissionPct: number | null = null;

  if (input.target_sell_price_rub && input.marketplace) {
    const mp = getMarketplace(input.marketplace);
    if (mp) {
      commissionPct = detectCommissionPct(input.marketplace, input.product_name);
      const commissionAmount = (input.target_sell_price_rub * commissionPct) / 100;
      const mpLogistics = calcMarketplaceLogisticsPerUnit(mp, 0.5, input.target_sell_price_rub);
      const netRevenue = input.target_sell_price_rub - commissionAmount - mpLogistics;
      profitPerUnit = netRevenue - landedCostPerUnit;
      marginPercent = (profitPerUnit / input.target_sell_price_rub) * 100;
    }
  }

  return {
    landed_cost_total_rub: Math.round(landedCostTotal),
    landed_cost_per_unit_rub: Math.round(landedCostPerUnit),
    marketplace_commission_pct: commissionPct,
    profit_per_unit_rub: profitPerUnit !== null ? Math.round(profitPerUnit) : null,
    margin_percent: marginPercent !== null ? Math.round(marginPercent * 10) / 10 : null,
    roi_percent:
      profitPerUnit !== null ? Math.round((profitPerUnit / landedCostPerUnit) * 100) : null,
  };
}
