import type { CheckResult, CheckSection, CheckStatus } from "./types";

function checkScore(status: CheckStatus): number {
  if (status === "OK")      return 100;
  if (status === "WARNING") return 50;
  if (status === "ERROR")   return 0;
  return 100; // SKIP = neutral
}

export function scoreSection(checks: CheckResult[]): { score: number; status: CheckStatus } {
  const scored = checks.filter(c => c.status !== "SKIP");
  if (!scored.length) return { score: 100, status: "OK" };
  const avg = scored.reduce((s, c) => s + checkScore(c.status), 0) / scored.length;
  const score = Math.round(avg);
  const status: CheckStatus =
    checks.some(c => c.status === "ERROR")   ? "ERROR"   :
    checks.some(c => c.status === "WARNING") ? "WARNING" : "OK";
  return { score, status };
}

// Weights per section (sum = 100)
const WEIGHTS: Record<string, number> = {
  api:          20,
  database:     15,
  performance:  10,
  seo:           8,
  security:     12,
  ai_providers:  8,
  crm:          10,
  payments:     12,
  telegram:      5,
};

export function calcHealthScore(sections: CheckSection[]): number {
  let weighted = 0;
  let totalWeight = 0;
  for (const s of sections) {
    const w = WEIGHTS[s.id] ?? 5;
    weighted += s.score * w;
    totalWeight += w;
  }
  if (!totalWeight) return 100;
  return Math.round(weighted / totalWeight);
}
