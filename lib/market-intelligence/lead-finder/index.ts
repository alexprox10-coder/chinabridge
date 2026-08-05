import type { MILead, MILeadSource, MILeadType, MILeadTemp } from "../types";
import { saveMILead } from "../db";

const FIRECRAWL_KEY  = process.env.FIRECRAWL_API_KEY ?? "";
const OR_KEY         = process.env.OPENROUTER_API_KEY ?? "";
const OR_MODEL       = "anthropic/claude-haiku-4.5";

// ─── Keyword configs ──────────────────────────────────────────────────────────

const TELEGRAM_KW = [
  "Wildberries импорт", "Ozon Китай", "маркетплейсы Китай",
  "1688 Россия", "Taobao заказ", "импорт из Китая",
  "ВЭД Китай", "оптовые закупки Китай", "белый импорт",
  "логистика Китай", "карго Китай", "сертификация Китай",
];

const VK_KW = [
  "импорт из Китая", "товары из Китая", "WB Китай",
  "Ozon поставщик", "поиск поставщика Китай", "ВЭД",
  "карго Китай", "оптом Китай",
];

const GOOGLE_QUERIES = [
  "ищу поставщика Китай оптом",
  "нужна доставка из Китая",
  "карго Китай Россия оптовые",
  "импорт из Китая под ключ купить",
  "таможня Китай ВЭД услуги",
  "1688 агент посредник Россия",
  "Taobao доставка оптом",
  "сертификация товаров из Китая",
  "маркетплейс поставщик Китай Wildberries",
  "Ozon поставщик из Китая",
];

// ─── Firecrawl search ─────────────────────────────────────────────────────────

async function firecrawlSearch(query: string, limit = 5): Promise<Array<{url: string; title: string; description: string}>> {
  if (!FIRECRAWL_KEY) return [];
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${FIRECRAWL_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit, lang: "ru", country: "ru" }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data ?? data.results ?? []).filter((r: {url?: string}) => r.url).map((r: {url: string; title?: string; description?: string}) => ({
      url: r.url, title: r.title ?? "", description: r.description ?? "",
    }));
  } catch { return []; }
}

// ─── AI scoring ───────────────────────────────────────────────────────────────

interface RawScore {
  type: MILeadType;
  temperature: MILeadTemp;
  score: number;
  scoreReason: string;
  company: string;
  description: string;
  city: string;
  website: string;
  nextAction: string;
}

async function aiScore(url: string, title: string, description: string, source: MILeadSource): Promise<RawScore> {
  const heuristic = (): RawScore => {
    const text = (title + " " + description).toLowerCase();
    const hotWords = ["1688", "taobao", "китай", "импорт", "wildberries", "ozon", "маркетплейс", "wed", "вэд"];
    const hotCount = hotWords.filter(w => text.includes(w)).length;
    const score = Math.min(85, 20 + hotCount * 12);
    const temperature: MILeadTemp = score >= 60 ? "HOT" : score >= 35 ? "WARM" : "COLD";
    let type: MILeadType = "unknown";
    if (text.includes("wildberries") || text.includes("wb")) type = "wb_seller";
    else if (text.includes("ozon")) type = "ozon_seller";
    else if (text.includes("импорт") || text.includes("ввоз")) type = "importer";
    else if (text.includes("логистик") || text.includes("карго")) type = "logistics";
    else if (text.includes("вэд") || text.includes("таможн")) type = "ved";
    else if (text.includes("произв")) type = "manufacturer";
    else if (text.includes("оптов")) type = "wholesaler";
    const company = title.replace(/[|–—].*/, "").trim().slice(0, 60) || "Без названия";
    const nextAction = temperature === "HOT"
      ? "Связаться в течение 24ч — горячий лид"
      : temperature === "WARM"
      ? "Квалифицировать и отправить предложение"
      : "Добавить в базу для прогрева";
    return { type, temperature, score, scoreReason: `Ключевых сигналов: ${hotCount}. Источник: ${source}`, company, description: description.slice(0, 200), city: "", website: url, nextAction };
  };

  if (!OR_KEY) return heuristic();

  try {
    const prompt = `Проанализируй лид для B2B-компании по импорту из Китая.

URL: ${url}
Заголовок: ${title}
Описание: ${description}
Источник: ${source}

Верни ТОЛЬКО валидный JSON без markdown:
{
  "type": "importer|wb_seller|ozon_seller|manufacturer|wholesaler|logistics|ved|unknown",
  "temperature": "HOT|WARM|COLD",
  "score": число 0-100,
  "scoreReason": "Причина оценки (2 предложения)",
  "company": "Название компании",
  "description": "Что делает компания (1-2 предложения)",
  "city": "Город или пусто",
  "website": "${url}",
  "nextAction": "Следующее действие для менеджера"
}

HOT (70+) = явный импортёр из Китая или активный WB/Ozon продавец
WARM (40-69) = вероятно ищет поставщиков
COLD (<40) = слабый сигнал`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OR_KEY}`, "Content-Type": "application/json", "HTTP-Referer": "https://chinabridge.pro" },
      body: JSON.stringify({ model: OR_MODEL, max_tokens: 512, messages: [{ role: "user", content: prompt }] }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return heuristic();
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return heuristic();
    return JSON.parse(match[0]) as RawScore;
  } catch { return heuristic(); }
}

// ─── Source-specific search ───────────────────────────────────────────────────

async function searchGoogle(tenantId: string, limit = 30): Promise<MILead[]> {
  const results: Array<{url: string; title: string; description: string}> = [];
  const queries = GOOGLE_QUERIES.slice(0, Math.ceil(limit / 5));
  for (const q of queries) {
    const r = await firecrawlSearch(q, 5);
    results.push(...r);
  }

  const seen = new Set<string>();
  const unique = results.filter(r => {
    try {
      const d = new URL(r.url).hostname.replace(/^www\./, "");
      if (seen.has(d)) return false;
      seen.add(d); return true;
    } catch { return false; }
  });

  const leads: MILead[] = [];
  for (const r of unique.slice(0, limit)) {
    const scored = await aiScore(r.url, r.title, r.description, "google");
    const lead: MILead = {
      leadId:    `mi-google-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      tenantId, source: "google", sourceUrl: r.url,
      company: scored.company, website: scored.website, city: scored.city, country: "RU",
      type: scored.type, temperature: scored.temperature, score: scored.score,
      scoreReason: scored.scoreReason, description: scored.description, nextAction: scored.nextAction,
      pipeline: "NEW", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    leads.push(lead);
    await saveMILead(lead);
  }
  return leads;
}

