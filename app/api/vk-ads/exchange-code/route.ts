import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/api-auth';
import { neon } from '@neondatabase/serverless';

export const runtime = 'nodejs';

// Принимает code или полный URL после редиректа, обменивает на myTarget access_token
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { input } = await req.json() as { input: string };
  if (!input) return NextResponse.json({ error: 'input required' }, { status: 400 });

  // Извлекаем code из URL или берём как есть
  let code = input.trim();
  const urlMatch = input.match(/[?&#]code=([^&#\s]+)/);
  if (urlMatch) code = urlMatch[1];

  const clientId     = process.env.VK_ADS_CLIENT_ID     ?? 'RSQWZsO7iPxs5BnN';
  const clientSecret = process.env.VK_ADS_CLIENT_SECRET ?? '';

  // Обмениваем code → myTarget access_token
  const tokenRes = await fetch('https://target.my.com/api/v2/token.json', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      client_id:     clientId,
      client_secret: clientSecret,
      redirect_uri:  'https://oauth.vk.ru/blank.html',
    }),
    signal: AbortSignal.timeout(10000),
  });

  const tokenData = await tokenRes.json().catch(() => ({})) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!tokenRes.ok || !tokenData.access_token) {
    return NextResponse.json({
      error: 'token_exchange_failed',
      details: tokenData,
      hint: 'Код мог устареть — он действует 60 секунд. Попробуйте ещё раз.',
    }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    CREATE TABLE IF NOT EXISTS integration_tokens (
      key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL
    )`;

  const now       = new Date().toISOString();
  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    : new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString();

  await sql`
    INSERT INTO integration_tokens (key, value, updated_at) VALUES
      ('vk_ads_access_token',  ${tokenData.access_token},           ${now}),
      ('vk_ads_refresh_token', ${tokenData.refresh_token ?? ''},    ${now}),
      ('vk_ads_expires_at',    ${expiresAt},                        ${now})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`;

  return NextResponse.json({ ok: true, expires_at: expiresAt });
}
