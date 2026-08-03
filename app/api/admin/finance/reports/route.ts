import { NextResponse } from "next/server";
import { getFinanceReport } from "@/lib/finance/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const report = await getFinanceReport();
  return NextResponse.json({ report });
}
