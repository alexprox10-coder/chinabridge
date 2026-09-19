// Idempotent outbound DB migrations — safe to call before any read/write
// Pattern: ALTER TABLE ... ADD COLUMN IF NOT EXISTS (never fails if column exists)

export async function runOutboundMigrations(): Promise<void> {
  const { neon } = await import("@neondatabase/serverless");
  const dbUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!;
  const sql = neon(dbUrl);

  {
    // Parser Club Intake: raw events table
    try {
      await sql.unsafe(`
        CREATE TABLE IF NOT EXISTS outbound_lead_events (
          id                   UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
          fingerprint          TEXT      UNIQUE NOT NULL,
          source               TEXT      NOT NULL DEFAULT 'parser_club',
          source_type          TEXT      NOT NULL DEFAULT 'file_import',
          external_id          TEXT      NOT NULL DEFAULT '',
          raw_text             TEXT      NOT NULL DEFAULT '',
          normalized_text      TEXT      NOT NULL DEFAULT '',
          raw_payload          JSONB     NOT NULL DEFAULT '{}',
          source_url           TEXT      NOT NULL DEFAULT '',
          source_chat          TEXT      NOT NULL DEFAULT '',
          source_message_id    TEXT      NOT NULL DEFAULT '',
          source_created_at    TIMESTAMP,
          tg_username          TEXT      NOT NULL DEFAULT '',
          tg_chat              TEXT      NOT NULL DEFAULT '',
          intent               TEXT      NOT NULL DEFAULT 'UNKNOWN',
          intent_subtype       TEXT      NOT NULL DEFAULT '',
          lead_score           INTEGER   NOT NULL DEFAULT 0,
          evidence_score       INTEGER   NOT NULL DEFAULT 0,
          final_score          INTEGER   NOT NULL DEFAULT 0,
          confidence           INTEGER   NOT NULL DEFAULT 0,
          priority             TEXT      NOT NULL DEFAULT 'LOW',
          stream               INTEGER,
          country              TEXT      NOT NULL DEFAULT 'UNKNOWN',
          city                 TEXT      NOT NULL DEFAULT '',
          destination          TEXT      NOT NULL DEFAULT '',
          product              TEXT      NOT NULL DEFAULT '',
          product_category     TEXT      NOT NULL DEFAULT '',
          business_type        TEXT      NOT NULL DEFAULT '',
          supplier_exists      BOOLEAN   NOT NULL DEFAULT false,
          weight_kg            NUMERIC,
          volume_m3            NUMERIC,
          packages             INTEGER,
          urgency              TEXT      NOT NULL DEFAULT '',
          recommended_offer    TEXT      NOT NULL DEFAULT '',
          qualification_reason TEXT      NOT NULL DEFAULT '',
          key_signals          JSONB     NOT NULL DEFAULT '[]',
          evidence_data        JSONB     NOT NULL DEFAULT '[]',
          ai_reply_draft       TEXT      NOT NULL DEFAULT '',
          product_hint         TEXT      NOT NULL DEFAULT '',
          geography_hint       TEXT      NOT NULL DEFAULT '',
          processing_status    TEXT      NOT NULL DEFAULT 'processed',
          processing_error     TEXT      NOT NULL DEFAULT '',
          outbound_lead_id     UUID,
          approval_status      TEXT      NOT NULL DEFAULT 'PENDING',
          crm_lead_id          TEXT      NOT NULL DEFAULT '',
          created_at           TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
    } catch { /* table already exists — add missing columns below */ }

    // Idempotent column additions for existing outbound_lead_events tables
    const intakeColumnMigrations = [
      `ALTER TABLE outbound_lead_events ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'file_import'`,
      `ALTER TABLE outbound_lead_events ADD COLUMN IF NOT EXISTS external_id TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE outbound_lead_events ADD COLUMN IF NOT EXISTS normalized_text TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE outbound_lead_events ADD COLUMN IF NOT EXISTS raw_payload JSONB NOT NULL DEFAULT '{}'`,
      `ALTER TABLE outbound_lead_events ADD COLUMN IF NOT EXISTS source_url TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE outbound_lead_events ADD COLUMN IF NOT EXISTS source_chat TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE outbound_lead_events ADD COLUMN IF NOT EXISTS source_message_id TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE outbound_lead_events ADD COLUMN IF NOT EXISTS source_created_at TIMESTAMP`,
      `ALTER TABLE outbound_lead_events ADD COLUMN IF NOT EXISTS intent_subtype TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE outbound_lead_events ADD COLUMN IF NOT EXISTS confidence INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE outbound_lead_events ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'UNKNOWN'`,
      `ALTER TABLE outbound_lead_events ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE outbound_lead_events ADD COLUMN IF NOT EXISTS destination TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE outbound_lead_events ADD COLUMN IF NOT EXISTS product TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE outbound_lead_events ADD COLUMN IF NOT EXISTS product_category TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE outbound_lead_events ADD COLUMN IF NOT EXISTS business_type TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE outbound_lead_events ADD COLUMN IF NOT EXISTS supplier_exists BOOLEAN NOT NULL DEFAULT false`,
      `ALTER TABLE outbound_lead_events ADD COLUMN IF NOT EXISTS weight_kg NUMERIC`,
      `ALTER TABLE outbound_lead_events ADD COLUMN IF NOT EXISTS volume_m3 NUMERIC`,
      `ALTER TABLE outbound_lead_events ADD COLUMN IF NOT EXISTS packages INTEGER`,
      `ALTER TABLE outbound_lead_events ADD COLUMN IF NOT EXISTS urgency TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE outbound_lead_events ADD COLUMN IF NOT EXISTS recommended_offer TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE outbound_lead_events ADD COLUMN IF NOT EXISTS evidence_data JSONB NOT NULL DEFAULT '[]'`,
      `ALTER TABLE outbound_lead_events ADD COLUMN IF NOT EXISTS intent_subtype TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE outbound_lead_events ADD COLUMN IF NOT EXISTS processing_status TEXT NOT NULL DEFAULT 'processed'`,
      `ALTER TABLE outbound_lead_events ADD COLUMN IF NOT EXISTS processing_error TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE outbound_lead_events ADD COLUMN IF NOT EXISTS crm_lead_id TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE outbound_lead_events ADD COLUMN IF NOT EXISTS normalized_text TEXT NOT NULL DEFAULT ''`,
    ];
    for (const m of intakeColumnMigrations) {
      try { await sql.unsafe(m); } catch { /* column already exists */ }
    }

    // Analytics events table (§31 ТЗ)
    try {
      await sql.unsafe(`
        CREATE TABLE IF NOT EXISTS outbound_analytics_events (
          id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
          event       TEXT      NOT NULL,
          lead_id     UUID,
          source      TEXT      NOT NULL DEFAULT '',
          country     TEXT      NOT NULL DEFAULT '',
          stream      INTEGER,
          score       INTEGER,
          meta        JSONB     NOT NULL DEFAULT '{}',
          created_at  TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
    } catch { /* already exists */ }

    try {
      await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_oae_event ON outbound_analytics_events(event, created_at DESC)`);
    } catch { /* already exists */ }

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
      `ALTER TABLE outbound_leads ADD COLUMN IF NOT EXISTS "campaign" text NOT NULL DEFAULT 'OUTBOUND_V1'`,
      `ALTER TABLE outbound_leads ADD COLUMN IF NOT EXISTS "opportunity_id" text NOT NULL DEFAULT ''`,
      `ALTER TABLE outbound_leads ADD COLUMN IF NOT EXISTS "ai_consultant_context" jsonb`,
      `ALTER TABLE outbound_leads ADD COLUMN IF NOT EXISTS "stage_updated_at" text NOT NULL DEFAULT ''`,
    ];

    for (const migration of columnMigrations) {
      try { await sql.unsafe(migration); } catch { /* column already exists */ }
    }
  }
}
