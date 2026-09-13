// Multi-factor Opportunity Score + Evidence Score
// Opportunity: how good is this lead for China sourcing
// Evidence: how proven/confirmed is the reason to contact

import type { EconomicsResult } from "./economics";
import type { ChinaMatch } from "./china-match";
import type { DiscoveredProduct } from "./product-discovery";

export interface ScoringInput {
  category: string;
  marketplace: string;
  phone: string;
  email: string;
  website: string;
  country: "KZ" | "RU";
  chinaMatch?: ChinaMatch | null;
  economics?: EconomicsResult | null;
  products?: DiscoveredProduct[];
}

// Evidence Score: how proven is the reason to contact (0-100)
export interface EvidenceBreakdown {
  has_specific_product: number;   // 0-20: specific SKU discovered
  has_marketplace: number;        // 0-15: sells on known marketplace
  has_china_match: number;        // 0-25: China supplier found
  match_confidence_pts: number;   // 0-15: match confidence score
  has_economics: number;          // 0-15: economics calculated
  has_price_gap: number;          // 0-10: price gap confirmed
}

export interface EvidenceResult {
  evidence_score: number;
  breakdown: EvidenceBreakdown;
  label: "CONFIRMED" | "PROBABLE" | "INFERRED" | "WEAK";
}

export function calculateEvidenceScore(input: ScoringInput): EvidenceResult {
  const b: EvidenceBreakdown = {
    has_specific_product: 0,
    has_marketplace: 0,
    has_china_match: 0,
    match_confidence_pts: 0,
    has_economics: 0,
    has_price_gap: 0,
  };

  // Has specific product (not just category)
  if (input.products && input.products.length > 0) {
    b.has_specific_product = input.products[0].name ? 20 : 10;
  }

  // Marketplace presence
  if (input.marketplace && input.marketplace !== "NONE") {
    b.has_marketplace = input.marketplace === "KASPI" || input.marketplace === "WB" || input.marketplace === "OZON" ? 15 : 8;
  }

  // China match
  if (input.chinaMatch) {
    const conf = input.chinaMatch.match_confidence ?? 0;
    b.has_china_match = conf >= 0.7 ? 25 : conf >= 0.5 ? 15 : conf >= 0.3 ? 8 : 0;
    b.match_confidence_pts = Math.round(conf * 15);
  }

  // Economics
  if (input.economics) {
    b.has_economics = input.economics.calculation_valid ? 15 : 7;
    b.has_price_gap = input.economics.price_gap > 0.1 ? 10 : input.economics.price_gap > 0 ? 5 : 0;
  }

  const score = Math.min(100,
    b.has_specific_product + b.has_marketplace + b.has_china_match +
    b.match_confidence_pts + b.has_economics + b.has_price_gap
  );

  const label: EvidenceResult["label"] =
    score >= 80 ? "CONFIRMED" :
    score >= 60 ? "PROBABLE" :
    score >= 35 ? "INFERRED" : "WEAK";

  return { evidence_score: score, breakdown: b, label };
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

  // Economic opportunity (0–20) — NO partial credit without real data
  if (input.economics && input.economics.calculation_valid) {
    const marginScore = Math.min(10, input.economics.estimated_margin * 25);
    const gapScore = Math.min(10, input.economics.price_gap * 15);
    breakdown.economic_opportunity = Math.round(marginScore + gapScore);
  } else {
    // Without confirmed economics: 0 pts — don't inflate score
    breakdown.economic_opportunity = 0;
  }

  // Match confidence penalty: no match = no pts
  if (!input.chinaMatch) {
    breakdown.match_confidence = 0;
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
