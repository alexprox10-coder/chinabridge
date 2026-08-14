import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/api-auth';
import { neon } from '@neondatabase/serverless';

export const runtime     = 'nodejs';
export const maxDuration = 30;

const VK_ADS_API = 'https://ads.vk.com/api/v3';

async function getToken(): Promise<string | null> {
  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT key, value FROM integration_tokens WHERE key = 'vk_ads_access_token'
  `.catch(() => []);
  return (rows[0] as { value: string } | undefined)?.value ?? null;
}

async function vkGet(path: string, token: string) {
  const res = await fetch(`${VK_ADS_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function vkPost(path: string, token: string, body: unknown) {
  const res = await fetch(`${VK_ADS_API}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const token = await getToken();
  if (!token) {
    return NextResponse.json({ error: 'VK Ads не подключён' }, { status: 400 });
  }

  const [campaignsRes, leadFormsRes] = await Promise.allSettled([
    vkGet('/campaigns/?limit=50', token),
    vkGet('/lead_forms/?limit=50', token),
  ]);

  return NextResponse.json({
    ok: true,
    campaigns:  campaignsRes.status  === 'fulfilled' ? campaignsRes.value.data  : { error: 'fetch failed' },
    lead_forms: leadFormsRes.status === 'fulfilled' ? leadFormsRes.value.data : { error: 'fetch failed' },
  });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const token = await getToken();
  if (!token) {
    return NextResponse.json({ error: 'VK Ads не подключён' }, { status: 400 });
  }

  const body   = await req.json().catch(() => ({}) as Record<string, unknown>);
  const action = body.action as string;

  if (action === 'create_campaign') {
    const r = await vkPost('/campaigns/', token, {
      name:         body.name ?? 'ChinaBridge — Лидогенерация',
      objective:    'lead_generation',
      status:       'ACTIVE',
      budget_limit: Number(body.budget ?? 5000),
      budget_type:  'total',
      start_time:   new Date().toISOString(),
    });
    return NextResponse.json({ ok: r.ok, campaign: r.data, http_status: r.status });
  }

  if (action === 'create_lead_form') {
    const r = await vkPost('/lead_forms/', token, {
      name:              body.name ?? 'ChinaBridge — Заявка на доставку из Китая',
      campaign_id:       body.campaign_id,
      description:       'Расчёт стоимости доставки товаров из Китая',
      header:            'Получите расчёт за 5 минут',
      questions: [
        { type: 'name',   label: 'Ваше имя',            required: true  },
        { type: 'phone',  label: 'Телефон',              required: true  },
        { type: 'custom', label: 'Что везёте из Китая?', required: false },
        { type: 'custom', label: 'Город назначения',     required: false },
      ],
      policy_link_url:   'https://chinabridge.pro/privacy',
      confirmation_text: 'Спасибо! Мы свяжемся с вами в течение 30 минут.',
    });
    return NextResponse.json({ ok: r.ok, lead_form: r.data, http_status: r.status });
  }

  if (action === 'create_ad_group') {
    const r = await vkPost('/ad_groups/', token, {
      campaign_id:  body.campaign_id,
      name:         body.name ?? 'Предприниматели — Москва',
      status:       'ACTIVE',
      budget_limit: Number(body.budget ?? 1000),
      bid:          Number(body.bid ?? 100),
      targeting: {
        age_from:  25,
        age_to:    55,
        sex:       0,
        interests: ['business', 'ecommerce', 'logistics'],
        geo: { cities: body.cities ?? [1], exclude_cities: [] },
      },
    });
    return NextResponse.json({ ok: r.ok, ad_group: r.data, http_status: r.status });
  }

  if (action === 'get_stats') {
    const r = await vkGet(
      `/statistics/?object_type=campaign&object_ids=${body.campaign_id}&date_from=${body.date_from ?? '2026-01-01'}&date_to=${body.date_to ?? new Date().toISOString().slice(0, 10)}`,
      token
    );
    return NextResponse.json({ ok: r.ok, stats: r.data });
  }

  return NextResponse.json({
    error: `Unknown action: ${action}`,
    available: ['create_campaign', 'create_lead_form', 'create_ad_group', 'get_stats'],
  }, { status: 400 });
}
