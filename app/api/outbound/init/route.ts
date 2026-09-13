import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const maxDuration = 60;

const INIT_TOKEN = "cb-ob-init-2026-09";

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-init-token");
  if (token !== INIT_TOKEN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  const results: string[] = [];

  try {
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "outbound_leads" (
        "id" serial PRIMARY KEY NOT NULL,
        "outbound_id" text NOT NULL UNIQUE,
        "tenant_id" text NOT NULL DEFAULT 'tenant-chinabridge',
        "stage" text NOT NULL DEFAULT 'FOUND',
        "company_name" text NOT NULL DEFAULT '',
        "seller_id" text NOT NULL DEFAULT '',
        "domain" text NOT NULL DEFAULT '',
        "website" text NOT NULL DEFAULT '',
        "marketplace" text NOT NULL DEFAULT '',
        "marketplace_store" text NOT NULL DEFAULT '',
        "country" text NOT NULL DEFAULT 'KZ',
        "city" text NOT NULL DEFAULT '',
        "category" text NOT NULL DEFAULT '',
        "address" text NOT NULL DEFAULT '',
        "phone" text NOT NULL DEFAULT '',
        "email" text NOT NULL DEFAULT '',
        "telegram" text NOT NULL DEFAULT '',
        "whatsapp" text NOT NULL DEFAULT '',
        "vk" text NOT NULL DEFAULT '',
        "source" text NOT NULL DEFAULT '',
        "source_url" text NOT NULL DEFAULT '',
        "source_count" integer NOT NULL DEFAULT 1,
        "dedup_hash" text NOT NULL DEFAULT '',
        "products" jsonb NOT NULL DEFAULT '[]',
        "products_count" integer NOT NULL DEFAULT 0,
        "china_match" jsonb NOT NULL DEFAULT '{}',
        "china_match_status" text NOT NULL DEFAULT 'UNKNOWN',
        "economics" jsonb NOT NULL DEFAULT '{}',
        "opportunity_score" integer NOT NULL DEFAULT 0,
        "company_score" integer NOT NULL DEFAULT 0,
        "lead_score" integer NOT NULL DEFAULT 0,
        "intent_score" integer NOT NULL DEFAULT 0,
        "message_quality_score" integer NOT NULL DEFAULT 0,
        "reason_to_contact" text NOT NULL DEFAULT '',
        "personalized_message" text NOT NULL DEFAULT '',
        "supplier_exists" boolean NOT NULL DEFAULT false,
        "pitch_type" text NOT NULL DEFAULT '',
        "channel" text NOT NULL DEFAULT '',
        "contacted_at" timestamp,
        "last_contact_at" timestamp,
        "attempt_count" integer NOT NULL DEFAULT 0,
        "delivery_status" text NOT NULL DEFAULT '',
        "response_status" text NOT NULL DEFAULT 'NO_REPLY',
        "campaign" text NOT NULL DEFAULT '',
        "vertical" text NOT NULL DEFAULT '',
        "crm_lead_id" text NOT NULL DEFAULT '',
        "approved_by" text NOT NULL DEFAULT '',
        "approved_at" timestamp,
        "error_stage" text NOT NULL DEFAULT '',
        "last_error" text NOT NULL DEFAULT '',
        "retry_count" integer NOT NULL DEFAULT 0,
        "created_at" text NOT NULL DEFAULT '',
        "updated_at" text NOT NULL DEFAULT ''
      )
    `);
    results.push("OK: table created");
  } catch (err: unknown) {
    results.push(`ERR table: ${err instanceof Error ? err.message : String(err)}`);
  }

  const indexes = [
    `CREATE INDEX IF NOT EXISTS "outbound_leads_tenant_idx" ON "outbound_leads" ("tenant_id")`,
    `CREATE INDEX IF NOT EXISTS "outbound_leads_stage_idx" ON "outbound_leads" ("stage")`,
    `CREATE INDEX IF NOT EXISTS "outbound_leads_country_idx" ON "outbound_leads" ("country")`,
    `CREATE INDEX IF NOT EXISTS "outbound_leads_vertical_idx" ON "outbound_leads" ("vertical")`,
    `CREATE INDEX IF NOT EXISTS "outbound_leads_dedup_idx" ON "outbound_leads" ("dedup_hash")`,
  ];
  for (const idx of indexes) {
    try {
      await sql.unsafe(idx);
      results.push(`OK: ${idx.match(/IF NOT EXISTS "([^"]+)"/)?.[1]}`);
    } catch (err: unknown) {
      results.push(`ERR idx: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  try {
    const rows = await sql.unsafe(`SELECT COUNT(*) as count FROM outbound_leads`);
    results.push(`OK: rows=${rows[0]?.count ?? '?'}`);
  } catch (err: unknown) {
    results.push(`ERR count: ${err instanceof Error ? err.message : String(err)}`);
  }

  return NextResponse.json({ results });
}
