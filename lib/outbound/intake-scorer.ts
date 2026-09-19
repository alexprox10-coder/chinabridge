// Intake Lead Scorer
// Formula: final_score = MIN(lead_score, 30 + 0.7 * evidence_score)
// This gates AI-only optimism with hard evidence from the message text

import crypto from "crypto";
import type { QualificationResult } from "./intake-qualifier";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "HOT";

export interface IntakeScore {
  lead_score: number;
  evidence_score: number;
  final_score: number;
  priority: Priority;
}

// §13 ТЗ Evidence Gate: final_score = MIN(lead_score, 30 + 0.7 * evidence_score)
export function calcFinalScore(leadScore: number, evidenceScore: number): number {
  const cap = 30 + 0.7 * evidenceScore;
  return Math.round(Math.min(leadScore, cap));
}

// §14 ТЗ Priority thresholds
export function scorePriority(finalScore: number): Priority {
  if (finalScore >= 70) return "HOT";
  if (finalScore >= 60) return "HIGH";
  if (finalScore >= 40) return "MEDIUM";
  return "LOW";
}

export function scoreIntakeLead(qual: QualificationResult): IntakeScore {
  const finalScore = calcFinalScore(qual.lead_score, qual.evidence_score);
  return {
    lead_score: qual.lead_score,
    evidence_score: qual.evidence_score,
    final_score: finalScore,
    priority: scorePriority(finalScore),
  };
}

// §20 ТЗ Fingerprint for deduplication
// Primary: source + external_id (if present)
// Fallback: sha256(normalized_username|normalized_chat|normalized_text_prefix|approx_date)
export function buildFingerprint(
  username: string,
  chat: string,
  text: string,
  approximateDate: string,  // YYYY-MM-DD
  externalId?: string,
  source?: string
): string {
  if (externalId && source) {
    // Prefer stable external ID as fingerprint base
    return crypto.createHash("sha256")
      .update(`${source}|${externalId}`, "utf8")
      .digest("hex");
  }

  const normalizedUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, "").trim();
  const normalizedChat = chat.toLowerCase().replace(/[^a-z0-9_]/g, "").trim();
  const normalizedText = text
    .toLowerCase()
    .replace(/[^\wа-яёА-ЯЁ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);

  return crypto.createHash("sha256")
    .update(`${normalizedUsername}|${normalizedChat}|${normalizedText}|${approximateDate}`, "utf8")
    .digest("hex");
}

// §23 ТЗ Offer mapping
export function mapOffer(qual: QualificationResult): string {
  if (qual.recommended_offer && qual.recommended_offer !== "GENERAL") {
    return qual.recommended_offer;
  }
  if (qual.intent === "DELIVERY" && ["KZ", "UNKNOWN"].includes(qual.country)) {
    return "GROUPAGE_DELIVERY";
  }
  if (qual.intent === "EXISTING_SUPPLIER" && qual.country === "KZ") {
    return "EXISTING_SUPPLIER_DELIVERY";
  }
  if (qual.intent === "EXISTING_SUPPLIER") {
    return "REGULAR_IMPORT";
  }
  if (qual.intent === "SUPPLIER_SEARCH") {
    return "SUPPLIER_SEARCH";
  }
  return "GENERAL";
}
