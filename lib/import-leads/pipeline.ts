import type { PipelineResult } from "./types";
import type { ImportLeadsConfig } from "./config";
import { searchCompanies } from "./search";
import { analyzeWebsite } from "./analyze";
import { scoreLead } from "./score";
import { saveLead, isDuplicateWebsite } from "./crm";
import { notifyTelegramLead } from "./notify";

function trackEvent(event: string, params?: Record<string, unknown>) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chinabridge.pro";
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (!gaId) return;
  // Server-side GA4 Measurement Protocol
  const mp_secret = process.env.GA_MP_SECRET;
  if (!mp_secret) return;
  fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${gaId}&api_secret=${mp_secret}`,
    {
      method: "POST",
      body: JSON.stringify({
        client_id: "import-leads-agent",
        events: [{ name: event, params: { ...params, page_location: siteUrl } }],
      }),
    }
  ).catch(() => {});
}

export async function runPipeline(config: ImportLeadsConfig): Promise<PipelineResult> {
  const result: PipelineResult = { found: 0, analyzed: 0, saved: 0, errors: [] };
  const today = new Date().toISOString().split("T")[0];

  const queriesPerRun = Math.ceil(config.dailyLimit / 5);
  const queries = config.searchQueries.slice(0, queriesPerRun);

  const searchResults = await searchCompanies(queries, 5);
  result.found = searchResults.length;
  trackEvent("leadFound", { count: result.found, date: today });

  let saved = 0;

  for (const sr of searchResults) {
    if (saved >= config.dailyLimit) break;

    try {
      // Skip duplicates
      const isDup = await isDuplicateWebsite(sr.url, config.companyId);
      if (isDup) continue;

      // Analyze website
      const analysis = await analyzeWebsite(sr.url);
      if (!analysis) {
        result.errors.push(`analyze_failed: ${sr.url}`);
        continue;
      }
      result.analyzed++;
      trackEvent("leadAnalyzed", { url: sr.url, imports: analysis.imports });

      // Score
      const scored = await scoreLead(analysis, sr.url, config);
      if (scored.score < config.minScore) continue;

      // Build lead
      const lead = {
        lead_id: crypto.randomUUID(),
        company: analysis.company || sr.title,
        website: sr.url,
        category: analysis.category,
        city: analysis.city,
        country: analysis.country,
        phone: analysis.phone,
        email: analysis.email,
        telegram: analysis.telegram,
        source: sr.source,
        imports: analysis.imports,
        score: scored.score,
        score_stars: scored.score_stars,
        why: scored.why,
        offer: scored.offer,
        message: scored.message,
        company_id: config.companyId,
        created_at: new Date().toISOString(),
        status: "new" as const,
      };

      // Save to CRM
      const saved_lead = await saveLead(lead);
      if (!saved_lead) {
        result.errors.push(`crm_save_failed: ${sr.url}`);
        continue;
      }
      result.saved++;
      saved++;
      trackEvent("leadAddedToCRM", { score: scored.score, category: analysis.category });

      // Telegram notification
      await notifyTelegramLead({ ...lead, id: (saved_lead as { id?: number }).id });
      trackEvent("telegramLeadSent", { score: scored.score });
      trackEvent("proposalGenerated", { category: analysis.category });
    } catch (err) {
      result.errors.push(`pipeline_error: ${sr.url}: ${String(err)}`);
    }
  }

  return result;
}
