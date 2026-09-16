// Multi-factor Opportunity Score + Evidence Score
// §6/§9/§10 ТЗ: evidence_factor gates opportunity_score — high opp with 0 evidence is FORBIDDEN

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
  // Optional verified flags (from data quality check)
  companyVerified?: boolean;
  productVerified?: boolean;
  contactVerified?: boolean;
  localPriceKnown?: boolean;
}

// ТЗ §9 exact weights: 20+20+20+20+10+10 = 100
export interface EvidenceBreakdown {
  product_verified: number;      // 0-20: specific product discovered and verified
  marketplace_evidence: number;  // 0-20: sells on known marketplace (confirmed)
  china_source_found: number;    // 0-20: China supplier URL / source found
  china_price_found: number;     // 0-20: China price confirmed
  local_price_verified: number;  // 0-10: local selling price known
  landed_cost_calculated: number;// 0-10: full economics calculated
}

export interface EvidenceResult {
  evidence_score: number;
  breakdown: EvidenceBreakdown;
  label: "CONFIRMED" | "PROBABLE" | "INFERRED" | "WEAK";
}

export function calculateEvidenceScore(input: ScoringInput): EvidenceResult {
  const b: EvidenceBreakdown = {
    product_verified: 0,
    marketplace_evidence: 0,
    china_source_found: 0,
    china_price_found: 0,
    local_price_verified: 0,
    landed_cost_calculated: 0,
  };

  // +20: specific product found (and optionally verified)
  if (input.products && input.products.length > 0) {
    const hasSpecific = input.products[0].name && input.products[0].name.split(" ").length >= 2;
    b.product_verified = hasSpecific ? (input.productVerified ? 20 : 15) : 8;
  } else if (input.companyVerified) {
    b.product_verified = 5; // company confirmed but no product
  }

  // +20: marketplace confirmed
  if (input.marketplace && input.marketplace !== "NONE") {
    const tier1 = ["KASPI", "WB", "OZON"];
    b.marketplace_evidence = tier1.includes(input.marketplace) ? 20 : 12;
  }

  // +20: China source URL/supplier found
  if (input.chinaMatch) {
    const conf = input.chinaMatch.match_confidence ?? 0;
    if (conf >= 0.7) b.china_source_found = 20;
    else if (conf >= 0.5) b.china_source_found = 15;
    else if (conf >= 0.3) b.china_source_found = 8;
  }

  // +20: China price confirmed (price_min_cny > 0 is meaningful data)
  if (input.chinaMatch) {
    const hasPrice = (input.chinaMatch.price_min_cny ?? 0) > 0 && (input.chinaMatch.price_max_cny ?? 0) > 0;
    if (hasPrice) {
      const conf = input.chinaMatch.match_confidence ?? 0;
      b.china_price_found = conf >= 0.6 ? 20 : conf >= 0.3 ? 12 : 6;
    }
  }

  // +10: local selling price known
  if (input.economics || input.localPriceKnown) {
    const hasLocalPrice = input.economics?.calculation_valid ||
      (input.products?.[0] && (
        (input.products[0].price_min_kzt ?? 0) > 0 ||
        (input.products[0].price_min_rub ?? 0) > 0
      ));
    b.local_price_verified = hasLocalPrice ? 10 : 5;
  }

  // +10: landed cost calculated (full economics valid)
  if (input.economics?.calculation_valid) {
    b.landed_cost_calculated = 10;
  }

  const score = Math.min(100,
    b.product_verified + b.marketplace_evidence + b.china_source_found +
    b.china_price_found + b.local_price_verified + b.landed_cost_calculated
  );

  const label: EvidenceResult["label"] =
    score >= 80 ? "CONFIRMED" :
    score >= 60 ? "PROBABLE" :
    score >= 35 ? "INFERRED" : "WEAK";

  return { evidence_score: score, breakdown: b, label };
}

// ТЗ §10: evidence_factor gates opportunity_score
// Opportunity 90 with Evidence 0 is FORBIDDEN
function evidenceFactor(evidenceScore: number): number {
  if (evidenceScore >= 81) return 1.0;
  if (evidenceScore >= 61) return 0.9;
  if (evidenceScore >= 41) return 0.7;
  if (evidenceScore >= 21) return 0.4;
  return 0.2;
}

export interface ScoreBreakdown {
  product_relevance: number;    // 0–20
  china_availability: number;   // 0–20
  match_confidence: number;     // 0–20
  economic_opportunity: number; // 0–20
  contact_quality: number;      // 0–10
  marketplace_presence: number; // 0–10
}

export interface ScoreResult {
  opportunity_score: number;    // 0–100, gated by evidence_factor
  raw_opportunity_score: number;// 0–100, before evidence_factor
  company_score: number;        // 0–100
  evidence_score: number;       // 0–100
  evidence_label: EvidenceResult["label"];
  evidence_factor: number;
  breakdown: ScoreBreakdown;
  evidence_breakdown: EvidenceBreakdown;
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
  // First calculate evidence score — it gates the opportunity score
  const evidenceResult = calculateEvidenceScore(input);
  const factor = evidenceFactor(evidenceResult.evidence_score);

  const breakdown: ScoreBreakdown = {
    product_relevance: CATEGORY_RELEVANCE[input.category] ?? 8,
    china_availability: CHINA_AVAILABILITY[input.category] ?? 8,
    match_confidence: 0,
    economic_opportunity: 0,
    contact_quality: 0,
    marketplace_presence: 0,
  };

  // Match confidence (0–20) — only from confirmed china match
  if (input.chinaMatch) {
    breakdown.match_confidence = Math.round(input.chinaMatch.match_confidence * 20);
  }

  // Economic opportunity (0–20) — NO partial credit without real calculation
  if (input.economics && input.economics.calculation_valid) {
    const marginScore = Math.min(10, input.economics.estimated_margin * 25);
    const gapScore = Math.min(10, input.economics.price_gap * 15);
    breakdown.economic_opportunity = Math.round(marginScore + gapScore);
  }

  // Contact quality (0–10)
  if (input.phone) breakdown.contact_quality += 5;
  if (input.email) breakdown.contact_quality += 2;
  if (input.website) breakdown.contact_quality += 3;

  // Marketplace presence (0–10)
  if (input.marketplace && input.marketplace !== "NONE") {
    breakdown.marketplace_presence =
      input.marketplace === "KASPI" ? 10 :
      input.marketplace === "WB"    ? 9  :
      input.marketplace === "OZON"  ? 8  : 5;
  }

  const raw_opportunity_score = Math.min(100,
    breakdown.product_relevance +
    breakdown.china_availability +
    breakdown.match_confidence +
    breakdown.economic_opportunity +
    breakdown.contact_quality +
    breakdown.marketplace_presence
  );

  // §10: Apply evidence_factor — this is the critical gate
  const opportunity_score = Math.min(100, Math.round(raw_opportunity_score * factor));

  // Company score: based on contact quality + marketplace + category
  const company_score = Math.min(100, Math.round(
    breakdown.contact_quality * 4 +
    breakdown.marketplace_presence * 3 +
    (CATEGORY_RELEVANCE[input.category] ?? 8) * 2
  ));

  return {
    opportunity_score,
    raw_opportunity_score,
    company_score,
    evidence_score: evidenceResult.evidence_score,
    evidence_label: evidenceResult.label,
    evidence_factor: factor,
    breakdown,
    evidence_breakdown: evidenceResult.breakdown,
  };
}
