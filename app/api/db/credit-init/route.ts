import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const runtime = "nodejs";
export const maxDuration = 30;

// Auth: same secret as /api/db/migrate (x-migrate-secret header == CRON_SECRET)
// OR admin secret (x-admin-secret == CALC_ADMIN_SECRET)
function checkAuth(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const adminSecret = process.env.CALC_ADMIN_SECRET;
  const migHeader = req.headers.get("x-migrate-secret");
  const adminHeader = req.headers.get("x-admin-secret");
  if (cronSecret && migHeader === cronSecret) return true;
  if (adminSecret && adminHeader === adminSecret) return true;
  return false;
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 503 });
  }

  // Use postgres package (TCP wire protocol) for reliable DDL execution.
  // @neondatabase/serverless HTTP driver silently drops DDL through the pooler.
  const sql = postgres(dbUrl, { max: 1, connect_timeout: 15, ssl: "require" });
  const results: string[] = [];

  const ddl: [string, string][] = [
    [
      "calculator_sessions",
      `CREATE TABLE IF NOT EXISTS calculator_sessions (
        session_id TEXT PRIMARY KEY,
        ip         TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_seen  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
    ],
    [
      "calculator_credits",
      `CREATE TABLE IF NOT EXISTS calculator_credits (
        session_id TEXT PRIMARY KEY REFERENCES calculator_sessions(session_id),
        balance    INT NOT NULL DEFAULT 0,
        free_used  INT NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
    ],
    [
      "credit_transactions",
      `CREATE TABLE IF NOT EXISTS credit_transactions (
        id             BIGSERIAL PRIMARY KEY,
        session_id     TEXT NOT NULL,
        type           TEXT NOT NULL,
        amount         INT  NOT NULL,
        calculation_id TEXT,
        operation_id   TEXT,
        package_id     TEXT,
        calc_source    TEXT,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
    ],
    [
      "credit_tx_calc_id_idx",
      `CREATE UNIQUE INDEX IF NOT EXISTS credit_tx_calc_id_idx
         ON credit_transactions (calculation_id)
         WHERE calculation_id IS NOT NULL AND type = 'spend'`,
    ],
    [
      "credit_tx_op_id_idx",
      `CREATE UNIQUE INDEX IF NOT EXISTS credit_tx_op_id_idx
         ON credit_transactions (operation_id)
         WHERE operation_id IS NOT NULL AND type = 'purchase'`,
    ],
    [
      "calc_credit_pending",
      `CREATE TABLE IF NOT EXISTS calc_credit_pending (
        operation_id TEXT PRIMARY KEY,
        session_id   TEXT NOT NULL,
        package_id   TEXT NOT NULL,
        credits      INT  NOT NULL,
        amount_rub   INT  NOT NULL,
        status       TEXT NOT NULL DEFAULT 'pending',
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
    ],
  ];

  for (const [name, stmt] of ddl) {
    try {
      await sql.unsafe(stmt);
      results.push(`OK: ${name}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push(`ERR ${name}: ${msg.slice(0, 120)}`);
    }
  }

  // Verify tables exist
  try {
    const rows = await sql`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('calculator_sessions','calculator_credits','credit_transactions','calc_credit_pending')
      ORDER BY tablename
    `;
    results.push(`VERIFY: ${rows.length}/4 tables found: ${rows.map((r) => r.tablename).join(", ")}`);
  } catch (err: unknown) {
    results.push(`VERIFY ERR: ${err instanceof Error ? err.message : String(err)}`);
  }

  await sql.end();

  const errors = results.filter((r) => r.startsWith("ERR"));
  return NextResponse.json({ success: errors.length === 0, results });
}
