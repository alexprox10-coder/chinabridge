// §18 ТЗ — CRM Handoff: create outbound_lead from approved intake_event
// POST /api/outbound/intake-crm  { event_id }
// Admin only. Idempotent: second call returns existing crm_lead_id.

import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { logIntakeEvent } from "@/lib/outbound/intake-analytics";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const isAdmin = req.cookies.get("cb_admin")?.value;
  if (!isAdmin) return NextResponse.json({ ok: false, error: "admin only" }, { status: 401 });

  const { event_id } = await req.json().catch(() => ({}));
  if (!event_id) return NextResponse.json({ ok: false, error: "event_id required" }, { status: 400 });

  const sql = neon(process.env.DATABASE_URL!);

  // Load the intake event
  const [ev] = await sql`
    SELECT * FROM outbound_lead_events WHERE id = ${event_id} LIMIT 1
  `;
  if (!ev) return NextResponse.json({ ok: false, error: "event not found" }, { status: 404 });

  // Idempotency: already has CRM lead
  if (ev.crm_lead_id) {
    return NextResponse.json({ ok: true, crm_lead_id: ev.crm_lead_id, already_existed: true });
  }

  // §19 ТЗ — AI Consultant context
  const aiConsultantContext = {
    source: ev.source,
    country: ev.country,
    city: ev.city,
    intent: ev.intent,
    intent_subtype: ev.intent_subtype,
    supplier_exists: ev.supplier_exists,
    weight_kg: ev.weight_kg,
    volume_m3: ev.volume_m3,
    packages: ev.packages,
    destination: ev.destination,
    product: ev.product,
    product_category: ev.product_category,
    urgency: ev.urgency,
    recommended_offer: ev.recommended_offer,
    business_type: ev.business_type,
    tg_username: ev.tg_username,
    source_url: ev.source_url,
    final_score: ev.final_score,
    evidence_score: ev.evidence_score,
    ai_reply_draft: ev.ai_reply_draft,
    intake_event_id: event_id,
  };

  try {
    // Create outbound_lead record (using existing table)
    const [lead] = await sql`
      INSERT INTO outbound_leads (
        name, source, stage, country, category,
        phone, email, website,
        approval_status, campaign, ai_consultant_context,
        stage_updated_at
      ) VALUES (
        ${[ev.tg_username, ev.product, ev.city].filter(Boolean).join(" · ") || "Parser Club Lead"},
        ${"parser_club_" + ev.source},
        ${"FOUND"},
        ${ev.country || "UNKNOWN"},
        ${ev.product_category || "general_cargo"},
        ${""}, ${""}, ${""},
        ${"PENDING"}, ${"INTAKE_V1"},
        ${JSON.stringify(aiConsultantContext)},
        ${new Date().toISOString()}
      ) RETURNING id
    `.catch(async () => {
      // Fallback: outbound_leads may have different required columns
      // Try minimal insert
      return await sql`
        INSERT INTO outbound_leads (name, source, stage, approval_status, campaign, ai_consultant_context, stage_updated_at)
        VALUES (
          ${ev.tg_username || "Parser Club Lead"},
          ${"parser_club"},
          ${"FOUND"},
          ${"PENDING"},
          ${"INTAKE_V1"},
          ${JSON.stringify(aiConsultantContext)},
          ${new Date().toISOString()}
        ) RETURNING id
      `;
    });

    const crmLeadId = lead[0]?.id ?? lead?.id;

    // Link back to intake event
    await sql`
      UPDATE outbound_lead_events
      SET crm_lead_id = ${String(crmLeadId)},
          approval_status = 'APPROVED',
          outbound_lead_id = ${crmLeadId}
      WHERE id = ${event_id}
    `;

    await logIntakeEvent(sql, "lead_crm_created", event_id, ev.source, ev.country, ev.stream, ev.final_score, { crm_lead_id: crmLeadId });
    if (ev.priority === "HOT") {
      await logIntakeEvent(sql, "lead_hot_crm", event_id, ev.source, ev.country, ev.stream, ev.final_score);
    }

    return NextResponse.json({ ok: true, crm_lead_id: crmLeadId });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
