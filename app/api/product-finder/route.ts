import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { isAuthorized } from '@/lib/api-auth';

export const runtime = 'nodejs';
export const maxDuration = 30;

const DAILY_LIMIT = 5;

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

async function checkLimit(
  key: string,
  date: string,
): Promise<{ allowed: boolean; remaining: number }> {
  const sql = neon(process.env.DATABASE_URL!);
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS calc_anon_requests (
        ip text NOT NULL, date text NOT NULL, count integer DEFAULT 1 NOT NULL,
        PRIMARY KEY (ip, date)
      )
    `;
    const rows = await sql`SELECT count FROM calc_anon_requests WHERE ip = ${key} AND date = ${date}`;
    const current = Number(rows[0]?.count ?? 0);
    if (current >= DAILY_LIMIT) return { allowed: false, remaining: 0 };
    await sql`
      INSERT INTO calc_anon_requests (ip, date, count) VALUES (${key}, ${date}, 1)
      ON CONFLICT (ip, date) DO UPDATE SET count = calc_anon_requests.count + 1
    `;
    return { allowed: true, remaining: DAILY_LIMIT - current - 1 };
  } catch {
    return { allowed: true, remaining: DAILY_LIMIT };
  }
}

const SYSTEM_PROMPT = `Ты — эксперт по импорту из Китая. Пользователь ищет КОНКРЕТНЫЙ товар для импорта в Россию/СНГ.

ГЛАВНОЕ ПРАВИЛО: возвращай ТОЛЬКО тот товар, который точно описан в запросе — в разных вариантах по мощности, размеру, модели. НЕ предлагай смежные или похожие категории товаров.

Примеры правильной логики:
- «LED светильники для склада» → UFO high bay 100W, 150W, 200W, линейный LED для склада — НЕ LED панели, НЕ LED ленты
- «детские велосипеды 16 дюймов» → велосипеды 16" разных типов — НЕ самокаты, НЕ велосипеды другого размера
- «спортивная одежда оптом» → футболки, шорты, леггинсы спортивные — НЕ обычная одежда

ОБЯЗАТЕЛЬНЫЕ требования к полям:
- search_1688: ТОЛЬКО китайские иероглифы (例: 仓库LED灯100W). Никакого русского или английского.
- search_alibaba: ТОЛЬКО английский язык (例: warehouse LED light 100W).
- price_min_cny и price_max_cny: реалистичные оптовые цены в юанях за единицу (2024-2025).
- moq: минимальный заказ в штуках (реалистично для 1688/Alibaba).
- НЕ выдумывай названия конкретных заводов и поставщиков.

Ответь ТОЛЬКО валидным JSON без markdown:
{
  "category": "точное название категории товара",
  "import_notes": "1-2 предложения о специфике импорта этого товара",
  "products": [
    {
      "name": "Конкретное название товара на русском (с характеристиками)",
      "name_en": "Specific product name in English",
      "price_min_cny": 10,
      "price_max_cny": 30,
      "moq": 50,
      "weight_per_unit_kg": 0.5,
      "platforms": ["1688", "Alibaba"],
      "search_1688": "中文关键词",
      "search_alibaba": "english search query",
      "notes": "На что обратить внимание при выборе именно этого варианта"
    }
  ]
}`;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const query = String(body.query ?? '').trim();

  if (!query || query.length < 3) {
    return NextResponse.json({ ok: false, error: 'Уточните запрос (минимум 3 символа)' }, { status: 400 });
  }
  if (query.length > 300) {
    return NextResponse.json({ ok: false, error: 'Запрос слишком длинный' }, { status: 400 });
  }

  const loggedIn = isAuthorized(req);
  const ip       = getIp(req);
  const today    = new Date().toISOString().slice(0, 10);

  let remaining = 999;
  if (!loggedIn) {
    const limit = await checkLimit(`pf:${ip}`, today);
    if (!limit.allowed) {
      return NextResponse.json(
        { ok: false, error: `Лимит: ${DAILY_LIMIT} поисков в день. Зарегистрируйтесь для неограниченного доступа.` },
        { status: 429 },
      );
    }
    remaining = limit.remaining;
  }

  const orKey = process.env.OPENROUTER_API_KEY;
  if (!orKey) {
    return NextResponse.json({ ok: false, error: 'AI сервис временно недоступен' }, { status: 503 });
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${orKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://chinabridge.pro',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: query },
        ],
        max_tokens: 1500,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(22000),
    });

    const aiData = await res.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty AI response');

    const parsed = JSON.parse(content) as {
      category?: string;
      import_notes?: string;
      products?: unknown[];
    };

    if (!Array.isArray(parsed.products) || parsed.products.length === 0) {
      throw new Error('No products in AI response');
    }

    return NextResponse.json({
      ok: true,
      category:     parsed.category ?? '',
      import_notes: parsed.import_notes ?? '',
      products:     parsed.products.slice(0, 5),
      rate_limit_remaining: remaining,
    });
  } catch (e) {
    console.error('[product-finder]', e);
    return NextResponse.json({ ok: false, error: 'Ошибка AI. Попробуйте ещё раз.' }, { status: 500 });
  }
}
