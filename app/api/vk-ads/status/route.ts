import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/api-auth';
import { neon } from '@neondatabase/serverless';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);

    // Проверяем есть ли таблица и токены
    const rows = await sql`
      SELECT key, value, updated_at FROM integration_tokens
      WHERE key LIKE 'vk_ads_%'
    `.catch(() => []);

    const data: Record<string, string> = {};
    for (const row of rows) {
      data[row.key as string] = row.value as string;
    }

    const accessToken = data['vk_ads_access_token'];
    if (!accessToken) {
      return NextResponse.json({ connected: false, message: 'Не подключён' });
    }

    // Проверяем токен через VK API
    const meRes = await fetch('https://id.vk.ru/oauth2/user_info', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: new URLSearchParams({ client_id: process.env.VK_ADS_CLIENT_ID ?? '' }),
      signal: AbortSignal.timeout(5000),
    }).then(r => r.json()).catch(() => ({}));

    const expiresAt = data['vk_ads_expires_at'];
    const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;

    // Считаем синхронизированные лиды
    const [synced] = await sql`
      SELECT COUNT(*) as cnt FROM crm_leads WHERE source = 'VK_ADS'
    `.catch(() => [{ cnt: 0 }]);

    return NextResponse.json({
      connected:    true,
      expired:      isExpired,
      expires_at:   expiresAt,
      updated_at:   data['vk_ads_access_token'] ? rows.find(r => r.key === 'vk_ads_access_token')?.updated_at : null,
      user_id:      data['vk_ads_user_id'],
      vk_user:      meRes?.user ?? null,
      leads_synced: synced?.cnt ?? 0,
    });

  } catch (e) {
    return NextResponse.json({ connected: false, error: String(e) });
  }
}
