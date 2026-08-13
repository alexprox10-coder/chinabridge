import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const runtime = 'nodejs';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://chinabridge.pro';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code        = searchParams.get('code');
  const state       = searchParams.get('state');
  const storedState = req.cookies.get('vk_oauth_state')?.value;

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(`${APP_URL}/admin?vk_ads=error&reason=state_mismatch`);
  }

  const clientId     = process.env.VK_ADS_CLIENT_ID     ?? '';
  const clientSecret = process.env.VK_ADS_CLIENT_SECRET ?? '';

  try {
    // Обмениваем code → access_token
    const tokenRes = await fetch('https://target.my.com/api/v2/token.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        client_id:     clientId,
        client_secret: clientSecret,
        redirect_uri:  `${APP_URL}/api/vk-ads/callback`,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('[VK-ADS] token exchange failed:', err);
      return NextResponse.redirect(`${APP_URL}/admin?vk_ads=error&reason=token_failed`);
    }

    const tokenData = await tokenRes.json() as {
      access_token:  string;
      refresh_token?: string;
      expires_in?:   number;
      user_id?:      number;
    };

    if (!tokenData.access_token) {
      return NextResponse.redirect(`${APP_URL}/admin?vk_ads=error&reason=no_token`);
    }

    // Сохраняем токены в БД
    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      CREATE TABLE IF NOT EXISTS integration_tokens (
        key         text PRIMARY KEY,
        value       text NOT NULL,
        updated_at  text NOT NULL
      )`;

    const now = new Date().toISOString();
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : '';

    await sql`
      INSERT INTO integration_tokens (key, value, updated_at) VALUES
        ('vk_ads_access_token',  ${tokenData.access_token},          ${now}),
        ('vk_ads_refresh_token', ${tokenData.refresh_token ?? ''},   ${now}),
        ('vk_ads_expires_at',    ${expiresAt},                       ${now}),
        ('vk_ads_user_id',       ${String(tokenData.user_id ?? '')}, ${now})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`;

    const res = NextResponse.redirect(`${APP_URL}/admin?vk_ads=connected`);
    res.cookies.delete('vk_oauth_state');
    return res;

  } catch (e) {
    console.error('[VK-ADS] callback error:', e);
    return NextResponse.redirect(`${APP_URL}/admin?vk_ads=error&reason=exception`);
  }
}
