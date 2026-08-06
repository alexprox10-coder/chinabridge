import type { MILead, MILeadSource, MILeadType, MILeadTemp } from "../types";
import { saveMILead } from "../db";

const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY ?? "";
const OR_KEY        = process.env.OPENROUTER_API_KEY ?? "";
const OR_MODEL      = "anthropic/claude-haiku-4.5";

// ─── Keyword configs ──────────────────────────────────────────────────────────

const TELEGRAM_KW = [
  "импорт из Китая", "Wildberries Китай", "1688 Россия",
  "карго Китай", "ВЭД Китай", "Ozon поставщик Китай",
];

const VK_KW = [
  "импорт из Китая", "товары из Китая оптом",
  "WB Китай поставщик", "карго Китай",
];

const GOOGLE_QUERIES = [
  "компания импорт из Китая оптом сайт",
  "карго доставка из Китая Россия",
  "ВЭД таможня Китай услуги",
  "поставщик Wildberries Ozon Китай",
  "1688 агент посредник Россия",
];

// ─── Firecrawl ────────────────────────────────────────────────────────────────

async function firecrawlSearch(query: string, limit = 5): Promise<Array<{url: string; title: string; description: string}>> {
  if (!FIRECRAWL_KEY) return [];
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${FIRECRAWL_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit, lang: "ru", country: "ru" }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data ?? data.results ?? [])
      .filter((r: {url?: string}) => r.url)
      .map((r: {url: string; title?: string; description?: string}) => ({
        url: r.url, title: r.title ?? "", description: r.description ?? "",
      }));
  } catch { return []; }
}

// ─── AI scoring ───────────────────────────────────────────────────────────────

interface RawScore {
  type: MILeadType; temperature: MILeadTemp; score: number;
  scoreReason: string; company: string; description: string;
  city: string; website: string; nextAction: string;
}

function heuristic(url: string, title: string, description: string, source: MILeadSource): RawScore {
  const text = (title + " " + description).toLowerCase();
  const hotWords = ["1688", "taobao", "китай", "импорт", "wildberries", "ozon", "вэд", "карго", "поставщик"];
  const hotCount = hotWords.filter(w => text.includes(w)).length;
  const score = Math.min(85, 20 + hotCount * 10);
  const temperature: MILeadTemp = score >= 60 ? "HOT" : score >= 35 ? "WARM" : "COLD";
  let type: MILeadType = "unknown";
  if (text.includes("wildberries") || text.includes("wb"))     type = "wb_seller";
  else if (text.includes("ozon"))                              type = "ozon_seller";
  else if (text.includes("импорт") || text.includes("ввоз"))  type = "importer";
  else if (text.includes("логистик") || text.includes("карго")) type = "logistics";
  else if (text.includes("вэд") || text.includes("таможн"))   type = "ved";
  else if (text.includes("произв"))                            type = "manufacturer";
  else if (text.includes("оптов"))                             type = "wholesaler";
  const company = title.replace(/[|–—].*/, "").trim().slice(0, 60) || "Без названия";
  const nextAction = temperature === "HOT" ? "Связаться в течение 24ч" : temperature === "WARM" ? "Квалифицировать и отправить КП" : "Добавить в базу для прогрева";
  return { type, temperature, score, scoreReason: `Сигналов: ${hotCount}. Источник: ${source}`, company, description: description.slice(0, 200), city: "", website: url, nextAction };
}

async function aiScore(url: string, title: string, description: string, source: MILeadSource): Promise<RawScore> {
  if (!OR_KEY) return heuristic(url, title, description, source);
  try {
    const prompt = `Проанализируй лид для B2B-компании по импорту из Китая. URL: ${url} Заголовок: ${title} Описание: ${description.slice(0, 300)} Источник: ${source}. Верни ТОЛЬКО JSON без markdown: {"type":"importer|wb_seller|ozon_seller|manufacturer|wholesaler|logistics|ved|unknown","temperature":"HOT|WARM|COLD","score":0-100,"scoreReason":"2 предложения","company":"Название","description":"Что делает","city":"Город","website":"${url}","nextAction":"Следующий шаг"}`;
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OR_KEY}`, "Content-Type": "application/json", "HTTP-Referer": "https://chinabridge.pro" },
      body: JSON.stringify({ model: OR_MODEL, max_tokens: 400, messages: [{ role: "user", content: prompt }] }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return heuristic(url, title, description, source);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return heuristic(url, title, description, source);
    return JSON.parse(match[0]) as RawScore;
  } catch { return heuristic(url, title, description, source); }
}

// ─── Dedup helper ─────────────────────────────────────────────────────────────

function dedup(items: Array<{url: string; title: string; description: string}>) {
  const seen = new Set<string>();
  return items.filter(r => {
    try {
      const key = new URL(r.url).hostname.replace(/^www\./, "");
      if (seen.has(key)) return false;
      seen.add(key); return true;
    } catch { return false; }
  });
}

// ─── Source runners (all queries in parallel) ─────────────────────────────────

async function searchGoogle(tenantId: string, limit: number): Promise<MILead[]> {
  const queries = GOOGLE_QUERIES.slice(0, Math.min(limit, GOOGLE_QUERIES.length));
  // All Firecrawl queries in parallel
  const batches = await Promise.all(queries.map(q => firecrawlSearch(q, 3)));
  const raw = dedup(batches.flat()).slice(0, limit);
  // All AI scoring in parallel
  const scored = await Promise.all(raw.map(r => aiScore(r.url, r.title, r.description, "google")));
  const leads: MILead[] = scored.map((s, i) => ({
    leadId: `mi-google-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    tenantId, source: "google" as MILeadSource, sourceUrl: raw[i].url,
    company: s.company, website: s.website, city: s.city, country: "RU",
    type: s.type, temperature: s.temperature, score: s.score,
    scoreReason: s.scoreReason, description: s.description, nextAction: s.nextAction,
    pipeline: "NEW", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }));
  // Save in parallel
  await Promise.allSettled(leads.map(l => saveMILead(l)));
  return leads;
}

