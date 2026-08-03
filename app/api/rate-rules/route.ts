import { NextRequest, NextResponse } from 'next/server';
import { listRows, createRow, TABLE_IDS } from '@/lib/rate-engine/db';
import { validatePricingRule } from '@/lib/rate-engine/validators';
import type { PricingRule } from '@/lib/rate-engine/types';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const rows = await listRows<PricingRule>(TABLE_IDS.pricing_rules);
    return NextResponse.json({ ok: true, data: rows });
  } catch (err) {
    console.error('[rate-rules GET]', err);
    return NextResponse.json({ ok: false, error: 'fetch_failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Partial<PricingRule>;
  const errors = validatePricingRule(body);
  if (errors.length) return NextResponse.json({ ok: false, errors }, { status: 400 });

  try {
    const row = await createRow<PricingRule>(TABLE_IDS.pricing_rules, {
      ...body,
      status: body.status ?? 'active',
    } as Record<string, unknown>);
    return NextResponse.json({ ok: true, data: row }, { status: 201 });
  } catch (err) {
    console.error('[rate-rules POST]', err);
    return NextResponse.json({ ok: false, error: 'create_failed' }, { status: 500 });
  }
}
