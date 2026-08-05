import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchContentData } from "@/lib/ai-company/content/data";
import { generateContentDirectorReport } from "@/lib/ai-company/content/director";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  if (!cookieStore.get("cb_admin")?.value) {
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
