// Temporary diagnostic endpoint — creates outbound tables and reports full result
// DELETE after tables confirmed created
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const isAdmin = req.cookies.get("cb_admin")?.value;
  const secret = req.headers.get("x-webhook-secret");
  const validSecret = process.env.OUTBOUND_WEBHOOK_SECRET;
  if (!isAdmin && (!validSecret || secret !== validSecret)) {
    return NextResponse.json({ ok: false, error: "admin only" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};
  const dbUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "";
  results.dbUrlPrefix = dbUrl.slice(0, 30) + "...";
  results.hasUnpooled = !!process.env.DATABASE_URL_UNPOOLED;

  const sql = neon(dbUrl);

  // Test basic connectivity
  try {
    const r = await sql`SELECT current_database(), current_user, version()`;
    results.connection = r[0];
  } catch (e) { results.connectionError = String(e); }

  // Check if table exists
  try {
    const r = await sql`SELECT COUNT(*) FROM outbound_lead_events`;
    results.tableExists = true;
    results.rowCount = r[0].count;
  } catch { results.tableExists = false; }

  // Try CREATE TABLE
  if (!results.tableExists) {
    try {
      await sql`
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
      `;
      results.createTable = "SUCCESS";
    } catch (e) { results.createTableError = String(e); }

    // Verify it now exists
    try {
      const r = await sql`SELECT COUNT(*) FROM outbound_lead_events`;
      results.tableExistsAfterCreate = true;
      results.rowCountAfterCreate = r[0].count;
    } catch (e) { results.verifyError = String(e); }
  }

  // Create analytics table
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS outbound_analytics_events (
        id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
        event      TEXT      NOT NULL,
        lead_id    UUID,
        source     TEXT      NOT NULL DEFAULT '',
        country    TEXT      NOT NULL DEFAULT '',
        stream     INTEGER,
        score      INTEGER,
        meta       JSONB     NOT NULL DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    results.createAnalyticsTable = "SUCCESS";
  } catch (e) { results.createAnalyticsTableError = String(e); }

  return NextResponse.json({ ok: true, results });
}
