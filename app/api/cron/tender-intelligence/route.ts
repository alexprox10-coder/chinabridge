// Tender Intelligence — main pipeline cron
// Schedule: every 4 hours (cron: "0 */4 * * *")
// Daily digest: "0 7 * * *"
//
// Pipeline: Collect → Pre-filter → China Fit → Score → CRM Lead → HOT Alert

import { NextRequest, NextResponse } from "next/server";
import { fetchRecentWinners, preFilterTender } from "@/lib/tender/eis";
import { classifyChinaFit } from "@/lib/tender/china-fit";
import { buildOpportunity } from "@/lib/tender/scorer";
import {
  ensureTenderSchema, saveProcedure, upsertCompany,
  getCompanyStats, saveOpportunity, setOpportunityCRMLead,
  getDailyStats,
} from "@/lib/tender/db";
import { sendHotAlert, sendDailyDigest } from "@/lib/tender/digest";
import { createLead } from "@/lib/crm/client";
import { CONFIG } from "@/lib/tender/types";

export const runtime     = "nodejs";
export const maxDuration = 300; // 5 min

function getDateRange(hoursBack = 6): { dateFrom: string; dateTo: string } {
  const to   = new Date();
  const from = new Date(to.getTime() - hoursBack * 3600 * 1000);
  const fmt  = (d: Date) => d.toISOString().slice(0, 10);
  return { dateFrom: fmt(from), dateTo: fmt(to) };
}

// Verify cron secret or admin cookie
function authOk(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev mode
  const header = req.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  // Allow authenticated admins to trigger manually from the dashboard
  const adminCookie = req.cookies.get("cb_admin")?.value;
  return !!adminCookie;
}

export async function GET(req: NextRequest) {
  if (!authOk(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const mode = searchParams.get("mode") ?? "collect"; // collect | digest | test

  try {
    await ensureTenderSchema();

    if (mode === "digest") {
      await sendDailyDigest();
      return NextResponse.json({ ok: true, mode: "digest" });
    }

    // Vercel Hobby: one cron per day at 05:00 — collect + digest in single run

    if (mode === "test") {
      const stats = await getDailyStats();
      return NextResponse.json({ ok: true, stats });
    }

    // === COLLECT MODE ===
    const { dateFrom, dateTo } = getDateRange(8);
    const log: string[] = [];

    // Phase 1: Collect from ЕИС
    log.push(`[1] Fetching ЕИС winners ${dateFrom} → ${dateTo}`);
    const rawTenders = await fetchRecentWinners({ dateFrom, dateTo, pageSize: 100 });
    log.push(`[1] Fetched: ${rawTenders.length} procedures`);

    // Phase 2: Pre-filter (cheap rules, no AI)
    const filtered = rawTenders.filter(preFilterTender);
    log.push(`[2] After pre-filter: ${filtered.length}`);

    let saved = 0, ai_processed = 0, hot_count = 0, crm_created = 0;

    for (const tender of filtered) {
      // Phase 3: Save raw procedure (dedup by purchase_number)
      const isNew = await saveProcedure(tender);
      if (!isNew) continue; // already processed
      saved++;

      // Phase 4: Company resolution
      const stats = await getCompanyStats(tender.winner_inn);
      const repeatWinner = stats.win_count_365d >= CONFIG.REPEAT_WINNER_MIN_COUNT;

      await upsertCompany({
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
      });

      // Phase 5: China Fit AI (only for candidates worth analyzing — ТЗ §42)
      const triggerDeepResearch =
        repeatWinner ||
        tender.final_price >= CONFIG.HIGH_VALUE_CONTRACT;

      const fit = await classifyChinaFit(tender);
      ai_processed++;

      if (fit.category === "IRRELEVANT") continue;

      // Phase 6: Build opportunity with scoring
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

      const opportunity = await buildOpportunity({ tender, company, fit });
      await saveOpportunity(opportunity);

      // Phase 7: Create CRM lead if threshold met
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
          utm_source:      "eis",
          utm_campaign:    `tender_${tender.law_type}`,
        });

        if (crmLead?.lead_id) {
          await setOpportunityCRMLead(opportunity.id, crmLead.lead_id);
          crm_created++;
        }
      }

      // Phase 8: HOT alert via Telegram
      if (opportunity.status === "HOT") {
        hot_count++;
        const now = new Date().toISOString();
        await sendHotAlert({ ...opportunity, created_at: now, updated_at: now });
      }
    }

    const result = {
      ok: true,
      mode: "collect",
      period: `${dateFrom} → ${dateTo}`,
      fetched:      rawTenders.length,
      pre_filtered: filtered.length,
      new_saved:    saved,
      ai_processed,
      hot_found:    hot_count,
      crm_created,
    };

    log.push(`[done] ${JSON.stringify(result)}`);

    // Send daily digest after collect (single cron on Hobby plan)
    await sendDailyDigest().catch(() => {});

    return NextResponse.json(result);

  } catch (err) {
    console.error("[tender-intelligence] error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
