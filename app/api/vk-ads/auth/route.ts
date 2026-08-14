import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/api-auth';
import { randomBytes } from 'crypto';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const clientId = process.env.VK_ADS_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'VK_ADS_CLIENT_ID not configured' }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://chinabridge.pro';
  const state = randomBytes(16).toString('hex');

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  `${appUrl}/api/vk-ads/callback`,
    response_type: 'code',
    scope:         'ads',
    state,
  });

  // myTarget shut down — use new VK Ads OAuth via id.vk.com
  const res = NextResponse.redirect(`https://id.vk.com/oauth2/authorize?${params}`);
  res.cookies.set('vk_oauth_state', state, {
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    maxAge:   600,
    path:     '/',
  });

  return res;
}
