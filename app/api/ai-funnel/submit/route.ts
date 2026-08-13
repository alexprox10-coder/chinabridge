import { NextRequest, NextResponse } from 'next/server';
import { calculateUnitEconomics }   from '@/lib/economics/calculator';
import { getMarketplace }           from '@/lib/economics/marketplaces';
import { createLead }               from '@/lib/crm/client';
import { neon }                     from '@neondatabase/serverless';

export const runtime     = 'nodejs';
export const maxDuration = 30;

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY ?? '';

async function getAiAnalysis(
  productName: string, margin: number, netProfit: number,
  unitPrice: number, currency: string, qty: number,
  marketplace: string, verdict: string,
): Promise<string | undefined> {
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
        max_tokens:  180,
        temperature: 0.3,
        messages: [
          { role: 'system', content: 'Эксперт по ВЭД и маркетплейсам. Дай краткий анализ рентабельности (2–3 предложения). Укажи главные риски и возможности. Только конкретные факты. Русский язык.' },
          { role: 'user',   content: `Товар: ${productName}. Закупка: ${unitPrice} ${currency}/ед × ${qty} шт. Маржа: ${margin.toFixed(1)}%. Прибыль: ${Math.round(netProfit)} ₽. Маркетплейс: ${marketplace}. Вердикт: ${verdict}.` },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });
    const d = await res.json();
    return (d.choices?.[0]?.message?.content as string | undefined)?.trim();
  } catch { return undefined; }
}

