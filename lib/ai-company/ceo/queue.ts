import type { CeoDecision } from "./types";

export function sortQueue(decisions: CeoDecision[]): CeoDecision[] {
  const p: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  const s: Record<string, number> = { NEW: 0, APPROVED: 1, IN_PROGRESS: 2, DONE: 3, REJECTED: 4 };
  return [...decisions].sort((a, b) => {
    const sd = (s[a.status] ?? 5) - (s[b.status] ?? 5);
    return sd !== 0 ? sd : (p[a.priority] ?? 1) - (p[b.priority] ?? 1);
  });
}