async function searchTelegram(tenantId: string, limit: number): Promise<MILead[]> {
  const keywords = TELEGRAM_KW.slice(0, Math.min(limit, TELEGRAM_KW.length));
  const batches = await Promise.all(keywords.map(kw => firecrawlSearch(`site:t.me ${kw}`, 3)));
  const raw = batches.flat().filter(r => r.url.includes("t.me"));
  const uniq = dedup(raw).slice(0, limit);
  const scored = await Promise.all(uniq.map(r => aiScore(r.url, r.title, r.description, "telegram")));
  const leads: MILead[] = scored.map((s, i) => {
    const channelName = uniq[i].url.replace(/https?:\/\/t\.me\//, "").split("/")[0];
    return {
      leadId: `mi-tg-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      tenantId, source: "telegram" as MILeadSource, sourceUrl: uniq[i].url, sourceChannel: `@${channelName}`,
      telegram: `@${channelName}`,
      company: s.company || uniq[i].title.slice(0, 60), website: "", city: s.city, country: "RU",
      type: s.type, temperature: s.temperature, score: s.score,
      scoreReason: s.scoreReason, description: s.description, nextAction: s.nextAction,
      pipeline: "NEW", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
  });
  await Promise.allSettled(leads.map(l => saveMILead(l)));
  return leads;
}

async function searchVK(tenantId: string, limit: number): Promise<MILead[]> {
  const keywords = VK_KW.slice(0, Math.min(limit, VK_KW.length));
  const batches = await Promise.all(keywords.map(kw => firecrawlSearch(`site:vk.com ${kw}`, 3)));
  const raw = batches.flat().filter(r => r.url.includes("vk.com"));
  const uniq = dedup(raw).slice(0, limit);
  const scored = await Promise.all(uniq.map(r => aiScore(r.url, r.title, r.description, "vk")));
  const leads: MILead[] = scored.map((s, i) => ({
    leadId: `mi-vk-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    tenantId, source: "vk" as MILeadSource, sourceUrl: uniq[i].url,
    company: s.company || uniq[i].title.slice(0, 60), website: uniq[i].url, city: s.city, country: "RU",
    type: s.type, temperature: s.temperature, score: s.score,
    scoreReason: s.scoreReason, description: s.description, nextAction: s.nextAction,
    pipeline: "NEW", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }));
  await Promise.allSettled(leads.map(l => saveMILead(l)));
  return leads;
}

// ─── Main entry ───────────────────────────────────────────────────────────────

export async function runLeadFinder(
  tenantId: string,
  sources: MILeadSource[] = ["google", "telegram", "vk"],
  limitPerSource = 5,
): Promise<{ google: number; telegram: number; vk: number; hot: number; total: number }> {
  // All three sources in parallel
  const [gRes, tRes, vRes] = await Promise.allSettled([
    sources.includes("google")   ? searchGoogle(tenantId, limitPerSource)   : Promise.resolve([]),
    sources.includes("telegram") ? searchTelegram(tenantId, limitPerSource) : Promise.resolve([]),
    sources.includes("vk")       ? searchVK(tenantId, limitPerSource)       : Promise.resolve([]),
  ]);

  const g = gRes.status === "fulfilled" ? gRes.value : [];
  const t = tRes.status === "fulfilled" ? tRes.value : [];
  const v = vRes.status === "fulfilled" ? vRes.value : [];

  const all = [...g, ...t, ...v];
  return {
    google:   g.length,
    telegram: t.length,
    vk:       v.length,
    hot:      all.filter(l => l.temperature === "HOT").length,
    total:    all.length,
  };
}
