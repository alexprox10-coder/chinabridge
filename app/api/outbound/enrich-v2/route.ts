// AI Outbound Engine v2 — Full Pipeline:
// PERSONALIZED → PRODUCTS_FOUND → CHINA_MATCHED → ECONOMICS_READY → SCORED
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { discoverProducts } from "@/lib/outbound/product-discovery";
import { findChinaMatch } from "@/lib/outbound/china-match";
import { calculateEconomics, CATEGORY_WEIGHTS } from "@/lib/outbound/economics";
import { calculateScore } from "@/lib/outbound/scoring";
import { generateMessage } from "@/lib/outbound/messaging";

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
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min((body.batchSize ?? 5) as number, 10);
    const stage = (body.stage ?? "PERSONALIZED") as string;

    const sql = neon(process.env.DATABASE_URL!);

    // Fetch leads in target stage
    const leads = await sql`
      SELECT id, outbound_id, company_name, category, city, country,
             marketplace, phone, email, website, stage, vertical
      FROM outbound_leads
      WHERE stage = ${stage}
      ORDER BY opportunity_score DESC
      LIMIT ${batchSize}
    ` as LeadRow[];

    if (!leads.length) {
      return NextResponse.json({ ok: true, processed: 0, message: `No ${stage} leads` });
    }

    const results = [];

    for (const lead of leads) {
      const { outbound_id, company_name, category, city, country, marketplace, phone, email, website } = lead;
      const countryTyped = (country === "KZ" ? "KZ" : "RU") as "KZ" | "RU";

      try {
        // Stage 1: Product Discovery
        await sql`UPDATE outbound_leads SET stage='PRODUCTS_FOUND', updated_at=${new Date().toISOString()} WHERE outbound_id=${outbound_id}`;

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

        // Stage 4: Opportunity Score
        const score = calculateScore({
          category,
          marketplace,
          phone,
          email,
          website,
          country: countryTyped,
          chinaMatch,
          economics,
        });

        // Stage 5: Message Generation
        const messaging = await generateMessage({
          companyName: company_name,
          category,
          city,
          country: countryTyped,
          marketplace,
          products,
          chinaMatch,
          economics,
          matchConfidence,
        });

        // Persist everything
        await sql`
          UPDATE outbound_leads SET
            stage = 'SCORED',
            products = ${JSON.stringify(products)},
            products_count = ${products.length},
            china_match = ${JSON.stringify(chinaMatch ?? {})},
            china_match_status = ${matchConfidence >= 0.7 ? 'MATCHED' : matchConfidence >= 0.4 ? 'PARTIAL' : 'UNKNOWN'},
            economics = ${JSON.stringify(economics ?? {})},
            opportunity_score = ${score.opportunity_score},
            company_score = ${score.company_score},
            reason_to_contact = ${messaging.reason_to_contact},
            personalized_message = ${messaging.personalized_message},
            pitch_type = ${messaging.pitch_type},
            message_quality_score = ${messaging.message_quality_score},
            supplier_exists = false,
            updated_at = ${new Date().toISOString()}
          WHERE outbound_id = ${outbound_id}
        `;

        results.push({
          outboundId: outbound_id,
          company: company_name,
          opportunityScore: score.opportunity_score,
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
