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

    // Store qualifying signals from this response
    const qualData = state.leadData as any;
    const qualificationJustStarted = !qualData.qualification_started &&
      (result.purchaseTiming != null || result.weightBand != null);
    if (qualificationJustStarted) qualData.qualification_started = true;
    if (result.purchaseTiming && !qualData.purchase_timing) {
      qualData.purchase_timing = result.purchaseTiming;
    }
    if (result.weightBand && !qualData.weight_band) {
      qualData.weight_band = result.weightBand;
    }
    if (result.supplierStatus && qualData.supplier_status == null) {
      qualData.supplier_status = result.supplierStatus;
    }
    if (result.intentScore != null) {
      qualData.intent_score = result.intentScore;
    }

    if (result.isLeadComplete && !state.isLeadSent) {
      markLeadSent(state);

      // Create CRM lead
      const contactInfo = state.leadData as any;
      try {
        const now = new Date().toISOString();
        const score = result.leadScore ?? 0;
        const priority = score >= 70 ? "HOT" : score >= 40 ? "WARM" : "COLD";

        // §48 — conversation summary: last 6 messages compressed
        const history = (state as any).history ?? [];
        const lastMsgs = history.slice(-6) as Array<{ role: string; content: string }>;
        const convoSummary = lastMsgs.length > 0
          ? lastMsgs.map(m => `[${m.role === "user" ? "К" : "А"}] ${String(m.content).slice(0, 120)}`).join("\n")
          : "";

        // §39 — AI Sales Brief comment
        const supplierStr = ctx.supplier_exists === true ? "есть" : ctx.supplier_exists === false ? "нет" : "неизвестно";
        const calcId = `eco-${sid.replace("ac_", "")}`;
        const comment = [
          `🤖 AI Sales Brief | Score:${score} | ${priority}`,
          `Товар: ${ctx.product_name.slice(0, 60)} | ${ctx.marketplace.toUpperCase()} | ${ctx.city_to}, ${ctx.country_to}`,
          `Закупка: ${ctx.unit_price_cny}¥ × ${ctx.quantity}шт | Продажа: ${ctx.sale_price_rub}₽`,
          `Маржа: ${Number(ctx.margin_pct ?? 0).toFixed(1)}% · ROI: ${Number(ctx.roi_pct ?? 0).toFixed(0)}% | ${ctx.verdict_label}`,
          `Поставщик: ${supplierStr}${contactInfo.purchase_timing ? ` | Закупка: ${contactInfo.purchase_timing}` : ""}${contactInfo.weight_band ? ` | Объём: ${contactInfo.weight_band}` : ""}`,
          // §38 — calc_id + marketplace + supplier_exists
          `calc_id: ${calcId} | mp: ${ctx.marketplace} | supplier: ${supplierStr}`,
          // §34 — UTM info if available
          contactInfo.utm_source ? `utm: ${contactInfo.utm_source}${contactInfo.utm_campaign ? `/${contactInfo.utm_campaign}` : ""}` : null,
          // §48 — conversation log
          convoSummary ? `\n--- Диалог (${lastMsgs.length} сообщений) ---\n${convoSummary}` : null,
        ].filter(Boolean).join("\n");

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
          priority:            priority as "HOT" | "WARM" | "COLD",
          estimated_value:     Math.round(ctx.net_profit_per_unit * ctx.quantity),
          manager:             "",
          comment,
          source:              "ai_consultant",
          utm_source:          contactInfo.utm_source ?? "",
          utm_campaign:        contactInfo.utm_campaign ?? "",
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
        source:          "ai_consultant",
        priority:        score >= 70 ? "HOT" : score >= 40 ? "WARM" : "COLD",
        product:         ctx.product_name,
        country:         ctx.country_to,
        marketplace:     ctx.marketplace,
        purchase_timing: qualData.purchase_timing ?? null,
        weight_band:     qualData.weight_band ?? null,
        intent_score:    qualData.intent_score ?? null,
        lead_score:      score,
      };
      await sendLeadToWebhook(webhookLead as any, sid).catch(() => {});
    }

    addMessage(state, "assistant", result.message);
    await saveSession(state);

    return NextResponse.json({
      message:              result.message,
      sessionId:            sid,
      intent:               result.intent,
      leadScore:            result.leadScore,
      isLeadReady:          result.isLeadReady,
      qualificationStarted: qualificationJustStarted || false,
    });
  } catch (err) {
    console.error("[ai-consultant/chat]", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
