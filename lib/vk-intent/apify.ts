import type { VkPost } from "./types";
import { getVkToken } from "./tokens";

const VK_BASE = "https://api.vk.com/method";
const VK_V    = "5.199";
const delay   = (ms: number) => new Promise(r => setTimeout(r, ms));

function resolveAuthor(
  ownerId: number,
  profiles: Record<string, unknown>[],
  groups: Record<string, unknown>[],
): string {
  if (ownerId < 0) {
    const g = groups.find(g => Number(g.id) === Math.abs(ownerId));
    return g ? String(g.name ?? "") : `club${Math.abs(ownerId)}`;
  }
  const p = profiles.find(p => Number(p.id) === ownerId);
  return p ? `${String(p.first_name ?? "")} ${String(p.last_name ?? "")}`.trim() : `id${ownerId}`;
}

async function searchPostsByQuery(query: string, count: number, token: string): Promise<VkPost[]> {
  const params = new URLSearchParams({
    q:            query,
    count:        String(Math.min(count, 200)),
    access_token: token,
    v:            VK_V,
    extended:     "1",
  });
  try {
    const res  = await fetch(`${VK_BASE}/newsfeed.search?${params}`, { signal: AbortSignal.timeout(12_000) });
    const data = await res.json() as { error?: unknown; response?: { items?: Record<string, unknown>[]; profiles?: Record<string, unknown>[]; groups?: Record<string, unknown>[] } };
    if (data.error) { console.error("VK API:", data.error); return []; }
    const items    = data.response?.items    ?? [];
    const profiles = data.response?.profiles ?? [];
    const groups   = data.response?.groups   ?? [];
    return items
      .filter(item => {
        if (!item.text || String(item.text).length < 20) return false;
        // Exclude company/group posts (negative from_id = group page)
        const fromId = Number(item.from_id ?? 0);
        if (fromId < 0) return false;
        // Exclude posts from known cargo/service providers (contain Chinese phone or promo signs)
        const txt = String(item.text).toLowerCase();
        if (txt.includes("+86 ") || txt.includes("whatsapp:") || txt.includes("наш надёжный партнёр")) return false;
        return true;
      })
      .map(item => {
        const ownerId = Number(item.owner_id ?? item.from_id ?? 0);
        const postId  = Number(item.id ?? 0);
        return {
          post_id:       `${ownerId}_${postId}`,
          text:          String(item.text ?? ""),
          author_name:   resolveAuthor(ownerId, profiles, groups),
          author_id:     String(ownerId),
          date:          Number(item.date ?? Math.floor(Date.now() / 1000)),
          link:          `https://vk.com/wall${ownerId}_${postId}`,
          likes_count:   Number((item.likes as Record<string, unknown>)?.count ?? 0),
          reposts_count: Number((item.reposts as Record<string, unknown>)?.count ?? 0),
          query,
        };
      });
  } catch { return []; }
}

export async function scrapeVkIntentPosts(queries: string[], maxItems = 20): Promise<VkPost[]> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return [];

  // Try user OAuth token first, fall back to service token
  const tokenData = await getVkToken(dbUrl);
  const token = tokenData?.access_token ?? process.env.VK_SERVICE_TOKEN ?? "";
  if (!token) return []; // no token at all — UI shows connect button

  const all:  VkPost[] = [];
  const seen = new Set<string>();

  for (const query of queries) {
    if (all.length > 0) await delay(400);
    const posts = await searchPostsByQuery(query, maxItems, token);
    for (const p of posts) {
      if (!seen.has(p.post_id)) { seen.add(p.post_id); all.push(p); }
    }
  }
  return all;
}
