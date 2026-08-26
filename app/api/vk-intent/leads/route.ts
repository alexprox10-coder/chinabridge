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
  const tier     = searchParams.get("tier") ?? "";
  const limit    = Math.min(Number(searchParams.get("limit") ?? "50"), 200);
  const stats    = searchParams.get("stats") === "1";
  const checkVk  = searchParams.get("check_vk") === "1";

  if (checkVk) {
    const { getVkToken } = await import("@/lib/vk-intent/tokens");
    const token = await getVkToken(dbUrl).catch(() => null);
    // Service token also counts as connected
    const serviceToken = process.env.VK_SERVICE_TOKEN ?? "";
    return NextResponse.json({ vk_connected: !!token || !!serviceToken });
  }

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

export async function DELETE(req: NextRequest) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return NextResponse.json({ error: "no db" }, { status: 500 });
  try {
    const body = await req.json().catch(() => ({})) as { ids?: number[]; all?: boolean };
    const sql  = neon(dbUrl);
    if (body.all) {
      await sql`DELETE FROM vk_intent_leads`;
      return NextResponse.json({ ok: true, deleted: "all" });
    }
    if (Array.isArray(body.ids) && body.ids.length > 0) {
      await sql`DELETE FROM vk_intent_leads WHERE id = ANY(${body.ids})`;
      return NextResponse.json({ ok: true, deleted: body.ids.length });
    }
    return NextResponse.json({ error: "pass ids or all:true" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const postsPerQuery = Math.min(Math.max(Number(body.postsPerQuery ?? 20), 5), 100);
  const queriesCount  = Math.min(Math.max(Number(body.queriesCount  ??  4), 1),  14);
  try {
    const result = await runIntentPipeline({ postsPerQuery, queriesCount });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
