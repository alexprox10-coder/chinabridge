import { NextRequest, NextResponse } from "next/server";
import { getFinanceSettings, updateSetting } from "@/lib/finance/api";
import { isAuthorized, getTenantId } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = getTenantId(req);
  const settings = await getFinanceSettings(tenantId);
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const updates: Array<{ id: number; value: string }> = body.updates ?? [];
    const results = await Promise.all(updates.map((u) => updateSetting(u.id, u.value)));
    const ok = results.every(Boolean);
    return NextResponse.json({ ok });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
