import { NextRequest, NextResponse } from 'next/server';
import { calculateUnitEconomics }   from '@/lib/economics/calculator';
import { getCommission }            from '@/lib/economics/marketplaces';
import { createLead }               from '@/lib/crm/client';

export const runtime     = 'nodejs';
export const maxDuration = 30;

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY ?? '';

async function getAiAnalysis(productName: string, margin: number, netProfit: number, unitPrice: number, currency: string, qty: number): Promise<string | undefined> {
  if (!OPENROUTER_KEY) return undefined;
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://chinabridge.pro',
      },
      body: JSON.stringify({
        model:       'openai/gpt-4o-mini',
        max_tokens:  150,
        temperature: 0.3,
        messages: [
          { role: 'system', content: 'Эксперт по ВЭД и маркетплейсам. Дай краткий анализ рентабельности (1–2 предложения). Только конкретные факты. Русский язык.' },
          { role: 'user',   content: `Товар: ${productName}. Закупка: ${unitPrice} ${currency}/ед × ${qty} шт. Маржа: ${margin.toFixed(1)}%. Чистая прибыль: ${Math.round(netProfit)} ₽.` },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });
    const d = await res.json();
    return (d.choices?.[0]?.message?.content as string | undefined)?.trim();
  } catch { return undefined; }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}) as Record<string, unknown>);

  const phone    = String(body.phone    ?? '').trim();
  const telegram = String(body.telegram ?? '').trim();
  if (!phone && !telegram) {
    return NextResponse.json({ ok: false, error: 'contact_required' }, { status: 400 });
  }

  const unitPrice  = parseFloat(String(body.unit_price  ?? '0'));
  const salePrice  = parseFloat(String(body.sale_price  ?? '0'));
  if (!unitPrice || !salePrice) {
    return NextResponse.json({ ok: false, error: 'prices_required' }, { status: 400 });
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

  const { economics, priority, delivery } = result;

  // AI verdict comment (best-effort)
  const aiAnalysis = await getAiAnalysis(
    String(body.product_name ?? ''),
    economics.margin_pct,
    economics.net_profit_rub,
    unitPrice,
    body.price_currency === 'USD' ? 'USD' : 'CNY',
    economics.quantity,
  );

  // UTM from body
  const utmSource   = String(body.utm_source   ?? 'ai_economics_funnel');
  const utmCampaign = String(body.utm_campaign ?? '');

  const leadId = `aif-${crypto.randomUUID()}`;
  const now    = new Date().toISOString();

  await createLead(
    {
      lead_id:             leadId,
      created_at:          now,
      updated_at:          now,
      name:                String(body.name ?? ''),
      phone,
      telegram,
      email:               String(body.email ?? ''),
      company:             '',
      product:             String(body.product_name ?? ''),
      product_link:        String(body.product_link ?? ''),
      category:            String(body.category ?? ''),
      quantity:            String(body.quantity ?? ''),
      weight:              String(body.weight_kg ?? ''),
      volume:              '',
      country_destination: String(body.country_to ?? 'Russia'),
      city_destination:    String(body.city_to ?? ''),
      delivery_type:       '',
      service_type:        'delivery_only',
      status:              'NEW',
      priority,
      estimated_value:     economics.gross_revenue_rub,
      manager:             '',
      comment:             JSON.stringify({
        marketplace:    marketplaceId,
        unit_price:     unitPrice,
        price_currency: body.price_currency ?? 'CNY',
        sale_price:     salePrice,
        margin_pct:     economics.margin_pct,
        roi_pct:        economics.roi_pct,
        net_profit_rub: economics.net_profit_rub,
        verdict:        economics.verdict,
        ai_analysis:    aiAnalysis,
        source:         'ai_economics_funnel',
      }),
      source:              'LEAD_MAGNET_UNIT_ECONOMICS',
      utm_source:          utmSource,
      utm_campaign:        utmCampaign,
      delivery_cost:       delivery.hasRate ? delivery.deliveryCost : undefined,
      carrier_cost:        undefined,
      markup_percent:      undefined,
      profit:              economics.net_profit_rub,
      margin_percent:      economics.margin_pct,
      pricing_rule:        delivery.pricingRule,
    },
    'tenant-chinabridge',
  ).catch(() => {});

  // Fire-and-forget Telegram notification via existing leads webhook
  const n8nUrl = process.env.N8N_WEBHOOK_URL;
  if (n8nUrl) {
    fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event:       'lead.created',
        lead_id:     leadId,
        source:      'ai_economics_funnel',
        name:        body.name ?? '',
        phone,
        telegram,
        product:     body.product_name ?? '',
        margin_pct:  economics.margin_pct,
        verdict:     economics.verdict,
        city_to:     body.city_to ?? '',
        marketplace: marketplaceId,
      }),
      signal: AbortSignal.timeout(5000),
    }).catch(() => {});
  }

  // Enrich economics with AI analysis
  const enriched = { ...economics, ai_analysis: aiAnalysis };

  return NextResponse.json({
    ok:       true,
    lead_id:  leadId,
    priority,
    economics: enriched,
    delivery,
  });
}
