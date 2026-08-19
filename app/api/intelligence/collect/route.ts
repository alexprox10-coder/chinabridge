import { NextRequest, NextResponse } from 'next/server';
import { getFactByKey, createChange } from '@/lib/intelligence/client';

export const runtime     = 'nodejs';
export const dynamic     = 'force-dynamic';
export const maxDuration = 30;

type CollectSource = 'wb' | 'ozon' | 'kaspi' | 'yandex';

const SOURCE_CONFIG: Record<CollectSource, {
  fact_key:   string;
  label:      string;
  entity:     string;
  department: string;
  source_url: string;
  prompt:     string;
}> = {
  wb: {
    fact_key:   'WB_COMMISSION_STANDARD',
    label:      'Комиссия WB (стандарт)',
    entity:     'Wildberries',
    department: 'WB',
    source_url: 'https://seller.wildberries.ru/dynamic-products',
    prompt:     'Найди на странице стандартную комиссию Wildberries (WB) для продавцов. Верни ТОЛЬКО одно число — процент комиссии (например: 23). Если не нашёл — верни null.',
  },
  ozon: {
    fact_key:   'OZON_COMMISSION_STANDARD',
    label:      'Комиссия Ozon (стандарт)',
    entity:     'Ozon',
    department: 'OZON',
    source_url: 'https://seller.ozon.ru/app/tariffs',
    prompt:     'Найди на странице стандартную комиссию Ozon для продавцов (FBO или средняя). Верни ТОЛЬКО одно число — процент комиссии (например: 18). Если не нашёл — верни null.',
  },
  kaspi: {
    fact_key:   'KASPI_COMMISSION_STANDARD',
    label:      'Комиссия Kaspi (стандарт)',
    entity:     'Kaspi',
    department: 'GENERAL',
    source_url: 'https://kaspi.kz/seller',
    prompt:     'Найди на странице стандартную комиссию Kaspi для продавцов. Верни ТОЛЬКО одно число — процент комиссии (например: 12.6). Если не нашёл — верни null.',
  },
  yandex: {
    fact_key:   'YANDEX_COMMISSION_STANDARD',
    label:      'Комиссия Яндекс Маркет (стандарт)',
    entity:     'Yandex Market',
    department: 'GENERAL',
    source_url: 'https://seller.market.yandex.ru/tariffs',
    prompt:     'Найди на странице стандартную комиссию Яндекс Маркет для продавцов. Верни ТОЛЬКО одно число — процент комиссии (например: 12). Если не нашёл — верни null.',
  },
};

async function extractCommissionWithAI(
  html:   string,
  prompt: string,
): Promise<number | null> {
  const orKey = process.env.OPENROUTER_API_KEY;
  if (!orKey) return null;

  const text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 3000);

  if (text.length < 50) return null;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${orKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://chinabridge.pro',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Ты парсер тарифных страниц маркетплейсов. Отвечай ТОЛЬКО цифрой или словом null.' },
          { role: 'user',   content: `${prompt}\n\nТекст страницы:\n${text}` },
        ],
        max_tokens:  20,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    const raw  = String(data.choices?.[0]?.message?.content ?? '').trim();
    if (raw === 'null' || raw === '') return null;
    const num = parseFloat(raw.replace(',', '.'));
    return isNaN(num) || num <= 0 || num > 100 ? null : num;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const body   = await req.json().catch(() => ({}));
  const source = String(body.source ?? '') as CollectSource;
  const html   = String(body.html ?? '');

  const cfg = SOURCE_CONFIG[source];
  if (!cfg) {
    return NextResponse.json({ ok: false, error: 'unknown_source' }, { status: 400 });
  }

  // Получить текущее значение из intel_facts
  const currentFact = await getFactByKey(cfg.fact_key);
  const currentValue = currentFact ? parseFloat(currentFact.current_value) : null;

  // AI парсинг HTML со страницы маркетплейса
  const extracted = await extractCommissionWithAI(html, cfg.prompt);

  // Если AI не нашёл — создаём INFO-изменение "нужна ручная проверка"
  if (extracted === null) {
    const change = await createChange({
      fact_key:        cfg.fact_key,
      department:      cfg.department as 'WB' | 'OZON' | 'GENERAL',
      source_url:      cfg.source_url,
      entity:          cfg.entity,
      metric:          'Комиссия (стандарт)',
      old_value:       currentValue !== null ? String(currentValue) : undefined,
      new_value:       currentValue !== null ? String(currentValue) : '?',
      change_type:     'WARNING',
      confidence:      'LOW',
      impact:          'MEDIUM',
      impact_summary:  `Автоматический парсинг ${cfg.label} не удался — страница вернула пустой контент. Требуется ручная проверка.`,
      affected_systems:['calculator', 'economics'],
      notes:           `HTML получен, но комиссия не извлечена. Возможно, SPA не отрендерил контент на сервере.`,
    });
    return NextResponse.json({ ok: true, action: 'manual_check_required', change_id: change.id, change_code: change.change_code });
  }

  // Если значение не изменилось — ничего не делаем
  if (currentValue !== null && Math.abs(extracted - currentValue) < 0.1) {
    return NextResponse.json({ ok: true, action: 'no_change', current: currentValue, extracted });
  }

  // Значение изменилось — создаём PENDING IntelChange
  const diffPct = currentValue !== null
    ? ((extracted - currentValue) / currentValue * 100).toFixed(1)
    : 'N/A';

  const change = await createChange({
    fact_key:        cfg.fact_key,
    department:      cfg.department as 'WB' | 'OZON' | 'GENERAL',
    source_url:      cfg.source_url,
    entity:          cfg.entity,
    metric:          'Комиссия (стандарт)',
    old_value:       currentValue !== null ? String(currentValue) : undefined,
    new_value:       String(extracted),
    difference:      currentValue !== null ? `${diffPct}%` : undefined,
    unit:            '%',
    change_type:     'CHANGE',
    confidence:      'MEDIUM',
    impact:          'CRITICAL',
    impact_summary:  `${cfg.label}: ${currentValue ?? '?'} → ${extracted}% (${diffPct}%). Требует проверки и ручного подтверждения перед применением.`,
    affected_systems:['calculator', 'economics', 'proposals'],
    notes:           `Обнаружено автоматически. Источник: ${cfg.source_url}`,
  });

  return NextResponse.json({
    ok:          true,
    action:      'change_created',
    change_id:   change.id,
    change_code: change.change_code,
    old_value:   currentValue,
    new_value:   extracted,
    diff_pct:    diffPct,
  });
}
