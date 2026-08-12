import { NextRequest, NextResponse } from 'next/server';
import { parseProductUrl, validateUrl } from '@/lib/ai-funnel/url-parser';
import { neon } from '@neondatabase/serverless';

export const runtime    = 'nodejs';
export const maxDuration = 30;

const DAILY_LIMIT = 3;

function getIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';
}

async function checkRateLimit(ip: string): Promise<{ allowed: boolean }> {
  if (ip === 'unknown') return { allowed: true };
  try {
    const sql  = neon(process.env.DATABASE_URL!);
    const date = new Date().toISOString().slice(0, 10);
    const key  = `url:${ip}`;
    await sql`
      CREATE TABLE IF NOT EXISTS calc_anon_requests (
        ip text NOT NULL, date text NOT NULL, count integer DEFAULT 1 NOT NULL,
        PRIMARY KEY (ip, date)
      )`;
    const rows = await sql`SELECT count FROM calc_anon_requests WHERE ip=${key} AND date=${date}`;
    const cur  = Number(rows[0]?.count ?? 0);
    if (cur >= DAILY_LIMIT) return { allowed: false };
    await sql`
      INSERT INTO calc_anon_requests (ip, date, count) VALUES (${key}, ${date}, 1)
      ON CONFLICT (ip, date) DO UPDATE SET count = calc_anon_requests.count + 1`;
    return { allowed: true };
  } catch { return { allowed: true }; }
}

export async function POST(req: NextRequest) {
  const { url } = await req.json().catch(() => ({}) as { url?: string });

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ ok: false, error: 'url_required' }, { status: 400 });
  }

  if (!validateUrl(url)) {
    return NextResponse.json(
      { ok: false, error: 'unsupported_domain', message: 'Поддерживаются только 1688.com, alibaba.com и taobao.com' },
      { status: 422 },
    );
  }

  const ip = getIp(req);
  const { allowed } = await checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: 'rate_limit', message: `Лимит ${DAILY_LIMIT} анализа URL в день` },
      { status: 429 },
    );
  }

  const result = await parseProductUrl(url);

  if (!result.ok) {
    // Не ошибка — просто предлагаем ввести вручную
    return NextResponse.json({
      ok:     false,
      reason: result.reason,
      message: result.reason === 'no_key'
        ? 'Автоанализ временно недоступен'
        : 'Не удалось извлечь данные автоматически. Введите параметры вручную.',
    });
  }

  return NextResponse.json({ ok: true, data: result.data });
}
