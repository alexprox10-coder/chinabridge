import type { DepartmentReport } from "../types";
import type { CeoTask } from "./types";

export function generateInitialTasks(depts: DepartmentReport[]): CeoTask[] {
  const d7  = new Date(Date.now() + 7  * 86400000).toISOString();
  const d14 = new Date(Date.now() + 14 * 86400000).toISOString();

  return depts
    .filter(d => d.status !== "IDLE" && d.recommendations.length > 0)
    .slice(0, 7)
    .map((dept, i) => {
      const rec = dept.recommendations[0];
      return {
        id: `task-init-${dept.id}`,
        title: rec.length > 72 ? rec.slice(0, 69) + "…" : rec,
        description: rec,
        deptId: dept.id,
        deptName: dept.nameRu,
        assignee: dept.director,
        priority: dept.status === "CRITICAL" ? "HIGH" : dept.status === "WARNING" ? "MEDIUM" : "LOW",
        status: "PENDING",
        createdAt: dept.lastUpdated,
        deadline: i < 4 ? d7 : d14,
        decisionId: `dec-${dept.id}-0`,
      } as CeoTask;
    });
}
