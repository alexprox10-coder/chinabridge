import { NextRequest, NextResponse } from 'next/server';
import { calculateDeliveryCost, saveCalculation } from '@/lib/rate-engine/rate-calculator';
import { validateCalculationInput } from '@/lib/rate-engine/validators';
import type { CalculationInput } from '@/lib/rate-engine/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Partial<CalculationInput>;
  const errors = validateCalculationInput(body);
  if (errors.length) return NextResponse.json({ ok: false, errors }, { status: 400 });

  try {
    const input = body as CalculationInput;
    const result = await calculateDeliveryCost(input);

    // Save calculation record if lead_id provided
    if (input.lead_id) {
      await saveCalculation(result, input).catch(console.error);
    }

    return NextResponse.json({ ok: true, data: result });
  } catch (err) {
    console.error('[rates/calculate POST]', err);
    return NextResponse.json({ ok: false, error: 'calculation_failed' }, { status: 500 });
  }
}
