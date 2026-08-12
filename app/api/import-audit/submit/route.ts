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

  const n8nUrl = process.env.N8N_WEBHOOK_URL;
  if (n8nUrl) {
    fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event:    'lead.created',
        lead_id:  leadId,
        source:   'import_audit_lm',
        name,
        phone,
        telegram,
        product,
        volume,
        problem,
        priority: 'HIGH',
      }),
      signal: AbortSignal.timeout(5000),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, lead_id: leadId });
}
