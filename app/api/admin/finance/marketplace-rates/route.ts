import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { MARKETPLACES } from '@/lib/economics/marketplaces';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TENANT = 'tenant-chinabridge';

async function upsertMpRate(
  sql: ReturnType<typeof neon>,
  mpId: string,
  commission: number,
  now: string,
) {
  const key = `mp_${mpId}_commission`;
  const label = `Комиссия маркетплейса ${mpId.toUpperCase()} (%)`;
  await sql`
    WITH upd AS (
      UPDATE finance_settings SET value = ${String(commission)}, updated_at = ${now}
      WHERE tenant_id = ${TENANT} AND key = ${key}
      RETURNING id
    )
    INSERT INTO finance_settings (tenant_id, key, value, label, updated_at)
    SELECT ${TENANT}, ${key}, ${String(commission)}, ${label}, ${now}
    WHERE NOT EXISTS (SELECT 1 FROM upd)
  `;
}

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT key, value, updated_at FROM finance_settings
    WHERE tenant_id = ${TENANT} AND key LIKE 'mp_%_commission'
  `.catch(() => [] as Array<{ key: string; value: string; updated_at: string }>);

  const dbMap: Record<string, { value: number; updated_at: string }> = {};
  for (const r of rows) {
    const m = String(r.key).match(/^mp_(.+)_commission$/);
    if (m) dbMap[m[1]] = { value: Number(r.value), updated_at: String(r.updated_at) };
  }

  const result = MARKETPLACES.map(mp => ({
    id:             mp.id,
    label:          mp.label,
    icon:           mp.icon,
    commission_pct: dbMap[mp.id]?.value ?? mp.commission_pct,
    default_pct:    mp.commission_pct,
    commission_note: mp.commission_note,
    updated_at:     dbMap[mp.id]?.updated_at ?? null,
    is_overridden:  mp.id in dbMap,
  }));

  return NextResponse.json({ ok: true, data: result });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { id, commission_pct } = body as { id: string; commission_pct: number };

  if (!id || commission_pct === undefined || commission_pct < 0 || commission_pct > 100) {
    return NextResponse.json({ ok: false, error: 'invalid_params' }, { status: 400 });
  }

  const mp = MARKETPLACES.find(m => m.id === id);
  if (!mp) return NextResponse.json({ ok: false, error: 'unknown_marketplace' }, { status: 404 });

  const sql = neon(process.env.DATABASE_URL!);
  const now = new Date().toISOString();
  await upsertMpRate(sql, id, commission_pct, now);

  return NextResponse.json({ ok: true, id, commission_pct, updated_at: now });
}
