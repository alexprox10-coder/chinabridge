import { NextRequest, NextResponse } from 'next/server';
import { calculateCostBreakdown } from '@/lib/cost-engine';
import { createLead } from '@/lib/crm/client';
import { neon } from '@neondatabase/serverless';
import type { EconomicsResult } from '@/lib/calculator/types';

export const runtime = 'nodejs';
export const maxDuration = 30;

const CNY_RATE = Number(process.env.CNY_TO_RUB ?? '12.5');
const USD_RATE = Number(process.env.USD_TO_RUB ?? '92');
const DAILY_LIMIT = 2;

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

async function checkAndIncrement(
  ip: string,
  date: string,
): Promise<{ allowed: boolean; remaining: number }> {
  if (ip === 'unknown') return { allowed: true, remaining: DAILY_LIMIT };
  const sql = neon(process.env.DATABASE_URL!);
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS calc_anon_requests (
        ip   text NOT NULL,
        date text NOT NULL,
        count integer DEFAULT 1 NOT NULL,
        PRIMARY KEY (ip, date)
      )
    `;
    const rows = await sql`
      SELECT count FROM calc_anon_requests WHERE ip = ${ip} AND date = ${date}
    `;
    const current = Number(rows[0]?.count ?? 0);
    if (current >= DAILY_LIMIT) return { allowed: false, remaining: 0 };
    await sql`
      INSERT INTO calc_anon_requests (ip, date, count) VALUES (${ip}, ${date}, 1)
      ON CONFLICT (ip, date) DO UPDATE SET count = calc_anon_requests.count + 1
    `;
    return { allowed: true, remaining: DAILY_LIMIT - current - 1 };
  } catch {
    return { allowed: true, remaining: DAILY_LIMIT };
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  if (!body.name || !body.phone || !body.product_name) {
    return NextResponse.json({ ok: false, error: 'required_fields_missing' }, { status: 400 });
  }

  const unitPrice = parseFloat(body.unit_price ?? '0');
  const salePrice = parseFloat(body.sale_price ?? '0');
  if (!unitPrice || !salePrice) {
    return NextResponse.json({ ok: false, error: 'economics_required' }, { status: 400 });
  }

  // Rate limit
  const ip = getIp(req);
  const today = new Date().toISOString().slice(0, 10);
  const { allowed, remaining } = await checkAndIncrement(ip, today);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: 'rate_limit', reason: 'Лимит: 2 AI-расчёта в день. Зарегистрируйтесь для расширенного доступа.' },
      { status: 429 },
    );
  }

  const qty             = Math.max(1, parseInt(body.quantity ?? '1') || 1);
  const commission      = parseFloat(body.marketplace_commission ?? '0');
  const adSpend         = parseFloat(body.ad_spend ?? '0');
  const otherCosts      = parseFloat(body.other_costs ?? '0');
  const priceCurrency   = body.price_currency === 'USD' ? 'USD' : 'CNY';

  // Delivery cost via existing rate engine
  const cost = await calculateCostBreakdown({
    country_from: body.country_from ?? 'China',
    city_from:    body.city_from ?? '',
    country_to:   body.country_to ?? 'Russia',
    city_to:      body.city_to ?? '',
    weight:   body.weight_kg     ? parseFloat(body.weight_kg)     : undefined,
    volume:   body.volume_m3     ? parseFloat(body.volume_m3)     : undefined,
    packages: body.packages_count ? parseInt(body.packages_count) : undefined,
  }).catch(() => null);

  const hasRate = cost && cost.sale_price > 0;

  // Convert delivery cost to RUB
  const deliveryRub = hasRate
    ? cost!.currency === 'RUB' ? cost!.sale_price
    : cost!.currency === 'CNY' ? cost!.sale_price * CNY_RATE
    : cost!.sale_price * USD_RATE   // USD and everything else
    : 0;

  // P&L
  const unitPriceRub      = unitPrice * (priceCurrency === 'CNY' ? CNY_RATE : USD_RATE);
  const purchaseTotalRub  = unitPriceRub * qty;
  const customsRub        = purchaseTotalRub * 0.20;
  const totalCostRub      = purchaseTotalRub + deliveryRub + customsRub + otherCosts;
  const unitCostRub       = totalCostRub / qty;
  const grossRevenue      = salePrice * qty;
  const marketplaceFee    = grossRevenue * (commission / 100);
  const netProfit         = grossRevenue - totalCostRub - marketplaceFee - adSpend;
  const marginPct         = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
  const roiPct            = totalCostRub > 0 ? (netProfit / totalCostRub) * 100 : 0;

  const verdict      = marginPct >= 25 ? 'green'       : marginPct >= 10 ? 'yellow'            : 'red' as const;
  const verdictEmoji = marginPct >= 25 ? '🟢'          : marginPct >= 10 ? '🟡'                : '🔴';
  const verdictLabel = marginPct >= 25 ? 'Перспективная' : marginPct >= 10 ? 'Требует проверки' : 'Слабая экономика';

  // AI analysis via OpenRouter (best-effort, 8 s timeout)
  let aiAnalysis: string | undefined;
  const orKey = process.env.OPENROUTER_API_KEY;
  if (orKey) {
    try {
      const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization:  `Bearer ${orKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://chinabridge.pro',
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Эксперт по ВЭД. Дай краткий анализ рентабельности (1–2 предложения). Только факты. Русский язык.',
            },
            {
              role: 'user',
              content: `Товар: ${body.product_name}. Закупка: ${unitPrice} ${priceCurrency}/ед × ${qty} шт = ${Math.round(purchaseTotalRub)} ₽. Доставка+таможня: ${Math.round(deliveryRub + customsRub)} ₽. Цена продажи: ${salePrice} ₽/шт. Маржа: ${marginPct.toFixed(1)}%. Чистая прибыль: ${Math.round(netProfit)} ₽.`,
            },
          ],
          max_tokens: 120,
          temperature: 0.3,
        }),
        signal: AbortSignal.timeout(8000),
      });
      const aiData = await aiRes.json();
      aiAnalysis = aiData.choices?.[0]?.message?.content?.trim();
    } catch { /* silently skip */ }
  }

  // Save lead
  const id       = crypto.randomUUID();
  const leadId   = `eco-${id}`;
  const priority = marginPct >= 25 ? 'HOT' : marginPct >= 10 ? 'WARM' : 'COLD';
  await createLead(
    {
      lead_id:             leadId,
      created_at:          new Date().toISOString(),
      updated_at:          new Date().toISOString(),
      name:                body.name ?? '',
      phone:               body.phone ?? '',
      telegram:            body.telegram ?? '',
      email:               body.email ?? '',
      company:             '',
      product:             body.product_name ?? '',
      product_link:        body.product_link ?? '',
      category:            body.category ?? '',
      quantity:            String(body.quantity ?? ''),
      weight:              String(body.weight_kg ?? ''),
      volume:              String(body.volume_m3 ?? ''),
      country_destination: body.country_to ?? 'Russia',
      city_destination:    body.city_to ?? '',
      delivery_type:       '',
      service_type:        body.service_type ?? '',
      status:              'NEW',
      priority:            priority as 'HOT' | 'WARM' | 'COLD',
      estimated_value:     grossRevenue,
      manager:             '',
      comment:             `Юнит-экономика: ${unitPrice}${priceCurrency}/ед, продажа ${salePrice}₽, маржа ${marginPct.toFixed(1)}%, прибыль ${Math.round(netProfit)}₽. ${aiAnalysis ?? ''}`,
      source:              'calculator_economics',
      utm_source:          'calculator',
      utm_campaign:        '',
      delivery_cost:       hasRate ? cost!.sale_price : undefined,
      carrier_cost:        hasRate ? cost!.carrier_cost : undefined,
      markup_percent:      hasRate ? cost!.markup_percent : undefined,
      profit:              netProfit,
      margin_percent:      marginPct,
      pricing_rule:        hasRate ? cost!.selected_rule_name : undefined,
    },
    'tenant-chinabridge',
  ).catch(() => {});

  const economics: EconomicsResult = {
    quantity:            qty,
    unit_price_rub:      Math.round(unitPriceRub),
    purchase_total_rub:  Math.round(purchaseTotalRub),
    delivery_total_rub:  Math.round(deliveryRub),
    customs_rub:         Math.round(customsRub),
    other_costs_rub:     Math.round(otherCosts),
    total_cost_rub:      Math.round(totalCostRub),
    unit_cost_rub:       Math.round(unitCostRub),
    sale_price_rub:      salePrice,
    gross_revenue_rub:   Math.round(grossRevenue),
    marketplace_fee_rub: Math.round(marketplaceFee),
    ad_cost_rub:         Math.round(adSpend),
    net_profit_rub:      Math.round(netProfit),
    margin_pct:          Math.round(marginPct * 10) / 10,
    roi_pct:             Math.round(roiPct * 10) / 10,
    verdict,
    verdict_emoji:       verdictEmoji,
    verdict_label:       verdictLabel,
    ai_analysis:         aiAnalysis,
    cny_rate:            CNY_RATE,
    usd_rate:            USD_RATE,
  };

  return NextResponse.json({
    ok:       true,
    cargo_type: 'consolidation',
    priority,
    reason:   '',
    lead_id:  leadId,
    ...(hasRate && {
      delivery_cost:     cost!.sale_price,
      delivery_days_min: cost!.delivery_days_min,
      delivery_days_max: cost!.delivery_days_max,
      rate_currency:     cost!.currency,
      pricing_rule:      cost!.selected_rule_name,
    }),
    economics,
    rate_limit_remaining: remaining,
  });
}