async function saveProductAnalysis(params: {
  analysisId:   string;
  leadId:       string;
  sourceUrl:    string;
  productName:  string;
  marketplace:  string;
  city:         string;
  quantity:     number;
  unitPriceCny: number;
  salePriceRub: number;
  marginPct:    number;
  roiPct:       number;
  netProfitRub: number;
  productScore: number;
  verdict:      string;
  cnyRate:      number;
}): Promise<void> {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      CREATE TABLE IF NOT EXISTS product_analyses (
        id serial PRIMARY KEY,
        analysis_id text NOT NULL UNIQUE,
        tenant_id text DEFAULT 'tenant-chinabridge' NOT NULL,
        lead_id text DEFAULT '' NOT NULL,
        source_url text DEFAULT '' NOT NULL,
        source_platform text DEFAULT '' NOT NULL,
        product_name text DEFAULT '' NOT NULL,
        product_data jsonb DEFAULT '{}'::jsonb NOT NULL,
        marketplace text DEFAULT '' NOT NULL,
        city_destination text DEFAULT '' NOT NULL,
        quantity integer DEFAULT 1 NOT NULL,
        unit_price_cny numeric DEFAULT '0' NOT NULL,
        sale_price_rub numeric DEFAULT '0' NOT NULL,
        margin_pct numeric DEFAULT '0' NOT NULL,
        roi_pct numeric DEFAULT '0' NOT NULL,
        net_profit_rub numeric DEFAULT '0' NOT NULL,
        product_score numeric DEFAULT '0' NOT NULL,
        verdict text DEFAULT '' NOT NULL,
        tariff_version text DEFAULT '' NOT NULL,
        cny_rate numeric DEFAULT '0' NOT NULL,
        created_at text NOT NULL
      )`;
    await sql`
      INSERT INTO product_analyses
        (analysis_id, lead_id, source_url, product_name, marketplace, city_destination,
         quantity, unit_price_cny, sale_price_rub, margin_pct, roi_pct, net_profit_rub,
         product_score, verdict, tariff_version, cny_rate, created_at)
      VALUES
        (${params.analysisId}, ${params.leadId}, ${params.sourceUrl}, ${params.productName},
         ${params.marketplace}, ${params.city}, ${params.quantity}, ${params.unitPriceCny},
         ${params.salePriceRub}, ${params.marginPct}, ${params.roiPct}, ${params.netProfitRub},
         ${params.productScore}, ${params.verdict}, ${'2026-07-07'}, ${params.cnyRate},
         ${new Date().toISOString()})
      ON CONFLICT (analysis_id) DO NOTHING`;
  } catch { /* best-effort */ }
}

async function sendTelegramAlert(p: {
  leadId: string; name: string; phone: string; telegram: string;
  product: string; marginPct: number; verdict: string; score?: number;
  priority: string; marketplace: string; cityTo: string;
}): Promise<void> {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const ve = p.verdict === 'go' ? '✅' : p.verdict === 'maybe' ? '⚠️' : '❌';
  const pe = p.priority === 'HIGH' ? '🔥' : p.priority === 'MEDIUM' ? '⚡' : '💤';

  const lines = [
    `${pe} <b>Новый лид — AI калькулятор</b>`,
    ``,
    `👤 ${p.name || 'Без имени'}`,
    p.phone    ? `📞 ${p.phone}`    : '',
    p.telegram ? `✈️ ${p.telegram}` : '',
    ``,
    `📦 ${p.product || '—'}`,
    `🏪 ${p.marketplace}${p.cityTo ? ' → ' + p.cityTo : ''}`,
    `📊 Маржа: <b>${p.marginPct.toFixed(1)}%</b>`,
    `${ve} Вердикт: ${p.verdict}${p.score ? ` · Скор ${p.score}/100` : ''}`,
    ``,
    `🆔 <code>${p.leadId}</code>`,
  ].filter(Boolean).join('\n');

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: lines, parse_mode: 'HTML' }),
      signal: AbortSignal.timeout(6000),
    });
  } catch { /* best-effort */ }
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
  const mp = getMarketplace(marketplaceId);
  const commissionPct = body.commission_pct != null
    ? parseFloat(String(body.commission_pct))
    : mp?.commission_pct ?? 15;

  const result = await calculateUnitEconomics({
    unitPrice,
    priceCurrency: body.price_currency === 'USD' ? 'USD' : 'CNY',
    salePrice,
    quantity:      Math.max(1, parseInt(String(body.quantity ?? '1')) || 1),
    commissionPct,
    marketplaceId,
    adSpend:       parseFloat(String(body.ad_spend    ?? '0')),
    otherCosts:    parseFloat(String(body.other_costs ?? '0')),
    cityTo:        String(body.city_to   ?? ''),
    countryTo:     String(body.country_to ?? 'Russia'),
    weightKg:      body.weight_kg ? parseFloat(String(body.weight_kg)) : undefined,
    productName:   String(body.product_name ?? ''),
    moq:           body.moq ? parseInt(String(body.moq)) : undefined,
  });

  const { economics, priority, delivery } = result;

  const aiAnalysis = await getAiAnalysis(
    String(body.product_name ?? ''),
    economics.margin_pct,
    economics.net_profit_rub,
    unitPrice,
    body.price_currency === 'USD' ? 'USD' : 'CNY',
    economics.quantity,
    mp?.label ?? marketplaceId,
    economics.verdict_label,
  );

  const utmSource   = String(body.utm_source   ?? 'ai_economics_funnel');
  const utmCampaign = String(body.utm_campaign ?? '');

  const leadId     = `aif-${crypto.randomUUID()}`;
  const analysisId = `ana-${crypto.randomUUID()}`;
  const now        = new Date().toISOString();

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
        marketplace:              marketplaceId,
        marketplace_label:        mp?.label,
        unit_price:               unitPrice,
        price_currency:           body.price_currency ?? 'CNY',
        sale_price:               salePrice,
        margin_pct:               economics.margin_pct,
        roi_pct:                  economics.roi_pct,
        net_profit_rub:           economics.net_profit_rub,
        marketplace_logistics_rub: economics.marketplace_logistics_rub,
        product_score:            economics.product_score?.total,
        verdict:                  economics.verdict,
        supplier_risk:            economics.supplier_risk?.level,
        tariff_date:              mp?.tariff_date,
        ai_analysis:              aiAnalysis,
        source:                   'ai_economics_funnel',
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

  // Сохраняем в product_analyses
  await saveProductAnalysis({
    analysisId,
    leadId,
    sourceUrl:    String(body.product_link ?? ''),
    productName:  String(body.product_name ?? ''),
    marketplace:  marketplaceId,
    city:         String(body.city_to ?? ''),
    quantity:     economics.quantity,
    unitPriceCny: unitPrice,
    salePriceRub: salePrice,
    marginPct:    economics.margin_pct,
    roiPct:       economics.roi_pct,
    netProfitRub: economics.net_profit_rub,
    productScore: economics.product_score?.total ?? 0,
    verdict:      economics.verdict,
    cnyRate:      economics.cny_rate,
  });

  // Прямое Telegram-уведомление (через бота)
  void sendTelegramAlert({
    leadId,
    name:      String(body.name ?? ''),
    phone,
    telegram,
    product:   String(body.product_name ?? ''),
    marginPct: economics.margin_pct,
    verdict:   economics.verdict,
    score:     economics.product_score?.total,
    priority,
    marketplace: mp?.label ?? marketplaceId,
    cityTo:    String(body.city_to ?? ''),
  });

  // n8n Telegram уведомление (доп. канал, если настроен)
  const n8nUrl = process.env.N8N_WEBHOOK_URL;
  if (n8nUrl) {
    fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event:        'lead.created',
        lead_id:      leadId,
        analysis_id:  analysisId,
        source:       'ai_economics_funnel',
        name:         body.name ?? '',
        phone,
        telegram,
        product:      body.product_name ?? '',
        margin_pct:   economics.margin_pct,
        verdict:      economics.verdict,
        score:        economics.product_score?.total,
        city_to:      body.city_to ?? '',
        marketplace:  mp?.label ?? marketplaceId,
        priority,
      }),
      signal: AbortSignal.timeout(5000),
    }).catch(() => {});
  }

  const enriched = { ...economics, ai_analysis: aiAnalysis };

  return NextResponse.json({
    ok:          true,
    lead_id:     leadId,
    analysis_id: analysisId,
    priority,
    economics:   enriched,
    delivery,
    marketplace_config: mp ? { id: mp.id, label: mp.label, tariff_date: mp.tariff_date, commission_note: mp.commission_note } : null,
  });
}
