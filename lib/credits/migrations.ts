// Run once against Neon to create credit system tables.
// Usage: npx tsx lib/credits/migrations.ts
import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;

export const CREATE_SESSIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS calculator_sessions (
    session_id TEXT PRIMARY KEY,
    ip         TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

export const CREATE_CREDITS_TABLE = `
  CREATE TABLE IF NOT EXISTS calculator_credits (
    session_id TEXT PRIMARY KEY REFERENCES calculator_sessions(session_id),
    balance    INT NOT NULL DEFAULT 0,
    free_used  INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

export const CREATE_TRANSACTIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS credit_transactions (
    id             BIGSERIAL PRIMARY KEY,
    session_id     TEXT NOT NULL,
    type           TEXT NOT NULL,
    amount         INT  NOT NULL,
    calculation_id TEXT,
    operation_id   TEXT,
    package_id     TEXT,
    calc_source    TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

export const CREATE_TRANSACTION_INDEXES = `
  CREATE UNIQUE INDEX IF NOT EXISTS credit_transactions_calculation_id_idx
    ON credit_transactions (calculation_id)
    WHERE calculation_id IS NOT NULL AND type = 'spend';

  CREATE UNIQUE INDEX IF NOT EXISTS credit_transactions_operation_id_idx
    ON credit_transactions (operation_id)
    WHERE operation_id IS NOT NULL AND type = 'purchase';
`;

if (require.main === module) {
  (async () => {
    if (!DATABASE_URL) throw new Error("DATABASE_URL not set");
    const sql = neon(DATABASE_URL);
    await sql.unsafe(CREATE_SESSIONS_TABLE);
    await sql.unsafe(CREATE_CREDITS_TABLE);
    await sql.unsafe(CREATE_TRANSACTIONS_TABLE);
    await sql.unsafe(CREATE_TRANSACTION_INDEXES);
    console.log("✅ Credit tables created");
  })();
}
