import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchFinanceData } from "@/lib/ai-company/finance/data";
import { generateFinanceDirectorReport } from "@/lib/ai-company/finance/director";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  if (!cookieStore.get("cb_admin")?.value) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { revenue, costs, profit, unitEconomics, forecast, saas, health } =
    await fetchFinanceData();

  const report = await generateFinanceDirectorReport(
    health, revenue, costs, profit, unitEconomics, forecast, saas,
  );

  return NextResponse.json({ ok: true, report });
}
