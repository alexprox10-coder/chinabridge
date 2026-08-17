import { NextRequest, NextResponse } from 'next/server';
import { reviewChange, applyChange } from '@/lib/intelligence/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (isNaN(id)) return NextResponse.json({ ok: false, error: 'invalid_id' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const { action, reviewed_by = 'admin' } = body as { action: string; reviewed_by?: string };

  if (action === 'apply') {
    const result = await applyChange(id);
    return NextResponse.json(result);
  }

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json(
      { ok: false, error: 'action must be approve | reject | apply' },
      { status: 400 },
    );
  }

  const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
  const change = await reviewChange(id, status, reviewed_by);
  return NextResponse.json({ ok: true, data: change });
}
