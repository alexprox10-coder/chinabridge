// Multi-factor Opportunity Score per ТЗ §20
// Factors: product_relevance, china_availability, match_confidence,
//          price_gap, estimated_margin, import_complexity, order_potential

import type { EconomicsResult } from "./economics";
import type { ChinaMatch } from "./china-match";

export interface ScoringInput {
  category: string;
  marketplace: string;
  phone: string;
  email: string;
  website: string;
  country: "KZ" | "RU";
  chinaMatch?: ChinaMatch | null;
  economics?: EconomicsResult | null;
}

export interface ScoreBreakdown {
  product_relevance: number;   // 0–20: how relevant the category is for China sourcing
  china_availability: number;  // 0–20: how easy to source from China
  match_confidence: number;    // 0–20: China match confidence
  economic_opportunity: number;// 0–20: price gap + margin potential
  contact_quality: number;     // 0–10: phone, email, website
  marketplace_presence: number;// 0–10: sells on marketplace
}

export interface ScoreResult {
  opportunity_score: number;   // 0–100
  company_score: number;       // 0–100 (separate from opportunity)
  breakdown: ScoreBreakdown;
}

// Categories most suitable for China import
const CATEGORY_RELEVANCE: Record<string, number> = {
  AUTO_ACCESSORIES: 20,
  ELECTRONICS: 20,
  HOME: 18,
  TOOLS: 17,
  CLOTHING: 15,
  SHOES: 14,
  CONSUMER_GOODS: 13,
  AUTO_PARTS: 16,
  EQUIPMENT: 12,
  OTHER: 8,
};

// China sourcing availability by category
const CHINA_AVAILABILITY: Record<string, number> = {
  AUTO_ACCESSORIES: 20,
  ELECTRONICS: 20,
  HOME: 18,
  CLOTHING: 17,
  TOOLS: 16,
  CONSUMER_GOODS: 15,
  SHOES: 14,
  AUTO_PARTS: 14,
  EQUIPMENT: 10,
  OTHER: 8,
};

export function calculateScore(input: ScoringInput): ScoreResult {
  const breakdown: ScoreBreakdown = {
    product_relevance: CATEGORY_RELEVANCE[input.category] ?? 8,
    china_availability: CHINA_AVAILABILITY[input.category] ?? 8,
    match_confidence: 0,
    economic_opportunity: 0,
    contact_quality: 0,
    marketplace_presence: 0,
  };

  // Match confidence (0–20)
  if (input.chinaMatch) {
    breakdown.match_confidence = Math.round(input.chinaMatch.match_confidence * 20);
  }

  // Economic opportunity (0–20)
  if (input.economics) {
    const marginScore = Math.min(10, input.economics.estimated_margin * 25);  // 40% margin = 10pts
    const gapScore = Math.min(10, input.economics.price_gap * 15);            // 67% gap = 10pts
    breakdown.economic_opportunity = Math.round(marginScore + gapScore);
  } else {
    // No economics: give partial credit based on category
    breakdown.economic_opportunity = Math.round((CATEGORY_RELEVANCE[input.category] ?? 8) * 0.4);
  }

  // Contact quality (0–10)
  if (input.phone) breakdown.contact_quality += 5;
  if (input.email) breakdown.contact_quality += 2;
  if (input.website) breakdown.contact_quality += 3;

  // Marketplace presence (0–10)
  if (input.marketplace && input.marketplace !== "NONE") {
    breakdown.marketplace_presence = input.marketplace === "KASPI" ? 10 :
                                     input.marketplace === "WB" ? 9 :
                                     input.marketplace === "OZON" ? 8 : 5;
  }

  const opportunity_score = Math.min(100,
    breakdown.product_relevance +
    breakdown.china_availability +
    breakdown.match_confidence +
    breakdown.economic_opportunity +
    breakdown.contact_quality +
    breakdown.marketplace_presence
  );

  // Company score: based on contact quality + marketplace presence + category
  const company_score = Math.min(100, Math.round(
    breakdown.contact_quality * 4 +
    breakdown.marketplace_presence * 3 +
    (CATEGORY_RELEVANCE[input.category] ?? 8) * 2
  ));

  return { opportunity_score, company_score, breakdown };
}
