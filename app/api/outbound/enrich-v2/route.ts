// AI Outbound Engine v2 — Full Pipeline (ТЗ §3-§9)
// FOUND/PERSONALIZED → PRODUCTS_FOUND → CHINA_MATCHED → ECONOMICS_READY → SCORED
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { discoverProducts } from "@/lib/outbound/product-discovery";
import { findChinaMatch } from "@/lib/outbound/china-match";
import { calculateEconomics, CATEGORY_WEIGHTS } from "@/lib/outbound/economics";
import { calculateScore } from "@/lib/outbound/scoring";
import { generateMessage } from "@/lib/outbound/messaging";
import { runOutboundMigrations } from "@/lib/outbound/migrations";
import crypto from "crypto";

export const runtime = "nodejs";
export const maxDuration = 60;

type LeadRow = {
  id: number;
  outbound_id: string;
  company_name: string;
  category: string;
  city: string;
  country: string;
  marketplace: string;
  phone: string;
  email: string;
  website: string;
  stage: string;
  vertical: string;
  source: string;
  source_url: string;
  domain: string;
};

// §3 ТЗ: structured evidence — Verified Facts / AI Inference / Unknown
function buildStructuredEvidence(params: {
  companyName: string;
  marketplace: string;
  sourceUrl: string;
  products: Array<{ name: string; name_en?: string; price_min_kzt?: number; price_min_rub?: number }>;
  chinaMatch: {
    product_name?: string; price_min_cny?: number; price_max_cny?: number;
    match_confidence?: number; supplier_url?: string; source?: string;
  } | null;
  economics: { landed_cost_usd?: number; estimated_margin?: number; price_gap?: number; calculation_valid?: boolean } | null;
  country: "KZ" | "RU";
}) {
  const verifiedFacts: Array<{ fact: string; source: string; url?: string }> = [];
  const aiInferences: Array<{ inference: string; confidence: "high" | "medium" | "low" }> = [];
  const unknowns: Array<{ field: string; why: string }> = [];

  const { companyName, marketplace, sourceUrl, products, chinaMatch, economics, country } = params;

  // Verified: marketplace presence (confirmed by source)
  if (marketplace && marketplace !== "NONE" && sourceUrl) {
    const mpName = marketplace === "KASPI" ? "Kaspi.kz" : marketplace === "WB" ? "Wildberries" : marketplace;
    verifiedFacts.push({
      fact: `Компания "${companyName}" продаёт на ${mpName}`,
      source: mpName,
      url: sourceUrl,
    });
  }

  // Verified: specific product from source
  if (products.length > 0) {
    const p = products[0];
    const price = country === "KZ" ? p.price_min_kzt : p.price_min_rub;
    const currency = country === "KZ" ? "₸" : "₽";
    verifiedFacts.push({
      fact: price
        ? `Товар: "${p.name}" — ~${price.toLocaleString("ru")} ${currency}`
        : `Товар: "${p.name}"`,
      source: "AI Product Discovery",
    });
  }

  // Verified: China source (if confidence ≥ 0.6)
  if (chinaMatch && (chinaMatch.match_confidence ?? 0) >= 0.6) {
    verifiedFacts.push({
      fact: `Китайский источник: ${chinaMatch.product_name ?? "похожий товар"} — ${chinaMatch.price_min_cny}–${chinaMatch.price_max_cny} CNY`,
      source: chinaMatch.source ?? "1688/Alibaba",
      url: chinaMatch.supplier_url,
    });
  } else if (chinaMatch && (chinaMatch.match_confidence ?? 0) >= 0.3) {
    aiInferences.push({
      inference: `Вероятный китайский источник: ${chinaMatch.product_name ?? "похожий товар"} (уверенность ${Math.round((chinaMatch.match_confidence ?? 0) * 100)}%)`,
      confidence: "medium",
    });
  }

  // Verified: economics (if calculation valid)
  if (economics?.calculation_valid && economics.landed_cost_usd) {
    verifiedFacts.push({
      fact: `Расчётная себестоимость: ~$${economics.landed_cost_usd.toFixed(2)}/ед.`,
      source: "Rate Engine",
    });
  }

  // AI Inferences
  if (!chinaMatch || (chinaMatch.match_confidence ?? 0) < 0.3) {
    aiInferences.push({
      inference: "Вероятно закупает через посредника — прямой источник не подтверждён",
      confidence: "low",
    });
  }

  if (marketplace === "NONE" || !marketplace) {
    aiInferences.push({
      inference: "Продаёт через другие каналы (не основной маркетплейс)",
      confidence: "medium",
    });
  }

  // Unknowns
  if (!chinaMatch || (chinaMatch.match_confidence ?? 0) < 0.5) {
    unknowns.push({ field: "Китайский поставщик", why: "Не найден с достаточной уверенностью" });
  }
  if (!economics?.calculation_valid) {
    unknowns.push({ field: "Точная экономика", why: "Недостаточно данных о цене или весе" });
  }
  if (products.length === 0) {
    unknowns.push({ field: "Конкретный товар", why: "Не определён" });
  }

  return { verified_facts: verifiedFacts, ai_inferences: aiInferences, unknown: unknowns };
}

