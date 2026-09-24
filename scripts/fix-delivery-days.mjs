import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const [k, ...rest] = line.split('=');
  if (k && rest.length) process.env[k.trim()] = rest.join('=').trim().replace(/^"|"$/g, '');
}

const sql = neon(process.env.DATABASE_URL);

// 1. Fix KZ truck routes: 5-8 days → 18-22 days
const kzFix = await sql`
  UPDATE shipping_rates
  SET delivery_days_min = 18,
      delivery_days_max = 22,
      updated_at = NOW()
  WHERE carrier_name ILIKE '%Almaty%'
    AND transport_type = 'truck'
    AND delivery_days_min = 5
    AND delivery_days_max = 8
  RETURNING id, carrier_name, delivery_days_min, delivery_days_max
`;
console.log(`KZ truck routes fixed: ${kzFix.length} rows`, kzFix);

// 2. Update intel_facts valid_from to NOW() so the date display is current
const datesFix = await sql`
  UPDATE intel_facts
  SET valid_from = NOW()::date::text,
      updated_at = NOW()
  WHERE fact_key IN ('CNY_RATE', 'USD_RATE', 'CUSTOMS_DUTY_DEFAULT')
  RETURNING fact_key, valid_from, updated_at
`;
console.log(`intel_facts dates updated: ${datesFix.length} rows`, datesFix);

console.log('Done.');
