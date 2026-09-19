import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const k = trimmed.slice(0, eq).trim();
  let v = trimmed.slice(eq + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  process.env[k] = v;
}

const secret = process.env.CRON_SECRET;
if (!secret) { console.error('CRON_SECRET not found'); process.exit(1); }

console.log('Calling migrate endpoint...');
const res = await fetch('https://chinabridge.pro/api/db/migrate', {
  method: 'POST',
  headers: { 'x-migrate-secret': secret, 'Content-Type': 'application/json' },
});
const text = await res.text();
console.log('Status:', res.status);
console.log('Response:', text);
