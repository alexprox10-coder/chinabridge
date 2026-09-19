// Admin stats for intake dashboard
// GET /api/outbound/intake-stats?days=7&stream=1&priority=HOT&intent=DELIVERY
// PATCH — approve/reject a lead
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { runOutboundMigrations } from "@/lib/outbound/migrations";
import { logIntakeEvent } from "@/lib/outbound/intake-analytics";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const isAdmin = req.cookies.get("cb_admin")?.value;
  if (!isAdmin) return NextResponse.json({ ok: false, error: "admin only" }, { status: 401 });

  const p = new URL(req.url).searchParams;
  const days     = Math.min(90, Math.max(1, Number(p.get("days") ?? 7)));
  const stream   = p.get("stream") ? Number(p.get("stream")) : null;
  const priority = p.get("priority") ?? null;
  const intent   = p.get("intent") ?? null;
  const approval = p.get("approval") ?? null;
  const limit    = Math.min(100, Math.max(1, Number(p.get("limit") ?? 50)));
  const offset   = Math.max(0, Number(p.get("offset") ?? 0));

  try {
    await runOutboundMigrations();
    const sql = neon(process.env.DATABASE_URL!);

    // KPI tiles
    const [kpi] = await sql`
      SELECT
        COUNT(*)                                                           AS total,
        COUNT(*) FILTER (WHERE priority = 'HOT')                           AS hot,
        COUNT(*) FILTER (WHERE priority = 'HIGH')                          AS high,
        COUNT(*) FILTER (WHERE priority = 'MEDIUM')                        AS medium,
        COUNT(*) FILTER (WHERE intent = 'NOISE' OR final_score < 5)        AS noise,
        COUNT(*) FILTER (WHERE approval_status = 'PENDING' AND final_score >= 40) AS pending_approval,
        COUNT(*) FILTER (WHERE stream = 1)                                 AS stream1,
        COUNT(*) FILTER (WHERE stream = 4)                                 AS stream4,
        COUNT(*) FILTER (WHERE supplier_exists = true)                     AS existing_supplier,
        COUNT(*) FILTER (WHERE crm_lead_id != '')                          AS crm_created,
        ROUND(AVG(final_score) FILTER (WHERE final_score >= 5), 1)         AS avg_score,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')   AS last_24h
      FROM outbound_lead_events
      WHERE created_at > NOW() - (${days} || ' days')::interval
    `;

    // Intent breakdown
    const byIntent = await sql`
      SELECT intent, COUNT(*) AS cnt, ROUND(AVG(final_score), 0) AS avg_score
      FROM outbound_lead_events
      WHERE created_at > NOW() - (${days} || ' days')::interval AND final_score >= 5
      GROUP BY intent ORDER BY cnt DESC
    `;

    // Country breakdown
    const byCountry = await sql`
      SELECT country, COUNT(*) AS cnt
      FROM outbound_lead_events
      WHERE created_at > NOW() - (${days} || ' days')::interval AND final_score >= 5
      GROUP BY country ORDER BY cnt DESC LIMIT 10
    `;

    // Leads list (filtered)
    const leads = await sql`
      SELECT
        id, source, source_type, tg_username, tg_chat, source_url,
        intent, intent_subtype, lead_score, evidence_score, final_score, confidence,
        priority, stream, country, city, destination,
        product, product_category, business_type,
        supplier_exists, weight_kg, volume_m3, packages, urgency,
        recommended_offer, qualification_reason, key_signals, evidence_data,
        ai_reply_draft, product_hint, geography_hint,
        approval_status, crm_lead_id, processing_status,
        created_at,
        LEFT(raw_text, 400) AS raw_text_preview,
        LEFT(normalized_text, 400) AS normalized_text_preview
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
        COUNT(*) FILTER (WHERE priority = 'HOT') AS hot,
        COUNT(*) FILTER (WHERE priority = 'HIGH') AS high
      FROM outbound_lead_events
      WHERE created_at > NOW() - (${days} || ' days')::interval
      GROUP BY DATE(created_at) ORDER BY day ASC
    `;

    // Analytics funnel summary
    const funnel = await sql`
      SELECT event, COUNT(*) AS cnt
      FROM outbound_analytics_events
      WHERE created_at > NOW() - (${days} || ' days')::interval
      GROUP BY event ORDER BY cnt DESC
    `.catch(() => []);

    return NextResponse.json({ ok: true, kpi, byIntent, byCountry, leads, trend, funnel });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

// PATCH — approve/reject
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const isAdmin = req.cookies.get("cb_admin")?.value;
  if (!isAdmin) return NextResponse.json({ ok: false, error: "admin only" }, { status: 401 });

  const { id, approval_status } = await req.json().catch(() => ({}));
  if (!id || !["APPROVED", "REJECTED", "PENDING"].includes(approval_status)) {
    return NextResponse.json({ ok: false, error: "bad params" }, { status: 400 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);
    const [ev] = await sql`SELECT source, country, stream, final_score FROM outbound_lead_events WHERE id = ${id} LIMIT 1`;

    await sql`UPDATE outbound_lead_events SET approval_status = ${approval_status} WHERE id = ${id}`;

    if (ev && approval_status === "APPROVED") {
      await logIntakeEvent(sql, "lead_approved", id, ev.source, ev.country, ev.stream, ev.final_score);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
