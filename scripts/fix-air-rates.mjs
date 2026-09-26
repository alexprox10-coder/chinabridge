/**
 * Updates air shipping rates in n8n to correct client prices.
 * Old values: $12/$8/$6 per kg (wholesale market prices)
 * New values: $25/$23/$20 per kg (client prices incl. margin)
 *
 * Run: node scripts/fix-air-rates.mjs
 */

// Run via: npx dotenv-cli -e .env.local -- node scripts/fix-air-rates.mjs
const N8N_BASE = process.env.N8N_BASE_URL ?? 'https://n8n.arendadom24.ru';
const N8N_KEY = process.env.N8N_API_KEY ?? '';
const TABLE_ID = 'asS7Xa9QFnPpAzN5'; // shipping_rates

if (!N8N_KEY) {
  console.error('N8N_API_KEY not found in .env.local');
  process.exit(1);
}

async function n8nFetch(path, init) {
  const res = await fetch(`${N8N_BASE}${path}`, {
    ...init,
    headers: {
      'X-N8N-API-KEY': N8N_KEY,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`n8n ${path} → ${res.status}: ${text}`);
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') return null;
  return res.json();
}

async function updateByCarrierAndWeight(carrierName, minWeight, maxWeight, newPrice) {
  // First fetch all rates to find the matching row IDs
  const data = await n8nFetch(`/api/v1/data-tables/${TABLE_ID}/rows?limit=250`);
  const rows = Array.isArray(data) ? data : (data?.rows ?? data?.data ?? []);

  const match = rows.find(r =>
    r.carrier_name === carrierName &&
    r.min_weight === minWeight &&
    r.max_weight === maxWeight &&
    r.transport_type === 'air'
  );

  if (!match) {
    console.log(`  ⚠️  Not found: "${carrierName}" min=${minWeight} max=${maxWeight}`);
    return false;
  }

  console.log(`  Found row id=${match.id}: ${carrierName} (${minWeight}-${maxWeight}kg) = $${match.price_value}/kg → $${newPrice}/kg`);

  await n8nFetch(`/api/v1/data-tables/${TABLE_ID}/rows/update`, {
    method: 'PATCH',
    body: JSON.stringify({
      filter: { filters: [{ columnName: 'id', condition: 'eq', value: match.id }] },
      data: { price_value: newPrice },
    }),
  });

  console.log(`  ✅  Updated id=${match.id} to $${newPrice}/kg`);
  return true;
}

async function main() {
  console.log('Updating air shipping rates in n8n...\n');

  const updates = [
    { carrier: 'Market | Air China → RU/KZ (small)', min: 0,   max: 100, price: 25.0 },
    { carrier: 'Market | Air China → RU/KZ',         min: 100, max: 300, price: 23.0 },
    { carrier: 'Market | Air China → RU/KZ',         min: 300, max: 0,   price: 20.0 },
  ];

  let ok = 0;
  for (const u of updates) {
    try {
      const success = await updateByCarrierAndWeight(u.carrier, u.min, u.max, u.price);
      if (success) ok++;
    } catch (err) {
      console.error(`  ❌  Error: ${err.message}`);
    }
  }

  console.log(`\nDone: ${ok}/${updates.length} air rates updated.`);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
