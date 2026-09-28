// One-time migration: creates docs tables in Neon
// Auth: x-admin-secret == CALC_ADMIN_SECRET
import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const adminSecret = process.env.CALC_ADMIN_SECRET;
  if (!adminSecret || req.headers.get("x-admin-secret") !== adminSecret)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!dbUrl) return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 503 });

  const sql = postgres(dbUrl, { max: 1, connect_timeout: 15, ssl: "require" });
  const results: string[] = [];

  const ddl: [string, string][] = [
    ["docs_uploads", `
      CREATE TABLE IF NOT EXISTS docs_uploads (
        id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        filename            TEXT,
        mime_type           TEXT,
        destination_country TEXT NOT NULL DEFAULT 'RU',
        marketplace         TEXT,
        user_telegram       TEXT,
        status              TEXT NOT NULL DEFAULT 'processing',
        error_message       TEXT
      )`],
    ["docs_results", `
      CREATE TABLE IF NOT EXISTS docs_results (
        id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        upload_id     UUID REFERENCES docs_uploads(id),
        result_data   JSONB,
        pdf_base64    TEXT,
        status        TEXT NOT NULL DEFAULT 'completed'
      )`],
    ["idx_docs_uploads_status", `CREATE INDEX IF NOT EXISTS idx_docs_uploads_status ON docs_uploads(status)`],
    ["idx_docs_results_upload", `CREATE INDEX IF NOT EXISTS idx_docs_results_upload ON docs_results(upload_id)`],
  ];

  for (const [name, stmt] of ddl) {
    try {
      await sql.unsafe(stmt);
      results.push(`OK: ${name}`);
    } catch (e) {
      results.push(`ERR ${name}: ${e instanceof Error ? e.message.slice(0, 120) : String(e)}`);
    }
  }

  await sql.end();
  return NextResponse.json({ success: true, results });
}
