import { NextRequest, NextResponse } from "next/server";
import { isAuthorized, getTenantId } from "@/lib/api-auth";
import { logOnboardingEvent } from "@/lib/onboarding/demo-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });

  const tenantId = getTenantId(req);
  const body     = await req.json().catch(() => ({})) as { step?: string; action?: string; data?: Record<string, unknown> };

  if (body.step && body.action) {
    await logOnboardingEvent(tenantId, body.step, body.action, body.data ?? {});
  }
  return NextResponse.json({ ok: true });
}
