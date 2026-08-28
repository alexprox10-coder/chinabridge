// Tender Intelligence — scoring model v1.0
// Implements: China Import Fit, Opportunity Score, Lead Score, Intent Score

import type {
  RawTender, TenderCompany, ChinaFitResult, TenderOpportunity,
  TenderStream, OpportunityStatus,
} from "./types";
import { CONFIG, SCORING_MODEL_VERSION } from "./types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function calcUrgency(deadlineDays: number | null): "HIGH" | "MEDIUM" | "LOW" {
  if (!deadlineDays) return "MEDIUM";
  if (deadlineDays <= CONFIG.URGENT_DEADLINE_DAYS)  return "HIGH";
  if (deadlineDays <= CONFIG.MEDIUM_DEADLINE_DAYS) return "MEDIUM";
  return "LOW";
}

function calcOpportunityScore(params: {
  chinaFit: number;
  contractValue: number;
  repeatWinner: boolean;
  urgency: "HIGH" | "MEDIUM" | "LOW";
  winCount365d: number;
  deadlineDays: number | null;
}): number {
  const { chinaFit, contractValue, repeatWinner, urgency, winCount365d } = params;

  let score = 0;

  // China Fit (40% weight)
  score += chinaFit * 0.40;

  // Contract value (20% weight)
  const valueScore = Math.min(
    100,
    contractValue >= 50_000_000 ? 100 :
    contractValue >= 20_000_000 ? 85 :
    contractValue >= 10_000_000 ? 70 :
    contractValue >= 5_000_000  ? 55 :
    contractValue >= 2_000_000  ? 40 :
    contractValue >= 1_000_000  ? 25 : 10,
  );
  score += valueScore * 0.20;

  // Repeat winner (20% weight)
  const repeatScore = repeatWinner
    ? Math.min(100, 50 + winCount365d * 5)
    : (winCount365d === 0 ? 60 : 30); // new winner gets bonus
  score += repeatScore * 0.20;

  // Urgency (10% weight)
  const urgencyScore = urgency === "HIGH" ? 100 : urgency === "MEDIUM" ? 60 : 30;
  score += urgencyScore * 0.10;

  // Category bonus (10%)
  score += chinaFit >= 70 ? 10 : chinaFit >= 50 ? 6 : chinaFit >= 30 ? 3 : 0;

  return Math.round(Math.min(100, Math.max(0, score)));
}

function calcLeadScore(params: {
  opportunityScore: number;
  chinaFit: number;
  repeatWinner: boolean;
  contractValue: number;
}): number {
  const { opportunityScore, chinaFit, repeatWinner, contractValue } = params;

  let score = opportunityScore * 0.6;
  score += chinaFit * 0.25;

  if (repeatWinner) score += 10;
  if (contractValue >= 10_000_000) score += 5;
  else if (contractValue >= 5_000_000) score += 3;

  return Math.round(Math.min(100, Math.max(0, score)));
}

function calcIntentScore(params: {
  chinaFit: number;
  repeatWinner: boolean;
  winCount365d: number;
  urgency: "HIGH" | "MEDIUM" | "LOW";
}): number {
  const { chinaFit, repeatWinner, winCount365d, urgency } = params;

  let score = chinaFit * 0.5;
  if (repeatWinner) score += 20 + Math.min(winCount365d * 2, 20);
  if (urgency === "HIGH") score += 15;
  else if (urgency === "MEDIUM") score += 7;

  return Math.round(Math.min(100, Math.max(0, score)));
}

function determineStream(company: TenderCompany): TenderStream {
  if (company.win_count_365d >= CONFIG.REPEAT_WINNER_MIN_COUNT) return "repeat_winners";
  if (company.is_new_winner) return "new_winners";
  return "winners";
}

function estimateEconomics(contractValue: number, chinaFit: number): {
  estimated_china_cost: number | null;
  estimated_logistics: number | null;
  estimated_customs: number | null;
  estimated_margin: number | null;
  estimated_margin_percent: number | null;
} {
  if (chinaFit < 40) return {
    estimated_china_cost: null, estimated_logistics: null,
    estimated_customs: null, estimated_margin: null, estimated_margin_percent: null,
  };

  // AI estimates (conservative, based on typical ChinaBridge margins)
  const chinaCost    = contractValue * 0.35;  // ~35% of contract value
  const logistics    = contractValue * 0.08;  // ~8% logistics
  const customs      = contractValue * 0.07;  // ~7% customs+duties
  const totalCost    = chinaCost + logistics + customs;
  const margin       = contractValue - totalCost;
  const marginPct    = (margin / contractValue) * 100;

  return {
    estimated_china_cost:    Math.round(chinaCost),
    estimated_logistics:     Math.round(logistics),
    estimated_customs:       Math.round(customs),
    estimated_margin:        Math.round(margin),
    estimated_margin_percent: Math.round(marginPct * 10) / 10,
  };
}

