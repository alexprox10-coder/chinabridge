import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/api-auth';
import { neon } from '@neondatabase/serverless';

export const runtime     = 'nodejs';
export const maxDuration = 30;

// myTarget API v2 — правильная база для токенов полученных через target.my.com/api/v2/token.json
const MYTARGET_API = 'https://target.my.com/api/v2';

async function getToken(): Promise<string | null> {
  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT key, value FROM integration_tokens WHERE key = 'vk_ads_access_token'
  `.catch(() => []);
  return (rows[0] as { value: string } | undefined)?.value ?? null;
}

async function mtGet(path: string, token: string) {
  const res = await fetch(`${MYTARGET_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function mtPost(path: string, token: string, body: unknown) {
  const res = await fetch(`${MYTARGET_API}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// GET — список кампаний и lead-форм
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const token = await getToken();
  if (!token) {
    return NextResponse.json({ error: 'VK Ads не подключён' }, { status: 400 });
  }

  const result: Record<string, unknown> = {};

  // Параллельный fetch — не ждём каждый последовательно
  const [campaignsRes, leadAdsRes] = await Promise.allSettled([
    mtGet('/campaigns.json?limit=50', token),
    mtGet('/lead_ads.json?limit=50', token),
  ]);

  result.campaigns  = campaignsRes.status  === 'fulfilled' ? campaignsRes.value.data  : { error: 'fetch failed' };
  result.lead_forms = leadAdsRes.status === 'fulfilled' ? leadAdsRes.value.data : { error: 'fetch failed' };

  return NextResponse.json({ ok: true, ...result });
}

// POST — создать кампанию / lead-форму / группу объявлений
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
    // myTarget API v2: POST /api/v2/campaigns.json
    const campaignBody = {
      name:             body.name ?? 'ChinaBridge — Лидогенерация',
      objective:        'leadads',   // цель — лиды (myTarget формат)
      status:           'active',
      budget_limit:     Number(body.budget ?? 5000),
      budget_limit_day: Math.min(Number(body.budget ?? 5000), 1000),
    };

    const r = await mtPost('/campaigns.json', token, campaignBody);
    return NextResponse.json({ ok: r.ok, campaign: r.data, http_status: r.status });
  }

  if (action === 'create_lead_form') {
    // myTarget API v2: POST /api/v2/lead_ads.json
    const formBody = {
      name:        body.name ?? 'ChinaBridge — Заявка на доставку из Китая',
      campaign_id: body.campaign_id,
      questions: [
        { type: 'name',   label: 'Ваше имя',              required: true  },
        { type: 'phone',  label: 'Телефон',                required: true  },
        { type: 'custom', label: 'Что везёте из Китая?',   required: false },
        { type: 'custom', label: 'Город назначения',       required: false },
      ],
      policy_link_url:   'https://chinabridge.pro/privacy',
      confirmation_text: 'Спасибо! Мы свяжемся с вами в течение 30 минут.',
    };

    const r = await mtPost('/lead_ads.json', token, formBody);
    return NextResponse.json({ ok: r.ok, lead_form: r.data, http_status: r.status });
  }

  if (action === 'create_ad_group') {
    // myTarget API v2: POST /api/v2/ad_groups.json
    const adGroupBody = {
      campaign_id:  body.campaign_id,
      name:         body.name ?? 'Предприниматели — Москва',
      status:       'active',
      budget_limit: Number(body.budget ?? 1000),
      targeting: {
        age:     { age_list: [{ age_from: 25, age_to: 55 }] },
        sex:     { sex_list: [1, 2] },  // все
        geo:     { regions: [188] },    // 188 = Москва myTarget ID
      },
    };

    const r = await mtPost('/ad_groups.json', token, adGroupBody);
    return NextResponse.json({ ok: r.ok, ad_group: r.data, http_status: r.status });
  }

  if (action === 'get_stats') {
    const campaignId = body.campaign_id as string;
    const dateFrom = body.date_from ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const dateTo   = body.date_to   ?? new Date().toISOString().slice(0, 10);
    const r = await mtGet(
      `/statistics/campaigns/day.json?id=${campaignId}&date_from=${dateFrom}&date_to=${dateTo}`,
      token
    );
    return NextResponse.json({ ok: r.ok, stats: r.data });
  }

  return NextResponse.json({
    error: `Unknown action: ${action}`,
    available: ['create_campaign', 'create_lead_form', 'create_ad_group', 'get_stats'],
  }, { status: 400 });
}
