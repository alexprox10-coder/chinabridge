import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/api-auth';
import { neon } from '@neondatabase/serverless';

export const runtime     = 'nodejs';
export const maxDuration = 30;

// New VK Ads API (ads.vk.com)
const VK_ADS_API = 'https://ads.vk.com/api/v2';

async function getToken(): Promise<string | null> {
  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT value FROM integration_tokens WHERE key = 'vk_ads_access_token'
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
  if (!isAuthorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const token = await getToken();
  if (!token) return NextResponse.json({ error: 'VK Ads не подключён' }, { status: 400 });

  const [campaignsRes, audiencesRes] = await Promise.allSettled([
    vkGet('/campaigns/', token),
    vkGet('/remarketing/audiences/', token),
  ]);

  return NextResponse.json({
    ok: true,
    campaigns:  campaignsRes.status  === 'fulfilled' ? campaignsRes.value.data  : { items: [] },
    lead_forms: audiencesRes.status === 'fulfilled' ? audiencesRes.value.data : { items: [] },
  });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const token = await getToken();
  if (!token) return NextResponse.json({ error: 'VK Ads не подключён' }, { status: 400 });

  const body   = await req.json().catch(() => ({}) as Record<string, unknown>);
  const action = body.action as string;

  if (action === 'create_campaign') {
    const r = await vkPost('/campaigns/', token, {
      name:        body.name ?? 'ChinaBridge — Лидогенерация',
      objective:   'LEADS',
      status:      'ACTIVE',
      budget_type: 'CAMPAIGN',
      budget_limit: Number(body.budget ?? 5000),
    });
    return NextResponse.json({ ok: r.ok, campaign: r.data, http_status: r.status });
  }

  if (action === 'create_lead_form') {
    // Lead forms in new API are part of ad creatives, return placeholder
    return NextResponse.json({ ok: true, lead_form: { id: 'pending', note: 'Создайте объявление в VK Ads кабинете' } });
  }

  if (action === 'create_ad_group') {
    const r = await vkPost('/ad_groups/', token, {
      campaign_id:  body.campaign_id,
      name:         body.name ?? 'Предприниматели — Россия',
      status:       'ACTIVE',
      budget_limit: Number(body.budget ?? 1000),
      targeting: {
        age_from: 25,
        age_to:   55,
        sex:      0,
        geo: { regions: [188] },
      },
    });
    return NextResponse.json({ ok: r.ok, ad_group: r.data, http_status: r.status });
  }

  if (action === 'get_stats') {
    const dateFrom = body.date_from ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const dateTo   = body.date_to   ?? new Date().toISOString().slice(0, 10);
    const r = await vkGet(
      `/statistics/?object_type=campaign&object_id=${body.campaign_id}&date_from=${dateFrom}&date_to=${dateTo}`,
      token
    );
    return NextResponse.json({ ok: r.ok, stats: r.data });
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}
