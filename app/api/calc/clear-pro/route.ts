import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Dev/test endpoint — clears the PRO cookie so limits can be tested
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('cb_anon_paid_until', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
