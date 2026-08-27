import { neon } from '@neondatabase/serverless';

const DATABASE_URL = "postgresql://neondb_owner:npg_xDZUWkt3CiY0@ep-rapid-cell-aunj0ge5-pooler.c-10.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require";

const sql = neon(DATABASE_URL);

async function main() {
  console.log('Creating calculator_leads table...');

  await sql`
    CREATE TABLE IF NOT EXISTS calculator_leads (
      id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      telegram     TEXT NOT NULL,
      source       TEXT NOT NULL,
      context_hint TEXT,
      ip           TEXT,
      status       TEXT DEFAULT 'new',
      UNIQUE (telegram, source)
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_calc_leads_created
    ON calculator_leads(created_at DESC)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_calc_leads_status
    ON calculator_leads(status)
  `;

  console.log('✅ Table calculator_leads created successfully');

  // Verify
  const rows = await sql`SELECT COUNT(*) as cnt FROM calculator_leads`;
  console.log(`✅ Current rows: ${rows[0].cnt}`);
}

main().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
