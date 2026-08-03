import { NextRequest, NextResponse } from 'next/server';
import { getProposal } from '@/lib/proposals/crm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proposal = await getProposal(id);
  if (!proposal) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(proposal);
}
