import { NextRequest, NextResponse } from "next/server";
import { getLeads, getDashboardStats } from "@/lib/crm/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") ?? undefined;
  const priority = searchParams.get("priority") ?? undefined;
  const stats = searchParams.get("stats") === "1";

  if (stats) {
    const data = await getDashboardStats();
    return NextResponse.json(data);
  }

  const leads = await getLeads({ status, priority });
  return NextResponse.json(leads);
}
