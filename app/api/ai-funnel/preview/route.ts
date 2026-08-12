import { NextRequest, NextResponse } from 'next/server';
import { calculateUnitEconomics } from '@/lib/economics/calculator';
import { getCommission }          from '@/lib/economics/marketplaces';
import { neon }                   from '@neondatabase/serverless';

export const runtime     = 'nodejs';
export const maxDuration = 20;

const DAILY_LIMIT = 5;

function getIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';
}

async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  if (ip === 'unknown') return { allowed: true, remaining: DAILY_LIMIT };
  try {
    const sql  = neon(process.env.DATABASE_URL!);
    const date = new Date().toISOString().slice(0, 10);
    const key  = `aif:${ip}`;
    await sql`
      CREATE TABLE IF NOT EXISTS calc_anon_requests (
        ip text NOT NULL, date text NOT NULL, count integer DEFAULT 1 NOT NULL,
        PRIMARY KEY (ip, date)
      )`;
    const rows = await sql`SELECT count FROM calc_anon_requests WHERE ip=${key} AND date=${date}`;
    const cur  = Number(rows[0]?.count ?? 0);
    if (cur >= DAILY_LIMIT) return { allowed: false, remaining: 0 };
    await sql`
      INSERT INTO calc_anon_requests (ip, date, count) VALUES (${key}, ${date}, 1)
      ON CONFLICT (ip, date) DO UPDATE SET count = calc_anon_requests.count + 1`;
    return { allowed: true, remaining: DAILY_LIMIT - cur - 1 };
  } catch { return { allowed: true, remaining: DAILY_LIMIT }; }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}) as Record<string, unknown>);

  const unitPrice  = parseFloat(String(body.unit_price  ?? '0'));
  const salePrice  = parseFloat(String(body.sale_price  ?? '0'));
  if (!unitPrice || !salePrice) {
    return NextResponse.json({ ok: false, error: 'prices_required' }, { status: 400 });
  }

  const ip = getIp(req);
  const { allowed, remaining } = await checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: 'rate_limit', message: `Лимит ${DAILY_LIMIT} предварительных расчётов в день` },
      { status: 429 },
    );
  }

  const marketplaceId = String(body.marketplace ?? 'wb');
  const commissionPct = body.commission_pct != null
    ? parseFloat(String(body.commission_pct))
    : getCommission(marketplaceId);

  const result = await calculateUnitEconomics({
    unitPrice,
    priceCurrency: body.price_currency === 'USD' ? 'USD' : 'CNY',
    salePrice,
    quantity:      Math.max(1, parseInt(String(body.quantity ?? '1')) || 1),
    commissionPct,
    adSpend:       parseFloat(String(body.ad_spend    ?? '0')),
    otherCosts:    parseFloat(String(body.other_costs ?? '0')),
    cityTo:        String(body.city_to  ?? ''),
    countryTo:     String(body.country_to ?? 'Russia'),
    weightKg:      body.weight_kg ? parseFloat(String(body.weight_kg)) : undefined,
    productName:   String(body.product_name ?? ''),
  });

  return NextResponse.json({
    ok: true,
    preview: true,
    economics:            result.economics,
    delivery:             result.delivery,
    priority:             result.priority,
    rate_limit_remaining: remaining,
  });
}
