import { NextRequest, NextResponse } from 'next/server';
import { neon }                      from '@neondatabase/serverless';
import { randomUUID }                from 'crypto';

export const runtime     = 'nodejs';
export const dynamic     = 'force-dynamic';

const SESSION_COOKIE = 'cb_session_id';
const MAX_HISTORY    = 30;

async function ensureTable(sql: ReturnType<typeof neon>) {
  await sql`
    CREATE TABLE IF NOT EXISTS calc_history (
      id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      session_key  TEXT        NOT NULL,
      client_id    TEXT,
      product_name TEXT,
      verdict      TEXT,
      verdict_emoji TEXT,
      verdict_label TEXT,
      margin_pct   NUMERIC(8,2),
      roi_pct      NUMERIC(8,2),
      net_profit_rub NUMERIC(12,2),
      marketplace  TEXT,
      unit_price_cny NUMERIC(12,2),
      sale_price_rub NUMERIC(12,2),
      quantity     INTEGER,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )`;
  await sql`
    CREATE INDEX IF NOT EXISTS calc_history_session_idx
      ON calc_history (session_key, created_at DESC)`;
}

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
  const sessionKey = req.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionKey) return NextResponse.json({ ok: true, items: [] });

  try {
    const sql  = neon(process.env.DATABASE_URL!);
    await ensureTable(sql);
    const rows = await sql`
      SELECT id, product_name, verdict, verdict_emoji, verdict_label,
             margin_pct, roi_pct, net_profit_rub, marketplace, created_at
      FROM calc_history
      WHERE session_key = ${sessionKey}
      ORDER BY created_at DESC
      LIMIT ${MAX_HISTORY}`;
    return NextResponse.json({ ok: true, items: rows });
  } catch {
    return NextResponse.json({ ok: true, items: [] });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;

  const sessionKey = req.cookies.get(SESSION_COOKIE)?.value ?? randomUUID();
  const clientId   = getClientId(req);
  const ec         = (body.economics ?? {}) as Record<string, unknown>;

  try {
    const sql = neon(process.env.DATABASE_URL!);
    await ensureTable(sql);
    await sql`
      INSERT INTO calc_history (
        session_key, client_id, product_name, verdict, verdict_emoji, verdict_label,
        margin_pct, roi_pct, net_profit_rub, marketplace,
        unit_price_cny, sale_price_rub, quantity
      ) VALUES (
        ${sessionKey}, ${clientId ?? null},
        ${String(body.product_name ?? '').slice(0, 200) || null},
        ${String(ec.verdict ?? '') || null},
        ${String(ec.verdict_emoji ?? '') || null},
        ${String(ec.verdict_label ?? '') || null},
        ${ec.margin_pct     != null ? Number(ec.margin_pct)      : null},
        ${ec.roi_pct        != null ? Number(ec.roi_pct)         : null},
        ${ec.net_profit_rub != null ? Number(ec.net_profit_rub)  : null},
        ${String(body.marketplace ?? '') || null},
        ${body.unit_price_cny != null ? Number(body.unit_price_cny) : null},
        ${body.sale_price_rub != null ? Number(body.sale_price_rub) : null},
        ${body.quantity       != null ? Number(body.quantity)       : null}
      )`;
  } catch { /* ignore save errors — history is non-critical */ }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, sessionKey, {
    maxAge: 365 * 24 * 3600,
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
  });
  return res;
}
