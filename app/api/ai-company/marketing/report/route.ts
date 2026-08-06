import { NextRequest, NextResponse } from "next/server";
import { fetchMarketingData } from "@/lib/ai-company/marketing/data";
import { generateMarketingDirectorReport } from "@/lib/ai-company/marketing/director";
import { isAuthorized } from "@/lib/api-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { kpis, funnel, health, ads, seo, channels } = await fetchMarketingData();
    const report = await generateMarketingDirectorReport(kpis, funnel, health, ads, seo, channels);
    return NextResponse.json({ ok: true, report });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
