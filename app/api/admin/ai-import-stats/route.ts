import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest) {
  return !!(req.cookies.get("cb_admin")?.value || req.cookies.get("cb_tenant_session")?.value);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sql = neon(process.env.DATABASE_URL!);

  const [today, week, total, handoffs, anonToday, tgToday, recentSessions] = await Promise.all([
    // Sessions today (distinct)
    sql`SELECT COUNT(DISTINCT session_id)::int AS cnt FROM ai_usage WHERE created_at::date = CURRENT_DATE AND session_id IS NOT NULL`.then(r => r[0]?.cnt ?? 0),
    // Sessions this week
    sql`SELECT COUNT(DISTINCT session_id)::int AS cnt FROM ai_usage WHERE created_at >= NOW() - INTERVAL '7 days' AND session_id IS NOT NULL`.then(r => r[0]?.cnt ?? 0),
    // Total sessions all time
    sql`SELECT COUNT(DISTINCT session_id)::int AS cnt FROM ai_usage WHERE session_id IS NOT NULL`.then(r => r[0]?.cnt ?? 0),
    // Handoffs = analyses with status 'submitted'
    sql`SELECT COUNT(*)::int AS cnt FROM ai_analyses WHERE status = 'submitted'`.then(r => r[0]?.cnt ?? 0),
    // Anonymous sessions today
    sql`SELECT COUNT(DISTINCT session_id)::int AS cnt FROM ai_usage WHERE created_at::date = CURRENT_DATE AND (user_telegram LIKE 'anon-%' OR user_telegram = '') AND session_id IS NOT NULL`.then(r => r[0]?.cnt ?? 0),
    // Telegram sessions today
    sql`SELECT COUNT(DISTINCT session_id)::int AS cnt FROM ai_usage WHERE created_at::date = CURRENT_DATE AND user_telegram NOT LIKE 'anon-%' AND user_telegram != '' AND session_id IS NOT NULL`.then(r => r[0]?.cnt ?? 0),
    // Recent sessions last 10
    sql`SELECT s.id, s.created_at, s.user_telegram, s.title, s.status,
          (SELECT COUNT(*)::int FROM ai_messages m WHERE m.session_id = s.id) AS msg_count,
          (SELECT COUNT(*)::int FROM ai_analyses a WHERE a.session_id = s.id AND a.status = 'submitted') AS handoffs
        FROM ai_sessions s
        ORDER BY s.created_at DESC LIMIT 10`.catch(() => []),
  ]);

  // Daily stats for last 7 days
  const daily = await sql`
    SELECT created_at::date AS day, COUNT(DISTINCT session_id)::int AS sessions
    FROM ai_usage
    WHERE created_at >= NOW() - INTERVAL '7 days' AND session_id IS NOT NULL
    GROUP BY day ORDER BY day DESC
  `.catch(() => []);

  return NextResponse.json({
    ok: true,
    stats: { today, week, total, handoffs, anonToday, tgToday },
    daily,
    recentSessions,
  });
}
