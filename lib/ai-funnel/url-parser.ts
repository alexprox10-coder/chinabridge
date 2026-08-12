const FIRECRAWL_KEY   = process.env.FIRECRAWL_API_KEY ?? '';
const OPENROUTER_KEY  = process.env.OPENROUTER_API_KEY ?? '';

export interface FieldConfidence {
  product_name: number;   // 0-1
  price:        number;   // 0-1
  weight:       number;   // 0-1
  moq:          number;   // 0-1
  overall:      'high' | 'medium' | 'low';
}

export interface ParsedProduct {
  product_name:    string;
  unit_price_cny?: number;
  weight_kg?:      number;
  category?:       string;
  moq?:            number;
  image_url?:      string;
  source_platform: 'alibaba' | '1688' | 'taobao' | 'unknown';
  confidence:      FieldConfidence;
  raw_notes?:      string;
}

export type ParseResult =
  | { ok: true;  data: ParsedProduct }
  | { ok: false; reason: 'unsupported_domain' | 'scrape_failed' | 'parse_failed' | 'no_key'; code?: string };

const ALLOWED = ['1688.com', 'alibaba.com', 'taobao.com', 'detail.tmall.com'];

function detectPlatform(url: string): ParsedProduct['source_platform'] {
  if (url.includes('1688.com'))    return '1688';
  if (url.includes('alibaba.com')) return 'alibaba';
  if (url.includes('taobao.com') || url.includes('tmall.com')) return 'taobao';
  return 'unknown';
}

async function scrape(url: string): Promise<string | null> {
  if (!FIRECRAWL_KEY) return null;
  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { Authorization: `Bearer ${FIRECRAWL_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true, timeout: 12000 }),
      signal: AbortSignal.timeout(16000),
    });
    if (!res.ok) return null;
    const d = await res.json();
    return ((d.data?.markdown ?? d.markdown ?? '') as string).slice(0, 10000) || null;
  } catch { return null; }
}

async function parseWithAI(platform: string, markdown: string): Promise<ParsedProduct | null> {
  if (!OPENROUTER_KEY) return null;
  const prompt = `Ты эксперт по закупкам из Китая. Из страницы товара (${platform}) извлеки данные и верни ТОЛЬКО JSON без markdown, без пояснений.

Страница:
${markdown}

Верни ТОЛЬКО JSON:
{
  "product_name": "название на русском (кратко, до 60 символов)",
  "unit_price_cny": число_или_null,
  "weight_kg": число_или_null,
  "category": "одежда|электроника|мебель|автозапчасти|оборудование|товары_для_дома|другое",
  "moq": минимальный_заказ_штук_или_null,
  "image_url": "URL главного фото или null",
  "confidence": {
    "product_name": 0.0-1.0,
    "price": 0.0-1.0,
    "weight": 0.0-1.0,
    "moq": 0.0-1.0,
    "overall": "high|medium|low"
  }
}

Правила:
- unit_price_cny: цена в юанях за единицу (только число без валюты). Если диапазон — бери меньшую.
- weight_kg: вес единицы в кг. Если несколько вариантов — средний.
- moq: минимальный заказ в штуках.
- Не выдумывай! Если данных нет — null.
- confidence.price = 0.9+ если нашёл чёткую цену; 0.5-0.8 если приблизительно; 0 если нет.
- confidence.overall = "high" если нашёл название + цену; "medium" если только название; "low" иначе.`;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://chinabridge.pro',
      },
      body: JSON.stringify({
        model:       'openai/gpt-4o-mini',
        max_tokens:  512,
        temperature: 0.1,
        messages:    [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const d = await res.json();
    const text = (d.choices?.[0]?.message?.content ?? '') as string;
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]) as Partial<ParsedProduct & { confidence: Partial<FieldConfidence> }>;
    // Normalize confidence
    const conf: FieldConfidence = {
      product_name: parsed.confidence?.product_name ?? 0.8,
      price:        parsed.confidence?.price        ?? 0,
      weight:       parsed.confidence?.weight       ?? 0,
      moq:          parsed.confidence?.moq          ?? 0,
      overall:      parsed.confidence?.overall      ?? 'low',
    };
    return { ...parsed, confidence: conf } as ParsedProduct;
  } catch { return null; }
}

export function validateUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return ALLOWED.some(domain => u.hostname.endsWith(domain));
  } catch { return false; }
}

export async function parseProductUrl(url: string): Promise<ParseResult> {
  if (!validateUrl(url)) return { ok: false, reason: 'unsupported_domain' };
  if (!FIRECRAWL_KEY)    return { ok: false, reason: 'no_key', code: 'FIRECRAWL_NOT_CONFIGURED' };

  const markdown = await scrape(url);
  if (!markdown) return { ok: false, reason: 'scrape_failed' };

  const platform = detectPlatform(url);
  const parsed   = await parseWithAI(platform, markdown);
  if (!parsed || !parsed.product_name) return { ok: false, reason: 'parse_failed' };

  return {
    ok: true,
    data: {
      ...parsed,
      source_platform: platform,
      product_name:    parsed.product_name ?? '',
    },
  };
}
