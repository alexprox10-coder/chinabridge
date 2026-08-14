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
    display:       'page',
    v:             '5.199',
    state,
  });

  // Classic VK OAuth — works for numeric app IDs with ads scope
  const res = NextResponse.redirect(`https://oauth.vk.com/authorize?${params}`);
  res.cookies.set('vk_oauth_state', state, {
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    maxAge:   600,
    path:     '/',
  });

  return res;
}
