import type { VkPost } from "./types";
import { getVkToken } from "./tokens";

const VK_BASE = "https://api.vk.com/method";
const VK_V    = "5.199";
const delay   = (ms: number) => new Promise(r => setTimeout(r, ms));

// Тематические VK-группы где бизнесмены задают вопросы о Китае
// Формат: числовой group_id (отрицательный owner_id) или домен группы
export const TARGET_GROUPS = [
  // Wildberries продавцы
  { id: "wildberries_sellers",     label: "WB продавцы" },
  { id: "wb.sellers",              label: "WB Sellers" },
  { id: "ozon_sellers",            label: "Ozon продавцы" },
  { id: "biznes_s_kitaem",         label: "Бизнес с Китаем" },
  { id: "postavki_iz_kitaya",      label: "Поставки из Китая" },
  { id: "china_opt",               label: "China Opt" },
  { id: "import_kitay",            label: "Импорт из Китая" },
  { id: "marketplace_sellers",     label: "Маркетплейс продавцы" },
  { id: "wb_ozon_community",       label: "WB/Ozon сообщество" },
  { id: "kitay_optom",             label: "Китай Оптом" },
];

// Ключевые слова в комментариях — сигнал что человек ИЩЕТ, а не предлагает
const BUYER_INTENT_WORDS = [
  "ищу карго", "ищу посредника", "нужна доставка", "нужен посредник",
  "как заказать", "где заказывают", "кто возит", "кто помогает",
  "рекомендуйте карго", "посоветуйте карго", "как везти",
  "как привезти", "помогите найти", "найти поставщика",
  "1688 как", "alibaba как", "taobao как", "как с китая",
  "подскажите карго", "порекомендуйте поставщика",
];

const SELLER_MARKERS = [
  "я предлагаю", "открываю набор", "помогу найти", "сам найду",
  "живу в китае", "нахожусь в", "пишите мне", "в личку",
  "наши услуги", "+86", "мы доставляем", "наша компания",
];

interface VkComment {
  id:      number;
  from_id: number;
  date:    number;
  text:    string;
  post_id: number;
  owner_id: number;
}

async function resolveGroupId(domain: string, token: string): Promise<number | null> {
  try {
    const params = new URLSearchParams({ group_id: domain, access_token: token, v: VK_V });
    const res  = await fetch(`${VK_BASE}/groups.getById?${params}`, { signal: AbortSignal.timeout(8_000) });
    const data = await res.json() as { response?: Array<{ id?: number }> };
    return data.response?.[0]?.id ?? null;
  } catch { return null; }
}

async function getGroupPosts(groupId: number, token: string, count = 30): Promise<number[]> {
  try {
    const params = new URLSearchParams({
      owner_id:     String(-Math.abs(groupId)),
      count:        String(count),
      filter:       "all",
      access_token: token,
      v:            VK_V,
    });
    const res  = await fetch(`${VK_BASE}/wall.get?${params}`, { signal: AbortSignal.timeout(10_000) });
    const data = await res.json() as { response?: { items?: Array<{ id?: number }> } };
    return (data.response?.items ?? []).map(p => Number(p.id)).filter(Boolean);
  } catch { return []; }
}

async function getPostComments(groupId: number, postId: number, token: string): Promise<VkComment[]> {
  try {
    const params = new URLSearchParams({
      owner_id:     String(-Math.abs(groupId)),
      post_id:      String(postId),
      count:        "100",
      sort:         "asc",
      access_token: token,
      v:            VK_V,
    });
    const res  = await fetch(`${VK_BASE}/wall.getComments?${params}`, { signal: AbortSignal.timeout(10_000) });
    const data = await res.json() as { response?: { items?: Array<{ id?: number; from_id?: number; date?: number; text?: string }> } };
    return (data.response?.items ?? [])
      .filter(c => c.text && String(c.text).length > 20 && Number(c.from_id) > 0)
      .map(c => ({
        id:       Number(c.id),
        from_id:  Number(c.from_id),
        date:     Number(c.date),
        text:     String(c.text),
        post_id:  postId,
        owner_id: groupId,
      }));
  } catch { return []; }
}

function isBuyerComment(text: string): boolean {
  const lower = text.toLowerCase();
  if (SELLER_MARKERS.some(m => lower.includes(m))) return false;
  return BUYER_INTENT_WORDS.some(w => lower.includes(w));
}

export async function scrapeGroupComments(maxGroups = 5): Promise<VkPost[]> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return [];

  const tokenData = await getVkToken(dbUrl);
  const token = tokenData?.access_token ?? process.env.VK_SERVICE_TOKEN ?? "";
  if (!token) return [];

  const results: VkPost[] = [];
  const seenIds = new Set<string>();
  const now = Math.floor(Date.now() / 1000);
  const maxAge = 7 * 24 * 3600; // 7 days

  const groups = TARGET_GROUPS.slice(0, maxGroups);

  for (const group of groups) {
    await delay(400);
    const gid = await resolveGroupId(group.id, token);
    if (!gid) continue;

    const postIds = await getGroupPosts(gid, token, 20);
    await delay(300);

    for (const postId of postIds.slice(0, 10)) {
      await delay(250);
      const comments = await getPostComments(gid, postId, token);

      for (const c of comments) {
        if (now - c.date > maxAge) continue;
        if (!isBuyerComment(c.text)) continue;

        const uid = `comment_${gid}_${postId}_${c.id}`;
        if (seenIds.has(uid)) continue;
        seenIds.add(uid);

        results.push({
          post_id:       uid,
          text:          c.text.slice(0, 800),
          author_name:   `id${c.from_id}`,
          author_id:     String(c.from_id),
          date:          c.date,
          link:          `https://vk.com/wall-${gid}_${postId}?reply=${c.id}`,
          likes_count:   0,
          reposts_count: 0,
          query:         `${group.label} (комментарии)`,
        });
      }
    }
  }

  return results;
}
