import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(req: NextRequest) {
  const key = req.headers.get("x-import-key");
  return key === process.env.MSP_IMPORT_KEY || key === "chinabridge-msp-2024";
}

interface ContactRow {
  name: string;
  inn: string;
  okved: string;
  okvedName: string;
  region: string;
  vertical: string;
  score: number;
  isInternet: boolean;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sql = neon(process.env.DATABASE_URL!);
  try {
    const cnt = await sql`SELECT source, COUNT(*) as n FROM outreach_contacts GROUP BY source ORDER BY n DESC LIMIT 20`;
    // Reproduce the same ALTER TABLE as sellers-base GET to see if it errors
    let alterErr = null;
    try {
      await sql`ALTER TABLE outreach_contacts ADD COLUMN IF NOT EXISTS product_vertical TEXT, ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0, ADD COLUMN IF NOT EXISTS is_internet_seller BOOLEAN DEFAULT false`;
    } catch(e: unknown) { alterErr = e instanceof Error ? e.message : String(e); }
    // Try the main count query
    let countErr = null; let countResult = null;
    try {
      const [r] = await sql`SELECT COUNT(*) AS total FROM outreach_contacts WHERE source = 'msp_registry'`;
      countResult = r;
    } catch(e: unknown) { countErr = e instanceof Error ? e.message : String(e); }
    return NextResponse.json({ cnt, alterErr, countErr, countResult });
  } catch(e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { contacts, clear } = body as { contacts: ContactRow[]; clear?: boolean };

  const sql = neon(process.env.DATABASE_URL!);

  await sql`
    ALTER TABLE outreach_contacts
      ADD COLUMN IF NOT EXISTS product_vertical TEXT,
      ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS is_internet_seller BOOLEAN DEFAULT false
  `;

  if (clear) {
    const deleted = await sql`DELETE FROM outreach_contacts WHERE source = 'msp_registry' RETURNING id`;
    console.log(`Cleared ${deleted.length} old msp_registry records`);
  }

  let saved = 0;
  for (const c of contacts) {
    try {
      await sql`
        INSERT INTO outreach_contacts
          (company_name, inn, okvad, okvad_name, region,
           has_china_keywords, china_keywords_found,
           product_vertical, lead_score, is_internet_seller,
           status, source)
        VALUES (
          ${c.name}, ${c.inn}, ${c.okved}, ${c.okvedName}, ${c.region},
          false, '{}',
          ${c.vertical}, ${c.score}, ${c.isInternet},
          'new', 'msp_registry'
        )
        ON CONFLICT (inn) DO UPDATE SET
          okvad = EXCLUDED.okvad,
          okvad_name = EXCLUDED.okvad_name,
          product_vertical = EXCLUDED.product_vertical,
          lead_score = EXCLUDED.lead_score,
          is_internet_seller = EXCLUDED.is_internet_seller,
          source = 'msp_registry',
          status = EXCLUDED.status
      `;
      saved++;
    } catch {}
  }

  return NextResponse.json({ ok: true, saved, total: contacts.length });
}
