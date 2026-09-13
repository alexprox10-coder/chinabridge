// Unit Economics: calculates landed cost, margin, price gap
// Uses ChinaBridge rate data: KZ $2.50/kg, RU $3.00/kg (from project rates)

export interface EconomicsInput {
  china_price_cny: number;      // average of min+max
  weight_kg: number;
  country: "KZ" | "RU";
  selling_price_local?: number; // marketplace price in local currency (optional)
  currency: "KZT" | "RUB";
}

export interface EconomicsResult {
  china_price_cny: number;
  china_price_usd: number;
  delivery_cost_usd: number;
  import_costs_usd: number;    // customs, handling (simplified)
  landed_cost_usd: number;
  landed_cost_local: number;
  selling_price_local: number;
  estimated_profit_local: number;
  estimated_margin: number;    // 0.0–1.0
  price_gap: number;           // 0.0–1.0 (how much cheaper China vs. selling price)
  target_purchase_price_usd: number;
  calculation_valid: boolean;
}

// Exchange rates (approximate, updated regularly)
const CNY_TO_USD = 0.138;  // 1 CNY ≈ $0.138
const USD_TO_KZT = 450;    // 1 USD ≈ 450 KZT
const USD_TO_RUB = 90;     // 1 USD ≈ 90 RUB

// ChinaBridge delivery rates
const DELIVERY_RATE_KZ_USD_PER_KG = 2.50;
const DELIVERY_RATE_RU_USD_PER_KG = 3.00;

// Import costs simplified (customs + handling): ~15% of china price for KZ, ~20% for RU
const IMPORT_COST_RATE_KZ = 0.15;
const IMPORT_COST_RATE_RU = 0.20;

// Marketplace fee estimate
const MARKETPLACE_FEE = 0.12; // ~12% of selling price

export function calculateEconomics(input: EconomicsInput): EconomicsResult {
  const { china_price_cny, weight_kg, country, selling_price_local, currency } = input;

  const china_price_usd = china_price_cny * CNY_TO_USD;
  const delivery_rate = country === "KZ" ? DELIVERY_RATE_KZ_USD_PER_KG : DELIVERY_RATE_RU_USD_PER_KG;
  const delivery_cost_usd = weight_kg * delivery_rate;
  const import_cost_rate = country === "KZ" ? IMPORT_COST_RATE_KZ : IMPORT_COST_RATE_RU;
  const import_costs_usd = china_price_usd * import_cost_rate;
  const landed_cost_usd = china_price_usd + delivery_cost_usd + import_costs_usd;

  const to_local = currency === "KZT" ? USD_TO_KZT : USD_TO_RUB;
  const landed_cost_local = landed_cost_usd * to_local;

  // If we have selling price, calculate actual margin
  let selling_price = selling_price_local ?? 0;
  let calculation_valid = false;

  if (selling_price > 0) {
    calculation_valid = true;
  } else {
    // Estimate: assume 2.5x landed cost as typical marketplace price
    selling_price = landed_cost_local * 2.5;
  }

  const marketplace_costs = selling_price * MARKETPLACE_FEE;
  const estimated_profit_local = selling_price - landed_cost_local - marketplace_costs;
  const estimated_margin = selling_price > 0 ? estimated_profit_local / selling_price : 0;

  const price_gap = selling_price > 0
    ? Math.max(0, (selling_price - landed_cost_local) / selling_price)
    : 0;

  // Target purchase price: landed_cost × 0.6 (we want to pay less in China)
  const target_purchase_price_usd = landed_cost_usd * 0.6;

  return {
    china_price_cny,
    china_price_usd: Math.round(china_price_usd * 100) / 100,
    delivery_cost_usd: Math.round(delivery_cost_usd * 100) / 100,
    import_costs_usd: Math.round(import_costs_usd * 100) / 100,
    landed_cost_usd: Math.round(landed_cost_usd * 100) / 100,
    landed_cost_local: Math.round(landed_cost_local),
    selling_price_local: Math.round(selling_price),
    estimated_profit_local: Math.round(estimated_profit_local),
    estimated_margin: Math.round(estimated_margin * 100) / 100,
    price_gap: Math.round(price_gap * 100) / 100,
    target_purchase_price_usd: Math.round(target_purchase_price_usd * 100) / 100,
    calculation_valid,
  };
}

// Category weight estimates (kg per unit)
export const CATEGORY_WEIGHTS: Record<string, number> = {
  AUTO_PARTS: 2.0,
  AUTO_ACCESSORIES: 0.5,
  ELECTRONICS: 0.35,
  HOME: 1.5,
  CLOTHING: 0.3,
  SHOES: 0.7,
  TOOLS: 1.8,
  EQUIPMENT: 5.0,
  CONSUMER_GOODS: 0.5,
  OTHER: 0.8,
};
