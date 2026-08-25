import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { runIntentPipeline } from "@/lib/vk-intent/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return NextResponse.json([]);

  const { searchParams } = new URL(req.url);
  const tier    = searchParams.get("tier") ?? "";
  const limit   = Math.min(Number(searchParams.get("limit") ?? "50"), 200);
  const stats   = searchParams.get("stats") === "1";

  const sql = neon(dbUrl);
  try {
    if (stats) {
      const rows = await sql`
        SELECT
          COUNT(*)                                               AS total,
          COUNT(*) FILTER (WHERE tier = 'HOT')                  AS hot,
          COUNT(*) FILTER (WHERE tier = 'WARM')                 AS warm,
          ROUND(AVG(score)::numeric, 1)                         AS avg_score,
          MAX(created_at)                                       AS last_run
        FROM vk_intent_leads
      `;
      return NextResponse.json(rows[0] ?? {});
    }

    const rows = tier
      ? await sql`SELECT * FROM vk_intent_leads WHERE tier = ${tier} ORDER BY score DESC LIMIT ${limit}`
      : await sql`SELECT * FROM vk_intent_leads ORDER BY score DESC, created_at DESC LIMIT ${limit}`;
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST() {
  try {
    const result = await runIntentPipeline();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
