import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

const ADMIN_SECRET = process.env.CALC_ADMIN_SECRET;

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

// Internal endpoint — requires CALC_ADMIN_SECRET. Used to restore PRO after verified payment.
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret') ?? req.headers.get('authorization')?.replace('Bearer ', '');
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const until = new Date();
  until.setDate(until.getDate() + 30);
  const untilStr = until.toISOString();

  const res = NextResponse.json({ ok: true, paidUntil: untilStr });

  // Set httpOnly cookie
  res.cookies.set('cb_anon_paid_until', untilStr, {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/',
    expires: until,
  });

  // Also write to DB if client is known
  const clientId = getClientId(req);
  if (clientId && process.env.DATABASE_URL) {
    try {
      const sql = neon(process.env.DATABASE_URL);
      await sql`
        INSERT INTO calc_subscriptions (client_id, subscribed_until, amount_rub, created_at)
        VALUES (${clientId}, ${untilStr}, 490, NOW())
        ON CONFLICT (client_id) DO UPDATE SET subscribed_until = ${untilStr}
      `;
    } catch { /* ignore */ }
  }

  return res;
}
