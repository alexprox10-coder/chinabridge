import { NextRequest, NextResponse } from 'next/server';
import { calculateUnitEconomics } from '@/lib/economics/calculator';
import { getMarketplace }         from '@/lib/economics/marketplaces';
import { neon }                   from '@neondatabase/serverless';
import { getOrCreateSessionId, setSessionCookie, getIp } from '@/lib/credits/session';
import { reserve, refund } from '@/lib/credits/db';

export const runtime     = 'nodejs';
export const maxDuration = 20;

const CLIENT_COOKIE = 'cb_client';

async function getClientIdFromCookie(req: NextRequest): Promise<string | null> {
  try {
    const token = req.cookies.get(CLIENT_COOKIE)?.value;
    if (!token) return null;
    const dot = token.lastIndexOf('.');
    if (dot < 0) return null;
    const encoded = token.slice(0, dot);
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString());
    return payload?.clientId ?? null;
  } catch { return null; }
}

async function hasActiveSubscription(clientId: string): Promise<boolean> {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      SELECT 1 FROM calc_subscriptions
      WHERE client_id = ${clientId} AND subscribed_until > NOW()
      LIMIT 1`;
    return rows.length > 0;
  } catch { return false; }
}

async function runCalc(body: Record<string, unknown>) {
  const marketplaceId = String(body.marketplace ?? 'wb');
  const mp = getMarketplace(marketplaceId);
  const commissionPct = body.commission_pct != null
    ? parseFloat(String(body.commission_pct))
    : mp?.commission_pct ?? 15;

  const result = await calculateUnitEconomics({
    unitPrice:      parseFloat(String(body.unit_price ?? '0')),
    priceCurrency:  body.price_currency === 'USD' ? 'USD' : 'CNY',
    salePrice:      parseFloat(String(body.sale_price ?? '0')),
    quantity:       Math.max(1, parseInt(String(body.quantity ?? '1')) || 1),
    commissionPct,
    marketplaceId,
    adSpend:        parseFloat(String(body.ad_spend    ?? '0')),
    otherCosts:     parseFloat(String(body.other_costs ?? '0')),
    cityTo:         String(body.city_to    ?? ''),
    countryTo:      String(body.country_to ?? 'Russia'),
    weightKg:       body.weight_kg ? parseFloat(String(body.weight_kg)) : undefined,
    productName:    String(body.product_name ?? ''),
    moq:            body.moq ? parseInt(String(body.moq)) : undefined,
  });

  return {
    economics:          result.economics,
    delivery:           result.delivery,
    deliveryOptions:    result.deliveryOptions,
    priority:           result.priority,
    marketplace_config: mp ? { id: mp.id, label: mp.label, tariff_date: mp.tariff_date, commission_note: mp.commission_note } : null,
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}) as Record<string, unknown>);

  const unitPrice = parseFloat(String(body.unit_price ?? '0'));
  const salePrice = parseFloat(String(body.sale_price ?? '0'));
  if (!unitPrice || !salePrice) {
    return NextResponse.json({ ok: false, error: 'prices_required' }, { status: 400 });
  }

  // Legacy PRO cookie (backward compat with existing subscribers)
  const anonPaidUntil = req.cookies.get("cb_anon_paid_until")?.value;
  if (anonPaidUntil && new Date(anonPaidUntil) > new Date()) {
    const calc = await runCalc(body);
    return NextResponse.json({ ok: true, preview: true, subscribed: true, rate_limit_remaining: 999, ...calc });
  }

  // Logged-in subscription (ЛК)
  const clientId = await getClientIdFromCookie(req);
  if (clientId && await hasActiveSubscription(clientId)) {
    const calc = await runCalc(body);
    return NextResponse.json({ ok: true, preview: true, subscribed: true, rate_limit_remaining: 999, ...calc });
  }

  // ── Credit system ─────────────────────────────────────────────────────────
  const { session_id, isNew } = getOrCreateSessionId(req);
  const ip = getIp(req);

  let reserveResult: Awaited<ReturnType<typeof reserve>> | null = null;

  if (process.env.DATABASE_URL) {
    try {
      reserveResult = await reserve(session_id, ip, 'ai_calc');
      if (!reserveResult.ok) {
        const res = NextResponse.json(
          { ok: false, error: 'rate_limit', message: 'Использованы все 3 бесплатных расчёта. Купите кредиты для продолжения.' },
          { status: 429 },
        );
        if (isNew) setSessionCookie(res, session_id);
        return res;
      }
    } catch (dbErr) {
      console.error('[ai-funnel/preview] credit-check DB error:', dbErr);
      // Fail open — allow request through if DB unavailable
    }
  }

  try {
    const calc = await runCalc(body);
    const res = NextResponse.json({
      ok: true,
      preview: true,
      rate_limit_remaining: reserveResult ? 0 : 999,
      ...calc,
    });
    if (isNew) setSessionCookie(res, session_id);
    return res;
  } catch (err) {
    // Refund credit if calculation failed
    if (reserveResult?.ok) {
      await refund(session_id, reserveResult.calculation_id, reserveResult.used_free).catch(() => null);
    }
    console.error('[ai-funnel/preview]', err);
    return NextResponse.json({ ok: false, error: 'calc_error' }, { status: 500 });
  }
}
