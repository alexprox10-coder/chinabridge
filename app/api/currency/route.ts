import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 3600; // cache 1 hour

const CBR_URL = 'https://www.cbr.ru/scripts/XML_daily.asp';

interface CbrValute {
  CharCode: string[];
  Value: string[];
  Nominal: string[];
}

interface RatesResult {
  cny: number;
  usd: number;
  eur: number;
  updated: string;
  source: 'cbr' | 'fallback';
}

async function fetchCbrRates(): Promise<RatesResult> {
  const res = await fetch(CBR_URL, {
    headers: { 'Accept': 'text/xml' },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error('cbr_fetch_failed');
  const xml = await res.text();

  function parseVal(code: string): number | null {
    const match = xml.match(
      new RegExp(`<CharCode>${code}</CharCode>[\\s\\S]*?<Nominal>(\\d+)</Nominal>[\\s\\S]*?<Value>([\\d,]+)</Value>`)
    );
    if (!match) return null;
    const nominal = parseInt(match[1]);
    const value   = parseFloat(match[2].replace(',', '.'));
    return value / nominal;
  }

  const cny = parseVal('CNY');
  const usd = parseVal('USD');
  const eur = parseVal('EUR');

  if (!cny || !usd) throw new Error('cbr_parse_failed');

  return {
    cny: Math.round(cny * 100) / 100,
    usd: Math.round((usd ?? 0) * 100) / 100,
    eur: Math.round((eur ?? 0) * 100) / 100,
    updated: new Date().toISOString(),
    source: 'cbr',
  };
}

export async function GET() {
  try {
    const rates = await fetchCbrRates();
    return NextResponse.json({ ok: true, ...rates }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch {
    // Fallback — approximate rates if CBR is unavailable
    return NextResponse.json({
      ok: true,
      cny: 11.8,
      usd: 85.5,
      eur: 93.0,
      updated: new Date().toISOString(),
      source: 'fallback',
    });
  }
}
