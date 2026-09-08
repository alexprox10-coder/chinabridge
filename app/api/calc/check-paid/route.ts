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

export async function GET(req: NextRequest) {
  // Fast path: anon httpOnly cookie
  const anonPaidUntil = req.cookies.get('cb_anon_paid_until')?.value;
  if (anonPaidUntil && new Date(anonPaidUntil) > new Date()) {
    return NextResponse.json({ isPaid: true, paidUntil: anonPaidUntil, source: 'cookie' });
  }

  // Logged-in user: check Neon
  const clientId = getClientId(req);
  if (clientId) {
    try {
      const sql = neon(process.env.DATABASE_URL!);
      const rows = await sql`
        SELECT subscribed_until FROM calc_subscriptions
        WHERE client_id = ${clientId} AND subscribed_until > NOW()
        LIMIT 1`;
      if (rows.length > 0) {
        return NextResponse.json({ isPaid: true, paidUntil: String(rows[0].subscribed_until), source: 'db' });
      }
    } catch { /* DB unavailable — fall through */ }
  }

  return NextResponse.json({ isPaid: false });
}
