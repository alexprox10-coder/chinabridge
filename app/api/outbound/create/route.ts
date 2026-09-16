// Manual opportunity creation — §29-31 ТЗ acceptance criteria
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { runOutboundMigrations } from "@/lib/outbound/migrations";
import crypto from "crypto";

export const runtime = "nodejs";
export const maxDuration = 30;

function deriveCompanyId(companyName: string, domain: string): string {
  const key = `${companyName.toLowerCase().trim()}::${domain.toLowerCase().trim()}`;
  return "co_" + crypto.createHash("md5").update(key).digest("hex").slice(0, 12);
}

function deriveOpportunityId(companyId: string, category: string): string {
  const key = `${companyId}::${category.toLowerCase().trim()}`;
  return "opp_" + crypto.createHash("md5").update(key).digest("hex").slice(0, 10);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      companyName, city, country, category, marketplace,
      phone, email, website, vertical, sourceUrl, campaign,
    } = body as {
      companyName: string; city: string; country: string;
      category: string; marketplace?: string; phone?: string;
      email?: string; website?: string; vertical?: string;
      sourceUrl?: string; campaign?: string;
    };

    if (!companyName || !country || !category) {
      return NextResponse.json({ ok: false, error: "companyName, country, category required" }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);
    await runOutboundMigrations();

    const domain = website ? new URL(website.startsWith("http") ? website : `https://${website}`).hostname.replace("www.", "").toLowerCase() : "";
    const companyId = deriveCompanyId(companyName, domain || companyName);
    const opportunityId = deriveOpportunityId(companyId, category);
    const outboundId = `ob_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    await sql`
      INSERT INTO outbound_leads (
        outbound_id, company_id, opportunity_id,
        company_name, city, country, category, marketplace,
        phone, email, website, domain,
        vertical, source, source_url, campaign,
        stage, created_at, updated_at,
        products, china_match, economics, evidence_data
      ) VALUES (
        ${outboundId}, ${companyId}, ${opportunityId},
        ${companyName}, ${city ?? ""}, ${country}, ${category}, ${marketplace ?? ""},
        ${phone ?? ""}, ${email ?? ""}, ${website ?? ""}, ${domain},
        ${vertical ?? ""}, ${"MANUAL"}, ${sourceUrl ?? ""}, ${campaign ?? "OUTBOUND_V1"},
        ${"FOUND"}, ${now}, ${now},
        ${"[]"}, ${"{}"}, ${"{}"}, ${"{}"}
      )
    `;

    return NextResponse.json({ ok: true, outboundId, companyId, opportunityId });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

// GET — list existing companies by company_id for deduplication
export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const companies = await sql`
      SELECT company_id, company_name, country,
             COUNT(*) as opportunity_count,
             MAX(updated_at) as last_updated
      FROM outbound_leads
      WHERE company_id IS NOT NULL AND company_id != ''
      GROUP BY company_id, company_name, country
      ORDER BY opportunity_count DESC, last_updated DESC
      LIMIT 100
    `;
    return NextResponse.json({ ok: true, companies });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
