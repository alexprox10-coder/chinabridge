import { NextRequest, NextResponse } from "next/server";
import { isAuthorized, getTenantId } from "@/lib/api-auth";
import { seedDemoLeads, logOnboardingEvent } from "@/lib/onboarding/demo-data";

export const runtime     = "nodejs";
export const maxDuration = 30;
export const dynamic     = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = getTenantId(req);
  const body     = await req.json().catch(() => ({})) as { name?: string; country?: string; industry?: string; employees?: string };

  const seeded = await seedDemoLeads(tenantId);

  await logOnboardingEvent(tenantId, "company", "setup", {
    companyName: body.name,
    country:     body.country,
    industry:    body.industry,
    employees:   body.employees,
    seededLeads: seeded,
  });

  return NextResponse.json({
    ok:      true,
    seeded,
    metrics: {
      leads:   10,
      deals:   3,
      revenue: 287000,
    },
  });
}
