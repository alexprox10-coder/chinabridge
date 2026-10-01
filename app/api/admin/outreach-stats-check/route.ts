import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const TOKEN = "cb-stats-check-7f2a";

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const [bySource, byStatus, total] = await Promise.all([
      sql`SELECT COALESCE(source, 'null') as source, COUNT(*)::int as cnt FROM outreach_contacts GROUP BY source`,
      sql`SELECT status, COUNT(*)::int as cnt FROM outreach_contacts GROUP BY status`,
      sql`SELECT COUNT(*)::int as cnt FROM outreach_contacts`,
    ]);
    return NextResponse.json({ ok: true, total: total[0]?.cnt, bySource, byStatus });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
