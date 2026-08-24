import { neon } from "@neondatabase/serverless";

export async function ensureFunnelTable(dbUrl: string) {
  const sql = neon(dbUrl);
  await sql`
    CREATE TABLE IF NOT EXISTS funnel_subscribers (
      id            SERIAL PRIMARY KEY,
      chat_id       BIGINT UNIQUE NOT NULL,
      first_name    TEXT,
      source        TEXT DEFAULT 'calc',
      drip_step     INT DEFAULT 0,
      subscribed_at TIMESTAMPTZ DEFAULT NOW(),
      next_drip_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '2 days',
      opted_out     BOOLEAN DEFAULT FALSE
    )
  `;
}
