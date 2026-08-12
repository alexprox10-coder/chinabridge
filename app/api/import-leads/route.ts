import { NextRequest, NextResponse } from "next/server";
import { saveLead } from "@/lib/import-leads/crm";
import type { ImportLead, LeadScore } from "@/lib/import-leads/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    let extraData: Record<string, unknown> = {};
    const rawComment = body.comment ?? "";
    if (typeof rawComment === "string") {
      try { extraData = JSON.parse(rawComment); } catch {}
    } else if (typeof rawComment === "object") {
      extraData = rawComment;
    }

    const leadScore = Number(extraData.leadScore ?? body.leadScore ?? 0);
    const chinaProb  = Number(extraData.chinaProb  ?? body.chinaProb  ?? 0);

    const mappedScore = Math.max(1, Math.min(5, Math.ceil(leadScore / 20))) as LeadScore;
    const imports = chinaProb >= 70 ? "yes" : chinaProb >= 40 ? "likely" : "no";

    const addressRaw = String(extraData.address ?? body.city ?? "");

    // Объединяем extraData с product из тела запроса
    const messageData = {
      ...extraData,
      topProduct: body.product ?? extraData.topProduct ?? "",
    };

    const lead: Omit<ImportLead, "id"> = {
      lead_id:    String(body.lead_id ?? `wb-${Date.now()}`),
      company:    String(body.company ?? body.name ?? ""),
      website:    String(body.website ?? ""),
      category:   String(body.category ?? ""),
      city:       addressRaw.slice(0, 120),
      country:    "RU",
      phone:      String(body.phone   ?? ""),
      email:      String(body.email   ?? ""),
      telegram:   String(body.telegram ?? ""),
      source:     String(body.source  ?? "WB_SELLER_AI_PARSER"),
      imports,
      score:      mappedScore,
      score_stars: "★".repeat(mappedScore),
      why:        String(extraData.reason ?? body.why ?? ""),
      offer:      String(extraData.offer  ?? body.offer ?? ""),
      message:    JSON.stringify(messageData),
      company_id: "chinabridge",
      created_at: new Date().toISOString(),
      status:     "new",
    };

    const saved = await saveLead(lead);
    if (!saved) {
      return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, lead_id: lead.lead_id });
  } catch (e) {
    console.error("[POST /api/import-leads]", e);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
