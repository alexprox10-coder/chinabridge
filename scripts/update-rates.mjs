// One-time script to update shipping_rates and routes in n8n data tables
// Rates from Chinese partner received 2026-09-06
// Run: node scripts/update-rates.mjs

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Parse .env.local manually
const envPath = resolve(process.cwd(), '.env.local');
const env = {};
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([^#=\s]+)="?([^"]*)"?$/);
  if (m) env[m[1]] = m[2];
}

const BASE = env.N8N_BASE_URL;
const KEY = env.N8N_API_KEY;
const PROJECT_ID = '7fYm4u3rVGVmOwQu';
const RATES_TABLE = 'asS7Xa9QFnPpAzN5';
const ROUTES_TABLE = 'Fw1nup7EcasZniSo';

if (!BASE || !KEY) { console.error('Missing N8N_BASE_URL or N8N_API_KEY'); process.exit(1); }

const headers = { 'X-N8N-API-KEY': KEY, 'Content-Type': 'application/json' };

async function n8n(path, method = 'GET', body) {
  const r = await fetch(`${BASE}${path}`, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function getRows(tableId) {
  const data = await n8n(`/api/v1/data-tables/${tableId}/rows?limit=250`);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.rows)) return data.rows;
  return [];
}

async function updateRow(tableId, id, fields) {
  return n8n(`/api/v1/data-tables/${tableId}/rows/update`, 'PATCH', {
    filter: { filters: [{ columnName: 'id', condition: 'eq', value: id }] },
    data: fields,
  });
}

async function addRows(tableId, rows) {
  return n8n(`/api/v1/data-tables/${tableId}/rows`, 'POST', { data: rows });
}

const now = new Date().toISOString();

// ─── New rate definitions (based on partner tariff 2026-09-06) ───────────────
// Yuan to USD rate: 1 CNY ≈ 0.138 USD (Sep 2026)
// Auto: density-based; we show client-facing price in USD (includes our markup)
// Air standard: 150 yuan/kg cost → charge $23/kg (markup ~$2)
// Air express: 220 yuan/kg cost → charge $33/kg (markup ~$3)

const NEW_RATES = [
  // KZ Auto — standard goods (density 200-250 kg/m³, rate 1.70 yuan/kg ≈ $0.23/kg cost → $2/kg client)
  {
    carrier_name: 'ChinaBridge KZ Truck',
    transport_type: 'truck',
    route_id: '',
    cargo_type: 'general',
    rate_type: 'KG',
    price_value: 2.0,
    currency: 'USD',
    min_weight: 30,
    max_weight: 0,
    min_volume: 0,
    max_volume: 0,
    delivery_days_min: 18,
    delivery_days_max: 22,
    status: 'active',
    rate_source: 'partner_2026_09_06',
    created_at: now,
    updated_at: now,
  },
  // Russia Auto via Kazakhstan
  {
    carrier_name: 'ChinaBridge RU Truck',
    transport_type: 'truck',
    route_id: '',
    cargo_type: 'general',
    rate_type: 'KG',
    price_value: 2.5,
    currency: 'USD',
    min_weight: 30,
    max_weight: 0,
    min_volume: 0,
    max_volume: 0,
    delivery_days_min: 25,
    delivery_days_max: 35,
    status: 'active',
    rate_source: 'partner_2026_09_06',
    created_at: now,
    updated_at: now,
  },
  // Air standard (150 yuan/kg cost, charge $23/kg)
  {
    carrier_name: 'ChinaBridge Air Standard',
    transport_type: 'air',
    route_id: '',
    cargo_type: 'general',
    rate_type: 'KG',
    price_value: 23.0,
    currency: 'USD',
    min_weight: 1,
    max_weight: 0,
    min_volume: 0,
    max_volume: 0,
    delivery_days_min: 5,
    delivery_days_max: 8,
    status: 'active',
    rate_source: 'partner_2026_09_06',
    created_at: now,
    updated_at: now,
  },
  // Air express (220 yuan/kg cost, charge $33/kg)
  {
    carrier_name: 'ChinaBridge Air Express',
    transport_type: 'express',
    route_id: '',
    cargo_type: 'general',
    rate_type: 'KG',
    price_value: 33.0,
    currency: 'USD',
    min_weight: 1,
    max_weight: 0,
    min_volume: 0,
    max_volume: 0,
    delivery_days_min: 3,
    delivery_days_max: 3,
    status: 'active',
    rate_source: 'partner_2026_09_06',
    created_at: now,
    updated_at: now,
  },
  // Sea LCL (estimation — no real partner rate yet)
  {
    carrier_name: 'ChinaBridge Sea LCL',
    transport_type: 'sea',
    route_id: '',
    cargo_type: 'general',
    rate_type: 'CBM',
    price_value: 180,
    currency: 'USD',
    min_weight: 0,
    max_weight: 0,
    min_volume: 0,
    max_volume: 4.9,
    delivery_days_min: 30,
    delivery_days_max: 45,
    status: 'active',
    rate_source: 'estimate',
    created_at: now,
    updated_at: now,
  },
];

const NEW_ROUTES = [
  { country_from: 'China', city_from: '', country_to: 'Kazakhstan', city_to: 'Алматы', transport_type: 'truck', delivery_days_min: 18, delivery_days_max: 22, status: 'active', created_at: now },
  { country_from: 'China', city_from: '', country_to: 'Kazakhstan', city_to: 'Астана', transport_type: 'truck', delivery_days_min: 22, delivery_days_max: 26, status: 'active', created_at: now },
  { country_from: 'China', city_from: '', country_to: 'Kazakhstan', city_to: 'Шымкент', transport_type: 'truck', delivery_days_min: 18, delivery_days_max: 22, status: 'active', created_at: now },
  { country_from: 'China', city_from: '', country_to: 'Russia', city_to: 'Москва', transport_type: 'truck', delivery_days_min: 25, delivery_days_max: 35, status: 'active', created_at: now },
  { country_from: 'China', city_from: '', country_to: 'Russia', city_to: 'Хабаровск', transport_type: 'truck', delivery_days_min: 10, delivery_days_max: 18, status: 'active', created_at: now },
  { country_from: 'China', city_from: '', country_to: 'Russia', city_to: 'Благовещенск', transport_type: 'truck', delivery_days_min: 3, delivery_days_max: 7, status: 'active', created_at: now },
  { country_from: 'China', city_from: '', country_to: 'Kazakhstan', city_to: 'Алматы', transport_type: 'air', delivery_days_min: 5, delivery_days_max: 8, status: 'active', created_at: now },
  { country_from: 'China', city_from: '', country_to: 'Russia', city_to: 'Москва', transport_type: 'air', delivery_days_min: 5, delivery_days_max: 8, status: 'active', created_at: now },
];

async function main() {
  console.log('Step 1: Marking old rates as inactive...');
  const oldRates = await getRows(RATES_TABLE);
  console.log(`  Found ${oldRates.length} existing rates`);
  for (const row of oldRates) {
    if (row.status === 'active') {
      await updateRow(RATES_TABLE, row.id, { status: 'inactive', updated_at: now });
      process.stdout.write('.');
    }
  }
  console.log('\n  Done.');

  console.log('Step 2: Marking old routes as inactive...');
  const oldRoutes = await getRows(ROUTES_TABLE);
  console.log(`  Found ${oldRoutes.length} existing routes`);
  for (const row of oldRoutes) {
    if (row.status === 'active') {
      await updateRow(ROUTES_TABLE, row.id, { status: 'inactive' });
      process.stdout.write('.');
    }
  }
  console.log('\n  Done.');

  console.log('Step 3: Adding new rates...');
  const r = await addRows(RATES_TABLE, NEW_RATES);
  console.log(`  Added ${NEW_RATES.length} rates. Response:`, JSON.stringify(r).substring(0, 200));

  console.log('Step 4: Adding new routes...');
  const r2 = await addRows(ROUTES_TABLE, NEW_ROUTES);
  console.log(`  Added ${NEW_ROUTES.length} routes. Response:`, JSON.stringify(r2).substring(0, 200));

  console.log('\n✓ Done! Calculator now uses real rates from partner tariff 2026-09-06.');
}

main().catch(e => { console.error(e); process.exit(1); });
