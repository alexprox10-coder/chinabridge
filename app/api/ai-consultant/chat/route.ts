import { NextRequest, NextResponse } from "next/server";
import {
  getOrCreate,
  addMessage,
  updateLead,
  markLeadSent,
  saveSession,
} from "@/lib/ai/memory";
import { runImportConsultant, CalcContext } from "@/lib/ai/agents/import-consultant";
import { sendLeadToWebhook } from "@/lib/webhook/n8n";
import { createLead } from "@/lib/crm/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Store calcContext per session in memory (alongside session state)
const ctxCache = new Map<string, CalcContext>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      sessionId?: string;
      message?: string;
      calcContext?: CalcContext;
    };

    const { message, calcContext } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    const sid = (body.sessionId && typeof body.sessionId === "string")
      ? body.sessionId
      : `ac_${crypto.randomUUID()}`;

    // Store or reuse calcContext
    if (calcContext) {
      ctxCache.set(sid, calcContext);
    }
    const ctx = ctxCache.get(sid);

    if (!ctx) {
      return NextResponse.json({ error: "calc_context_required" }, { status: 400 });
    }

    const state = await getOrCreate(sid);
    addMessage(state, "user", message.trim().slice(0, 800));

    const result = await runImportConsultant(state, message.trim(), ctx);

    if (result.leadDataUpdate && Object.keys(result.leadDataUpdate).length > 0) {
      updateLead(state, result.leadDataUpdate as any);
    }

    if (result.isLeadComplete && !state.isLeadSent) {
      markLeadSent(state);

      // Create CRM lead
      const contactInfo = state.leadData as any;
      try {
        const now = new Date().toISOString();
        const score = result.leadScore ?? 0;
        const crmLead = await createLead({
          lead_id:             `ac-${sid.replace("ac_", "")}`,
          created_at:          now,
          updated_at:          now,
          name:                contactInfo.name ?? "AI Консультант",
          phone:               contactInfo.phone ?? "",
          telegram:            contactInfo.telegram ?? "",
          email:               "",
          company:             "",
          product:             ctx.product_name,
          product_link:        "",
          category:            "Из Китая",
          quantity:            String(ctx.quantity),
          weight:              String(ctx.weight_kg),
          volume:              "",
          country_destination: ctx.country_to,
          city_destination:    ctx.city_to,
          delivery_type:       "auto",
          service_type:        "full_service",
          status:              "NEW",
          priority:            score >= 70 ? "HOT" : score >= 40 ? "WARM" : "COLD",
          estimated_value:     Math.round(ctx.net_profit_per_unit * ctx.quantity),
          manager:             "",
          comment:             `Маржа ${Number(ctx.margin_pct ?? 0).toFixed(1)}% · ROI ${Number(ctx.roi_pct ?? 0).toFixed(0)}% · ${ctx.marketplace.toUpperCase()} · Score ${score}`,
          source:              "ai_consultant",
          utm_source:          "",
          utm_campaign:        "",
        });
        const leadId = crmLead?.lead_id;
        if (leadId) {
          (state.leadData as any).leadId = leadId;
        }
      } catch (e) {
        console.error("[ai-consultant] createLead failed", e);
      }

      // n8n webhook — override source/priority, send product_name from ctx (not leadData)
      const score = result.leadScore ?? 0;
      const webhookLead = {
        ...state.leadData,
        source:   "ai_consultant",
        priority: score >= 70 ? "HOT" : score >= 40 ? "WARM" : "COLD",
        product:  ctx.product_name,
      };
      await sendLeadToWebhook(webhookLead as any, sid).catch(() => {});
    }

    addMessage(state, "assistant", result.message);
    await saveSession(state);

    return NextResponse.json({
      message:      result.message,
      sessionId:    sid,
      intent:       result.intent,
      leadScore:    result.leadScore,
      isLeadReady:  result.isLeadReady,
    });
  } catch (err) {
    console.error("[ai-consultant/chat]", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
