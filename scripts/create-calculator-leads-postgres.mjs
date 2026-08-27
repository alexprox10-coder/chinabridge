import postgres from 'postgres';

const sql = postgres("postgresql://neondb_owner:npg_xDZUWkt3CiY0@ep-rapid-cell-aunj0ge5-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require");

console.log('Connecting to Neon...');

await sql`
  CREATE TABLE IF NOT EXISTS calculator_leads (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    telegram     TEXT NOT NULL,
    source       TEXT NOT NULL,
    context_hint TEXT,
    ip           TEXT,
    status       TEXT DEFAULT 'new',
    UNIQUE (telegram, source)
  )
`;

await sql`CREATE INDEX IF NOT EXISTS idx_calc_leads_created ON calculator_leads(created_at DESC)`;
await sql`CREATE INDEX IF NOT EXISTS idx_calc_leads_status ON calculator_leads(status)`;

const [{ cnt }] = await sql`SELECT COUNT(*) as cnt FROM calculator_leads`;
console.log('✅ Table calculator_leads created. Rows:', cnt);

await sql.end();
