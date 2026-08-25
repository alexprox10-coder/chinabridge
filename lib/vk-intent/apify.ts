import type { VkPost } from "./types";

const APIFY_TOKEN = process.env.APIFY_TOKEN ?? "";
const ACTOR_ID = "maximedupre~vk-posts-scraper";
const APIFY_BASE = "https://api.apify.com/v2";

async function getDatasetItems(datasetId: string, query: string): Promise<VkPost[]> {
  const res = await fetch(
    `${APIFY_BASE}/datasets/${datasetId}/items?token=${APIFY_TOKEN}&clean=true&limit=50`,
    { signal: AbortSignal.timeout(10_000) }
  );
  if (!res.ok) return [];
  const items = await res.json();
  if (!Array.isArray(items)) return [];
  return items.map((item: Record<string, unknown>) => ({
    post_id: String(item.id ?? item.post_id ?? `${query}_${Date.now()}_${Math.random()}`),
    text: String(item.text ?? item.content ?? ""),
    author_name: String(item.authorName ?? item.owner_name ?? item.author ?? ""),
    author_id: String(item.authorId ?? item.owner_id ?? ""),
    date: Number(item.date ?? item.timestamp ?? Math.floor(Date.now() / 1000)),
    link: String(item.url ?? item.link ?? ""),
    likes_count: Number(item.likesCount ?? item.likes ?? 0),
    reposts_count: Number(item.repostsCount ?? item.reposts ?? 0),
    query,
  }));
}

async function runActorForQuery(query: string, maxItems = 30): Promise<VkPost[]> {
  if (!APIFY_TOKEN) return [];

  // Start actor run
  let runId: string;
  try {
    const runRes = await fetch(
      `${APIFY_BASE}/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, maxItems }),
        signal: AbortSignal.timeout(15_000),
      }
    );
    if (!runRes.ok) return [];
    const runData = await runRes.json();
    runId = runData.data?.id;
    if (!runId) return [];
  } catch {
    return [];
  }

  // Poll until finished (max 90s)
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 6_000));
    try {
      const statusRes = await fetch(
        `${APIFY_BASE}/actor-runs/${runId}?token=${APIFY_TOKEN}`,
        { signal: AbortSignal.timeout(8_000) }
      );
      if (!statusRes.ok) continue;
      const statusData = await statusRes.json();
      const status = String(statusData.data?.status ?? "");
      if (status === "SUCCEEDED") {
        const datasetId = statusData.data?.defaultDatasetId as string | undefined;
        if (!datasetId) return [];
        return getDatasetItems(datasetId, query);
      }
      if (["FAILED", "ABORTED", "TIMED-OUT"].includes(status)) return [];
    } catch {
      // keep polling
    }
  }
  return [];
}

export async function scrapeVkIntentPosts(queries: string[], maxItems = 20): Promise<VkPost[]> {
  const allPosts: VkPost[] = [];
  const seenIds = new Set<string>();

  for (const query of queries) {
    const posts = await runActorForQuery(query, maxItems).catch(() => []);
    for (const p of posts) {
      if (p.text && !seenIds.has(p.post_id)) {
        seenIds.add(p.post_id);
        allPosts.push(p);
      }
    }
  }
  return allPosts;
}
