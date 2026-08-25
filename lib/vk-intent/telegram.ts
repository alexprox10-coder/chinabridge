import type { VkPost } from "./types";

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; TelegramBot/1.0)",
  "Accept":     "text/html,application/xhtml+xml",
  "Accept-Language": "ru-RU,ru;q=0.9",
};

function parseTelegramHtml(html: string, channel: string): VkPost[] {
  const posts: VkPost[] = [];

  // Extract post IDs: data-post="channel/123"
  const postIdRe = /data-post="([^"]+)"/g;
  // Extract message text: class="tgme_widget_message_text..."
  const textRe   = /class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
  // Extract dates: datetime="..."
  const dateRe   = /datetime="([^"]+)"/g;

  const ids: string[] = [];
  const dates: number[] = [];

  let m: RegExpExecArray | null;
  while ((m = postIdRe.exec(html)) !== null) ids.push(m[1]);
  while ((m = dateRe.exec(html)) !== null) {
    try { dates.push(Math.floor(new Date(m[1]).getTime() / 1000)); } catch { dates.push(Math.floor(Date.now() / 1000)); }
  }

  let idx = 0;
  while ((m = textRe.exec(html)) !== null) {
    // Strip HTML tags
    const text = m[1].replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    if (text.length < 10) { idx++; continue; }

    const postId = ids[idx] ?? `${channel}/${idx}`;
    const date   = dates[idx] ?? Math.floor(Date.now() / 1000);

    posts.push({
      post_id:       `tg_${postId.replace("/", "_")}`,
      text,
      author_name:   `@${channel}`,
      author_id:     channel,
      date,
      link:          `https://t.me/${postId}`,
      likes_count:   0,
      reposts_count: 0,
      query:         channel,
    });
    idx++;
  }
  return posts;
}

export async function scrapeTelegramChannel(username: string): Promise<VkPost[]> {
  const clean = username.replace(/^@/, "");
  const url   = `https://t.me/s/${clean}`;
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(12_000) });
    if (!res.ok) return [];
    const html = await res.text();
    // t.me/s/ returns 200 with login page if channel is private
    if (!html.includes("tgme_widget_message")) return [];
    return parseTelegramHtml(html, clean);
  } catch { return []; }
}

export async function scrapeAllTgChannels(channels: string[]): Promise<VkPost[]> {
  const all  = new Map<string, VkPost>();
  for (const ch of channels) {
    await delay(800);
    const posts = await scrapeTelegramChannel(ch);
    for (const p of posts) { if (!all.has(p.post_id)) all.set(p.post_id, p); }
  }
  return [...all.values()];
}
