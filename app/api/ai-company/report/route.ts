import { NextRequest, NextResponse } from "next/server";
import { buildAllDepartments, buildCompanyMetrics } from "@/lib/ai-company/departments";
import { generateCeoReport } from "@/lib/ai-company/ceo";
import type { CeoReport } from "@/lib/ai-company/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authCookie = req.cookies.get("cb_admin")?.value;
  if (!authCookie) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const departments = await buildAllDepartments();
    const metrics = await buildCompanyMetrics(departments);
    const ceo = await generateCeoReport(departments, metrics);

    const report: CeoReport = {
      companyHealth: ceo.companyHealth,
      healthScore: ceo.healthScore,
      summary: ceo.summary,
      metrics,
      departments,
      recommendations: ceo.recommendations,
      tasks: ceo.tasks,
      generatedAt: new Date().toISOString(),
      period: "week",
    };

    return NextResponse.json({ ok: true, report });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
