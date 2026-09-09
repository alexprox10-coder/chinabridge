import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '') ?? req.headers.get('x-admin-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const cny = parseFloat(String(body.cny ?? '0'));
  const usd = parseFloat(String(body.usd ?? '0'));

  if (!cny || !usd) {
    return NextResponse.json({ ok: false, error: 'cny and usd required' }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    INSERT INTO intel_facts (fact_key, current_value, updated_at)
    VALUES
      ('CNY_RATE', ${String(cny)}, NOW()),
      ('USD_RATE', ${String(usd)}, NOW())
    ON CONFLICT (fact_key) DO UPDATE
      SET current_value = EXCLUDED.current_value, updated_at = NOW()
    RETURNING fact_key, current_value, updated_at
  `;

  return NextResponse.json({ ok: true, updated: rows });
}
