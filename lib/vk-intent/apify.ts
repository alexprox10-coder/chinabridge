import type { VkPost } from "./types";

const VK_TOKEN = process.env.VK_ACCESS_TOKEN ?? "";
const VK_BASE  = "https://api.vk.com/method";
const VK_V     = "5.199";

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// Keywords to find groups where entrepreneurs discuss imports
const GROUP_SEARCH_TERMS = [
  "карго китай",
  "грузы из китая",
  "импорт китай",
  "оптовики китай",
  "предприниматели импорт",
];

// Intent keywords to search inside group walls
const INTENT_TERMS = [
  "ищу карго",
  "нужен карго",
  "карго из китая",
  "поставщик 1688",
  "доставка из китая",
  "кто возит из китая",
  "агент в китае",
];

interface VkGroup { id: number; name: string; is_closed: number }

async function findGroups(maxGroups: number): Promise<number[]> {
  if (!VK_TOKEN) return [];
  const seen = new Set<number>();

  for (const q of GROUP_SEARCH_TERMS) {
    if (seen.size >= maxGroups) break;
    const params = new URLSearchParams({
      q, count: "20", type: "group",
      access_token: VK_TOKEN, v: VK_V,
    });
    try {
      const res  = await fetch(`${VK_BASE}/groups.search?${params}`, { signal: AbortSignal.timeout(10_000) });
      const data = await res.json() as { error?: unknown; response?: { items?: VkGroup[] } };
      if (data.error) { console.error("VK groups.search error:", data.error); }
      for (const g of (data.response?.items ?? [])) {
        if (!g.is_closed) seen.add(g.id);
        if (seen.size >= maxGroups) break;
      }
    } catch { /* ignore */ }
    await delay(400);
  }
  return [...seen];
}

function mapItem(item: Record<string, unknown>, groupId: number, query: string): VkPost | null {
  const text = String(item.text ?? "");
  if (text.length < 10) return null;
  const ownerId = groupId > 0 ? -groupId : Number(item.owner_id ?? 0);
  const postId  = Number(item.id ?? 0);
  return {
    post_id:       `${ownerId}_${postId}`,
    text,
    author_name:   String(item.signer_id ? `id${item.signer_id}` : `club${groupId}`),
    author_id:     String(ownerId),
    date:          Number(item.date ?? Math.floor(Date.now() / 1000)),
    link:          `https://vk.com/wall${ownerId}_${postId}`,
    likes_count:   Number((item.likes as Record<string, unknown>)?.count ?? 0),
    reposts_count: Number((item.reposts as Record<string, unknown>)?.count ?? 0),
    query,
  };
}

async function searchGroupWall(groupId: number, query: string, count: number): Promise<VkPost[]> {
  const params = new URLSearchParams({
    owner_id: String(-groupId),
    query, count: String(Math.min(count, 100)),
    access_token: VK_TOKEN, v: VK_V,
  });
  try {
    const res  = await fetch(`${VK_BASE}/wall.search?${params}`, { signal: AbortSignal.timeout(10_000) });
    const data = await res.json() as { error?: unknown; response?: { items?: Record<string, unknown>[] } };
    if (data.error) return [];
    return (data.response?.items ?? [])
      .map(i => mapItem(i, groupId, query))
      .filter((p): p is VkPost => p !== null);
  } catch {
    return [];
  }
}

export async function scrapeVkIntentPosts(queries: string[], maxItems = 20): Promise<VkPost[]> {
  if (!VK_TOKEN) return [];

  // Step 1: find relevant groups
  const maxGroups = Math.min(Math.ceil(queries.length * 2), 12);
  const groupIds  = await findGroups(maxGroups);
  if (groupIds.length === 0) return [];

  // Step 2: search walls — use intent terms, not the classifier queries
  const intentTerms = INTENT_TERMS.slice(0, queries.length);
  const allPosts: VkPost[] = [];
  const seenIds  = new Set<string>();
  const perCall  = Math.max(5, Math.ceil(maxItems / intentTerms.length));

  for (const groupId of groupIds) {
    for (const term of intentTerms) {
      await delay(400);
      const posts = await searchGroupWall(groupId, term, perCall);
      for (const p of posts) {
        if (!seenIds.has(p.post_id)) {
          seenIds.add(p.post_id);
          allPosts.push(p);
        }
      }
      if (allPosts.length >= maxItems * 3) break; // enough material
    }
    if (allPosts.length >= maxItems * 3) break;
  }

  return allPosts;
}
