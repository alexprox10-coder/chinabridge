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

const ALLOWED = ['1688.com', 'alibaba.com', 'taobao.com', 'detail.tmall.com', 'kaspi.kz'];

function detectPlatform(url: string): ParsedProduct['source_platform'] {
  if (url.includes('1688.com'))    return '1688';
  if (url.includes('alibaba.com')) return 'alibaba';
  if (url.includes('taobao.com') || url.includes('tmall.com')) return 'taobao';
  if (url.includes('kaspi.kz'))    return 'unknown'; // treated as sale-side
  return 'unknown';
}

async function scrapeKaspi(url: string): Promise<string | null> {
  try {
    // Extract product slug from kaspi URL: /shop/p/SLUG-ID/
    const match = url.match(/\/shop\/p\/([^/?#]+)/);
    if (!match) return null;
    const slug = match[1];
    // Extract numeric ID from the end of slug
    const idMatch = slug.match(/(\d{6,})$/);
    if (!idMatch) return null;
    const productId = idMatch[1];
    const q = slug.replace(/-\d+$/, '').replace(/-/g, ' ');

    const apiUrl = `https://kaspi.kz/yml/product-view/pl/filters?q=${encodeURIComponent(q)}&sort=1&cityId=750000000&lang=ru&currency=KZT&ui=d&limit=5`;
    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://kaspi.kz/',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const items: Array<{ id?: string; title?: string; unitPrice?: number; masterCategoryTitle?: string }> =
      data?.data?.cards ?? data?.data?.items ?? [];
    // Find matching product by ID
    const product = items.find((p) => String(p.id) === productId) ?? items[0];
    if (!product) return null;
    const priceKzt = product.unitPrice ?? 0;
    return `Kaspi product: ${product.title ?? q}\nPrice KZT: ${priceKzt}\nCategory: ${product.masterCategoryTitle ?? ''}\nID: ${product.id}`;
  } catch { return null; }
}

async function scrape1688Direct(offerId: string): Promise<string | null> {
  const urls = [
    `https://m.1688.com/offer/${offerId}.html`,
    `https://detail.1688.com/offer/${offerId}.html`,
  ];
  for (const u of urls) {
    try {
      const res = await fetch(u, {
        headers: {
          'User-Agent':      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9',
          'Referer':         'https://m.1688.com/',
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      const html = await res.text();
      // Extract useful parts
      const titleM  = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const descM   = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i);
      const ldJson  = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
      const priceM  = html.match(/["']price["']\s*:\s*["']?([\d.]+)/i);
      const parts: string[] = [];
      if (titleM?.[1])  parts.push(`Title: ${titleM[1].trim()}`);
      if (descM?.[1])   parts.push(`Description: ${descM[1].trim()}`);
      if (ldJson?.[1])  parts.push(`Structured data: ${ldJson[1].slice(0, 1000)}`);
      if (priceM?.[1])  parts.push(`Price found: ${priceM[1]}`);
      if (parts.length > 0) return parts.join('\n');
    } catch { continue; }
  }
  return null;
}

async function scrape(url: string): Promise<string | null> {
  if (!FIRECRAWL_KEY) return null;
  const is1688    = url.includes('1688.com');
  const isAlibaba = url.includes('alibaba.com');
  const needsJs   = is1688 || isAlibaba;
  try {
    const body: Record<string, unknown> = {
      url,
      formats:         ['markdown'],
      onlyMainContent: !needsJs,
      timeout:         needsJs ? 25000 : 12000,
    };
    if (is1688) {
      body.mobile  = true;
      body.waitFor = 3000;
      body.headers = {
        'User-Agent':      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Referer':         'https://www.1688.com/',
      };
    }
    if (isAlibaba) {
      body.mobile  = true;
      body.waitFor = 4000;
      body.headers = {
        'User-Agent':      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer':         'https://www.alibaba.com/',
      };
    }
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method:  'POST',
      headers: { Authorization: `Bearer ${FIRECRAWL_KEY}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      signal:  AbortSignal.timeout(needsJs ? 32000 : 16000),
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

  const isKaspi = url.includes('kaspi.kz');

  // Kaspi: use native API, no Firecrawl needed
  if (isKaspi) {
    const markdown = await scrapeKaspi(url);
    if (!markdown) return { ok: false, reason: 'scrape_failed' };
    const parsed = await parseWithAI('kaspi', markdown);
    if (!parsed || !parsed.product_name) return { ok: false, reason: 'parse_failed' };
    return { ok: true, data: { ...parsed, source_platform: 'unknown', product_name: parsed.product_name ?? '' } };
  }

  const platform = detectPlatform(url);

  // 1688: try direct fetch first (no Firecrawl needed), fall back to Firecrawl
  if (url.includes('1688.com')) {
    const offerIdM = url.match(/\/offer\/(\d+)/);
    if (offerIdM) {
      const directMd = await scrape1688Direct(offerIdM[1]);
      if (directMd) {
        const parsed = await parseWithAI('1688', directMd);
        if (parsed?.product_name) {
          return { ok: true, data: { ...parsed, source_platform: '1688', product_name: parsed.product_name } };
        }
      }
    }
  }

  if (!FIRECRAWL_KEY) return { ok: false, reason: 'no_key', code: 'FIRECRAWL_NOT_CONFIGURED' };

  const markdown = await scrape(url);
  if (!markdown) return { ok: false, reason: 'scrape_failed' };

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
