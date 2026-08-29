// Manual tender import endpoint — accepts tenders from external scrapers
// Runs the full Tender Intelligence pipeline on submitted data
// Auth: cb_admin cookie or X-Admin-Key header

import { NextRequest, NextResponse } from "next/server";
import { classifyChinaFit } from "@/lib/tender/china-fit";
import { buildOpportunity } from "@/lib/tender/scorer";
import {
  ensureTenderSchema, saveProcedure, upsertCompany,
  getCompanyStats, saveOpportunity, setOpportunityCRMLead,
} from "@/lib/tender/db";
import { sendHotAlert } from "@/lib/tender/digest";
import { createLead } from "@/lib/crm/client";
import { CONFIG } from "@/lib/tender/types";
import { preFilterTender } from "@/lib/tender/eis";
import type { RawTender } from "@/lib/tender/types";

export const runtime = "nodejs";
export const maxDuration = 300;

function authOk(req: NextRequest): boolean {
  const adminCookie = req.cookies.get("cb_admin")?.value;
  if (adminCookie) return true;
  const key = req.headers.get("x-admin-key");
  const envKey = process.env.ADMIN_IMPORT_KEY ?? process.env.CRON_SECRET;
  if (envKey && key === envKey) return true;
  return false;
}

export async function POST(req: NextRequest) {
  if (!authOk(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const tenders: RawTender[] = Array.isArray(body) ? body : (body as { tenders?: RawTender[] }).tenders ?? [];
  if (!tenders.length) {
    return NextResponse.json({ ok: false, error: "no tenders provided" }, { status: 400 });
  }

  await ensureTenderSchema();

  const filtered = tenders.filter(preFilterTender);
  let saved = 0, ai_processed = 0, hot_count = 0, crm_created = 0;

  for (const tender of filtered) {
    const isNew = await saveProcedure(tender);
    if (!isNew) continue;
    saved++;

    const stats = await getCompanyStats(tender.winner_inn);
    const repeatWinner = stats.win_count_365d >= CONFIG.REPEAT_WINNER_MIN_COUNT;

    const company = {
      inn:            tender.winner_inn,
      name:           tender.winner,
      region:         tender.delivery_region,
      win_count:      stats.win_count_365d,
      win_count_30d:  stats.win_count_30d,
      win_count_90d:  stats.win_count_90d,
      win_count_365d: stats.win_count_365d,
      total_amount:   stats.total_amount,
      categories:     tender.category ? [tender.category] : [],
      repeat_winner:  repeatWinner,
      is_new_winner:  stats.win_count_365d <= CONFIG.NEW_WINNER_MAX_COUNT,
      contact_phone:  null,
      contact_email:  null,
      website:        null,
      updated_at:     new Date().toISOString(),
    };

    await upsertCompany(company);

    const fit = await classifyChinaFit(tender);
    ai_processed++;

    if (fit.score < 5) continue; // skip only truly zero-score items

    const opportunity = await buildOpportunity({ tender, company, fit });
    await saveOpportunity(opportunity);

    if (opportunity.lead_score >= CONFIG.CRM_LEAD_THRESHOLD) {
      const priority = opportunity.opportunity_score >= 85 ? "HOT"
        : opportunity.opportunity_score >= 70 ? "WARM" : "COLD";

      const crmLead = await createLead({
        lead_id:         `tender-${tender.purchase_number}`,
        created_at:      new Date().toISOString(),
        updated_at:      new Date().toISOString(),
        name:            tender.winner,
        phone:           "",
        telegram:        "",
        email:           "",
        company:         tender.winner,
        product:         tender.subject,
        product_link:    tender.source_url,
        category:        opportunity.category,
        quantity:        tender.quantity ? String(tender.quantity) : "",
        weight:          "",
        volume:          "",
        country_destination: "Россия",
        city_destination:    tender.delivery_region ?? "",
        delivery_type:       "cargo",
        service_type:        "import",
        status:          "NEW",
        priority,
        estimated_value: tender.final_price,
        manager:         "",
        comment:         opportunity.ai_summary ?? "",
        source:          "TENDER_INTELLIGENCE",
        utm_source:      "manual_import",
        utm_campaign:    `tender_${tender.law_type}`,
      });

      if (crmLead?.lead_id) {
        await setOpportunityCRMLead(opportunity.id, crmLead.lead_id);
        crm_created++;
      }
    }

    if (opportunity.status === "HOT") {
      hot_count++;
      const now = new Date().toISOString();
      await sendHotAlert({ ...opportunity, created_at: now, updated_at: now });
    }
  }

  return NextResponse.json({
    ok: true,
    submitted: tenders.length,
    pre_filtered: filtered.length,
    new_saved: saved,
    ai_processed,
    hot_found: hot_count,
    crm_created,
  });
}
