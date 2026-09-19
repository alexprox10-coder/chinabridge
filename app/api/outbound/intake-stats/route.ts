// Admin stats for intake dashboard
// GET /api/outbound/intake-stats?days=7&stream=1&priority=HOT
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { runOutboundMigrations } from "@/lib/outbound/migrations";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const isAdmin = req.cookies.get("cb_admin")?.value;
  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: "admin only" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = Math.min(90, Math.max(1, Number(searchParams.get("days") ?? 7)));
  const stream = searchParams.get("stream") ? Number(searchParams.get("stream")) : null;
  const priority = searchParams.get("priority") ?? null;
  const intent = searchParams.get("intent") ?? null;
  const approval = searchParams.get("approval") ?? null;
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50)));
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));

  try {
    await runOutboundMigrations();
    const sql = neon(process.env.DATABASE_URL!);

    // KPI tiles
    const [kpi] = await sql`
      SELECT
        COUNT(*)                                                     AS total,
        COUNT(*) FILTER (WHERE priority = 'HOT')                     AS hot,
        COUNT(*) FILTER (WHERE priority = 'HIGH')                    AS high,
        COUNT(*) FILTER (WHERE priority = 'MEDIUM')                  AS medium,
        COUNT(*) FILTER (WHERE intent = 'NOISE' OR final_score < 5)  AS noise,
        COUNT(*) FILTER (WHERE approval_status = 'PENDING' AND final_score >= 40) AS pending_approval,
        COUNT(*) FILTER (WHERE stream = 1)                           AS stream1,
        COUNT(*) FILTER (WHERE stream = 4)                           AS stream4,
        ROUND(AVG(final_score) FILTER (WHERE final_score >= 5), 1)   AS avg_score,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') AS last_24h
      FROM outbound_lead_events
      WHERE created_at > NOW() - (${days} || ' days')::interval
    `;

    // Intent breakdown
    const byIntent = await sql`
      SELECT intent, COUNT(*) AS cnt
      FROM outbound_lead_events
      WHERE created_at > NOW() - (${days} || ' days')::interval
        AND final_score >= 5
      GROUP BY intent ORDER BY cnt DESC
    `;

    // Leads list (filtered)
    const leads = await sql`
      SELECT
        id, source, tg_username, tg_chat, intent, lead_score, evidence_score,
        final_score, priority, stream, qualification_reason, key_signals,
        ai_reply_draft, product_hint, geography_hint, approval_status,
        created_at,
        LEFT(raw_text, 300) AS raw_text_preview
      FROM outbound_lead_events
      WHERE
        created_at > NOW() - (${days} || ' days')::interval
        AND final_score >= 5
        ${stream !== null ? sql`AND stream = ${stream}` : sql``}
        ${priority ? sql`AND priority = ${priority}` : sql``}
        ${intent ? sql`AND intent = ${intent}` : sql``}
        ${approval ? sql`AND approval_status = ${approval}` : sql``}
      ORDER BY final_score DESC, created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Daily trend
    const trend = await sql`
      SELECT
        DATE(created_at) AS day,
        COUNT(*) FILTER (WHERE final_score >= 5) AS qualified,
        COUNT(*) FILTER (WHERE priority = 'HOT') AS hot
      FROM outbound_lead_events
      WHERE created_at > NOW() - (${days} || ' days')::interval
      GROUP BY DATE(created_at) ORDER BY day ASC
    `;

    return NextResponse.json({
      ok: true,
      kpi,
      byIntent,
      leads,
      trend,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

// PATCH /api/outbound/intake-stats?id=xxx — approve/reject a lead
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const isAdmin = req.cookies.get("cb_admin")?.value;
  if (!isAdmin) return NextResponse.json({ ok: false, error: "admin only" }, { status: 401 });

  const { id, approval_status } = await req.json().catch(() => ({}));
  if (!id || !["APPROVED", "REJECTED", "PENDING"].includes(approval_status)) {
    return NextResponse.json({ ok: false, error: "bad params" }, { status: 400 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      UPDATE outbound_lead_events
      SET approval_status = ${approval_status}
      WHERE id = ${id}
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
