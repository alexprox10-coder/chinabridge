import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

function requireAdmin(req: NextRequest): boolean {
  // Cookie-based auth (existing admin session)
  const adminCookie = req.cookies.get("cb_admin")?.value;
  if (adminCookie) return true;

  // Secret-based auth (CALC_ADMIN_SECRET via Authorization header or query param)
  const secret = process.env.CALC_ADMIN_SECRET;
  if (secret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader === `Bearer ${secret}`) return true;
    if (req.nextUrl.searchParams.get("secret") === secret) return true;
  }

  return false;
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Funnel events counts (last 30 days)
    const eventCounts = await sql`
      SELECT event_name, COUNT(*) AS cnt
      FROM calc_funnel_events
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY event_name
      ORDER BY cnt DESC
    `.catch(() => [] as Array<{ event_name: string; cnt: number | string }>);

    // Subscriptions stats
    const subStats = await sql`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE subscribed_until > NOW()) AS active,
        MIN(created_at) AS first_payment,
        MAX(created_at) AS last_payment
      FROM calc_subscriptions
    `.catch(() => [] as Array<Record<string, unknown>>);

    // Pending payments stats (last 30 days)
    const pendingStats = await sql`
      SELECT status, COUNT(*) AS cnt
      FROM calc_pending_payments
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY status
      ORDER BY cnt DESC
    `.catch(() => [] as Array<{ status: string; cnt: number | string }>);

    // Daily payment success (last 14 days)
    const dailyPayments = await sql`
      SELECT DATE(created_at) AS day, COUNT(*) AS cnt
      FROM calc_pending_payments
      WHERE status IN ('claimed', 'auto_verified', 'verified', 'code_sent')
        AND created_at > NOW() - INTERVAL '14 days'
      GROUP BY day
      ORDER BY day
    `.catch(() => [] as Array<{ day: string; cnt: number | string }>);

    // Funnel events by day (last 14 days)
    const dailyEvents = await sql`
      SELECT DATE(created_at) AS day, event_name, COUNT(*) AS cnt
      FROM calc_funnel_events
      WHERE created_at > NOW() - INTERVAL '14 days'
      GROUP BY day, event_name
      ORDER BY day, event_name
    `.catch(() => [] as Array<{ day: string; event_name: string; cnt: number | string }>);

    // Mode breakdown (last 30 days from calc_mode_stats)
    const modeStats = await sql`
      SELECT mode, country, COUNT(*) AS cnt
      FROM calc_mode_stats
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY mode, country
      ORDER BY cnt DESC
    `.catch(() => [] as Array<{ mode: string; country: string | null; cnt: number | string }>);

    // Calculator step funnel (last 7 days from calc_step_events)
    const stepFunnel = await sql`
      SELECT
        step,
        COUNT(*)                                      AS total,
        COUNT(DISTINCT anonymous_id)                  AS users,
        COUNT(*) FILTER (WHERE country = 'KZ')        AS kz,
        COUNT(*) FILTER (WHERE country = 'RU')        AS ru,
        COUNT(*) FILTER (WHERE device  = 'mobile')    AS mobile,
        COUNT(*) FILTER (WHERE device  = 'desktop')   AS desktop
      FROM calc_step_events
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY step
    `.catch(() => [] as Array<Record<string, unknown>>);

    // Step funnel by calculator_mode (last 7 days)
    const stepByMode = await sql`
      SELECT step, calculator_mode, COUNT(DISTINCT anonymous_id) AS users
      FROM calc_step_events
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY step, calculator_mode
      ORDER BY step, users DESC
    `.catch(() => [] as Array<Record<string, unknown>>);

    const counts: Record<string, number> = {};
    for (const row of eventCounts) {
      counts[row.event_name] = Number(row.cnt);
    }

    return NextResponse.json({
      ok: true,
      funnel: {
        calc_view:        counts["calc_view"]        ?? 0,
        calc_done:        counts["calc_done"]        ?? 0,
        paywall_shown:    counts["paywall_shown"]    ?? 0,
        pro_click:        counts["pro_click"]        ?? 0,
        checkout_started: counts["checkout_started"] ?? 0,
        payment_success:  counts["payment_success"]  ?? 0,
        pro_activated:    counts["pro_activated"]    ?? 0,
      },
      subscriptions: subStats[0] ?? {},
      pendingByStatus: pendingStats,
      dailyPayments,
      dailyEvents,
      modeStats,
      stepFunnel,
      stepByMode,
    });
  } catch (err) {
    console.error("[admin/calc-funnel]", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
