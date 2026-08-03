import { NextRequest, NextResponse } from 'next/server';
import { listRows, createRow, TABLE_IDS } from '@/lib/rate-engine/db';
import { validateShippingRate } from '@/lib/rate-engine/validators';
import type { ShippingRate } from '@/lib/rate-engine/types';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const rates = await listRows<ShippingRate>(TABLE_IDS.shipping_rates);
    return NextResponse.json({ ok: true, data: rates });
  } catch (err) {
    console.error('[rates GET]', err);
    return NextResponse.json({ ok: false, error: 'fetch_failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Partial<ShippingRate>;
  const errors = validateShippingRate(body);
  if (errors.length) return NextResponse.json({ ok: false, errors }, { status: 400 });

  try {
    const now = new Date().toISOString();
    const row = await createRow<ShippingRate>(TABLE_IDS.shipping_rates, {
      ...body,
      status: body.status ?? 'active',
      created_at: now,
      updated_at: now,
    } as Record<string, unknown>);
    return NextResponse.json({ ok: true, data: row }, { status: 201 });
  } catch (err) {
    console.error('[rates POST]', err);
    return NextResponse.json({ ok: false, error: 'create_failed' }, { status: 500 });
  }
}
