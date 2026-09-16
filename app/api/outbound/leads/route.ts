import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const maxDuration = 30;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapLead(r: Record<string, any>) {
  return {
    outboundId: r.outbound_id,
    companyName: r.company_name ?? "",
    city: r.city ?? "",
    country: r.country ?? "",
    category: r.category ?? "",
    marketplace: r.marketplace ?? "",
    phone: r.phone ?? "",
    email: r.email ?? "",
    website: r.website ?? "",
    stage: r.stage ?? "FOUND",
    opportunityScore: r.opportunity_score ?? 0,
    rawOpportunityScore: r.raw_opportunity_score ?? 0,
    evidenceScore: r.evidence_score ?? 0,
    companyScore: r.company_score ?? 0,
    leadScore: r.lead_score ?? 0,
    reasonToContact: r.reason_to_contact ?? "",
    personalizedMessage: r.personalized_message ?? "",
    messageQualityScore: r.message_quality_score ?? 0,
    responseStatus: r.response_status ?? "",
    pitchType: r.pitch_type ?? "SELLER_OUTBOUND",
    recommendedOffer: r.recommended_offer ?? "",
    nextBestAction: r.next_best_action ?? "",
    chinaMatchStatus: r.china_match_status ?? "UNKNOWN",
    chinaMatch: r.china_match ?? {},
    products: r.products ?? [],
    economics: r.economics ?? {},
    evidenceData: r.evidence_data ?? {},
    leadQuality: r.lead_quality ?? "UNREVIEWED",
    source: r.source ?? "",
    vertical: r.vertical ?? "",
    createdAt: r.created_at ?? "",
    // New fields (§6/§19/§22 ТЗ) — graceful defaults if columns not yet migrated
    companyId: r.company_id ?? "",
    chinaSourceUrl: r.china_source_url ?? "",
    chinaUnitPrice: r.china_unit_price ?? null,
    localSellingPrice: r.local_selling_price ?? null,
    dataQualityScore: r.data_quality_score ?? 0,
    countryVerified: r.country_verified ?? false,
    companyVerified: r.company_verified ?? false,
    productVerified: r.product_verified ?? false,
    contactVerified: r.contact_verified ?? false,
    sourceVerified: r.source_verified ?? false,
    messageStatus: r.message_status ?? "DRAFT",
    approvalStatus: r.approval_status ?? "PENDING",
    outreachStatus: r.outreach_status ?? "NOT_SENT",
    messageVersion: r.message_version ?? "v1",
    quoteId: r.quote_id ?? "",
    dealId: r.deal_id ?? "",
    campaign: r.campaign ?? "OUTBOUND_V1",
    opportunityId: r.opportunity_id ?? "",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function queryLeads(sql: any, stage: string, country: string, vertical: string, limit: number): Promise<Record<string, any>[]> {
  if (stage && country && vertical) {
    return sql`SELECT outbound_id,company_name,city,country,category,marketplace,phone,email,website,stage,source,vertical,opportunity_score,company_score,lead_score,COALESCE(evidence_score,0)AS evidence_score,reason_to_contact,personalized_message,message_quality_score,response_status,pitch_type,china_match_status,COALESCE(recommended_offer,'')AS recommended_offer,COALESCE(next_best_action,'')AS next_best_action,COALESCE(lead_quality,'UNREVIEWED')AS lead_quality,china_match,products,economics,COALESCE(evidence_data,'{}')AS evidence_data,created_at,COALESCE(company_id,'')AS company_id,COALESCE(china_source_url,'')AS china_source_url,COALESCE(china_unit_price,NULL)AS china_unit_price,COALESCE(local_selling_price,NULL)AS local_selling_price,COALESCE(data_quality_score,0)AS data_quality_score,COALESCE(raw_opportunity_score,0)AS raw_opportunity_score,COALESCE(country_verified,false)AS country_verified,COALESCE(company_verified,false)AS company_verified,COALESCE(product_verified,false)AS product_verified,COALESCE(contact_verified,false)AS contact_verified,COALESCE(source_verified,false)AS source_verified,COALESCE(message_status,'DRAFT')AS message_status,COALESCE(approval_status,'PENDING')AS approval_status,COALESCE(outreach_status,'NOT_SENT')AS outreach_status,COALESCE(message_version,'v1')AS message_version,COALESCE(quote_id,'')AS quote_id,COALESCE(deal_id,'')AS deal_id,COALESCE(campaign,'OUTBOUND_V1')AS campaign,COALESCE(opportunity_id,'')AS opportunity_id FROM outbound_leads WHERE stage=${stage} AND country=${country} AND vertical=${vertical} ORDER BY opportunity_score DESC LIMIT ${limit}` as Promise<Record<string,any>[]>;
  } else if (stage && country) {
    return sql`SELECT outbound_id,company_name,city,country,category,marketplace,phone,email,website,stage,source,vertical,opportunity_score,company_score,lead_score,COALESCE(evidence_score,0)AS evidence_score,reason_to_contact,personalized_message,message_quality_score,response_status,pitch_type,china_match_status,COALESCE(recommended_offer,'')AS recommended_offer,COALESCE(next_best_action,'')AS next_best_action,COALESCE(lead_quality,'UNREVIEWED')AS lead_quality,china_match,products,economics,COALESCE(evidence_data,'{}')AS evidence_data,created_at,COALESCE(company_id,'')AS company_id,COALESCE(china_source_url,'')AS china_source_url,COALESCE(china_unit_price,NULL)AS china_unit_price,COALESCE(local_selling_price,NULL)AS local_selling_price,COALESCE(data_quality_score,0)AS data_quality_score,COALESCE(raw_opportunity_score,0)AS raw_opportunity_score,COALESCE(country_verified,false)AS country_verified,COALESCE(company_verified,false)AS company_verified,COALESCE(product_verified,false)AS product_verified,COALESCE(contact_verified,false)AS contact_verified,COALESCE(source_verified,false)AS source_verified,COALESCE(message_status,'DRAFT')AS message_status,COALESCE(approval_status,'PENDING')AS approval_status,COALESCE(outreach_status,'NOT_SENT')AS outreach_status,COALESCE(message_version,'v1')AS message_version,COALESCE(quote_id,'')AS quote_id,COALESCE(deal_id,'')AS deal_id,COALESCE(campaign,'OUTBOUND_V1')AS campaign,COALESCE(opportunity_id,'')AS opportunity_id FROM outbound_leads WHERE stage=${stage} AND country=${country} ORDER BY opportunity_score DESC LIMIT ${limit}` as Promise<Record<string,any>[]>;
  } else if (stage && vertical) {
    return sql`SELECT outbound_id,company_name,city,country,category,marketplace,phone,email,website,stage,source,vertical,opportunity_score,company_score,lead_score,COALESCE(evidence_score,0)AS evidence_score,reason_to_contact,personalized_message,message_quality_score,response_status,pitch_type,china_match_status,COALESCE(recommended_offer,'')AS recommended_offer,COALESCE(next_best_action,'')AS next_best_action,COALESCE(lead_quality,'UNREVIEWED')AS lead_quality,china_match,products,economics,COALESCE(evidence_data,'{}')AS evidence_data,created_at,COALESCE(company_id,'')AS company_id,COALESCE(china_source_url,'')AS china_source_url,COALESCE(china_unit_price,NULL)AS china_unit_price,COALESCE(local_selling_price,NULL)AS local_selling_price,COALESCE(data_quality_score,0)AS data_quality_score,COALESCE(raw_opportunity_score,0)AS raw_opportunity_score,COALESCE(country_verified,false)AS country_verified,COALESCE(company_verified,false)AS company_verified,COALESCE(product_verified,false)AS product_verified,COALESCE(contact_verified,false)AS contact_verified,COALESCE(source_verified,false)AS source_verified,COALESCE(message_status,'DRAFT')AS message_status,COALESCE(approval_status,'PENDING')AS approval_status,COALESCE(outreach_status,'NOT_SENT')AS outreach_status,COALESCE(message_version,'v1')AS message_version,COALESCE(quote_id,'')AS quote_id,COALESCE(deal_id,'')AS deal_id,COALESCE(campaign,'OUTBOUND_V1')AS campaign,COALESCE(opportunity_id,'')AS opportunity_id FROM outbound_leads WHERE stage=${stage} AND vertical=${vertical} ORDER BY opportunity_score DESC LIMIT ${limit}` as Promise<Record<string,any>[]>;
  } else if (stage) {
    return sql`SELECT outbound_id,company_name,city,country,category,marketplace,phone,email,website,stage,source,vertical,opportunity_score,company_score,lead_score,COALESCE(evidence_score,0)AS evidence_score,reason_to_contact,personalized_message,message_quality_score,response_status,pitch_type,china_match_status,COALESCE(recommended_offer,'')AS recommended_offer,COALESCE(next_best_action,'')AS next_best_action,COALESCE(lead_quality,'UNREVIEWED')AS lead_quality,china_match,products,economics,COALESCE(evidence_data,'{}')AS evidence_data,created_at,COALESCE(company_id,'')AS company_id,COALESCE(china_source_url,'')AS china_source_url,COALESCE(china_unit_price,NULL)AS china_unit_price,COALESCE(local_selling_price,NULL)AS local_selling_price,COALESCE(data_quality_score,0)AS data_quality_score,COALESCE(raw_opportunity_score,0)AS raw_opportunity_score,COALESCE(country_verified,false)AS country_verified,COALESCE(company_verified,false)AS company_verified,COALESCE(product_verified,false)AS product_verified,COALESCE(contact_verified,false)AS contact_verified,COALESCE(source_verified,false)AS source_verified,COALESCE(message_status,'DRAFT')AS message_status,COALESCE(approval_status,'PENDING')AS approval_status,COALESCE(outreach_status,'NOT_SENT')AS outreach_status,COALESCE(message_version,'v1')AS message_version,COALESCE(quote_id,'')AS quote_id,COALESCE(deal_id,'')AS deal_id,COALESCE(campaign,'OUTBOUND_V1')AS campaign,COALESCE(opportunity_id,'')AS opportunity_id FROM outbound_leads WHERE stage=${stage} ORDER BY opportunity_score DESC LIMIT ${limit}` as Promise<Record<string,any>[]>;
  } else if (country && vertical) {
    return sql`SELECT outbound_id,company_name,city,country,category,marketplace,phone,email,website,stage,source,vertical,opportunity_score,company_score,lead_score,COALESCE(evidence_score,0)AS evidence_score,reason_to_contact,personalized_message,message_quality_score,response_status,pitch_type,china_match_status,COALESCE(recommended_offer,'')AS recommended_offer,COALESCE(next_best_action,'')AS next_best_action,COALESCE(lead_quality,'UNREVIEWED')AS lead_quality,china_match,products,economics,COALESCE(evidence_data,'{}')AS evidence_data,created_at,COALESCE(company_id,'')AS company_id,COALESCE(china_source_url,'')AS china_source_url,COALESCE(china_unit_price,NULL)AS china_unit_price,COALESCE(local_selling_price,NULL)AS local_selling_price,COALESCE(data_quality_score,0)AS data_quality_score,COALESCE(raw_opportunity_score,0)AS raw_opportunity_score,COALESCE(country_verified,false)AS country_verified,COALESCE(company_verified,false)AS company_verified,COALESCE(product_verified,false)AS product_verified,COALESCE(contact_verified,false)AS contact_verified,COALESCE(source_verified,false)AS source_verified,COALESCE(message_status,'DRAFT')AS message_status,COALESCE(approval_status,'PENDING')AS approval_status,COALESCE(outreach_status,'NOT_SENT')AS outreach_status,COALESCE(message_version,'v1')AS message_version,COALESCE(quote_id,'')AS quote_id,COALESCE(deal_id,'')AS deal_id,COALESCE(campaign,'OUTBOUND_V1')AS campaign,COALESCE(opportunity_id,'')AS opportunity_id FROM outbound_leads WHERE country=${country} AND vertical=${vertical} ORDER BY opportunity_score DESC LIMIT ${limit}` as Promise<Record<string,any>[]>;
  } else if (country) {
    return sql`SELECT outbound_id,company_name,city,country,category,marketplace,phone,email,website,stage,source,vertical,opportunity_score,company_score,lead_score,COALESCE(evidence_score,0)AS evidence_score,reason_to_contact,personalized_message,message_quality_score,response_status,pitch_type,china_match_status,COALESCE(recommended_offer,'')AS recommended_offer,COALESCE(next_best_action,'')AS next_best_action,COALESCE(lead_quality,'UNREVIEWED')AS lead_quality,china_match,products,economics,COALESCE(evidence_data,'{}')AS evidence_data,created_at,COALESCE(company_id,'')AS company_id,COALESCE(china_source_url,'')AS china_source_url,COALESCE(china_unit_price,NULL)AS china_unit_price,COALESCE(local_selling_price,NULL)AS local_selling_price,COALESCE(data_quality_score,0)AS data_quality_score,COALESCE(raw_opportunity_score,0)AS raw_opportunity_score,COALESCE(country_verified,false)AS country_verified,COALESCE(company_verified,false)AS company_verified,COALESCE(product_verified,false)AS product_verified,COALESCE(contact_verified,false)AS contact_verified,COALESCE(source_verified,false)AS source_verified,COALESCE(message_status,'DRAFT')AS message_status,COALESCE(approval_status,'PENDING')AS approval_status,COALESCE(outreach_status,'NOT_SENT')AS outreach_status,COALESCE(message_version,'v1')AS message_version,COALESCE(quote_id,'')AS quote_id,COALESCE(deal_id,'')AS deal_id,COALESCE(campaign,'OUTBOUND_V1')AS campaign,COALESCE(opportunity_id,'')AS opportunity_id FROM outbound_leads WHERE country=${country} ORDER BY opportunity_score DESC LIMIT ${limit}` as Promise<Record<string,any>[]>;
  } else if (vertical) {
    return sql`SELECT outbound_id,company_name,city,country,category,marketplace,phone,email,website,stage,source,vertical,opportunity_score,company_score,lead_score,COALESCE(evidence_score,0)AS evidence_score,reason_to_contact,personalized_message,message_quality_score,response_status,pitch_type,china_match_status,COALESCE(recommended_offer,'')AS recommended_offer,COALESCE(next_best_action,'')AS next_best_action,COALESCE(lead_quality,'UNREVIEWED')AS lead_quality,china_match,products,economics,COALESCE(evidence_data,'{}')AS evidence_data,created_at,COALESCE(company_id,'')AS company_id,COALESCE(china_source_url,'')AS china_source_url,COALESCE(china_unit_price,NULL)AS china_unit_price,COALESCE(local_selling_price,NULL)AS local_selling_price,COALESCE(data_quality_score,0)AS data_quality_score,COALESCE(raw_opportunity_score,0)AS raw_opportunity_score,COALESCE(country_verified,false)AS country_verified,COALESCE(company_verified,false)AS company_verified,COALESCE(product_verified,false)AS product_verified,COALESCE(contact_verified,false)AS contact_verified,COALESCE(source_verified,false)AS source_verified,COALESCE(message_status,'DRAFT')AS message_status,COALESCE(approval_status,'PENDING')AS approval_status,COALESCE(outreach_status,'NOT_SENT')AS outreach_status,COALESCE(message_version,'v1')AS message_version,COALESCE(quote_id,'')AS quote_id,COALESCE(deal_id,'')AS deal_id,COALESCE(campaign,'OUTBOUND_V1')AS campaign,COALESCE(opportunity_id,'')AS opportunity_id FROM outbound_leads WHERE vertical=${vertical} ORDER BY opportunity_score DESC LIMIT ${limit}` as Promise<Record<string,any>[]>;
  } else {
    return sql`SELECT outbound_id,company_name,city,country,category,marketplace,phone,email,website,stage,source,vertical,opportunity_score,company_score,lead_score,COALESCE(evidence_score,0)AS evidence_score,reason_to_contact,personalized_message,message_quality_score,response_status,pitch_type,china_match_status,COALESCE(recommended_offer,'')AS recommended_offer,COALESCE(next_best_action,'')AS next_best_action,COALESCE(lead_quality,'UNREVIEWED')AS lead_quality,china_match,products,economics,COALESCE(evidence_data,'{}')AS evidence_data,created_at,COALESCE(company_id,'')AS company_id,COALESCE(china_source_url,'')AS china_source_url,COALESCE(china_unit_price,NULL)AS china_unit_price,COALESCE(local_selling_price,NULL)AS local_selling_price,COALESCE(data_quality_score,0)AS data_quality_score,COALESCE(raw_opportunity_score,0)AS raw_opportunity_score,COALESCE(country_verified,false)AS country_verified,COALESCE(company_verified,false)AS company_verified,COALESCE(product_verified,false)AS product_verified,COALESCE(contact_verified,false)AS contact_verified,COALESCE(source_verified,false)AS source_verified,COALESCE(message_status,'DRAFT')AS message_status,COALESCE(approval_status,'PENDING')AS approval_status,COALESCE(outreach_status,'NOT_SENT')AS outreach_status,COALESCE(message_version,'v1')AS message_version,COALESCE(quote_id,'')AS quote_id,COALESCE(deal_id,'')AS deal_id,COALESCE(campaign,'OUTBOUND_V1')AS campaign,COALESCE(opportunity_id,'')AS opportunity_id FROM outbound_leads ORDER BY opportunity_score DESC LIMIT ${limit}` as Promise<Record<string,any>[]>;
  }
}

export async function GET(req: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const { searchParams } = new URL(req.url);
    const stage = searchParams.get("stage") ?? "";
    const country = searchParams.get("country") ?? "";
    const vertical = searchParams.get("vertical") ?? "";
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "200"), 500);

    // Try with new columns (COALESCE handles NULL); catch if column doesn't exist yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rows: Record<string, any>[];
    try {
      rows = await queryLeads(sql, stage, country, vertical, limit);
    } catch {
      // Fallback: columns may not exist yet — select without new v1.1 fields
      rows = await sql`SELECT outbound_id,company_name,city,country,category,marketplace,phone,email,website,stage,source,vertical,opportunity_score,company_score,lead_score,0 AS evidence_score,reason_to_contact,personalized_message,message_quality_score,response_status,pitch_type,china_match_status,'' AS recommended_offer,'' AS next_best_action,'UNREVIEWED' AS lead_quality,china_match,products,economics,'{}' AS evidence_data,created_at FROM outbound_leads ORDER BY opportunity_score DESC LIMIT ${limit}` as typeof rows;
    }

    const countRows = await sql`SELECT stage, COUNT(*)::int AS cnt FROM outbound_leads GROUP BY stage` as { stage: string; cnt: number }[];
    const stageCounts: Record<string, number> = {};
    let total = 0;
    for (const r of countRows) {
      stageCounts[r.stage] = r.cnt;
      total += r.cnt;
    }

    return NextResponse.json({ ok: true, leads: rows.map(mapLead), total, stageCounts });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const body = await req.json();
    const { outboundId, stage, responseStatus } = body as { outboundId: string; stage?: string; responseStatus?: string };
    if (!outboundId) return NextResponse.json({ ok: false, error: "outboundId required" }, { status: 400 });

    const now = new Date().toISOString();
    if (stage) {
      await sql`UPDATE outbound_leads SET stage=${stage}, updated_at=${now} WHERE outbound_id=${outboundId}`;
    }
    if (responseStatus) {
      await sql`UPDATE outbound_leads SET response_status=${responseStatus}, updated_at=${now} WHERE outbound_id=${outboundId}`;
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
