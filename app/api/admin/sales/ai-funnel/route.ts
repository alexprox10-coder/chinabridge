import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest) {
  return !!(req.cookies.get("cb_admin")?.value || req.cookies.get("cb_tenant_session")?.value);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL!);

  const [scoreRows, stageRows, recentRows, pendingRow] = await Promise.all([
    // HOT/WARM/COLD distribution + revenue potential
    sql`
      SELECT
        ai_score_level,
        COUNT(*) AS cnt,
        COALESCE(SUM(CAST(ai_potential_min AS numeric)), 0) AS potential_min_sum,
        COALESCE(SUM(CAST(ai_potential_max AS numeric)), 0) AS potential_max_sum,
        ROUND(AVG(CAST(ai_lead_score AS numeric)), 1) AS avg_score
      FROM crm_leads
      WHERE tenant_id = 'tenant-chinabridge'
        AND ai_score_level IS NOT NULL
      GROUP BY ai_score_level
    `,

    // Pipeline stage counts
    sql`
      SELECT status, COUNT(*) AS cnt
      FROM crm_leads
      WHERE tenant_id = 'tenant-chinabridge'
      GROUP BY status
      ORDER BY cnt DESC
    `,

    // Last 5 enriched leads
    sql`
      SELECT id, company, name, ai_score_level, ai_lead_score, ai_selected_product,
             ai_business_summary, ai_analyzed_at
      FROM crm_leads
      WHERE tenant_id = 'tenant-chinabridge'
        AND ai_analyzed_at IS NOT NULL
        AND ai_analyzed_at != ''
      ORDER BY ai_analyzed_at DESC
      LIMIT 5
    `,

    // Count NEW leads pending enrichment
    sql`
      SELECT COUNT(*) AS cnt
      FROM crm_leads
      WHERE tenant_id = 'tenant-chinabridge'
        AND status = 'NEW'
        AND (ai_analyzed_at IS NULL OR ai_analyzed_at = '')
    `,
  ]);

  const scoreMap: Record<string, { count: number; potentialMin: number; potentialMax: number; avgScore: number }> = {};
  for (const r of scoreRows) {
    scoreMap[r.ai_score_level as string] = {
      count: Number(r.cnt),
      potentialMin: Number(r.potential_min_sum),
      potentialMax: Number(r.potential_max_sum),
      avgScore: Number(r.avg_score),
    };
  }

  const hot = scoreMap["HOT"] ?? { count: 0, potentialMin: 0, potentialMax: 0, avgScore: 0 };
  const warm = scoreMap["WARM"] ?? { count: 0, potentialMin: 0, potentialMax: 0, avgScore: 0 };
  const cold = scoreMap["COLD"] ?? { count: 0, potentialMin: 0, potentialMax: 0, avgScore: 0 };
  const totalEnriched = hot.count + warm.count + cold.count;

  const STAGE_ORDER = [
    "NEW", "RESEARCHED", "CONTACTED", "QUALIFICATION",
    "CALCULATION", "OFFER_SENT", "NEGOTIATION",
    "WAITING_CLIENT", "PAYMENT", "DELIVERY", "SUCCESS", "LOST",
  ];
  const stageMap: Record<string, number> = {};
  for (const r of stageRows) stageMap[r.status as string] = Number(r.cnt);
  const stages = STAGE_ORDER.map(s => ({ status: s, count: stageMap[s] ?? 0 }));

  const recentEnrichments = recentRows.map(r => ({
    id: r.id,
    company: r.company,
    name: r.name,
    scoreLevel: r.ai_score_level,
    leadScore: r.ai_lead_score,
    selectedProduct: r.ai_selected_product,
    businessSummary: (r.ai_business_summary as string | null)?.slice(0, 120),
    analyzedAt: r.ai_analyzed_at,
  }));

  return NextResponse.json({
    scores: { hot, warm, cold, totalEnriched },
    revenue: {
      totalMin: hot.potentialMin + warm.potentialMin + cold.potentialMin,
      totalMax: hot.potentialMax + warm.potentialMax + cold.potentialMax,
      hotMin: hot.potentialMin,
      hotMax: hot.potentialMax,
    },
    stages,
    recentEnrichments,
    pendingEnrichment: Number((pendingRow[0] as { cnt: unknown })?.cnt ?? 0),
  });
}
