import { NextRequest, NextResponse } from "next/server";
import { enrichLead } from "@/lib/ai-sales/enrich";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Called by n8n every 30 min to auto-enrich NEW leads.
// Auth: X-Api-Key header must match INTERNAL_API_KEY env var.
export async function POST(req: NextRequest) {
  const key = req.headers.get("x-api-key");
  if (!key || key !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const batchSize = Math.min(Number(body.batchSize ?? 5), 10);

  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL!);

  // Pick up to batchSize NEW leads not yet analyzed
  const rows = await sql`
    SELECT id, name, company
    FROM crm_leads
    WHERE status = 'NEW'
      AND (ai_analyzed_at IS NULL OR ai_analyzed_at = '')
      AND tenant_id = 'tenant-chinabridge'
    ORDER BY created_at ASC
    LIMIT ${batchSize}
  `;

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, results: [] });
  }

  // Enrich sequentially to stay within OpenRouter rate limits
  const results = [];
  for (const row of rows) {
    const r = await enrichLead(row.id as number);
    results.push(r);
    // Small pause between calls
    await new Promise((res) => setTimeout(res, 500));
  }

  const hot = results.filter((r) => r.ok && r.scoreLevel === "HOT");
  const warm = results.filter((r) => r.ok && r.scoreLevel === "WARM");
  const cold = results.filter((r) => r.ok && r.scoreLevel === "COLD");
  const failed = results.filter((r) => !r.ok);

  return NextResponse.json({
    ok: true,
    processed: results.length,
    hot: hot.length,
    warm: warm.length,
    cold: cold.length,
    failed: failed.length,
    results: results.map((r) => ({
      leadId: r.leadId,
      ok: r.ok,
      scoreLevel: r.scoreLevel,
      leadScore: r.leadScore,
      selectedProduct: r.selectedProduct,
      businessSummary: r.businessSummary,
      error: r.error,
    })),
  });
}