async function generateAISalesBrief(params: {
  tender: RawTender;
  company: TenderCompany;
  fit: ChinaFitResult;
  opportunityScore: number;
}): Promise<{ summary: string; offer: string; action: string }> {
  const { tender, company, fit, opportunityScore } = params;
  const apiKey = process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      summary: `${company.name} выиграло контракт на ${(tender.final_price / 1_000_000).toFixed(1)} млн ₽ (${fit.product_category}). China Fit: ${fit.score}/100.`,
      offer: "China Procurement + White Import",
      action: "Связаться с закупочным отделом компании.",
    };
  }

  const prompt = `Составь краткий AI Sales Brief для менеджера ChinaBridge.

КОМПАНИЯ: ${company.name}
ИНН: ${company.inn}
РЕГИОН: ${company.region ?? "не указан"}
ТЕНДЕР: ${tender.subject}
КОНТРАКТ: ${tender.final_price.toLocaleString("ru")} ₽
СРОК: ${tender.delivery_deadline ? `${tender.delivery_deadline} дней` : "не указан"}
CHINA FIT: ${fit.score}/100 (${fit.category})
OPPORTUNITY: ${opportunityScore}/100
ПОВТОРНЫЙ ПОБЕДИТЕЛЬ: ${company.repeat_winner ? `Да (${company.win_count_365d} побед за год, ${(company.total_amount / 1_000_000).toFixed(1)} млн ₽ общая сумма)` : "Нет"}

Верни JSON (без markdown):
{
  "summary": "<3-4 предложения: что выиграли, почему интересно ChinaBridge, какой потенциал>",
  "offer": "<рекомендуемый продукт ChinaBridge: China Sourcing / White Import / Cargo / Consolidation>",
  "action": "<конкретное следующее действие менеджера в 1 предложении>"
}

Тон: деловой, конкретный. НЕ писать 'доставка из Китая' как первую фразу.`;

  try {
    const resp = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4-5",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!resp.ok) throw new Error(`${resp.status}`);
    const data = await resp.json() as { choices: Array<{ message: { content: string } }> };
    const content = data.choices[0]?.message?.content ?? "{}";
    return JSON.parse(content.replace(/```json\n?|```/g, "").trim());
  } catch {
    return {
      summary: `${company.name} выиграло контракт на ${(tender.final_price / 1_000_000).toFixed(1)} млн ₽ (${fit.product_category}). China Fit: ${fit.score}/100.`,
      offer: fit.score >= 70 ? "China Procurement + White Import" : "Предварительное исследование товара",
      action: company.repeat_winner
        ? "Предложить регулярный procurement agreement."
        : "Отправить персонализированное B2B-предложение.",
    };
  }
}

export async function buildOpportunity(params: {
  tender: RawTender;
  company: TenderCompany;
  fit: ChinaFitResult;
}): Promise<Omit<TenderOpportunity, "created_at" | "updated_at">> {
  const { tender, company, fit } = params;

  const urgency = calcUrgency(tender.delivery_deadline);
  const stream  = determineStream(company);

  const opportunityScore = calcOpportunityScore({
    chinaFit:      fit.score,
    contractValue: tender.final_price,
    repeatWinner:  company.repeat_winner,
    urgency,
    winCount365d:  company.win_count_365d,
    deadlineDays:  tender.delivery_deadline,
  });

  const leadScore = calcLeadScore({
    opportunityScore,
    chinaFit:      fit.score,
    repeatWinner:  company.repeat_winner,
    contractValue: tender.final_price,
  });

  const intentScore = calcIntentScore({
    chinaFit:     fit.score,
    repeatWinner: company.repeat_winner,
    winCount365d: company.win_count_365d,
    urgency,
  });

  const status: OpportunityStatus = opportunityScore >= CONFIG.HOT_OPPORTUNITY_THRESHOLD
    ? "HOT"
    : fit.category === "IRRELEVANT" ? "IRRELEVANT" : "QUALIFIED";

  const econ = estimateEconomics(tender.final_price, fit.score);

  // Generate AI Sales Brief only for candidates worth pursuing
  const brief = (opportunityScore >= 60 || company.repeat_winner)
    ? await generateAISalesBrief({ tender, company, fit, opportunityScore })
    : {
        summary: `${company.name}: контракт ${(tender.final_price / 1_000_000).toFixed(1)} млн ₽, China Fit ${fit.score}/100.`,
        offer: "Требует дополнительного анализа",
        action: "Провести исследование товара перед контактом.",
      };

  return {
    id:                  `op-${tender.tender_id}-${Date.now()}`,
    tender_id:           tender.tender_id,
    company_id:          company.inn,
    source:              tender.source,
    purchase_number:     tender.purchase_number,
    subject:             tender.subject,
    category:            fit.product_category,
    law_type:            tender.law_type,
    contract_value:      tender.final_price,
    winner_price:        tender.winner_price,
    delivery_deadline:   tender.delivery_deadline,
    urgency,
    china_import_fit:    fit.score,
    opportunity_score:   opportunityScore,
    lead_score:          leadScore,
    intent_score:        intentScore,
    priority:            fit.category,
    status,
    stream,
    repeat_winner:       company.repeat_winner,
    win_count:           company.win_count_365d,
    ai_summary:          brief.summary,
    recommended_offer:   brief.offer,
    next_best_action:    brief.action,
    scoring_model_version: SCORING_MODEL_VERSION,
    source_url:          tender.source_url,
    ...econ,
  };
}
