import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRadarSignals } from "@/lib/market-intelligence/db";
import { runFullRadar } from "@/lib/market-intelligence/market-radar";

export const runtime     = "nodejs";
export const maxDuration = 60;
export const dynamic     = "force-dynamic";

async function getTenantId() {
  const store = await cookies();
  return store.get("cb_tenant_id")?.value ?? "tenant-chinabridge";
}

export async function GET(req: NextRequest) {
  const tenantId = await getTenantId();
  const type = req.nextUrl.searchParams.get("type") ?? undefined;
  const signals = await getRadarSignals(tenantId, type);
  return NextResponse.json(signals);
}

export async function POST(req: NextRequest) {
  const tenantId = await getTenantId();
  const body = await req.json().catch(() => ({}));
  const modules = body.modules as string[] ?? ["telegram", "competitors", "trends", "opportunities"];
  const result = await runFullRadar(tenantId);
  void modules;
  return NextResponse.json({ ok: true, ...result });
}
