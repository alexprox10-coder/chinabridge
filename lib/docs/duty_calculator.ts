// ChinaBridge Docs — duty & VAT calculator
import type { ExtractedData } from "./ocr";
import type { HSClassification } from "./hs_classifier";

const RATES = {
  CNY_RUB: 12.88,
  CNY_KZT: 66.5,
  USD_RUB: 90.0,
  EUR_RUB: 97.0,
  USD_KZT: 470.0,
};

export interface DutyCalculation {
  customs_value_cny: number;
  customs_value_rub: number;
  customs_value_kzt: number;
  duty_rate_percent: number;
  duty_amount: number;
  vat_rate_percent: number;
  vat_amount: number;
  customs_fee: number;
  total_duties: number;
  landed_cost_rub: number;
  currency: string;
  exchange_rate_cny: number;
}

export function calculateDuties(
  item: ExtractedData["items"][0],
  hs: HSClassification,
  dest: "RU" | "KZ"
): DutyCalculation {
  // Нормализуем к CNY
  const c = (item.currency ?? "CNY").toUpperCase().replace("RMB", "CNY");
  let valueCNY = item.total_price;
  if (c === "USD") valueCNY = item.total_price * (RATES.USD_RUB / RATES.CNY_RUB);
  if (c === "EUR") valueCNY = item.total_price * (RATES.EUR_RUB / RATES.CNY_RUB);

  const valueRUB = valueCNY * RATES.CNY_RUB;
  const valueKZT = valueCNY * RATES.CNY_KZT;

  const base = dest === "RU" ? valueRUB : valueKZT;
  const dutyRate = (hs.duty_rate_percent ?? 10) / 100;
  const duty = base * dutyRate;

  const vatRate = dest === "RU" ? 0.2 : 0.12;
  const vat = (base + duty) * vatRate;

  const fee = dest === "RU" ? customsFeeRU(valueRUB) : 6720;

  const total = duty + vat + fee;

  return {
    customs_value_cny: Math.round(valueCNY * 100) / 100,
    customs_value_rub: Math.round(valueRUB),
    customs_value_kzt: Math.round(valueKZT),
    duty_rate_percent: hs.duty_rate_percent ?? 10,
    duty_amount: Math.round(duty),
    vat_rate_percent: vatRate * 100,
    vat_amount: Math.round(vat),
    customs_fee: Math.round(fee),
    total_duties: Math.round(total),
    landed_cost_rub: Math.round(valueRUB + total),
    currency: dest === "RU" ? "RUB" : "KZT",
    exchange_rate_cny: dest === "RU" ? RATES.CNY_RUB : RATES.CNY_KZT,
  };
}

function customsFeeRU(valueRUB: number): number {
  if (valueRUB <= 200_000) return 1_067;
  if (valueRUB <= 450_000) return 2_134;
  if (valueRUB <= 1_200_000) return 4_269;
  if (valueRUB <= 2_700_000) return 11_754;
  if (valueRUB <= 4_200_000) return 16_524;
  if (valueRUB <= 5_500_000) return 22_246;
  if (valueRUB <= 7_000_000) return 32_845;
  return 44_732;
}
