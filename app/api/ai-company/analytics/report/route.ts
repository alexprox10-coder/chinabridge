import { NextRequest, NextResponse } from "next/server";
import { fetchAnalyticsData } from "@/lib/ai-company/analytics/data";
import { generateAnalyticsDirectorReport } from "@/lib/ai-company/analytics/director";
import { isAuthorized } from "@/lib/api-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { sales, marketing, content, finance, health, insights } = await fetchAnalyticsData();
  const report = await generateAnalyticsDirectorReport(health, sales, marketing, content, finance, insights);

  return NextResponse.json({ ok: true, report });
}