// §19 ТЗ: data quality flags
function assessDataQuality(lead: LeadRow, products: Array<unknown>, chinaMatch: unknown | null) {
  const countryFromSource =
    lead.source === "KASPI" || lead.source_url?.includes("kaspi") ? "KZ" :
    lead.source === "WB" || lead.source_url?.includes("wildberries") ? "RU" :
    null;

  return {
    country_verified: countryFromSource === null || countryFromSource === lead.country,
    company_verified: lead.company_name.length > 2 && !["Company", "ООО", "ИП", "N/A", "—"].includes(lead.company_name),
    product_verified: products.length > 0,
    contact_verified: (lead.phone.length >= 10 || lead.email.includes("@")),
    source_verified: lead.source_url.startsWith("http"),
    data_quality_score: 0, // calculated below
  };
}

function computeDqScore(flags: ReturnType<typeof assessDataQuality>): number {
  let score = 0;
  if (flags.country_verified) score += 25;
  if (flags.company_verified) score += 20;
  if (flags.product_verified) score += 25;
  if (flags.contact_verified) score += 20;
  if (flags.source_verified) score += 10;
  return score;
}

// §2 ТЗ: derive stable company_id from company_name + domain
function deriveCompanyId(companyName: string, domain: string): string {
  const key = `${companyName.toLowerCase().trim()}::${domain.toLowerCase().trim()}`;
  return "co_" + crypto.createHash("md5").update(key).digest("hex").slice(0, 12);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min((body.batchSize ?? 5) as number, 10);
    const stageFilter = (body.stage ?? "PERSONALIZED") as string;
    const specificId = body.outboundId as string | undefined; // single lead re-enrichment

    const sql = neon(process.env.DATABASE_URL!);

    // Run migrations first — idempotent, safe
    await runOutboundMigrations();

    // Fetch leads
    const leads = specificId
      ? await sql`
          SELECT id, outbound_id, company_name, category, city, country,
                 marketplace, phone, email, website, stage, vertical,
                 source, source_url, domain
          FROM outbound_leads WHERE outbound_id = ${specificId} LIMIT 1
        ` as LeadRow[]
      : await sql`
          SELECT id, outbound_id, company_name, category, city, country,
                 marketplace, phone, email, website, stage, vertical,
                 source, source_url, domain
          FROM outbound_leads
          WHERE stage = ${stageFilter}
          ORDER BY opportunity_score DESC
          LIMIT ${batchSize}
        ` as LeadRow[];

    if (!leads.length) {
      return NextResponse.json({ ok: true, processed: 0, message: `No ${stageFilter} leads` });
    }

    const results = [];

    for (const lead of leads) {
      const { outbound_id, company_name, category, city, country, marketplace, phone, email, website, source, source_url, domain } = lead;
      const countryTyped = (country === "KZ" ? "KZ" : "RU") as "KZ" | "RU";

      try {
        // §2: derive company_id
        const company_id = deriveCompanyId(company_name, domain || website);

        // Stage 1: Product Discovery
        await sql`UPDATE outbound_leads SET stage='PRODUCTS_FOUND', company_id=${company_id}, updated_at=${new Date().toISOString()} WHERE outbound_id=${outbound_id}`;

        const productResult = await discoverProducts(company_name, category, city, countryTyped);
        const products = productResult.ok ? productResult.products.slice(0, 3) : [];

        // Stage 2: China Match (best product)
        let chinaMatch = null;
        if (products.length > 0) {
          await sql`UPDATE outbound_leads SET stage='CHINA_MATCHED', updated_at=${new Date().toISOString()} WHERE outbound_id=${outbound_id}`;
          const topProduct = products[0];
          const matchResult = await findChinaMatch(topProduct.name, topProduct.name_en, category);
          if (matchResult.ok) chinaMatch = matchResult.match ?? null;
        }

        const matchConfidence = chinaMatch?.match_confidence ?? 0;

        // Stage 3: Economics
        let economics = null;
        if (chinaMatch && matchConfidence >= 0.5) {
          await sql`UPDATE outbound_leads SET stage='ECONOMICS_READY', updated_at=${new Date().toISOString()} WHERE outbound_id=${outbound_id}`;
          const avgPrice = (chinaMatch.price_min_cny + chinaMatch.price_max_cny) / 2;
          const weight = products[0]?.weight_kg ?? CATEGORY_WEIGHTS[category] ?? 0.8;
          const sellingPrice = products[0]?.price_min_kzt ?? products[0]?.price_min_rub;
          economics = calculateEconomics({
            china_price_cny: avgPrice,
            weight_kg: weight,
            country: countryTyped,
            selling_price_local: sellingPrice,
            currency: countryTyped === "KZ" ? "KZT" : "RUB",
          });
        }

        // Stage 4: Score (with evidence_factor gate — §10 ТЗ)
        const scoreInput = {
          category, marketplace, phone, email, website, country: countryTyped,
          chinaMatch, economics, products,
          productVerified: products.length > 0,
          localPriceKnown: !!(products[0]?.price_min_kzt || products[0]?.price_min_rub),
        };
        const score = calculateScore(scoreInput);

        // Stage 5: Message Generation
        const messaging = await generateMessage({
          companyName: company_name, category, city, country: countryTyped,
          marketplace, products, chinaMatch, economics, matchConfidence,
        });

        // §3: Build structured evidence (Verified Facts / AI Inference / Unknown)
        const structuredEvidence = buildStructuredEvidence({
          companyName: company_name, marketplace, sourceUrl: source_url, products,
          chinaMatch, economics, country: countryTyped,
        });

        // §19: Data quality flags
        const dqFlags = assessDataQuality(lead, products, chinaMatch);
        dqFlags.data_quality_score = computeDqScore(dqFlags);

        // China source fields
        const china_source_url = chinaMatch?.supplier_url ?? "";
        const china_unit_price = chinaMatch ? ((chinaMatch.price_min_cny + chinaMatch.price_max_cny) / 2) : null;
        const local_selling_price =
          countryTyped === "KZ" ? (products[0]?.price_min_kzt ?? null) : (products[0]?.price_min_rub ?? null);
        const potential_saving =
          economics?.calculation_valid && economics.price_gap > 0
            ? Math.round(economics.price_gap * 100)
            : null;

        const now = new Date().toISOString();

        await sql`
          UPDATE outbound_leads SET
            stage = 'SCORED',
            company_id = ${company_id},
            products = ${JSON.stringify(products)},
            products_count = ${products.length},
            china_match = ${JSON.stringify(chinaMatch ?? {})},
            china_match_status = ${matchConfidence >= 0.7 ? 'MATCHED' : matchConfidence >= 0.4 ? 'PARTIAL' : 'UNKNOWN'},
            china_source_url = ${china_source_url},
            china_unit_price = ${china_unit_price},
            local_selling_price = ${local_selling_price},
            economics = ${JSON.stringify(economics ?? {})},
            potential_saving = ${potential_saving},
            opportunity_score = ${score.opportunity_score},
            raw_opportunity_score = ${score.raw_opportunity_score},
            evidence_factor_used = ${score.evidence_factor},
            company_score = ${score.company_score},
            evidence_score = ${score.evidence_score},
            evidence_data = ${JSON.stringify({
              structured: structuredEvidence,
              breakdown: score.evidence_breakdown,
              label: score.evidence_label,
            })},
            data_quality_score = ${dqFlags.data_quality_score},
            country_verified = ${dqFlags.country_verified},
            company_verified = ${dqFlags.company_verified},
            product_verified = ${dqFlags.product_verified},
            contact_verified = ${dqFlags.contact_verified},
            source_verified = ${dqFlags.source_verified},
            reason_to_contact = ${messaging.reason_to_contact},
            personalized_message = ${messaging.personalized_message},
            pitch_type = ${messaging.pitch_type},
            recommended_offer = ${messaging.recommended_offer},
            next_best_action = ${messaging.next_best_action},
            message_quality_score = ${messaging.message_quality_score},
            message_status = 'GENERATED',
            approval_status = 'PENDING',
            outreach_status = 'NOT_SENT',
            lead_quality = ${score.evidence_score >= 60 ? 'VALID' : score.evidence_score >= 35 ? 'LOW_EVIDENCE' : 'WEAK'},
            stage_updated_at = ${now},
            supplier_exists = false,
            updated_at = ${now}
          WHERE outbound_id = ${outbound_id}
        `;

        results.push({
          outboundId: outbound_id,
          company: company_name,
          companyId: company_id,
          opportunityScore: score.opportunity_score,
          rawOpportunityScore: score.raw_opportunity_score,
          evidenceScore: score.evidence_score,
          evidenceFactor: score.evidence_factor,
          evidenceLabel: score.evidence_label,
          dataQualityScore: dqFlags.data_quality_score,
          chinaMatchConfidence: matchConfidence,
          productsFound: products.length,
          messagingOk: messaging.ok,
          ok: true,
        });
      } catch (err) {
        await sql`
          UPDATE outbound_leads SET
            stage = 'PERSONALIZED',
            error_stage = 'ENRICH_V2',
            last_error = ${String(err).slice(0, 500)},
            retry_count = retry_count + 1,
            updated_at = ${new Date().toISOString()}
          WHERE outbound_id = ${outbound_id}
        `;
        results.push({ outboundId: outbound_id, ok: false, error: String(err) });
      }
    }

    return NextResponse.json({ ok: true, processed: results.length, results });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
