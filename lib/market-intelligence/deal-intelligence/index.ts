import type { CRMLead } from "@/lib/crm/types";
import type { DealScore, DealIntelligenceResult, RevenueForecast } from "../types";

// ─── Score constants ──────────────────────────────────────────────────────────

const STATUS_BASE: Record<string, number> = {
  NEW: 10, CONTACTED: 22, QUALIFICATION: 32, CALCULATION: 44,
  OFFER_SENT: 55, NEGOTIATION: 68, PAYMENT: 82, DELIVERY: 88,
  SUCCESS: 100, LOST: 0,
};

const STATUS_WIN_PROB: Record<string, number> = {
  NEW: 8, CONTACTED: 18, QUALIFICATION: 30, CALCULATION: 42,
  OFFER_SENT: 53, NEGOTIATION: 67, PAYMENT: 86, DELIVERY: 92,
  SUCCESS: 100, LOST: 0,
};

const STATUS_NEXT_ACTION: Record<string, string> = {
  NEW:           "Связаться с клиентом — ещё не было контакта",
  CONTACTED:     "Квалифицировать: уточнить объём и маршрут",
  QUALIFICATION: "Отправить расчёт себестоимости",
  CALCULATION:   "Подготовить и выслать коммерческое предложение",
  OFFER_SENT:    "Позвонить — уточнить статус КП",
  NEGOTIATION:   "Согласовать финальные условия сделки",
  PAYMENT:       "Проконтролировать получение оплаты",
  DELIVERY:      "Организовать отгрузку и трекинг",
  SUCCESS:       "Собрать отзыв и предложить следующую поставку",
  LOST:          "Выяснить причину отказа для аналитики",
};

// ─── Scoring algorithm ────────────────────────────────────────────────────────

export function scoreDeal(lead: CRMLead): DealScore {
  const status   = lead.status   ?? "NEW";
  const priority = lead.priority ?? "COLD";
  const value    = Number(lead.estimated_value) || 0;

  // Base from status (0-55)
  let score = STATUS_BASE[status] ?? 10;

  // Priority bonus
  if (priority === "HOT")  score += 22;
  if (priority === "WARM") score += 10;

  // Value bonus (log scale, max +15)
  if (value > 0) {
    const valueBonus = Math.min(15, Math.floor(Math.log10(value + 1) * 3));
    score += valueBonus;
  }

  // Source quality bonus
  const source = lead.source ?? "";
  if (source === "referral" || source === "exhibition") score += 6;
  if (source === "website_form" || source === "website") score += 4;

  // Recency — penalty for stale deals
  const now = Date.now();
  const lastUpdate = new Date(lead.updated_at || lead.created_at || 0).getTime();
  const daysSinceUpdate = (now - lastUpdate) / 86400000;

  let daysInStatus = 0;
  if (lead.updated_at && lead.updated_at !== lead.created_at) {
    daysInStatus = Math.floor(daysSinceUpdate);
  }

  if (status !== "SUCCESS" && status !== "LOST") {
    if (daysSinceUpdate > 14) score -= 15;
    else if (daysSinceUpdate > 7) score -= 8;
    else if (daysSinceUpdate > 3) score -= 3;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Win probability (adjusted by score)
  const baseProb = STATUS_WIN_PROB[status] ?? 8;
  const scoreMod = (score - STATUS_BASE[status]) * 0.3;
  const winProbability = Math.max(0, Math.min(100, Math.round(baseProb + scoreMod)));

  // Revenue & margin estimates
  const expectedRevenue = Math.round(value * (winProbability / 100));
  const estimatedMargin = Math.round(expectedRevenue * 0.18); // ~18% margin

  // Decision date estimate
  const stagesLeft = Object.keys(STATUS_BASE).indexOf(status);
  const daysToClose = stagesLeft > 0 ? (10 - stagesLeft) * 5 : 0;
  const decisionDate = daysToClose > 0
    ? new Date(Date.now() + daysToClose * 86400000).toISOString().slice(0, 10)
    : undefined;

  // Risk classification
  let risk: "low" | "medium" | "high" = "medium";
  if (score >= 65 && daysSinceUpdate < 3) risk = "low";
  else if (score < 30 || daysSinceUpdate > 14) risk = "high";

  // Alert type
  let alert: DealScore["alert"] | undefined;
  if (status !== "SUCCESS" && status !== "LOST") {
    if (daysSinceUpdate > 7) alert = "stale";
    if (priority === "HOT" && daysSinceUpdate > 2) alert = "urgent";
    if (["NEGOTIATION", "PAYMENT"].includes(status)) alert = "closing";
    if (priority === "HOT" && score >= 70) alert = "hot";
  }

  // Build reasons
  const reasons: string[] = [];
  if (priority === "HOT")  reasons.push("🔥 Горячий приоритет");
  if (value >= 1000000)    reasons.push(`💰 Высокая стоимость: ${(value / 1000000).toFixed(1)}M ₽`);
  if (source === "referral") reasons.push("🤝 Пришёл по рекомендации");
  if (daysSinceUpdate < 1) reasons.push("⚡ Обновлён сегодня");
  if (daysSinceUpdate > 7) reasons.push(`⏰ Нет активности ${Math.floor(daysSinceUpdate)} дн.`);
  if (["NEGOTIATION", "PAYMENT"].includes(status)) reasons.push("📋 Близко к закрытию");

  return {
    leadId:          lead.id ?? 0,
    leadDbId:        lead.lead_id ?? "",
    company:         lead.company || lead.name || "—",
    product:         lead.product || "—",
    status,
    priority,
    estimatedValue:  value,
    score,
    winProbability,
    expectedRevenue,
    estimatedMargin,
    decisionDate,
    nextAction:      STATUS_NEXT_ACTION[status] ?? "Уточнить статус",
    reasons,
    risk,
    alert,
    daysInStatus,
    manager:         lead.manager || undefined,
  };
}

// ─── Revenue forecast ─────────────────────────────────────────────────────────

function calcForecast(deals: DealScore[]): RevenueForecast {
  const active = deals.filter(d => !["SUCCESS", "LOST"].includes(d.status));
  const d7  = active.filter(d => d.winProbability >= 80).reduce((s, d) => s + d.expectedRevenue, 0);
  const d30 = active.filter(d => d.winProbability >= 50).reduce((s, d) => s + d.expectedRevenue, 0);
  const d90 = active.reduce((s, d) => s + d.expectedRevenue, 0);
  return { d7, d30, d90 };
}

// ─── Main entry ───────────────────────────────────────────────────────────────

export function analyzeDealIntelligence(leads: CRMLead[]): DealIntelligenceResult {
  const active = leads.filter(l => l.status !== "SUCCESS" && l.status !== "LOST");
  const deals  = active.map(scoreDeal).sort((a, b) => b.score - a.score);

  const topDeals    = deals.slice(0, 10);
  const urgentDeals = deals.filter(d => d.alert === "urgent" || d.alert === "closing").slice(0, 5);
  const staleDeals  = deals.filter(d => d.alert === "stale").slice(0, 5);
  const forecast    = calcForecast(deals);
  const totalPipeline = active.reduce((s, l) => s + (Number(l.estimated_value) || 0), 0);
  const avgScore    = deals.length > 0 ? Math.round(deals.reduce((s, d) => s + d.score, 0) / deals.length) : 0;

  return { deals, topDeals, urgentDeals, staleDeals, forecast, totalPipeline, avgScore };
}
