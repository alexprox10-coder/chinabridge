// Idempotent outbound DB migrations — safe to call before any read/write
// Pattern: ALTER TABLE ... ADD COLUMN IF NOT EXISTS (never fails if column exists)

export async function runOutboundMigrations(): Promise<void> {
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL!);

    // §6 ТЗ — New Opportunity fields
    const columnMigrations = [
      // Company + Opportunity model
      `ALTER TABLE outbound_leads ADD COLUMN IF NOT EXISTS "company_id" text NOT NULL DEFAULT ''`,
      `ALTER TABLE outbound_leads ADD COLUMN IF NOT EXISTS "product_url" text NOT NULL DEFAULT ''`,
      `ALTER TABLE outbound_leads ADD COLUMN IF NOT EXISTS "marketplace_url" text NOT NULL DEFAULT ''`,
      `ALTER TABLE outbound_leads ADD COLUMN IF NOT EXISTS "china_source_url" text NOT NULL DEFAULT ''`,
      `ALTER TABLE outbound_leads ADD COLUMN IF NOT EXISTS "china_unit_price" numeric`,
      `ALTER TABLE outbound_leads ADD COLUMN IF NOT EXISTS "local_selling_price" numeric`,
      `ALTER TABLE outbound_leads ADD COLUMN IF NOT EXISTS "potential_saving" numeric`,
      `ALTER TABLE outbound_leads ADD COLUMN IF NOT EXISTS "potential_saving_type" text NOT NULL DEFAULT ''`,
      // Scores
      `ALTER TABLE outbound_leads ADD COLUMN IF NOT EXISTS "data_quality_score" integer NOT NULL DEFAULT 0`,
      `ALTER TABLE outbound_leads ADD COLUMN IF NOT EXISTS "raw_opportunity_score" integer NOT NULL DEFAULT 0`,
      `ALTER TABLE outbound_leads ADD COLUMN IF NOT EXISTS "evidence_factor_used" numeric`,
      // Status fields (§6)
      `ALTER TABLE outbound_leads ADD COLUMN IF NOT EXISTS "message_status" text NOT NULL DEFAULT 'DRAFT'`,
      `ALTER TABLE outbound_leads ADD COLUMN IF NOT EXISTS "approval_status" text NOT NULL DEFAULT 'PENDING'`,
      `ALTER TABLE outbound_leads ADD COLUMN IF NOT EXISTS "outreach_status" text NOT NULL DEFAULT 'NOT_SENT'`,
      `ALTER TABLE outbound_leads ADD COLUMN IF NOT EXISTS "reply_status" text NOT NULL DEFAULT 'NO_REPLY'`,
      // §19 ТЗ — Data quality flags
      `ALTER TABLE outbound_leads ADD COLUMN IF NOT EXISTS "country_verified" boolean NOT NULL DEFAULT false`,
      `ALTER TABLE outbound_leads ADD COLUMN IF NOT EXISTS "company_verified" boolean NOT NULL DEFAULT false`,
      `ALTER TABLE outbound_leads ADD COLUMN IF NOT EXISTS "product_verified" boolean NOT NULL DEFAULT false`,
      `ALTER TABLE outbound_leads ADD COLUMN IF NOT EXISTS "contact_verified" boolean NOT NULL DEFAULT false`,
      `ALTER TABLE outbound_leads ADD COLUMN IF NOT EXISTS "source_verified" boolean NOT NULL DEFAULT false`,
      // §22 ТЗ — Outreach analytics
      `ALTER TABLE outbound_leads ADD COLUMN IF NOT EXISTS "message_version" text NOT NULL DEFAULT 'v1'`,
      `ALTER TABLE outbound_leads ADD COLUMN IF NOT EXISTS "quote_id" text NOT NULL DEFAULT ''`,
      `ALTER TABLE outbound_leads ADD COLUMN IF NOT EXISTS "deal_id" text NOT NULL DEFAULT ''`,
      `ALTER TABLE outbound_leads ADD COLUMN IF NOT EXISTS "sent_at" timestamp`,
      `ALTER TABLE outbound_leads ADD COLUMN IF NOT EXISTS "replied_at" timestamp`,
    ];

    for (const migration of columnMigrations) {
      try { await sql.unsafe(migration); } catch { /* column already exists */ }
    }
  } catch {
    // Silently ignore — columns already exist or table not yet created
  }
}
