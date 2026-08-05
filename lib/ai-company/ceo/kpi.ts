import type { DepartmentReport } from "../types";
import type { KpiTarget } from "./types";

export function generateKpis(depts: DepartmentReport[]): KpiTarget[] {
  return depts
    .filter(d => d.status !== "IDLE")
    .flatMap(dept =>
      dept.kpis.slice(0, 2).map(kpi => ({
        deptId:   dept.id,
        deptName: dept.nameRu,
        icon:     dept.icon,
        metric:   kpi.label,
        current:  kpi.value,
        target:   kpi.target ?? "—",
        unit:     "",
        trend:    kpi.trend ?? "stable",
      } as KpiTarget))
    );
}
