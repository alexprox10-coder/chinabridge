import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchAnalyticsData } from "@/lib/ai-company/analytics/data";
import { generateAnalyticsDirectorReport } from "@/lib/ai-company/analytics/director";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  if (!cookieStore.get("cb_admin")?.value) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { sales, marketing, content, finance, health, insights } = await fetchAnalyticsData();
  const report = await generateAnalyticsDirectorReport(health, sales, marketing, content, finance, insights);

  return NextResponse.json({ ok: true, report });
}