async function searchTelegram(tenantId: string, limit = 30): Promise<MILead[]> {
  const results: Array<{url: string; title: string; description: string}> = [];
  for (const kw of TELEGRAM_KW.slice(0, Math.ceil(limit / 3))) {
    const r = await firecrawlSearch(`site:t.me ${kw}`, 3);
    results.push(...r.filter(x => x.url.includes("t.me")));
  }

  const seen = new Set<string>();
  const unique = results.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url); return true;
  });

  const leads: MILead[] = [];
  for (const r of unique.slice(0, limit)) {
    const channelName = r.url.replace(/https?:\/\/t\.me\//, "").split("/")[0];
    const scored = await aiScore(r.url, r.title, r.description, "telegram");
    const lead: MILead = {
      leadId:    `mi-tg-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      tenantId, source: "telegram", sourceUrl: r.url, sourceChannel: `@${channelName}`,
      telegram: `@${channelName}`,
      company: scored.company || r.title.slice(0, 60), website: "", city: scored.city, country: "RU",
      type: scored.type, temperature: scored.temperature, score: scored.score,
      scoreReason: scored.scoreReason, description: scored.description, nextAction: scored.nextAction,
      pipeline: "NEW", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    leads.push(lead);
    await saveMILead(lead);
  }
  return leads;
}

async function searchVK(tenantId: string, limit = 30): Promise<MILead[]> {
  const results: Array<{url: string; title: string; description: string}> = [];
  for (const kw of VK_KW.slice(0, Math.ceil(limit / 4))) {
    const r = await firecrawlSearch(`site:vk.com ${kw} сообщество`, 4);
    results.push(...r.filter(x => x.url.includes("vk.com")));
  }

  const seen = new Set<string>();
  const unique = results.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url); return true;
  });

  const leads: MILead[] = [];
  for (const r of unique.slice(0, limit)) {
    const scored = await aiScore(r.url, r.title, r.description, "vk");
    const lead: MILead = {
      leadId:    `mi-vk-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      tenantId, source: "vk", sourceUrl: r.url,
      company: scored.company || r.title.slice(0, 60), website: r.url, city: scored.city, country: "RU",
      type: scored.type, temperature: scored.temperature, score: scored.score,
      scoreReason: scored.scoreReason, description: scored.description, nextAction: scored.nextAction,
      pipeline: "NEW", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    leads.push(lead);
    await saveMILead(lead);
  }
  return leads;
}

// ─── Main entry ───────────────────────────────────────────────────────────────

export async function runLeadFinder(tenantId: string, sources: MILeadSource[] = ["google", "telegram", "vk"], limitPerSource = 20): Promise<{
  google: number; telegram: number; vk: number; hot: number; total: number;
}> {
  let google = 0, telegram = 0, vk = 0;
  if (sources.includes("google"))   { const r = await searchGoogle(tenantId, limitPerSource);   google   = r.filter(l => l.temperature === "HOT").length; }
  if (sources.includes("telegram")) { const r = await searchTelegram(tenantId, limitPerSource); telegram = r.filter(l => l.temperature === "HOT").length; }
  if (sources.includes("vk"))       { const r = await searchVK(tenantId, limitPerSource);       vk       = r.filter(l => l.temperature === "HOT").length; }
  const hot = google + telegram + vk;
  return { google: limitPerSource, telegram: limitPerSource, vk: limitPerSource, hot, total: google + telegram + vk };
}
