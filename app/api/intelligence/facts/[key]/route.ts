import { NextRequest, NextResponse } from 'next/server';
import { getFactByKey, getFactVersions, upsertFact } from '@/lib/intelligence/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  const fact = await getFactByKey(key);
  if (!fact) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  const versions = await getFactVersions(key);
  return NextResponse.json({ ok: true, data: { ...fact, versions } });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  const body = await req.json().catch(() => ({}));

  const existing = await getFactByKey(key);
  if (!existing) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });

  const updated = await upsertFact({ ...existing, ...body, fact_key: key });
  return NextResponse.json({ ok: true, data: updated });
}
