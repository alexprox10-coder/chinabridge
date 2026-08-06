import { NextRequest, NextResponse } from "next/server";
import { fetchContentData } from "@/lib/ai-company/content/data";
import { generateContentDirectorReport } from "@/lib/ai-company/content/director";
import { isAuthorized } from "@/lib/api-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { kpis, health, seo, telegram, youtube, shorts, imageAI } = await fetchContentData();
    const report = await generateContentDirectorReport(kpis, health, seo, telegram, youtube, shorts, imageAI);
    return NextResponse.json({ ok: true, report });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
