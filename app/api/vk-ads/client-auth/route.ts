import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/api-auth';
import { neon } from '@neondatabase/serverless';

export const runtime = 'nodejs';

// Получаем токен через client_credentials — без браузерного OAuth
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const clientId     = process.env.VK_ADS_CLIENT_ID     ?? 'RSQWZsO7iPxs5BnN';
  const clientSecret = process.env.VK_ADS_CLIENT_SECRET ?? '';

  if (!clientSecret) {
    return NextResponse.json({ error: 'VK_ADS_CLIENT_SECRET не настроен в Vercel env' }, { status: 500 });
  }

  // New VK Ads API (ads.vk.com) uses id.vk.com for token exchange
  const tokenRes = await fetch('https://id.vk.com/oauth2/auth', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     clientId,
      client_secret: clientSecret,
    }),
    signal: AbortSignal.timeout(10000),
  });

  const data = await tokenRes.json().catch(() => ({})) as {
    access_token?: string;
    token_type?:   string;
    expires_in?:   number;
    error?:        string;
    error_description?: string;
  };

  if (!tokenRes.ok || !data.access_token) {
    return NextResponse.json({ error: 'auth_failed', details: data, http_status: tokenRes.status }, { status: 400 });
  }

  const sql       = neon(process.env.DATABASE_URL!);
  const now       = new Date().toISOString();
  const expiresAt = new Date(Date.now() + (data.expires_in ?? 86400) * 1000).toISOString();

  await sql`CREATE TABLE IF NOT EXISTS integration_tokens (
    key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL
  )`;

  await sql`
    INSERT INTO integration_tokens (key, value, updated_at) VALUES
      ('vk_ads_access_token', ${data.access_token}, ${now}),
      ('vk_ads_expires_at',   ${expiresAt},          ${now})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`;

  return NextResponse.json({ ok: true, expires_at: expiresAt });
}
