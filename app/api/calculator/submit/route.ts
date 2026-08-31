import { NextRequest, NextResponse } from 'next/server';
import { calculateCostBreakdown } from '@/lib/cost-engine';
import { createLead } from '@/lib/crm/client';

export const runtime = 'nodejs';

function escapeNonAscii(s: string): string {
  return s.replace(/[^\x00-\x7F]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
}

async function notifyManagerTelegram(data: {
  name: string; phone: string; telegram?: string; whatsapp?: string; email?: string;
  product_name: string; city_to?: string; country_to?: string;
  weight_kg?: string; quantity?: string; cost?: number; days_min?: number; days_max?: number;
  source?: string;
}) {
  const token = process.env.CHINABRIDGE_LID_BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN ?? "";
  const chatId = process.env.TELEGRAM_MANAGER_CHAT_ID ?? "8979087725";
  if (!token) return;

  const h = (s: string) => (s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const dest = [data.city_to, data.country_to].filter(Boolean).join(", ");
  const costLine = data.cost ? `\n💰 <b>Расчёт:</b> ${data.cost.toFixed(0)} ₽ (${data.days_min}-${data.days_max} дн.)` : "";
  const tgLine = data.telegram ? `\n📲 Telegram: ${h(data.telegram)}` : "";
  const waLine = data.whatsapp ? `\n💬 WhatsApp: ${h(data.whatsapp)}` : "";
  const emailLine = !data.telegram && !data.whatsapp && data.email ? `\n📧 Email: ${h(data.email)}` : "";
  const sourceLine = data.source ? `\n🌐 Источник: ${h(data.source)}` : "";

  const phoneLink = data.phone ? `\n\n📞 <b><a href="tel:${data.phone}">${h(data.phone)}</a></b>` : "\n\n📞 <b>телефон не указан</b>";
  const text = `🔥 <b>Новая заявка!</b>${sourceLine}${phoneLink}${tgLine}${waLine}${emailLine}\n\n👤 ${h(data.name || "Аноним")}\n📦 <b>Товар:</b> ${h(data.product_name || "—")}\n🗺 <b>Куда:</b> ${h(dest || "—")}\n📏 <b>Вес/кол-во:</b> ${h(data.weight_kg || data.quantity || "—")}${costLine}\n\n⏱ Ответьте в течение 5 минут!`;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  if (!body.phone) {
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

  // Fire Telegram notification FIRST — independent of n8n, fast
  await notifyManagerTelegram({
    name:         body.name ?? '',
    phone:        body.phone ?? '',
    telegram:     body.telegram ?? '',
    whatsapp:     body.whatsapp ?? '',
    email:        body.email ?? '',
    product_name: body.product_name ?? '',
    city_to:      body.city_to ?? '',
    country_to:   body.country_to ?? '',
    weight_kg:    body.weight_kg ?? '',
    quantity:     String(body.quantity ?? ''),
    source:       body.source ?? '',
  });

  const n8n = await fetch(`${N8N_BASE}/webhook/chinabridge-calculator`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: escapeNonAscii(JSON.stringify(n8nPayload)),
    signal: AbortSignal.timeout(28000),
  }).then(r => r.json()).catch(() => null);

  const n8nData = Array.isArray(n8n) ? n8n[0] ?? {} : (n8n ?? {});

  // Save to crm_leads so the proposal API can find the lead by ID
  const crmLeadId = `calc-${id}`;
  await createLead({
    lead_id:             crmLeadId,
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
    priority:            (n8nData.priority ?? 'WARM') as 'HOT' | 'WARM' | 'COLD',
    estimated_value:     hasRate ? cost!.sale_price : 0,
    manager:             '',
    comment:             n8nData.reason ?? '',
    source:              'delivery_calculator',
    utm_source:          'calculator',
    utm_campaign:        '',
    delivery_cost:       hasRate ? cost!.sale_price : undefined,
    carrier_cost:        hasRate ? cost!.carrier_cost : undefined,
    markup_percent:      hasRate ? cost!.markup_percent : undefined,
    profit:              hasRate ? cost!.profit : undefined,
    margin_percent:      hasRate ? cost!.margin_percent : undefined,
    pricing_rule:        hasRate ? cost!.selected_rule_name : undefined,
  }, 'tenant-chinabridge').catch((e) => console.error('[calculator] createLead failed:', e));

  return NextResponse.json({
    ok: true,
    cargo_type: n8nData.cargo_type ?? 'consolidation',
    priority: n8nData.priority ?? 'WARM',
    reason: n8nData.reason ?? '',
    lead_id: crmLeadId,
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
