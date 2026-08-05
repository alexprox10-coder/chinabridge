import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchStrategyData } from "@/lib/ai-company/strategy/data";
import { generateStrategyDirectorReport } from "@/lib/ai-company/strategy/director";

export const runtime    = "nodejs";
export const maxDuration = 60;

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  if (!cookieStore.get("cb_admin")?.value) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const data   = fetchStrategyData();
  const report = await generateStrategyDirectorReport(data);
  return NextResponse.json({ ok: true, report });
}
