import { NextRequest, NextResponse } from "next/server";
import { fetchFinanceData } from "@/lib/ai-company/finance/data";
import { generateFinanceDirectorReport } from "@/lib/ai-company/finance/director";
import { isAuthorized } from "@/lib/api-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { revenue, costs, profit, unitEconomics, forecast, saas, health } =
    await fetchFinanceData();

  const report = await generateFinanceDirectorReport(
    health, revenue, costs, profit, unitEconomics, forecast, saas,
  );

  return NextResponse.json({ ok: true, report });
}
