import type { SearchResult } from "./types";

const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY ?? "";
const FIRECRAWL_BASE = "https://api.firecrawl.dev/v1";

async function firecrawlSearch(query: string, limit = 5): Promise<SearchResult[]> {
  if (!FIRECRAWL_KEY) return [];
  try {
    const res = await fetch(`${FIRECRAWL_BASE}/search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, limit, lang: "ru", country: "ru" }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const results: SearchResult[] = (data.data ?? data.results ?? [])
      .filter((r: { url?: string }) => r.url)
      .map((r: { url: string; title?: string; description?: string }) => ({
        url: r.url,
        title: r.title ?? "",
        description: r.description ?? "",
        source: "google",
      }));
    return results;
  } catch {
    return [];
  }
}

function deduplicateByDomain(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    try {
      const domain = new URL(r.url).hostname.replace(/^www\./, "");
      if (seen.has(domain)) return false;
      seen.add(domain);
      return true;
    } catch {
      return false;
    }
  });
}

function skipNonTargets(results: SearchResult[]): SearchResult[] {
  const BLOCKED = [
    "avito.ru", "hh.ru", "vk.com", "facebook.com", "instagram.com",
    "youtube.com", "yandex.ru", "google.com", "wikipedia.org",
    "wildberries.ru", "ozon.ru", "aliexpress.com", "alibaba.com",
    "1688.com", "ok.ru", "linkedin.com", "twitter.com", "tiktok.com",
    "gosuslugi.ru", "nalog.ru", "mos.ru",
  ];
  return results.filter((r) => {
    try {
      const host = new URL(r.url).hostname.replace(/^www\./, "");
      return !BLOCKED.some((b) => host === b || host.endsWith(`.${b}`));
    } catch {
      return false;
    }
  });
}

export async function searchCompanies(
  queries: string[],
  resultsPerQuery = 5
): Promise<SearchResult[]> {
  const batches = await Promise.allSettled(
    queries.map((q) => firecrawlSearch(q, resultsPerQuery))
  );

  const all: SearchResult[] = [];
  for (const b of batches) {
    if (b.status === "fulfilled") all.push(...b.value);
  }

  return deduplicateByDomain(skipNonTargets(all));
}
