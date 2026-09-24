import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const N8N_SHIPPING_RATES_TABLE = 'asS7Xa9QFnPpAzN5';

async function fixN8NDeliveryDays(): Promise<{ fixed: number; rows: unknown[] }> {
  const n8nBase = process.env.N8N_BASE_URL ?? 'https://n8n.arendadom24.ru';
  const n8nKey = process.env.N8N_API_KEY ?? '';

  if (!n8nKey) return { fixed: 0, rows: [] };

  const listRes = await fetch(`${n8nBase}/api/v1/data-tables/${N8N_SHIPPING_RATES_TABLE}/rows?limit=250`, {
    headers: { 'X-N8N-API-KEY': n8nKey },
    signal: AbortSignal.timeout(10000),
  });
  if (!listRes.ok) throw new Error(`n8n list → ${listRes.status}`);

  const raw = await listRes.json();
  const rows: Array<Record<string, unknown>> = Array.isArray(raw) ? raw
    : Array.isArray(raw?.data) ? raw.data
    : Array.isArray(raw?.rows) ? raw.rows
    : [];

  const toFix = rows.filter((r) =>
    String(r.carrier_name ?? '').toLowerCase().includes('almaty') &&
    r.transport_type === 'truck' &&
    Number(r.delivery_days_min) === 5 &&
    Number(r.delivery_days_max) === 8,
  );

  const fixed: unknown[] = [];
  for (const row of toFix) {
    const rowId = row.id ?? row.row_id;
    if (!rowId) continue;
    const updateRes = await fetch(`${n8nBase}/api/v1/data-tables/${N8N_SHIPPING_RATES_TABLE}/rows/${rowId}`, {
      method: 'PATCH',
      headers: { 'X-N8N-API-KEY': n8nKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { delivery_days_min: 18, delivery_days_max: 22 } }),
      signal: AbortSignal.timeout(5000),
    });
    if (updateRes.ok) fixed.push({ id: rowId, carrier_name: row.carrier_name });
  }

  return { fixed: fixed.length, rows: fixed };
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret') ?? req.headers.get('authorization')?.replace('Bearer ', '');
  const cronSecret = process.env.CRON_SECRET;
  const internalKey = process.env.INTERNAL_API_KEY;

  if (!secret || (secret !== cronSecret && secret !== internalKey)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  const results: Record<string, unknown> = {};

  // 1. Update intel_facts updated_at
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const datesFix = await sql`
      UPDATE intel_facts
      SET updated_at = NOW()
      WHERE fact_key IN ('CNY_RATE', 'USD_RATE', 'CUSTOMS_DUTY_DEFAULT')
      RETURNING fact_key, updated_at
    `;
    results.intel_dates_updated = datesFix.length;
    results.intel_rows = datesFix;
  } catch (err) {
    results.intel_error = err instanceof Error ? err.message : String(err);
  }

  // 2. Fix n8n shipping_rates: KZ Almaty truck 5-8 → 18-22 days
  try {
    const n8nResult = await fixN8NDeliveryDays();
    results.n8n_delivery_fixed = n8nResult.fixed;
    results.n8n_rows = n8nResult.rows;
  } catch (err) {
    results.n8n_error = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({ ok: true, results });
}
