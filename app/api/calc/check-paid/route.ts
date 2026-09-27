import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getOrCreateSessionId, setSessionCookie, getIp } from '@/lib/credits/session';
import { getBalance } from '@/lib/credits/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getClientId(req: NextRequest): string | null {
  try {
    const token = req.cookies.get('cb_client')?.value;
    if (!token) return null;
    const dot = token.lastIndexOf('.');
    if (dot < 0) return null;
    const payload = JSON.parse(Buffer.from(token.slice(0, dot), 'base64url').toString());
    return payload?.clientId ?? null;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const { session_id, isNew } = getOrCreateSessionId(req);
  const ip = getIp(req);

  // Legacy PRO cookie still honoured for backward compatibility
  const anonPaidUntil = req.cookies.get('cb_anon_paid_until')?.value;
  if (anonPaidUntil && new Date(anonPaidUntil) > new Date()) {
    const res = NextResponse.json({
      isPaid: true, paidUntil: anonPaidUntil, source: 'cookie',
      // Also return credit info
      balance: 999, free_left: 0, has_access: true,
    });
    if (isNew) setSessionCookie(res, session_id);
    return res;
  }

  // Logged-in user: check subscription table
  const clientId = getClientId(req);
  if (clientId && process.env.DATABASE_URL) {
    try {
      const sql = neon(process.env.DATABASE_URL);
      const rows = await sql`
        SELECT subscribed_until FROM calc_subscriptions
        WHERE client_id = ${clientId} AND subscribed_until > NOW()
        LIMIT 1`;
      if (rows.length > 0) {
        const res = NextResponse.json({
          isPaid: true, paidUntil: String(rows[0].subscribed_until), source: 'db',
          balance: 999, free_left: 0, has_access: true,
        });
        if (isNew) setSessionCookie(res, session_id);
        return res;
      }
    } catch { /* DB unavailable — fall through to credit check */ }
  }

  // Credit balance check
  if (process.env.DATABASE_URL) {
    try {
      const bal = await getBalance(session_id, ip);
      const res = NextResponse.json({
        isPaid: bal.has_access,
        source: 'credits',
        balance:   bal.balance,
        free_used: bal.free_used,
        free_left: bal.free_left,
        has_access: bal.has_access,
      });
      if (isNew) setSessionCookie(res, session_id);
      return res;
    } catch { /* DB unavailable */ }
  }

  // Fail open — allow access if DB is down
  const res = NextResponse.json({
    isPaid: true, source: 'fail_open',
    balance: 0, free_left: 3, has_access: true,
  });
  if (isNew) setSessionCookie(res, session_id);
  return res;
}
