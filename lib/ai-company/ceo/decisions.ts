import type { DepartmentReport } from "../types";
import type { CeoDecision, Priority } from "./types";

function toPriority(status: string): Priority {
  return status === "CRITICAL" ? "HIGH" : status === "WARNING" ? "MEDIUM" : "LOW";
}

export function generateDecisions(depts: DepartmentReport[]): CeoDecision[] {
  const now = new Date().toISOString();
  const decisions: CeoDecision[] = [];

  depts
    .filter(d => d.status !== "IDLE" && d.recommendations.length > 0)
    .forEach(dept => {
      dept.recommendations.forEach((rec, i) => {
        decisions.push({
          id: `dec-${dept.id}-${i}`,
          source: dept.nameRu,
          deptId: dept.id,
          title: rec,
          reason: dept.problems[0] ?? "Стратегическое улучшение показателей",
          expectedEffect: "Рост эффективности и KPI отдела",
          priority: toPriority(dept.status),
          status: "NEW",
          createdAt: dept.lastUpdated ?? now,
          updatedAt: dept.lastUpdated ?? now,
        });
      });
    });

  return decisions.sort((a, b) => {
    const p: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return (p[a.priority] ?? 1) - (p[b.priority] ?? 1);
  });
}
