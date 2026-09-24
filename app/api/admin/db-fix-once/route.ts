import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret') ?? req.headers.get('authorization')?.replace('Bearer ', '');
  const cronSecret = process.env.CRON_SECRET;
  const internalKey = process.env.INTERNAL_API_KEY;

  if (!secret || (secret !== cronSecret && secret !== internalKey)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json({ ok: false, error: 'no DATABASE_URL' }, { status: 500 });
  }

  try {
    const sql = neon(dbUrl);
    const results: Record<string, unknown> = {};

    // Check table exists
    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN ('shipping_rates', 'intel_facts')
    `;
    results.tables_found = tables.map((t: Record<string, unknown>) => t.table_name);

    // Fix KZ truck routes: 5-8 days → 18-22 days
    const kzFix = await sql`
      UPDATE shipping_rates
      SET delivery_days_min = 18,
          delivery_days_max = 22
      WHERE carrier_name ILIKE '%Almaty%'
        AND transport_type = 'truck'
        AND delivery_days_min = 5
        AND delivery_days_max = 8
      RETURNING id, carrier_name, delivery_days_min, delivery_days_max
    `;
    results.kz_truck_fixed = kzFix.length;
    results.kz_rows = kzFix;

    // Update intel_facts updated_at so date display shows today
    const datesFix = await sql`
      UPDATE intel_facts
      SET updated_at = NOW()
      WHERE fact_key IN ('CNY_RATE', 'USD_RATE', 'CUSTOMS_DUTY_DEFAULT')
      RETURNING fact_key, updated_at
    `;
    results.intel_dates_updated = datesFix.length;

    return NextResponse.json({ ok: true, results });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
