import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const [k, ...rest] = line.split('=');
  if (k && rest.length) process.env[k.trim()] = rest.join('=').trim().replace(/^"|"$/g, '');
}

const sql = neon(process.env.DATABASE_URL);

const rows = await sql`
  INSERT INTO intel_facts (fact_key, current_value, updated_at)
  VALUES
    ('CNY_RATE', '12.74', NOW()),
    ('USD_RATE', '85.46', NOW())
  ON CONFLICT (fact_key) DO UPDATE
    SET current_value = EXCLUDED.current_value, updated_at = NOW()
  RETURNING fact_key, current_value, updated_at
`;
console.log('Updated intel_facts:', rows);
