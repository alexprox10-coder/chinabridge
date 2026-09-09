import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

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

// Dev-only: removes PRO subscription from DB + clears cookie
export async function POST(req: NextRequest) {
  const clientId = getClientId(req);

  const res = NextResponse.json({ ok: true, clientId });

  // Clear httpOnly PRO cookie
  res.cookies.set('cb_anon_paid_until', '', {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0,
  });

  // Delete DB subscription
  if (clientId && process.env.DATABASE_URL) {
    try {
      const sql = neon(process.env.DATABASE_URL);
      await sql`DELETE FROM calc_subscriptions WHERE client_id = ${clientId}`;
    } catch { /* ignore */ }
  }

  return res;
}
