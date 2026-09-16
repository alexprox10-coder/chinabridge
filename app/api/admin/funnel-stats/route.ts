import { NextResponse } from "next/server";
import { getLeads } from "@/lib/crm/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const leads = await getLeads();

    const byVertical: Record<string, number> = {};
    const byCountry:  Record<string, number> = {};
    const now = Date.now();
    const d7  = 7 * 24 * 60 * 60 * 1000;

    let week_leads = 0;
    for (const lead of leads) {
      const v = lead.vertical ?? "other";
      byVertical[v] = (byVertical[v] ?? 0) + 1;

      const dest = lead.country_destination;
      const country = dest && dest.toLowerCase().includes("kazak") ? "KZ" : "RU";
      byCountry[country] = (byCountry[country] ?? 0) + 1;

      if (now - new Date(lead.created_at ?? 0).getTime() < d7) week_leads++;
    }

    return NextResponse.json({
      lead_created:    leads.length,
      week_leads,
      hot:             leads.filter(l => l.priority === "HOT").length,
      quote:           leads.filter(l => l.status === "OFFER_SENT").length,
      deal:            leads.filter(l => l.status === "SUCCESS").length,
      calculator_used: leads.filter(l => l.calculator_used).length,
      by_vertical:     byVertical,
      by_country:      byCountry,
      last_updated:    new Date().toISOString(),
    });
  } catch (e) {
    console.error("[funnel-stats]", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
