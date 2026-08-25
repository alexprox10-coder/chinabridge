import type { VkPost } from "./types";

const VK_TOKEN = process.env.VK_ACCESS_TOKEN ?? "";
const VK_BASE = "https://api.vk.com/method";
const VK_V = "5.199";

function buildLink(ownerId: number, postId: number): string {
  return `https://vk.com/wall${ownerId}_${postId}`;
}

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
  return p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() : `id${ownerId}`;
}

async function searchPostsByQuery(query: string, count: number): Promise<VkPost[]> {
  if (!VK_TOKEN) return [];

  const params = new URLSearchParams({
    q: query,
    count: String(Math.min(count, 200)),
    access_token: VK_TOKEN,
    v: VK_V,
    extended: "1",
  });

  try {
    const res = await fetch(`${VK_BASE}/newsfeed.search?${params}`, {
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.error) {
      console.error("VK API error:", data.error);
      return [];
    }

    const items: Record<string, unknown>[] = data.response?.items ?? [];
    const profiles: Record<string, unknown>[] = data.response?.profiles ?? [];
    const groups: Record<string, unknown>[] = data.response?.groups ?? [];

    return items
      .filter(item => item.text && String(item.text).length > 10)
      .map(item => {
        const ownerId = Number(item.owner_id ?? item.from_id ?? 0);
        const postId  = Number(item.id ?? 0);
        return {
          post_id:       `${ownerId}_${postId}`,
          text:          String(item.text ?? ""),
          author_name:   resolveAuthor(ownerId, profiles, groups),
          author_id:     String(ownerId),
          date:          Number(item.date ?? Math.floor(Date.now() / 1000)),
          link:          buildLink(ownerId, postId),
          likes_count:   Number((item.likes as Record<string, unknown>)?.count ?? 0),
          reposts_count: Number((item.reposts as Record<string, unknown>)?.count ?? 0),
          query,
        };
      });
  } catch {
    return [];
  }
}

export async function scrapeVkIntentPosts(queries: string[], maxItems = 20): Promise<VkPost[]> {
  const allPosts: VkPost[] = [];
  const seenIds = new Set<string>();

  for (const query of queries) {
    // VK rate limit ~3 req/sec — выдерживаем паузу
    if (allPosts.length > 0) await new Promise(r => setTimeout(r, 400));

    const posts = await searchPostsByQuery(query, maxItems);
    for (const p of posts) {
      if (!seenIds.has(p.post_id)) {
        seenIds.add(p.post_id);
        allPosts.push(p);
      }
    }
  }
  return allPosts;
}
