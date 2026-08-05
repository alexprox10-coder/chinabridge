import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildAllDepartments, buildCompanyMetrics } from "@/lib/ai-company/departments";
import { generateDecisions }    from "@/lib/ai-company/ceo/decisions";
import { generateNotifications } from "@/lib/ai-company/ceo/notifications";
import { generateKpis }          from "@/lib/ai-company/ceo/kpi";
import { generateCeoAiReport }   from "@/lib/ai-company/ceo/director";
import type { DeptSummary, CeoMetrics } from "@/lib/ai-company/ceo/types";
import type { DepartmentReport }  from "@/lib/ai-company/types";

export const runtime     = "nodejs";
export const maxDuration = 60;

function calcHealth(depts: DepartmentReport[]): number {
  const active = depts.filter(d => d.status !== "IDLE");
  if (!active.length) return 50;
  const scores = active.map(d => d.status === "GOOD" ? 85 : d.status === "WARNING" ? 55 : 30);
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function toSummary(dept: DepartmentReport): DeptSummary {
  return {
    id:              dept.id,
    nameRu:          dept.nameRu,
    icon:            dept.icon,
    director:        dept.director,
    status:          dept.status as DeptSummary["status"],
    kpis:            dept.kpis,
    problems:        dept.problems,
    recommendations: dept.recommendations,
    agents:          dept.agents.map(a => ({ name: a.name, connected: a.connected })),
    lastUpdated:     dept.lastUpdated,
  };
}

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  if (!cookieStore.get("cb_admin")?.value) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const depts       = await buildAllDepartments();
  const compMetrics = await buildCompanyMetrics(depts);
  const summaries   = depts.map(toSummary);
  const healthScore = calcHealth(depts);
  const compStatus  = healthScore >= 70 ? "GOOD" : healthScore >= 45 ? "WARNING" : "CRITICAL";

  // Derive revenue / mrr from Finance KPIs
  const fin     = depts.find(d => d.id === "finance");
  const revKpi  = fin?.kpis.find(k => k.label.includes("Выручка"));
  const mrrKpi  = fin?.kpis.find(k => String(k.label).includes("MRR") || String(k.label).includes("mrr"));

  const metrics: CeoMetrics = {
    revenue:       String(revKpi?.value ?? "—"),
    mrr:           String(mrrKpi?.value ?? "—"),
    leads:         compMetrics.leads,
    conversion:    compMetrics.conversion,
    activeDeals:   compMetrics.activeDeals,
    openTasks:     0,
    criticalCount: depts.filter(d => d.status === "CRITICAL").length,
    deptsOnline:   depts.filter(d => d.status !== "IDLE").length,
  };

  const [decisions, notifications, kpis, aiReport] = await Promise.all([
    Promise.resolve(generateDecisions(depts)),
    Promise.resolve(generateNotifications(depts)),
    Promise.resolve(generateKpis(depts)),
    generateCeoAiReport(healthScore, summaries, metrics),
  ]);

  return NextResponse.json({
    ok: true,
    report: {
      healthScore,
      companyStatus: compStatus,
      depts:         summaries,
      metrics,
      decisions,
      notifications,
      kpis,
      aiReport,
      generatedAt: new Date().toISOString(),
    },
  });
}
