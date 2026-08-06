import { NextRequest, NextResponse } from "next/server";
import { fetchStrategyData } from "@/lib/ai-company/strategy/data";
import { generateStrategyDirectorReport } from "@/lib/ai-company/strategy/director";
import { isAuthorized } from "@/lib/api-auth";

export const runtime    = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const data   = fetchStrategyData();
  const report = await generateStrategyDirectorReport(data);
  return NextResponse.json({ ok: true, report });
}
