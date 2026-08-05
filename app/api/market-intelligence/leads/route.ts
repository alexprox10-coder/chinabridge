import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMILeads, getMILeadStats, updateMILeadPipeline } from "@/lib/market-intelligence/db";
import { runLeadFinder } from "@/lib/market-intelligence/lead-finder";
import type { MILeadPipeline } from "@/lib/market-intelligence/types";

export const runtime     = "nodejs";
export const maxDuration = 60;
export const dynamic     = "force-dynamic";

async function getTenantId() {
  const store = await cookies();
  return store.get("cb_tenant_id")?.value ?? "tenant-chinabridge";
}

export async function GET(req: NextRequest) {
  const tenantId = await getTenantId();
  const { searchParams } = req.nextUrl;
  const source      = searchParams.get("source")      ?? undefined;
  const temperature = searchParams.get("temperature")  ?? undefined;
  const pipeline    = searchParams.get("pipeline")     ?? undefined;
  const stats       = searchParams.get("stats") === "1";

  if (stats) {
    const data = await getMILeadStats(tenantId);
    return NextResponse.json(data);
  }

  const leads = await getMILeads(tenantId, { source, temperature, pipeline });
  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const tenantId = await getTenantId();
  const body = await req.json().catch(() => ({}));
  const sources = body.sources ?? ["google", "telegram", "vk"];
  const limit   = Number(body.limit ?? 15);

  const result = await runLeadFinder(tenantId, sources, limit);
  return NextResponse.json({ ok: true, ...result });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { id, pipeline } = body as { id: number; pipeline: MILeadPipeline };
  if (!id || !pipeline) return NextResponse.json({ ok: false }, { status: 400 });
  await updateMILeadPipeline(id, pipeline);
  return NextResponse.json({ ok: true });
}
