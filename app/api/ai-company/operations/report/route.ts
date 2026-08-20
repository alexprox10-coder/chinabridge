import { NextRequest, NextResponse } from "next/server";
import { fetchOperationsData } from "@/lib/ai-company/operations/data";
import { generateOperationsDirectorReport } from "@/lib/ai-company/operations/director";
import { isAuthorized } from "@/lib/api-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { deals, partners, cargos, documents, clients, kpis, health, risks, connected } =
    await fetchOperationsData();

  const report = await generateOperationsDirectorReport(
    health, kpis, deals, partners, cargos, documents, clients, risks, connected,
  );

  return NextResponse.json({ ok: true, report, connected });
}
