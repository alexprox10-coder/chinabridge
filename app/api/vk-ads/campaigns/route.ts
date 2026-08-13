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
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

async function vkPost(path: string, token: string, body: unknown) {
  const res = await fetch(`${VK_ADS_API}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

// GET — список кампаний, групп объявлений, lead-форм
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const token = await getToken();
  if (!token) {
    return NextResponse.json({ error: 'VK Ads не подключён. Перейдите на /api/vk-ads/auth' }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const section = searchParams.get('section') ?? 'all';

  const result: Record<string, unknown> = {};

  if (section === 'all' || section === 'campaigns') {
    const r = await vkGet('/campaigns/?limit=50', token);
    result.campaigns = r.data;
  }

  if (section === 'all' || section === 'lead_forms') {
    const r = await vkGet('/lead_forms/?limit=50', token);
    result.lead_forms = r.data;
  }

  if (section === 'all' || section === 'account') {
    const r = await vkGet('/agency/clients/', token).catch(() => vkGet('/ad_plans/', token));
    result.account = r.data;
  }

  return NextResponse.json({ ok: true, ...result });
}

// POST — создать кампанию или lead-форму
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const token = await getToken();
  if (!token) {
    return NextResponse.json({ error: 'VK Ads не подключён' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}) as Record<string, unknown>);
  const action = body.action as string;

  if (action === 'create_campaign') {
    // Создаём кампанию для лидогенерации ChinaBridge
    const campaignBody = {
      name:        body.name ?? 'ChinaBridge — Лидогенерация',
      objective:   'lead_generation',   // цель — лиды
      status:      'ACTIVE',
      budget_limit: body.budget        ?? 5000,  // ₽
      budget_type:  'total',
      start_time:   body.start_time    ?? new Date().toISOString(),
      ...(body.end_time ? { end_time: body.end_time } : {}),
    };

    const r = await vkPost('/campaigns/', token, campaignBody);
    return NextResponse.json({ ok: r.ok, campaign: r.data });
  }

  if (action === 'create_lead_form') {
    // Создаём lead-форму для сбора контактов на доставку из Китая
    const formBody = {
      name:        body.name ?? 'ChinaBridge — Заявка на доставку из Китая',
      campaign_id: body.campaign_id,
      description: 'Расчёт стоимости доставки товаров из Китая',
      header:      'Получите расчёт за 5 минут',
      questions: [
        { type: 'name',  label: 'Ваше имя',       required: true  },
        { type: 'phone', label: 'Телефон',         required: true  },
        { type: 'custom', label: 'Что везёте из Китая?', required: false },
        { type: 'custom', label: 'Город назначения',     required: false },
      ],
      policy_link_url: 'https://chinabridge.pro/privacy',
      confirmation_text: 'Спасибо! Мы свяжемся с вами в течение 30 минут.',
    };

    const r = await vkPost('/lead_forms/', token, formBody);
    return NextResponse.json({ ok: r.ok, lead_form: r.data });
  }

  if (action === 'create_ad_group') {
    // Создаём группу объявлений с таргетингом на предпринимателей
    const adGroupBody = {
      campaign_id:  body.campaign_id,
      name:         body.name ?? 'Предприниматели — Москва',
      status:       'ACTIVE',
      budget_limit: body.budget ?? 1000,
      bid:          body.bid    ?? 100,
      targeting: {
        age_from:    25,
        age_to:      55,
        sex:         0,  // all
        interests:   ['business', 'ecommerce', 'logistics'],  // интересы
        geo: {
          cities: body.cities ?? [1],  // 1 = Москва
          exclude_cities: [],
        },
      },
    };

    const r = await vkPost('/ad_groups/', token, adGroupBody);
    return NextResponse.json({ ok: r.ok, ad_group: r.data });
  }

  if (action === 'get_stats') {
    const campaignId = body.campaign_id as string;
    const r = await vkGet(
      `/statistics/?object_type=campaign&object_ids=${campaignId}&date_from=${body.date_from ?? '2026-01-01'}&date_to=${body.date_to ?? new Date().toISOString().slice(0,10)}`,
      token
    );
    return NextResponse.json({ ok: r.ok, stats: r.data });
  }

  return NextResponse.json({ error: `Unknown action: ${action}`, available: ['create_campaign', 'create_lead_form', 'create_ad_group', 'get_stats'] }, { status: 400 });
}
