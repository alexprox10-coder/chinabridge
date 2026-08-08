import { NextRequest, NextResponse } from 'next/server';
import { ARTICLES } from '@/lib/knowledge/articles';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const article = ARTICLES.find(a => a.id === id);
  if (!article) {
    return NextResponse.json({ ok: false, error: 'Статья не найдена' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, article });
}
