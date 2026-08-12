import { NextRequest, NextResponse } from 'next/server';
import { createLead } from '@/lib/crm/client';

export const runtime     = 'nodejs';
export const maxDuration = 15;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}) as Record<string, unknown>);

  const telegram = String(body.telegram ?? '').trim();
  const phone    = String(body.phone    ?? '').trim();
  if (!telegram && !phone) {
    return NextResponse.json({ ok: false, error: 'contact_required' }, { status: 400 });
  }

  const product  = String(body.product  ?? '').trim();
  const volume   = String(body.volume   ?? '').trim();
  const problem  = String(body.problem  ?? '').trim();
  const name     = String(body.name     ?? '').trim();

  const leadId = `aud-${crypto.randomUUID()}`;
  const now    = new Date().toISOString();

  await createLead(
    {
      lead_id:             leadId,
      created_at:          now,
      updated_at:          now,
      name,
      phone,
      telegram,
      email:               '',
      company:             '',
      product,
      product_link:        '',
      category:            'import_audit',
      quantity:            '',
      weight:              '',
      volume:              volume,
      country_destination: 'Russia',
      city_destination:    '',
      delivery_type:       '',
      service_type:        'audit',
      status:              'NEW',
      priority:            'HOT',
      estimated_value:     0,
      manager:             '',
      comment:             JSON.stringify({ product, volume, problem, source: 'import_audit_lm' }),
      source:              'LEAD_MAGNET_IMPORT_AUDIT',
      utm_source:          String(body.utm_source ?? 'import_audit'),
      utm_campaign:        String(body.utm_campaign ?? ''),
      delivery_cost:       undefined,
      carrier_cost:        undefined,
      markup_percent:      undefined,
      profit:              undefined,
      margin_percent:      undefined,
      pricing_rule:        undefined,
    },
    'tenant-chinabridge',
  ).catch(() => {});

  // Прямое Telegram-уведомление менеджеру
  const botToken  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId    = process.env.TELEGRAM_MANAGER_CHAT_ID ?? process.env.TELEGRAM_CHAT_ID;
  if (botToken && chatId) {
    const VOLUME_LABELS: Record<string, string> = {
      less_1m: '< 1 млн ₽/мес', '1_5m': '1–5 млн ₽/мес',
      '5_20m': '5–20 млн ₽/мес', over_20m: '> 20 млн ₽/мес',
    };
    const PROBLEM_LABELS: Record<string, string> = {
      margin: 'Маржа падает', supplier: 'Поставщик ненадёжный/дорогой',
      logistics: 'Логистика дорогая', customs: 'Проблемы с таможней', all: 'Общий аудит',
    };
    const text = [
      '📊 <b>Новый лид — Аудит импорта</b>',
      '',
      `📦 Товар: ${product || '—'}`,
      `💰 Объём: ${(VOLUME_LABELS[volume] ?? volume) || '—'}`,
      `⚠️ Проблема: ${(PROBLEM_LABELS[problem] ?? problem) || '—'}`,
      '',
      name     ? `👤 Имя: ${name}` : '',
      telegram ? `📱 Telegram: ${telegram}` : '',
      phone    ? `📞 Телефон: ${phone}` : '',
      '',
      `🆔 Lead ID: ${leadId}`,
      `🔗 CRM: https://chinabridge.pro/admin/import-leads`,
    ].filter(Boolean).join('\n');

    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      signal: AbortSignal.timeout(8000),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, lead_id: leadId });
}
