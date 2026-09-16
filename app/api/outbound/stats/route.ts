// Outbound Dashboard KPIs
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    const [stageCounts, verticalCounts, categoryCounts, topLeads, first100, recentActivity] = await Promise.all([
      // Stage funnel
      sql`
        SELECT stage, COUNT(*) as count
        FROM outbound_leads
        GROUP BY stage
        ORDER BY count DESC
      `,
      // Vertical breakdown
      sql`
        SELECT vertical, COUNT(*) as count
        FROM outbound_leads
        GROUP BY vertical
        ORDER BY count DESC
      `,
      // Category breakdown
      sql`
        SELECT category, COUNT(*) as count,
               AVG(opportunity_score)::int as avg_score
        FROM outbound_leads
        GROUP BY category
        ORDER BY count DESC
        LIMIT 10
      `,
      // Top scored leads ready to contact
      sql`
        SELECT outbound_id, company_name, city, country, category, marketplace,
               opportunity_score, message_quality_score, stage, phone, email
        FROM outbound_leads
        WHERE stage IN ('SCORED', 'PERSONALIZED') AND opportunity_score >= 60
        ORDER BY opportunity_score DESC
        LIMIT 20
      `,
      // First 100 contacts KPI tracking
      sql`
        SELECT
          COUNT(*) FILTER (WHERE approved_at IS NOT NULL) as total_approved,
          COUNT(*) FILTER (WHERE stage IN ('CONTACTED','REPLIED','QUALIFIED','HOT','QUOTE','DEAL')) as total_contacted,
          COUNT(*) FILTER (WHERE response_status = 'POSITIVE') as positive_replies,
          COUNT(*) FILTER (WHERE stage IN ('QUALIFIED','HOT','QUOTE','DEAL')) as qualified,
          COUNT(*) FILTER (WHERE stage = 'HOT') as hot,
          COUNT(*) FILTER (WHERE stage = 'DEAL') as deals,
          COUNT(*) FILTER (WHERE approved_at >= (NOW() - INTERVAL '1 day')::text) as approved_today
        FROM outbound_leads
      `,
      // Reply rates
      sql`
        SELECT
          COUNT(*) FILTER (WHERE stage = 'CONTACTED') as contacted,
          COUNT(*) FILTER (WHERE response_status = 'POSITIVE') as positive_replies,
          COUNT(*) FILTER (WHERE response_status = 'NEGATIVE') as negative_replies,
          COUNT(*) FILTER (WHERE stage IN ('QUALIFIED', 'HOT', 'QUOTE', 'DEAL')) as qualified,
          COUNT(*) FILTER (WHERE stage = 'HOT') as hot,
          COUNT(*) FILTER (WHERE stage = 'DEAL') as deals,
          COUNT(*) FILTER (WHERE china_match_status = 'MATCHED') as china_matched,
          AVG(opportunity_score)::int as avg_opportunity_score,
          AVG(message_quality_score)::int as avg_message_quality
        FROM outbound_leads
      `,
    ]);

    const f100 = first100[0] as {
      total_approved: string;
      total_contacted: string;
      positive_replies: string;
      qualified: string;
      hot: string;
      deals: string;
      approved_today: string;
    } | undefined;

    const activity = recentActivity[0] as {
      contacted: string;
      positive_replies: string;
      negative_replies: string;
      qualified: string;
      hot: string;
      deals: string;
      china_matched: string;
      avg_opportunity_score: string;
      avg_message_quality: string;
    } | undefined;

    // Stage funnel map
    const funnel: Record<string, number> = {};
    for (const r of stageCounts as { stage: string; count: string }[]) {
      funnel[r.stage] = Number(r.count);
    }

    const total = Object.values(funnel).reduce((a, b) => a + b, 0);
    const contacted = Number(activity?.contacted ?? 0);
    const positive = Number(activity?.positive_replies ?? 0);
    const qualified = Number(activity?.qualified ?? 0);

    const kpis = {
      total_leads: total,
      funnel,
      // Conversion rates
      positive_reply_rate: contacted > 0 ? Math.round((positive / contacted) * 100) : null,
      qualified_rate: positive > 0 ? Math.round((qualified / positive) * 100) : null,
      hot_count: Number(activity?.hot ?? 0),
      deal_count: Number(activity?.deals ?? 0),
      china_matched: Number(activity?.china_matched ?? 0),
      avg_opportunity_score: Number(activity?.avg_opportunity_score ?? 0),
      avg_message_quality: Number(activity?.avg_message_quality ?? 0),
    };

    const totalContacted = Number(f100?.total_contacted ?? 0);
    const positiveReplies = Number(f100?.positive_replies ?? 0);
    const first100Kpis = {
      total_approved: Number(f100?.total_approved ?? 0),
      total_contacted: totalContacted,
      approved_today: Number(f100?.approved_today ?? 0),
      daily_limit: 20,
      positive_replies: positiveReplies,
      qualified: Number(f100?.qualified ?? 0),
      hot: Number(f100?.hot ?? 0),
      deals: Number(f100?.deals ?? 0),
      reply_rate: totalContacted > 0 ? Math.round((positiveReplies / totalContacted) * 100) : null,
      progress_pct: Math.min(100, Math.round((totalContacted / 100) * 100)),
    };

    return NextResponse.json({
      ok: true,
      kpis,
      first_100: first100Kpis,
      verticals: verticalCounts,
      categories: categoryCounts,
      top_leads: topLeads,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
