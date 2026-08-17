import { NextRequest, NextResponse } from 'next/server';
import { getFacts, upsertFact } from '@/lib/intelligence/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const department = searchParams.get('department') ?? undefined;
  const facts = await getFacts(department);
  return NextResponse.json({ ok: true, data: facts });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!body.fact_key || !body.current_value) {
    return NextResponse.json({ ok: false, error: 'fact_key and current_value required' }, { status: 400 });
  }
  const fact = await upsertFact(body);
  return NextResponse.json({ ok: true, data: fact });
}
