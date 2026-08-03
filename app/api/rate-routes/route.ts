import { NextRequest, NextResponse } from 'next/server';
import { listRows, createRow, TABLE_IDS } from '@/lib/rate-engine/db';
import { validateRoute } from '@/lib/rate-engine/validators';
import type { Route } from '@/lib/rate-engine/types';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const rows = await listRows<Route>(TABLE_IDS.routes);
    return NextResponse.json({ ok: true, data: rows });
  } catch (err) {
    console.error('[rate-routes GET]', err);
    return NextResponse.json({ ok: false, error: 'fetch_failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Partial<Route>;
  const errors = validateRoute(body);
  if (errors.length) return NextResponse.json({ ok: false, errors }, { status: 400 });

  try {
    const row = await createRow<Route>(TABLE_IDS.routes, {
      ...body,
      status: body.status ?? 'active',
      created_at: new Date().toISOString(),
    } as Record<string, unknown>);
    return NextResponse.json({ ok: true, data: row }, { status: 201 });
  } catch (err) {
    console.error('[rate-routes POST]', err);
    return NextResponse.json({ ok: false, error: 'create_failed' }, { status: 500 });
  }
}
