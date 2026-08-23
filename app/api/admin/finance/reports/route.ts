import { NextRequest, NextResponse } from "next/server";
import { getFinanceReport } from "@/lib/finance/api";
import { isAuthorized, getTenantId } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = getTenantId(req);
  const report = await getFinanceReport(tenantId);
  return NextResponse.json({ report });
}
