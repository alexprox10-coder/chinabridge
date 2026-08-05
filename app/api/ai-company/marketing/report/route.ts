import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchMarketingData } from "@/lib/ai-company/marketing/data";
import { generateMarketingDirectorReport } from "@/lib/ai-company/marketing/director";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  if (!cookieStore.get("cb_admin")?.value) {
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
