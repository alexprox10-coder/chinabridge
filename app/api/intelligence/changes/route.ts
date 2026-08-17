import { NextRequest, NextResponse } from 'next/server';
import { getChanges, createChange } from '@/lib/intelligence/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status     = searchParams.get('status')     ?? undefined;
  const department = searchParams.get('department') ?? undefined;
  const changes = await getChanges(status, department);
  return NextResponse.json({ ok: true, data: changes });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!body.fact_key || !body.new_value) {
    return NextResponse.json({ ok: false, error: 'fact_key and new_value required' }, { status: 400 });
  }
  const change = await createChange(body);
  return NextResponse.json({ ok: true, data: change }, { status: 201 });
}
