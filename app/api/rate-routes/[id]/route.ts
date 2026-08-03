import { NextRequest, NextResponse } from 'next/server';
import { updateRow, deleteRow, TABLE_IDS } from '@/lib/rate-engine/db';
import type { Route } from '@/lib/rate-engine/types';

export const runtime = 'nodejs';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({})) as Partial<Route>;
  try {
    const row = await updateRow<Route>(TABLE_IDS.routes, Number(id), body as Record<string, unknown>);
    return NextResponse.json({ ok: true, data: row });
  } catch (err) {
    console.error('[rate-routes PUT]', err);
    return NextResponse.json({ ok: false, error: 'update_failed' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await deleteRow(TABLE_IDS.routes, Number(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[rate-routes DELETE]', err);
    return NextResponse.json({ ok: false, error: 'delete_failed' }, { status: 500 });
  }
}
