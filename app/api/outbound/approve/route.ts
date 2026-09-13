// Human Approval + Reply Tracking + HOT Lead + AI Consultant handoff
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const maxDuration = 30;

const TG_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const TG_CHAT_ID   = process.env.TELEGRAM_CHAT_ID ?? "8979087725";

type LeadRow = {
  outbound_id: string;
  company_name: string;
  city: string;
  country: string;
  category: string;
  marketplace: string;
  phone: string;
  email: string;
  website: string;
  stage: string;
  opportunity_score: number;
  company_score: number;
  lead_score: number;
  reason_to_contact: string;
  personalized_message: string;
  response_status: string;
  products: unknown[];
  china_match: Record<string, unknown>;
  economics: Record<string, unknown>;
  pitch_type: string;
  china_match_status: string;
  message_quality_score: number;
};

async function tg(text: string) {
  if (!TG_BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: "Markdown" }),
  }).catch(() => {});
}

// §27: Notification after human approval
function approvedText(lead: LeadRow, finalMessage: string) {
  return [
    `✅ *ЛИД ОДОБРЕН → APPROVED*`,
    ``,
    `🏢 *${lead.company_name}*`,
    `🌍 ${lead.city}, ${lead.country === "KZ" ? "Казахстан" : "Россия"}`,
    `📂 ${lead.category} · ${lead.marketplace || "—"}`,
    `📊 Opportunity: *${lead.opportunity_score}/100*`,
    ``,
    `💡 ${lead.reason_to_contact}`,
    ``,
    `💬 Сообщение:`,
    finalMessage,
    ``,
    `📞 ${lead.phone || "—"} | 📧 ${lead.email || "—"}`,
  ].join("\n");
}

// §40: HOT lead notification
function hotLeadText(lead: LeadRow) {
  const econ = lead.economics as { estimated_margin?: number } | undefined;
  return [
    `🔥 *HOT LEAD*`,
    ``,
    `Компания: ${lead.company_name}`,
    `Страна: ${lead.country === "KZ" ? "Казахстан" : "Россия"}`,
    `Город: ${lead.city}`,
    ``,
    `Категория:`,
    lead.category,
    ``,
    `Маркетплейс:`,
    lead.marketplace || "—",
    ``,
    `Поставщик:`,
    lead.china_match_status === "MATCHED" ? "Найден в Китае" : "Неизвестно",
    ``,
    `Opportunity: ${lead.opportunity_score}/100`,
    `Lead Score: ${lead.lead_score}/100`,
    ``,
    econ?.estimated_margin ? `Маржа: ~${Math.round(econ.estimated_margin * 100)}%` : "",
    ``,
    `Причина обращения:`,
    lead.reason_to_contact,
    ``,
    `Next Best Action:`,
    `Показать предварительный расчёт и уточнить условия поставки.`,
  ].filter((l) => l !== undefined).join("\n");
}

// §32-34: Handoff context to AI Consultant
async function handoffToConsultant(lead: LeadRow) {
  const context = {
    lead_id: lead.outbound_id,
    company_name: lead.company_name,
    country: lead.country,
    city: lead.city,
    category: lead.category,
    marketplace: lead.marketplace,
    product: (lead.products as unknown[])?.[0] ?? null,
    china_match: lead.china_match,
    economics: lead.economics,
    reason_to_contact: lead.reason_to_contact,
    pitch_type: lead.pitch_type,
    opportunity_score: lead.opportunity_score,
    campaign: "OUTBOUND_V1",
  };

  // Notify manager with context link for AI Consultant session
  const handoffText = [
    `🤝 *ПОЛОЖИТЕЛЬНЫЙ ОТВЕТ → AI CONSULTANT*`,
    ``,
    `Компания: *${lead.company_name}*`,
    `${lead.city}, ${lead.country === "KZ" ? "KZ" : "RU"} · ${lead.category}`,
    ``,
    `Opportunity: ${lead.opportunity_score}/100`,
    ``,
    `📋 Контекст передан AI Consultant. Откройте диалог:`,
    `https://chinabridge.pro/admin/outbound?lead=${lead.outbound_id}`,
    ``,
    `Следующий шаг: QUALIFY → HOT`,
  ].join("\n");

  await tg(handoffText);
  return context;
}

// Calculate HOT threshold: lead_score >= 70 OR (opportunity >= 70 AND intent positive)
function isHot(lead: LeadRow): boolean {
  return lead.lead_score >= 70 || lead.opportunity_score >= 75;
}

