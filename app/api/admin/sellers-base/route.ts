import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest) {
  return !!(req.cookies.get("cb_admin")?.value || req.cookies.get("cb_tenant_session")?.value);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sql = neon(process.env.DATABASE_URL!);
  const { searchParams } = req.nextUrl;
  const vertical = searchParams.get("vertical") ?? "";
  const statusFilter = searchParams.get("status") ?? "";
  const minScore = parseInt(searchParams.get("minScore") || "0", 10);

  try {
    const [totalRow] = await sql`
      SELECT COUNT(*) AS total FROM outreach_contacts WHERE source = 'msp_registry'
    `;

    const byVerticalRows = await sql`
      SELECT product_vertical, COUNT(*) AS cnt
      FROM outreach_contacts
      WHERE source = 'msp_registry' AND product_vertical IS NOT NULL
      GROUP BY product_vertical
    `;

    const byStatusRows = await sql`
      SELECT status, COUNT(*) AS cnt
      FROM outreach_contacts
      WHERE source = 'msp_registry'
      GROUP BY status
    `;

    const [withEmailRow] = await sql`
      SELECT COUNT(*) AS cnt FROM outreach_contacts
      WHERE source = 'msp_registry' AND email IS NOT NULL AND email != ''
    `;

    const [withPhoneRow] = await sql`
      SELECT COUNT(*) AS cnt FROM outreach_contacts
      WHERE source = 'msp_registry' AND phone IS NOT NULL AND phone != ''
    `;

    const [internetRow] = await sql`
      SELECT COUNT(*) AS cnt FROM outreach_contacts
      WHERE source = 'msp_registry' AND is_internet_seller = true
    `;

    const byVertical: Record<string, number> = {};
    for (const r of byVerticalRows) {
      byVertical[r.product_vertical as string] = parseInt(String(r.cnt), 10);
    }

    const byStatus: Record<string, number> = {};
    for (const r of byStatusRows) {
      byStatus[r.status as string] = parseInt(String(r.cnt), 10);
    }

    const stats = {
      total: parseInt(String(totalRow.total), 10),
      byVertical,
      byStatus,
      withEmail: parseInt(String(withEmailRow.cnt), 10),
      withPhone: parseInt(String(withPhoneRow.cnt), 10),
      internetSellers: parseInt(String(internetRow.cnt), 10),
      scoreDistribution: [],
    };

    // Build contacts query dynamically to avoid parameterized null issues
    let contacts;
    if (vertical && statusFilter) {
      contacts = await sql`
        SELECT id, company_name, inn, okvad, okvad_name, region,
               email, phone, status, product_vertical, lead_score,
               is_internet_seller, created_at
        FROM outreach_contacts
        WHERE source = 'msp_registry'
          AND product_vertical = ${vertical}
          AND status = ${statusFilter}
          AND (lead_score >= ${minScore} OR lead_score IS NULL)
        ORDER BY lead_score DESC NULLS LAST, created_at DESC
        LIMIT 200
      `;
    } else if (vertical) {
      contacts = await sql`
        SELECT id, company_name, inn, okvad, okvad_name, region,
               email, phone, status, product_vertical, lead_score,
               is_internet_seller, created_at
        FROM outreach_contacts
        WHERE source = 'msp_registry'
          AND product_vertical = ${vertical}
          AND (lead_score >= ${minScore} OR lead_score IS NULL)
        ORDER BY lead_score DESC NULLS LAST, created_at DESC
        LIMIT 200
      `;
    } else if (statusFilter) {
      contacts = await sql`
        SELECT id, company_name, inn, okvad, okvad_name, region,
               email, phone, status, product_vertical, lead_score,
               is_internet_seller, created_at
        FROM outreach_contacts
        WHERE source = 'msp_registry'
          AND status = ${statusFilter}
          AND (lead_score >= ${minScore} OR lead_score IS NULL)
        ORDER BY lead_score DESC NULLS LAST, created_at DESC
        LIMIT 200
      `;
    } else {
      contacts = await sql`
        SELECT id, company_name, inn, okvad, okvad_name, region,
               email, phone, status, product_vertical, lead_score,
               is_internet_seller, created_at
        FROM outreach_contacts
        WHERE source = 'msp_registry'
          AND (lead_score >= ${minScore} OR lead_score IS NULL)
        ORDER BY lead_score DESC NULLS LAST, created_at DESC
        LIMIT 200
      `;
    }

    return NextResponse.json({ ok: true, stats, contacts });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
