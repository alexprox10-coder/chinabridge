import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getLeads } from "@/lib/crm/client";
import { analyzeDealIntelligence } from "@/lib/market-intelligence/deal-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getTenantId() {
  const store = await cookies();
  return store.get("cb_tenant_id")?.value ?? "tenant-chinabridge";
}

export async function GET() {
  const tenantId = await getTenantId();
  const leads = await getLeads({ tenantId });
  const result = analyzeDealIntelligence(leads);
  return NextResponse.json(result);
}
