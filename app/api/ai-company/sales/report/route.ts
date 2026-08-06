import { NextRequest, NextResponse } from "next/server";
import { fetchAllSalesData } from "@/lib/ai-company/sales/data";
import { generateSalesDirectorReport } from "@/lib/ai-company/sales/director";
import type { SalesDirectorReport } from "@/lib/ai-company/sales/types";
import { isAuthorized } from "@/lib/api-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  try {
    const { importLeads, platformLeads, pipelineHealth, followupQueue, kpis } = await fetchAllSalesData();
    const director = await generateSalesDirectorReport(kpis, pipelineHealth, importLeads, platformLeads, followupQueue);

    const report: SalesDirectorReport = {
      summary: director.summary,
      kpis,
      pipelineHealth,
      importLeads,
      platformLeads,
      followupQueue,
      recommendations: director.recommendations,
      tasks: director.tasks,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, report });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
