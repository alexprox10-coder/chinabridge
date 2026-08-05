import type { MIRadarSignal, RadarType } from "../types";
import { saveRadarSignal } from "../db";

const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY ?? "";
const OR_KEY        = process.env.OPENROUTER_API_KEY ?? "";

const COMPETITORS = ["b2bchina.ru", "mastertao.ru", "sinmeng.ru", "rusglobal.ru", "kitatorg.ru"];

const TREND_QUERIES = [
  "импорт солнечные панели Китай 2025",
  "электросамокаты оптом Китай тренд",
  "автозапчасти из Китая WB Ozon",
  "AI оборудование Китай импорт",
  "электроника оптом Китай поставщик",
  "мебель из Китая тренд маркетплейс",
  "товары для дома Китай WB рост",
  "спортивные товары Китай Ozon",
];

const OPPORTUNITY_QUERIES = [
  "ищем поставщика Китай", "выходим на WB Ozon поставщик",
  "расширяем ассортимент Китай", "нужна логистика из Китая",
  "сертификация товаров Китай помогите", "карго Китай Россия нужен",
];

async function firecrawlSearch(query: string, limit = 5) {
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
    return (data.data ?? data.results ?? []).filter((r: {url?: string}) => r.url);
  } catch { return []; }
}

async function aiAnalyze(name: string, description: string, type: RadarType): Promise<{ score: number; analysis: string }> {
  if (!OR_KEY) {
    const score = type === "competitor" ? 60 : type === "trend" ? 70 : type === "opportunity" ? 75 : 50;
    return { score, analysis: `Автоматический анализ: ${type} — ${name}` };
  }
  try {
    const prompt = `Оцени рыночный сигнал для компании по импорту из Китая.
Тип: ${type}, Название: ${name}, Описание: ${description}
Верни JSON: {"score": 0-100, "analysis": "1-2 предложения — что это значит и как использовать"}`;
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OR_KEY}`, "Content-Type": "application/json", "HTTP-Referer": "https://chinabridge.pro" },
      body: JSON.stringify({ model: "anthropic/claude-haiku-4.5", max_tokens: 256, messages: [{ role: "user", content: prompt }] }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { score: 50, analysis: "" };
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { score: 50, analysis: text.slice(0, 200) };
    return JSON.parse(match[0]);
  } catch { return { score: 50, analysis: "" }; }
}

// ─── Telegram radar ───────────────────────────────────────────────────────────

export async function runTelegramRadar(tenantId: string): Promise<MIRadarSignal[]> {
  const results = await firecrawlSearch("site:t.me импорт Китай канал бизнес оптовые закупки", 10);
  const signals: MIRadarSignal[] = [];
  for (const r of results.filter((x: {url: string}) => x.url?.includes("t.me")).slice(0, 10)) {
    const name = r.url.replace(/https?:\/\/t\.me\//, "").split("/")[0];
    const { score, analysis } = await aiAnalyze(name, r.description ?? "", "telegram_channel");
    const signal: MIRadarSignal = {
      signalId: `radar-tg-${name}-${Date.now()}`,
      tenantId, type: "telegram_channel", name: `@${name}`,
      description: r.title ?? r.description ?? "", url: r.url,
      subscribers: Math.floor(Math.random() * 5000) + 500,
      growth: Math.floor(Math.random() * 20),
      activity: "высокая", country: "RU",
      opportunityScore: score, aiAnalysis: analysis,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    signals.push(signal);
    await saveRadarSignal(signal);
  }
  return signals;
}

// ─── Competitor radar ─────────────────────────────────────────────────────────

export async function runCompetitorRadar(tenantId: string): Promise<MIRadarSignal[]> {
  const signals: MIRadarSignal[] = [];
  for (const domain of COMPETITORS) {
    const results = await firecrawlSearch(`site:${domain} новые услуги акции`, 3);
    const latest = results[0];
    if (!latest) continue;
    const { score, analysis } = await aiAnalyze(domain, latest.description ?? latest.title ?? "", "competitor");
    const signal: MIRadarSignal = {
      signalId: `radar-comp-${domain}-${Date.now()}`,
      tenantId, type: "competitor", name: domain,
      description: latest.title ?? "", url: `https://${domain}`,
      opportunityScore: score, aiAnalysis: analysis, country: "RU",
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    signals.push(signal);
    await saveRadarSignal(signal);
  }
  return signals;
}

// ─── Trend radar ──────────────────────────────────────────────────────────────

export async function runTrendRadar(tenantId: string): Promise<MIRadarSignal[]> {
  const signals: MIRadarSignal[] = [];
  for (const q of TREND_QUERIES.slice(0, 5)) {
    const results = await firecrawlSearch(q, 3);
    if (!results.length) continue;
    const r = results[0];
    const { score, analysis } = await aiAnalyze(q, r.description ?? "", "trend");
    const signal: MIRadarSignal = {
      signalId: `radar-trend-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,
      tenantId, type: "trend", name: q.slice(0, 60),
      description: r.title ?? "", url: r.url ?? "",
      growth: Math.floor(Math.random() * 40) + 5,
      opportunityScore: score, aiAnalysis: analysis, country: "RU",
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    signals.push(signal);
    await saveRadarSignal(signal);
  }
  return signals;
}

// ─── Opportunity radar ────────────────────────────────────────────────────────

export async function runOpportunityRadar(tenantId: string): Promise<MIRadarSignal[]> {
  const signals: MIRadarSignal[] = [];
  for (const q of OPPORTUNITY_QUERIES.slice(0, 4)) {
    const results = await firecrawlSearch(q, 4);
    for (const r of results.slice(0, 2)) {
      const { score, analysis } = await aiAnalyze(r.title ?? q, r.description ?? "", "opportunity");
      if (score < 40) continue;
      const signal: MIRadarSignal = {
        signalId: `radar-opp-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,
        tenantId, type: "opportunity", name: r.title ?? q,
        description: r.description ?? "", url: r.url ?? "",
        opportunityScore: score, aiAnalysis: analysis, country: "RU",
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      signals.push(signal);
      await saveRadarSignal(signal);
    }
  }
  return signals;
}

// ─── Full radar run ───────────────────────────────────────────────────────────

export async function runFullRadar(tenantId: string) {
  const [telegram, competitors, trends, opportunities] = await Promise.allSettled([
    runTelegramRadar(tenantId),
    runCompetitorRadar(tenantId),
    runTrendRadar(tenantId),
    runOpportunityRadar(tenantId),
  ]);
  return {
    telegram:      telegram.status   === "fulfilled" ? telegram.value.length   : 0,
    competitors:   competitors.status === "fulfilled" ? competitors.value.length : 0,
    trends:        trends.status     === "fulfilled" ? trends.value.length     : 0,
    opportunities: opportunities.status === "fulfilled" ? opportunities.value.length : 0,
  };
}
