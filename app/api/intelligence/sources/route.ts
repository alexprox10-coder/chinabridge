import { NextRequest, NextResponse } from 'next/server';
import { getSources, createSource } from '@/lib/intelligence/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const sources = await getSources();
  return NextResponse.json({ ok: true, data: sources });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!body.name || !body.url || !body.department) {
    return NextResponse.json({ ok: false, error: 'name, url, department required' }, { status: 400 });
  }
  const source = await createSource({
    name:            body.name,
    url:             body.url,
    department:      body.department,
    source_type:     body.source_type ?? 'OFFICIAL',
    priority:        body.priority ?? 3,
    active:          body.active ?? true,
    crawl_frequency: body.crawl_frequency ?? 'WEEKLY',
    notes:           body.notes ?? null,
  });
  return NextResponse.json({ ok: true, data: source }, { status: 201 });
}
