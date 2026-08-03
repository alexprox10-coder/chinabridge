import { readFileSync } from 'fs';
import { resolve } from 'path';
import { SEED_ROUTES } from './routes.seed';
import { getSeedRates } from './rates.seed';
import { SEED_SERVICES } from './services.seed';
import { seedListRows, seedCreateRow } from './seed-db';
import type { Route, ShippingRate, AdditionalService } from '../types';

// ── env loader ───────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = resolve(process.cwd(), '.env.local');
  try {
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx < 0) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
    console.log('✓ .env.local loaded');
  } catch {
    console.warn('⚠ .env.local not found — using existing process.env');
  }
}

// ── helpers ───────────────────────────────────────────────────────────────
function log(msg: string) { console.log(msg); }
function err(msg: string, e?: unknown) {
  console.error(msg, e instanceof Error ? e.message : e);
}

// ── STEP 1: Routes ────────────────────────────────────────────────────────
async function seedRoutes(): Promise<Record<string, number>> {
  log('\n── Routes ────────────────────────────────────────────────');
  const existing = await seedListRows<Route>('routes');

  // dedup key: city_from + city_to + transport_type
  const existingKeys = new Set(
    existing.map(r => `${r.city_from}|${r.city_to}|${r.transport_type}`)
  );

  const routeMap: Record<string, number> = {};

  // populate routeMap from already-existing rows
  for (const r of existing) {
    const seedRoute = SEED_ROUTES.find(
      s => s.city_from === r.city_from && s.city_to === r.city_to && s.transport_type === r.transport_type
    );
    if (seedRoute && r.id) routeMap[seedRoute.key] = r.id;
  }

  let created = 0;
  let skipped = 0;

  for (const route of SEED_ROUTES) {
    const key = `${route.city_from}|${route.city_to}|${route.transport_type}`;
    if (existingKeys.has(key)) {
      log(`  skip  ${route.city_from} → ${route.city_to} (${route.transport_type})`);
      skipped++;
      continue;
    }

    const { key: _k, ...fields } = route;
    try {
      const created_route = await seedCreateRow<Route>('routes', fields as Record<string, unknown>);
      if (created_route.id) routeMap[route.key] = created_route.id;
      log(`  +     ${route.city_from} → ${route.city_to} (id=${created_route.id})`);
      created++;
    } catch (e) {
      err(`  ERROR ${route.city_from} → ${route.city_to}`, e);
    }
  }

  log(`  Routes: ${created} created, ${skipped} skipped`);
  return routeMap;
}

// ── STEP 2: Rates ─────────────────────────────────────────────────────────
async function seedRates(routeMap: Record<string, number>) {
  log('\n── Rates ─────────────────────────────────────────────────');
  const existing = await seedListRows<ShippingRate>('shipping_rates');

  // dedup key: carrier_name + min_weight + max_weight
  const existingKeys = new Set(
    existing.map(r => `${r.carrier_name}|${r.min_weight ?? ''}|${r.max_weight ?? ''}`)
  );

  const rates = getSeedRates(routeMap);
  let created = 0;
  let skipped = 0;

  for (const rate of rates) {
    const key = `${rate.carrier_name}|${rate.min_weight ?? ''}|${rate.max_weight ?? ''}`;
    if (existingKeys.has(key)) {
      log(`  skip  ${rate.carrier_name} ${rate.min_weight ?? 0}–${rate.max_weight ?? '∞'} kg`);
      skipped++;
      continue;
    }

    try {
      const created_rate = await seedCreateRow<ShippingRate>('shipping_rates', rate as unknown as Record<string, unknown>);
      log(`  +     ${rate.carrier_name} ${rate.min_weight ?? 0}–${rate.max_weight ?? '∞'} kg (id=${created_rate.id})`);
      created++;
    } catch (e) {
      err(`  ERROR ${rate.carrier_name}`, e);
    }
  }

  log(`  Rates: ${created} created, ${skipped} skipped`);
}

// ── STEP 3: Services ──────────────────────────────────────────────────────
async function seedServices() {
  log('\n── Services ──────────────────────────────────────────────');
  const existing = await seedListRows<AdditionalService>('additional_services');
  const existingNames = new Set(existing.map(s => s.name));

  let created = 0;
  let skipped = 0;

  for (const service of SEED_SERVICES) {
    if (existingNames.has(service.name)) {
      log(`  skip  ${service.name}`);
      skipped++;
      continue;
    }

    try {
      const created_service = await seedCreateRow<AdditionalService>('additional_services', service as Record<string, unknown>);
      log(`  +     ${service.name} (id=${created_service.id})`);
      created++;
    } catch (e) {
      err(`  ERROR ${service.name}`, e);
    }
  }

  log(`  Services: ${created} created, ${skipped} skipped`);
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log(' ChinaBridge Rate Engine — Market Data Seed v1.0');
  console.log('═══════════════════════════════════════════════════════');

  loadEnv();

  const apiKey = process.env.N8N_API_KEY ?? '';
  if (!apiKey) {
    console.warn('⚠ N8N_API_KEY not set — trying without key (may work if n8n allows it)');
  }

  try {
    const routeMap = await seedRoutes();
    await seedRates(routeMap);
    await seedServices();

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(' ✓ Seed complete');
    console.log('═══════════════════════════════════════════════════════\n');
  } catch (e) {
    err('\n✗ Seed failed', e);
    process.exit(1);
  }
}

main();
