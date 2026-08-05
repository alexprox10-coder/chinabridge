import type { RevenueData, CostData, UnitEconomics, FinanceHealth, UnitEcoRating } from "./types";

// ── Finance Health ─────────────────────────────────────────────────────────

export function calculateFinanceHealth(
  revenue: RevenueData,
  costs: CostData,
  margin: number,
  ltvToCac: number,
): FinanceHealth {
  let score = 40;

  if (revenue.total > 0)          score += 15;
  if (margin >= 20)               score += 20;
  else if (margin >= 10)          score += 10;
  if (revenue.growth >= 15)       score += 15;
  else if (revenue.growth >= 5)   score += 7;
  if (ltvToCac >= 10)             score += 15;
  else if (ltvToCac >= 3)         score += 7;
  if (revenue.mrr > 0)            score += 10;
  if (!revenue.connected)         score -= 20;
  if (!costs.connected)           score -= 10;

  score = Math.max(0, Math.min(100, score));
  const status = score >= 80 ? "GOOD" : score >= 55 ? "WARNING" : "CRITICAL";

  const positives: string[] = [];
  const problems: string[] = [];

  if (revenue.total > 0)     positives.push(`Выручка ${(revenue.total / 1000).toFixed(0)}К₽ / мес`);
  if (margin >= 20)          positives.push(`Маржа ${margin}% — выше нормы`);
  if (revenue.growth >= 10)  positives.push(`Рост выручки +${revenue.growth}% к прошлому месяцу`);
  if (ltvToCac >= 5)         positives.push(`LTV/CAC ${ltvToCac.toFixed(1)}x — отличная unit-экономика`);

  if (!revenue.connected)    problems.push("Таблица заказов не заполнена — нет реальной выручки");
  if (margin < 10 && revenue.total > 0) problems.push(`Маржа ${margin}% — критически низко`);
  if (costs.total > revenue.total)      problems.push("Расходы превышают выручку");
  if (ltvToCac < 3 && ltvToCac > 0)    problems.push(`LTV/CAC ${ltvToCac.toFixed(1)}x — ниже нормы 3x`);

  return { score, status, positives, problems };
}

// ── Unit Economics ─────────────────────────────────────────────────────────

export function calculateUnitEconomics(
  revenue: RevenueData,
  costs: CostData,
  customersCount: number,
): UnitEconomics {
  const adSpend = costs.adSpend;
  const newCustomers = Math.max(1, Math.round(customersCount * 0.4));

  const cac         = adSpend > 0 ? Math.round(adSpend / newCustomers) : 18000;
  const arpu        = customersCount > 0 ? Math.round(revenue.total / customersCount) : 115000;
  const churn       = 8;
  const ltv         = Math.round(arpu * (100 / churn) * 0.25);
  const ltvToCac    = cac > 0 ? Math.round((ltv / cac) * 10) / 10 : 0;
  const paybackDays = arpu > 0 ? Math.round((cac / arpu) * 30) : 60;

  let rating: UnitEcoRating = "CRITICAL";
  let ratingReason = "";
  if (ltvToCac >= 20) { rating = "EXCELLENT"; ratingReason = "LTV/CAC > 20x — исключительная эффективность"; }
  else if (ltvToCac >= 10) { rating = "EXCELLENT"; ratingReason = "LTV/CAC > 10x — очень высокая эффективность"; }
  else if (ltvToCac >= 5)  { rating = "GOOD";      ratingReason = "LTV/CAC > 5x — хорошая unit-экономика"; }
  else if (ltvToCac >= 3)  { rating = "WARNING";   ratingReason = "LTV/CAC 3-5x — приемлемо, но есть потенциал"; }
  else                     { rating = "CRITICAL";  ratingReason = "LTV/CAC < 3x — нужно снизить CAC или повысить LTV"; }

  const byChannel = [
    { channel: "SEO / Органика", cac: Math.round(cac * 0.15), ltv, ratio: Math.round((ltv / (cac * 0.15)) * 10) / 10 },
    { channel: "Яндекс Директ",  cac: Math.round(cac * 1.4),  ltv, ratio: Math.round((ltv / (cac * 1.4))  * 10) / 10 },
    { channel: "Telegram",       cac: Math.round(cac * 0.6),  ltv, ratio: Math.round((ltv / (cac * 0.6))  * 10) / 10 },
    { channel: "Рекомендации",   cac: Math.round(cac * 0.05), ltv, ratio: Math.round((ltv / (cac * 0.05)) * 10) / 10 },
  ];

  return { cac, ltv, arpu, paybackDays, churn, ltvToCac, rating, ratingReason, byChannel };
}

// ── MRR / ARR ──────────────────────────────────────────────────────────────

export function calculateMRR(monthlyRevenue: number): number {
  return monthlyRevenue;
}

export function calculateARR(mrr: number): number {
  return mrr * 12;
}

export function calculateROI(revenue: number, costs: number): number {
  return costs > 0 ? Math.round(((revenue - costs) / costs) * 100) : 0;
}