export async function POST(req: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const body = await req.json();
    const { outboundId, action, editedMessage } = body as {
      outboundId: string;
      action: "approve" | "reject" | "edit_approve";
      editedMessage?: string;
    };

    if (!outboundId || !action) {
      return NextResponse.json({ ok: false, error: "outboundId and action required" }, { status: 400 });
    }

    const rows = await sql`
      SELECT outbound_id, company_name, city, country, category, marketplace,
             phone, email, website, stage, opportunity_score, company_score,
             lead_score, reason_to_contact, personalized_message, response_status,
             products, china_match, economics, pitch_type, china_match_status,
             message_quality_score
      FROM outbound_leads WHERE outbound_id = ${outboundId} LIMIT 1
    ` as LeadRow[];

    if (!rows.length) return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });
    const lead = rows[0];

    if (action === "reject") {
      await sql`
        UPDATE outbound_leads SET
          stage = 'FOUND',
          reason_to_contact = '',
          personalized_message = '',
          updated_at = ${new Date().toISOString()}
        WHERE outbound_id = ${outboundId}
      `;
      return NextResponse.json({ ok: true, stage: "FOUND" });
    }

    const finalMessage = editedMessage ?? lead.personalized_message;

    await sql`
      UPDATE outbound_leads SET
        stage = 'APPROVED',
        personalized_message = ${finalMessage},
        approved_by = 'manager',
        approved_at = ${new Date().toISOString()},
        updated_at = ${new Date().toISOString()}
      WHERE outbound_id = ${outboundId}
    `;

    await tg(approvedText(lead, finalMessage));

    return NextResponse.json({ ok: true, stage: "APPROVED" });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

// §30-37: Reply tracking + HOT detection + AI Consultant handoff
export async function PATCH(req: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const body = await req.json();
    const { outboundId, stage, responseStatus, channel } = body as {
      outboundId: string;
      stage?: string;
      responseStatus?: string; // POSITIVE | NEGATIVE | QUESTION | NOT_NOW | UNSUBSCRIBE
      channel?: string;
    };

    if (!outboundId) return NextResponse.json({ ok: false, error: "outboundId required" }, { status: 400 });

    // Fetch current lead
    const rows = await sql`
      SELECT outbound_id, company_name, city, country, category, marketplace,
             phone, email, website, stage AS current_stage, opportunity_score,
             company_score, lead_score, reason_to_contact, personalized_message,
             response_status, products, china_match, economics, pitch_type,
             china_match_status, message_quality_score
      FROM outbound_leads WHERE outbound_id = ${outboundId} LIMIT 1
    ` as LeadRow[];

    if (!rows.length) return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });
    const lead = rows[0];

    let newStage = stage ?? lead.stage;
    let newResponseStatus = responseStatus ?? lead.response_status;
    const now = new Date().toISOString();

    // §31: Map response status to stages
    if (responseStatus === "POSITIVE") {
      newStage = "REPLIED";
      // §32: Handoff to AI Consultant
      await handoffToConsultant(lead);
    } else if (responseStatus === "NEGATIVE") {
      newStage = "CONTACTED"; // keep in contacted, not advance
    } else if (responseStatus === "UNSUBSCRIBE") {
      newStage = "FOUND"; // remove from active pipeline
    } else if (responseStatus === "NOT_NOW") {
      newStage = "CONTACTED"; // keep for future follow-up
    } else if (responseStatus === "QUESTION") {
      newStage = "REPLIED"; // has question → needs response
    }

    // §37: HOT detection when qualified
    if (stage === "QUALIFIED" && isHot(lead)) {
      newStage = "HOT";
      await tg(hotLeadText({ ...lead, stage: "HOT" }));
    }

    const updates: Record<string, unknown> = {
      stage: newStage,
      response_status: newResponseStatus,
      updated_at: now,
    };

    if (channel) updates.channel = channel;
    if (stage === "CONTACTED" || newStage === "CONTACTED") {
      updates.contacted_at = now;
      updates.last_contact_at = now;
    }
    if (responseStatus) {
      updates.last_contact_at = now;
    }

    // Build SET clause dynamically
    await sql`
      UPDATE outbound_leads SET
        stage = ${newStage},
        response_status = ${newResponseStatus},
        channel = ${channel ?? null},
        updated_at = ${now}
      WHERE outbound_id = ${outboundId}
    `;

    // Update contacted_at if moving to CONTACTED
    if (newStage === "CONTACTED") {
      await sql`
        UPDATE outbound_leads SET
          contacted_at = ${now},
          last_contact_at = ${now}
        WHERE outbound_id = ${outboundId} AND contacted_at IS NULL
      `;
    }

    return NextResponse.json({ ok: true, stage: newStage, responseStatus: newResponseStatus });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
