import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_xDZUWkt3CiY0@ep-rapid-cell-aunj0ge5-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

await client.connect();
console.log('Connected to Neon');

await client.query(`
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
`);

await client.query(`CREATE INDEX IF NOT EXISTS idx_calc_leads_created ON calculator_leads(created_at DESC)`);
await client.query(`CREATE INDEX IF NOT EXISTS idx_calc_leads_status ON calculator_leads(status)`);

const { rows } = await client.query(`SELECT COUNT(*) as cnt FROM calculator_leads`);
console.log('✅ Table created. Rows:', rows[0].cnt);

await client.end();
