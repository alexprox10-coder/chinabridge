import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

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

const SYSTEM_PROMPT = `Ты — эксперт по работе с китайскими поставщиками. Проанализируй товар/запрос и опиши 4-5 типичных профилей поставщиков на рынке Китая. Используй реальные рыночные паттерны 2024-2025 года. НЕ выдумывай конкретные названия компаний.

Ответь ТОЛЬКО валидным JSON без markdown:
{
  "market_overview": "1-2 предложения об особенностях рынка поставщиков",
  "suppliers": [
    {
      "type": "Тип: Производитель / Оптовик / Торговая компания / Фабрика",
      "region": "Провинция/город Китая",
      "platform": "1688",
      "price_level": "low",
      "price_min_cny": 10,
      "price_max_cny": 25,
      "moq_min": 50,
      "moq_max": 500,
      "quality_level": "standard",
      "reliability_score": 78,
      "score_breakdown": {
        "reliability": 80,
        "price": 70,
        "quality": 75,
        "communication": 82
      },
      "pros": ["Низкая цена", "Гибкий МОQ"],
      "cons": ["Дольше доставка", "Нужна инспекция"],
      "verification_tips": "На что обратить внимание при проверке этого типа поставщика"
    }
  ]
}

reliability_score: 0-100, AI-оценка на основе типичных паттернов данного типа поставщика.
price_level: low | medium | high
quality_level: basic | standard | premium`;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const query = String(body.query ?? '').trim();

  if (!query || query.length < 3) {
    return NextResponse.json({ ok: false, error: 'Уточните запрос (минимум 3 символа)' }, { status: 400 });
  }
  if (query.length > 300) {
    return NextResponse.json({ ok: false, error: 'Запрос слишком длинный' }, { status: 400 });
  }

  const ip    = getIp(req);
  const today = new Date().toISOString().slice(0, 10);
  const { allowed, remaining } = await checkLimit(`sf:${ip}`, today);

  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: `Лимит: ${DAILY_LIMIT} поисков в день. Зарегистрируйтесь для расширенного доступа.` },
      { status: 429 },
    );
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
        max_tokens: 1800,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(22000),
    });

    const aiData = await res.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty AI response');

    const parsed = JSON.parse(content) as {
      market_overview?: string;
      suppliers?: unknown[];
    };

    if (!Array.isArray(parsed.suppliers) || parsed.suppliers.length === 0) {
      throw new Error('No suppliers in AI response');
    }

    return NextResponse.json({
      ok: true,
      market_overview: parsed.market_overview ?? '',
      suppliers:       parsed.suppliers.slice(0, 5),
      rate_limit_remaining: remaining,
    });
  } catch (e) {
    console.error('[supplier-finder]', e);
    return NextResponse.json({ ok: false, error: 'Ошибка AI. Попробуйте ещё раз.' }, { status: 500 });
  }
}
