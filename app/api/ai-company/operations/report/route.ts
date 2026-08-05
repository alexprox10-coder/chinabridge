import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchOperationsData } from "@/lib/ai-company/operations/data";
import { generateOperationsDirectorReport } from "@/lib/ai-company/operations/director";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  if (!cookieStore.get("cb_admin")?.value) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { deals, partners, cargos, documents, clients, kpis, health, risks } =
    await fetchOperationsData();

  const report = await generateOperationsDirectorReport(
    health, kpis, deals, partners, cargos, documents, clients, risks,
  );

  return NextResponse.json({ ok: true, report });
}
