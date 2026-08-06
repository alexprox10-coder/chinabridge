import { NextRequest, NextResponse } from "next/server";
import { isAdminOnly } from "@/lib/api-auth";
import { getLatestCtoReport, getCtoReportHistory, getCtoReportById } from "@/lib/ai-cto/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isAdminOnly(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const report = await getCtoReportById(Number(id));
    return NextResponse.json({ ok: true, report });
  }

  const history = req.nextUrl.searchParams.get("history");
  if (history) {
    const reports = await getCtoReportHistory(30);
    return NextResponse.json({ ok: true, reports });
  }

  const latest = await getLatestCtoReport();
  return NextResponse.json({ ok: true, report: latest });
}
