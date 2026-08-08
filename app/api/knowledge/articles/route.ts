import { NextRequest, NextResponse } from 'next/server';
import { ARTICLES, ARTICLE_CATEGORIES } from '@/lib/knowledge/articles';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const q = searchParams.get('q')?.toLowerCase().trim();

  let articles = ARTICLES;

  if (category && category !== 'all') {
    articles = articles.filter(a => a.categorySlug === category);
  }

  if (q) {
    articles = articles.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  return NextResponse.json({
    ok: true,
    categories: ARTICLE_CATEGORIES,
    articles: articles.map(a => ({
      id: a.id,
      category: a.category,
      categorySlug: a.categorySlug,
      title: a.title,
      description: a.description,
      tags: a.tags,
      readTime: a.readTime,
    })),
    total: articles.length,
  });
}
