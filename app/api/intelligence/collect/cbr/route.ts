import { NextResponse } from 'next/server';
import { upsertFact } from '@/lib/intelligence/client';

export const runtime     = 'nodejs';
export const dynamic     = 'force-dynamic';
export const maxDuration = 30;

// ЦБ РФ XML daily rates: https://www.cbr.ru/scripts/XML_daily.asp
// Used by Vercel cron (vercel.json) or n8n at 07:00 UTC daily.

async function fetchCbrRates(): Promise<{ cny: number; usd: number } | null> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
  const url   = `https://www.cbr.ru/scripts/XML_daily.asp?date_req=${today.split('/').reverse().join('/')}`;

  const res = await fetch(url, {
    headers: { 'Accept': 'application/xml, text/xml' },
    signal:  AbortSignal.timeout(10000),
  });
  if (!res.ok) return null;

  const xml = await res.text();

  const extract = (charCode: string): number | null => {
    const re  = new RegExp(`<CharCode>${charCode}</CharCode>[\\s\\S]*?<Value>([\\d,]+)</Value>`);
    const m   = xml.match(re);
    if (!m) return null;
    return parseFloat(m[1].replace(',', '.'));
  };

  const cny = extract('CNY');
  const usd = extract('USD');

  if (!cny || !usd) return null;
  return { cny, usd };
}

export async function POST() {
  const rates = await fetchCbrRates().catch(() => null);
  if (!rates) {
    return NextResponse.json({ ok: false, error: 'cbr_fetch_failed' }, { status: 502 });
  }

  const today   = new Date().toISOString().slice(0, 10);
  const results = await Promise.all([
    upsertFact({
      fact_key:          'CNY_RATE',
      department:        'GENERAL',
      category:          'CURRENCY',
      entity:            'CBR',
      metric:            'cny_rub',
      current_value:     String(rates.cny),
      unit:              'RUB',
      valid_from:        today,
      confidence:        'HIGH',
      impact_level:      'CRITICAL',
      label:             'Курс CNY/RUB (ЦБ РФ)',
      source_url:        'https://www.cbr.ru/scripts/XML_daily.asp',
      requires_approval: false,
    }),
    upsertFact({
      fact_key:          'USD_RATE',
      department:        'GENERAL',
      category:          'CURRENCY',
      entity:            'CBR',
      metric:            'usd_rub',
      current_value:     String(rates.usd),
      unit:              'RUB',
      valid_from:        today,
      confidence:        'HIGH',
      impact_level:      'CRITICAL',
      label:             'Курс USD/RUB (ЦБ РФ)',
      source_url:        'https://www.cbr.ru/scripts/XML_daily.asp',
      requires_approval: false,
    }),
  ]);

  return NextResponse.json({
    ok:    true,
    rates: { cny: rates.cny, usd: rates.usd },
    facts: results.map(r => r.fact_key),
    date:  today,
  });
}

// GET for health check
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: '/api/intelligence/collect/cbr', method: 'POST' });
}
