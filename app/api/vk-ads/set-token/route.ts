import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/api-auth';
import { neon } from '@neondatabase/serverless';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { token, expires_in } = await req.json() as { token: string; expires_in?: number };
  if (!token || token.length < 10) {
    return NextResponse.json({ error: 'invalid token' }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    CREATE TABLE IF NOT EXISTS integration_tokens (
      key        text PRIMARY KEY,
      value      text NOT NULL,
      updated_at text NOT NULL
    )`;

  const now = new Date().toISOString();
  const expiresAt = expires_in
    ? new Date(Date.now() + expires_in * 1000).toISOString()
    : new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(); // 1 year default

  await sql`
    INSERT INTO integration_tokens (key, value, updated_at) VALUES
      ('vk_ads_access_token', ${token},     ${now}),
      ('vk_ads_expires_at',   ${expiresAt}, ${now})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`;

  return NextResponse.json({ ok: true });
}
