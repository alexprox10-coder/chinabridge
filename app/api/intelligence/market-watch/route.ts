import { NextRequest, NextResponse } from 'next/server';
import {
  getMarketWatchItems,
  createMarketWatchItem,
  updateMarketWatchPrice,
  getFactByKey,
  createChange,
} from '@/lib/intelligence/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET — list all tracked market segments
export async function GET() {
  const items = await getMarketWatchItems();
  return NextResponse.json({ ok: true, items });
}

// POST — add new tracked segment OR update prices from n8n collector
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  // n8n collector posts price update: { watch_key, avg_price, min_price, max_price, item_count }
  if (body.avg_price !== undefined) {
    const { watch_key, avg_price, min_price, max_price, item_count } = body;

    if (!watch_key || avg_price == null) {
      return NextResponse.json({ ok: false, error: 'watch_key and avg_price required' }, { status: 400 });
    }

    const items = await getMarketWatchItems();
    const current = items.find(i => i.watch_key === watch_key);

    if (!current) {
      return NextResponse.json({ ok: false, error: 'watch_item_not_found' }, { status: 404 });
    }

    const prevAvg = current.avg_price;
    const updated = await updateMarketWatchPrice(watch_key, avg_price, min_price, max_price, item_count);

    // Create IntelChange if price moved > 3%
    if (prevAvg && Math.abs(avg_price - prevAvg) / prevAvg > 0.03) {
      const diffPct = ((avg_price - prevAvg) / prevAvg * 100).toFixed(1);
      const direction = avg_price > prevAvg ? '📈' : '📉';
      await createChange({
        fact_key:        watch_key,
        department:      'COMPETITOR',
        entity:          current.category,
        metric:          `Средняя цена на ${current.platform.toUpperCase()}`,
        old_value:       String(Math.round(prevAvg)),
        new_value:       String(Math.round(avg_price)),
        difference:      `${diffPct}%`,
        unit:            '₽',
        change_type:     'CHANGE',
        confidence:      'MEDIUM',
        impact:          'INFO',
        impact_summary:  `${direction} ${current.category} (${current.platform.toUpperCase()}): ${Math.round(prevAvg)} → ${Math.round(avg_price)} ₽ (${diffPct}%). Запрос: "${current.query}"`,
        affected_systems:['calculator', 'proposals'],
        source_url:      current.platform === 'wb'
          ? `https://www.wildberries.ru/catalog/0/search.aspx?search=${encodeURIComponent(current.query)}`
          : `https://www.ozon.ru/search/?text=${encodeURIComponent(current.query)}`,
        notes: `Автоматический мониторинг рынка. Выборка: ${item_count} товаров.`,
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, updated, prev_avg: prevAvg, change_detected: prevAvg ? Math.abs(avg_price - prevAvg) / prevAvg > 0.03 : false });
  }

  // Admin adds new tracked segment: { watch_key, platform, query, category }
  const { watch_key, platform, query, category } = body;
  if (!watch_key || !platform || !query || !category) {
    return NextResponse.json({ ok: false, error: 'watch_key, platform, query, category required' }, { status: 400 });
  }

  const item = await createMarketWatchItem({ watch_key, platform, query, category });
  return NextResponse.json({ ok: true, item });
}
