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

// §ТЗ: final_score = MIN(lead_score, 30 + 0.7 * evidence_score)
export function calcFinalScore(leadScore: number, evidenceScore: number): number {
  const cap = 30 + 0.7 * evidenceScore;
  return Math.round(Math.min(leadScore, cap));
}

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

// Fingerprint for deduplication: sha256(normalized fields)
export function buildFingerprint(
  username: string,
  chat: string,
  text: string,
  approximateDate: string  // e.g. "2026-09-19"
): string {
  const normalizedUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, "").trim();
  const normalizedChat = chat.toLowerCase().replace(/[^a-z0-9_]/g, "").trim();
  // Normalize text: lowercase, collapse whitespace, remove punctuation
  const normalizedText = text
    .toLowerCase()
    .replace(/[^\wа-яёА-ЯЁ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200); // cap to first 200 chars for stability

  const payload = `${normalizedUsername}|${normalizedChat}|${normalizedText}|${approximateDate}`;
  return crypto.createHash("sha256").update(payload, "utf8").digest("hex");
}
