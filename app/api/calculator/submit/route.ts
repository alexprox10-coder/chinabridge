import { NextRequest, NextResponse } from 'next/server';
import { calculateCostBreakdown } from '@/lib/cost-engine';

export const runtime = 'nodejs';

function escapeNonAscii(s: string): string {
  return s.replace(/[^\x00-\x7F]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  if (!body.name || !body.phone || !body.product_name) {
    return NextResponse.json({ ok: false, error: 'required_fields_missing' }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const N8N_BASE = process.env.N8N_BASE_URL ?? 'https://n8n.arendadom24.ru';

  const payload = {
    id,
    name: body.name ?? '',
    phone: body.phone ?? '',
    telegram: body.telegram ?? '',
    email: body.email ?? '',
    product_name: body.product_name ?? '',
    category: body.category ?? '',
    product_link: body.product_link ?? '',
    quantity: body.quantity ?? '',
    weight_kg: body.weight_kg ?? '',
    volume_m3: body.volume_m3 ?? '',
    packages_count: body.packages_count ?? '',
    country_from: body.country_from ?? 'China',
    city_from: body.city_from ?? '',
    country_to: body.country_to ?? 'Russia',
    city_to: body.city_to ?? '',
    service_type:      body.service_type ?? 'delivery_only',
    source:            'delivery_calculator',
    payment_status:    'UNPAID',
    payment_currency:  '',
    payment_amount:    '',
    supplier_name:     '',
    exchange_rate:     '',
    payment_date:      '',
  };

  // Cost Engine: select pricing rule → compute sale price, profit, margin
  const cost = await calculateCostBreakdown({
    country_from: body.country_from ?? 'China',
    city_from: body.city_from ?? '',
    country_to: body.country_to ?? 'Russia',
    city_to: body.city_to ?? '',
    weight: body.weight_kg ? parseFloat(body.weight_kg) : undefined,
    volume: body.volume_m3 ? parseFloat(body.volume_m3) : undefined,
    packages: body.packages_count ? parseInt(body.packages_count) : undefined,
    customer_type: body.customer_type ?? undefined,
  }).catch(() => null);

  const hasRate = cost && cost.sale_price > 0;

  const n8nPayload = {
    ...payload,
    ...(hasRate && {
      delivery_cost: cost!.sale_price,
      carrier_cost: cost!.carrier_cost,
      delivery_days_min: cost!.delivery_days_min,
      delivery_days_max: cost!.delivery_days_max,
      rate_currency: cost!.currency,
      pricing_rule: cost!.selected_rule_name,
      markup_percent: cost!.markup_percent,
      profit: cost!.profit,
      margin_percent: cost!.margin_percent,
      pricing_reason: cost!.selection_reason,
    }),
  };

  const n8n = await fetch(`${N8N_BASE}/webhook/chinabridge-calculator`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: escapeNonAscii(JSON.stringify(n8nPayload)),
    signal: AbortSignal.timeout(28000),
  }).then(r => r.json()).catch(() => null);

  const n8nData = Array.isArray(n8n) ? n8n[0] ?? {} : (n8n ?? {});

  return NextResponse.json({
    ok: true,
    cargo_type: n8nData.cargo_type ?? 'consolidation',
    priority: n8nData.priority ?? 'WARM',
    reason: n8nData.reason ?? '',
    lead_id: n8nData.lead_id ?? id,
    ...(hasRate && {
      delivery_cost: cost!.sale_price,
      delivery_days_min: cost!.delivery_days_min,
      delivery_days_max: cost!.delivery_days_max,
      rate_currency: cost!.currency,
      pricing_rule: cost!.selected_rule_name,
      markup_percent: cost!.markup_percent,
      profit: cost!.profit,
      margin_percent: cost!.margin_percent,
    }),
  });
}
