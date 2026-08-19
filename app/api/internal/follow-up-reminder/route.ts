import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Called by n8n daily to find HOT/WARM leads needing follow-up.
// Auth: X-Api-Key header must match INTERNAL_API_KEY env var.
export async function GET(req: NextRequest) {
  const key = req.headers.get("x-api-key");
  if (!key || key !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL!);

  const rows = await sql`
    SELECT
      id, name, company, phone, telegram, email,
      ai_score_level, ai_lead_score, ai_business_summary,
      ai_selected_product, ai_attack_plan, ai_message_short,
      ai_contacts_found, status, contact_attempts, last_contact_at,
      created_at
    FROM crm_leads
    WHERE tenant_id = 'tenant-chinabridge'
      AND ai_score_level IN ('HOT', 'WARM')
      AND status IN ('RESEARCHED', 'CONTACTED')
      AND (
        contact_attempts = 0
        OR contact_attempts IS NULL
        OR (last_contact_at IS NOT NULL AND last_contact_at != '' AND last_contact_at::timestamptz < NOW() - INTERVAL '3 days')
      )
    ORDER BY ai_lead_score DESC NULLS LAST, created_at ASC
    LIMIT 20
  `;

  const leads = rows.map((r) => {
    const plan = r.ai_attack_plan as Record<string, unknown> | null;
    const contacts = r.ai_contacts_found as {
      phones?: string[];
      telegram?: string;
      whatsapp?: string;
      emails?: string[];
    } | null;

    const bestContact =
      plan?.best_contact ||
      contacts?.telegram ||
      contacts?.whatsapp ||
      (contacts?.phones?.[0] ?? null) ||
      r.phone ||
      null;

    return {
      id: r.id,
      name: r.name,
      company: r.company,
      scoreLevel: r.ai_score_level,
      leadScore: r.ai_lead_score,
      businessSummary: r.ai_business_summary,
      selectedProduct: r.ai_selected_product,
      firstGoal: plan?.first_goal,
      whatToSell: plan?.what_to_sell,
      mainPain: plan?.main_pain,
      bestContact,
      messageShort: r.ai_message_short,
      status: r.status,
      contactAttempts: r.contact_attempts ?? 0,
      lastContactAt: r.last_contact_at,
      daysSinceCreated: Math.floor(
        (Date.now() - new Date(r.created_at as string).getTime()) / 86400000,
      ),
    };
  });

  const hot = leads.filter((l) => l.scoreLevel === "HOT");
  const warm = leads.filter((l) => l.scoreLevel === "WARM");

  return NextResponse.json({
    ok: true,
    total: leads.length,
    hot: hot.length,
    warm: warm.length,
    leads,
  });
}
