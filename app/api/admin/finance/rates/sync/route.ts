import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function fetchCBRRates(): Promise<{ cny: number; usd: number; date: string } | null> {
  try {
    const res = await fetch('https://www.cbr.ru/scripts/XML_daily.asp', {
      signal: AbortSignal.timeout(10000),
      headers: { 'Accept-Charset': 'windows-1251' },
    });
    const buf = await res.arrayBuffer();
    const xml = new TextDecoder('windows-1251').decode(buf);

    const cnyMatch = xml.match(/<CharCode>CNY<\/CharCode>[\s\S]*?<VunitRate>([\d,]+)<\/VunitRate>/);
    const usdMatch = xml.match(/<CharCode>USD<\/CharCode>[\s\S]*?<VunitRate>([\d,]+)<\/VunitRate>/);
    const dateMatch = xml.match(/Date="(\d{2}\.\d{2}\.\d{4})"/);
    if (!cnyMatch || !usdMatch) return null;

    return {
      cny: Number(cnyMatch[1].replace(',', '.')),
      usd: Number(usdMatch[1].replace(',', '.')),
      date: dateMatch?.[1] ?? new Date().toISOString().slice(0, 10),
    };
  } catch {
    return null;
  }
}

async function upsertRate(
  sql: ReturnType<typeof neon>,
  key: string,
  value: string,
  label: string,
  now: string,
) {
  await sql`
    WITH upd AS (
      UPDATE finance_settings SET value = ${value}, updated_at = ${now}
      WHERE tenant_id = 'tenant-chinabridge' AND key = ${key}
      RETURNING id
    )
    INSERT INTO finance_settings (tenant_id, key, value, label, updated_at)
    SELECT 'tenant-chinabridge', ${key}, ${value}, ${label}, ${now}
    WHERE NOT EXISTS (SELECT 1 FROM upd)
  `;
}

export async function POST() {
  const rates = await fetchCBRRates();
  if (!rates) return NextResponse.json({ ok: false, error: 'cbr_unavailable' }, { status: 502 });

  const sql = neon(process.env.DATABASE_URL!);
  const now = new Date().toISOString();

  await upsertRate(sql, 'cny_rate', String(rates.cny), 'Курс CNY/RUB (ЦБ РФ)', now);
  await upsertRate(sql, 'usd_rate', String(rates.usd), 'Курс USD/RUB (ЦБ РФ)', now);

  return NextResponse.json({ ok: true, rates, synced_at: now });
}

export async function GET() {
  const [cbr, sql] = await Promise.all([
    fetchCBRRates(),
    Promise.resolve(neon(process.env.DATABASE_URL!)),
  ]);
  const rows = await sql`
    SELECT key, value, updated_at FROM finance_settings
    WHERE key IN ('cny_rate', 'usd_rate') AND tenant_id = 'tenant-chinabridge'
  `.catch(() => [] as Array<{ key: string; value: string; updated_at: string }>);

  const stored: Record<string, { value: number; updated_at: string }> = {};
  for (const r of rows) {
    stored[String(r.key)] = { value: Number(r.value), updated_at: String(r.updated_at) };
  }

  return NextResponse.json({ cbr, stored });
}
