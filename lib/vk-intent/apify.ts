import type { VkPost } from "./types";

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

const FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
};

const AVITO_QUERIES = [
  "карго из китая",
  "доставка из китая грузы",
  "карго агент китай",
  "поставщик 1688",
  "оптом из китая доставка",
  "нужен карго китай",
  "привезти из китая",
];

interface AvitoItem {
  id: number;
  title: string;
  description?: string;
  url?: string;
  location?: { name?: string };
  contacts?: { phone?: string };
  addDate?: string;
}

function parseAvitoJson(html: string): AvitoItem[] {
  // Avito embeds data in <script> with JSON state
  const patterns = [
    /window\.__initialData__\s*=\s*"(.+?)";\s*<\/script>/,
    /"items"\s*:\s*(\[.+?\]),"totalCount"/s,
    /data-state="([^"]+)"/,
  ];

  for (const re of patterns) {
    const m = html.match(re);
    if (!m) continue;
    try {
      let raw = m[1];
      // sometimes it's URL-encoded
      if (raw.includes("%7B")) raw = decodeURIComponent(raw);
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as AvitoItem[];
      // dig into nested structure
      const items = parsed?.catalog?.items ?? parsed?.items ?? parsed?.data?.items;
      if (Array.isArray(items)) return items as AvitoItem[];
    } catch { /* try next */ }
  }
  return [];
}

function parseAvitoHtml(html: string, query: string): VkPost[] {
  const posts: VkPost[] = [];

  // Try structured JSON first
  const items = parseAvitoJson(html);
  if (items.length > 0) {
    for (const it of items) {
      const text = [it.title, it.description].filter(Boolean).join(" — ");
      if (!text || text.length < 10) continue;
      posts.push({
        post_id:       `avito_${it.id}`,
        text,
        author_name:   it.location?.name ?? "Avito",
        author_id:     String(it.id),
        date:          it.addDate ? Math.floor(new Date(it.addDate).getTime() / 1000) : Math.floor(Date.now() / 1000),
        link:          it.url ? `https://www.avito.ru${it.url}` : `https://www.avito.ru/rossiya?q=${encodeURIComponent(query)}`,
        likes_count:   0,
        reposts_count: 0,
        query,
      });
    }
    return posts;
  }

  // Fallback: regex parse raw HTML for item titles and descriptions
  const itemRe = /data-marker="item"[\s\S]*?data-marker="item-title"[^>]*>([^<]{5,200})<\/[^>]+>[\s\S]*?(?:class="[^"]*description[^"]*"[^>]*>([^<]{0,400}))?/g;
  const linkRe  = /href="(\/rossiya\/[^"]+\/\d+[^"]*?)"/g;
  const idRe    = /\/(\d{8,12})(?:\?|$)/;

  let m: RegExpExecArray | null;
  const links: string[] = [];
  while ((m = linkRe.exec(html)) !== null) links.push(m[1]);

  let idx = 0;
  const itemRe2 = /data-marker="item-title"[^>]*>([^<]{5,200})</g;
  while ((m = itemRe2.exec(html)) !== null) {
    const title = m[1].trim();
    const link  = links[idx] ?? "";
    const idMatch = link.match(idRe);
    const postId  = idMatch ? idMatch[1] : `avito_${idx}_${Date.now()}`;
    posts.push({
      post_id:       `avito_${postId}`,
      text:          title,
      author_name:   "Avito",
      author_id:     postId,
      date:          Math.floor(Date.now() / 1000),
      link:          link ? `https://www.avito.ru${link}` : `https://www.avito.ru/rossiya?q=${encodeURIComponent(query)}`,
      likes_count:   0,
      reposts_count: 0,
      query,
    });
    idx++;
  }
  // suppress unused warning
  void itemRe;

  return posts;
}

async function scrapeAvitoQuery(query: string, maxItems: number): Promise<VkPost[]> {
  const url = `https://www.avito.ru/rossiya?q=${encodeURIComponent(query)}&s=104&counterId=239`;
  try {
    const res = await fetch(url, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return [];
    const html = await res.text();
    const posts = parseAvitoHtml(html, query);
    return posts.slice(0, maxItems);
  } catch {
    return [];
  }
}

export async function scrapeVkIntentPosts(queries: string[], maxItems = 20): Promise<VkPost[]> {
  // Use Avito intent queries (ignore VK queries parameter, use our curated list)
  const intentQueries = AVITO_QUERIES.slice(0, queries.length);
  const all: VkPost[] = [];
  const seen = new Set<string>();

  for (const q of intentQueries) {
    await delay(1200);
    const posts = await scrapeAvitoQuery(q, maxItems);
    for (const p of posts) {
      if (!seen.has(p.post_id)) {
        seen.add(p.post_id);
        all.push(p);
      }
    }
    if (all.length >= maxItems * 3) break;
  }

  return all;
}
