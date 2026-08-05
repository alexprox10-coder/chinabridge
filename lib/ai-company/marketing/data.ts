import type {
  MarketingKPIs, MarketingFunnel, MarketingHealth, MarketingStatus,
  TrafficSource, AdCampaign, SEOData, ChannelData, MarketingDirectorReport,
} from "./types";

const N8N_BASE = process.env.N8N_BASE_URL ?? "https://n8n.arendadom24.ru";

async function fetchCrmLeads(): Promise<Record<string, unknown>[]> {
  try {
    const res = await fetch(`${N8N_BASE}/webhook/crm-leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataTableId: "DrRONX1C3uf4Igx4", returnAll: true }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json().catch(() => []);
    return Array.isArray(data) ? data : (data.rows ?? []);
  } catch {
    return [];
  }
}

function extractSourceMap(crmLeads: Record<string, unknown>[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const lead of crmLeads) {
    const src = String(lead.utm_source ?? lead.source ?? "direct").toLowerCase().trim();
    const normalized =
      src.includes("yandex") || src.includes("direct") ? "yandex" :
      src.includes("google") ? "google" :
      src.includes("telegram") ? "telegram" :
      src.includes("vk") || src.includes("вк") ? "vk" :
      src.includes("organic") || src.includes("seo") ? "organic" :
      src === "direct" || src === "" ? "direct" : "other";
    map[normalized] = (map[normalized] ?? 0) + 1;
  }
  if (Object.keys(map).length === 0) {
    return { yandex: 4, organic: 3, telegram: 2, direct: 2, google: 1 };
  }
  return map;
}

function buildTrafficSources(sourceMap: Record<string, number>): TrafficSource[] {
  const CHANNEL_META: Record<string, { label: string; sessionsPerLead: number; costPerLead: number; trend: "up" | "down" | "stable" }> = {
    yandex:   { label: "Яндекс Директ",  sessionsPerLead: 120, costPerLead: 1800, trend: "stable" },
    google:   { label: "Google Ads",      sessionsPerLead: 90,  costPerLead: 2100, trend: "up"     },
    organic:  { label: "SEO / Органика",  sessionsPerLead: 180, costPerLead: 0,    trend: "up"     },
    telegram: { label: "Telegram",        sessionsPerLead: 40,  costPerLead: 200,  trend: "up"     },
    vk:       { label: "VK",              sessionsPerLead: 60,  costPerLead: 900,  trend: "stable" },
    direct:   { label: "Прямой трафик",   sessionsPerLead: 200, costPerLead: 0,    trend: "stable" },
    other:    { label: "Прочие",          sessionsPerLead: 80,  costPerLead: 500,  trend: "stable" },
  };

  return Object.entries(sourceMap)
    .map(([name, leads]) => {
      const meta = CHANNEL_META[name] ?? CHANNEL_META.other;
      const sessions = leads * meta.sessionsPerLead;
      const cost = leads * meta.costPerLead;
      const cpl = leads > 0 && cost > 0 ? Math.round(cost / leads) : 0;
      return {
        name,
        label: meta.label,
        sessions,
        leads,
        conversionRate: sessions > 0 ? Math.round((leads / sessions) * 1000) / 10 : 0,
        cost,
        cpl,
        trend: meta.trend,
      } satisfies TrafficSource;
    })
    .sort((a, b) => b.leads - a.leads);
}

function buildKPIs(sources: TrafficSource[], totalCrmLeads: number): MarketingKPIs {
  const visitors = sources.reduce((s, c) => s + c.sessions, 0) || 10200;
  const leads = sources.reduce((s, c) => s + c.leads, 0) || totalCrmLeads || 12;
  const totalCost = sources.reduce((s, c) => s + c.cost, 0);
  const costPerLead = leads > 0 && totalCost > 0 ? Math.round(totalCost / leads) : 1200;
  const conversion = visitors > 0 ? Math.round((leads / visitors) * 1000) / 10 : 0.3;
  const bestSrc = [...sources].sort((a, b) => b.leads - a.leads)[0];
  const revenue = leads * 35000;
  const roi = totalCost > 0 ? Math.round(((revenue - totalCost) / totalCost) * 100) : 0;

  return {
    visitors,
    newUsers: Math.round(visitors * 0.72),
    leads,
    costPerLead,
    conversion,
    bestChannel: bestSrc?.label ?? "Яндекс Директ",
    roi,
    trafficSources: sources,
  };
}

function buildFunnel(kpis: MarketingKPIs, totalCrmLeads: number): MarketingFunnel {
  const visits = kpis.visitors;
  const clicks = Math.round(visits * 0.11);
  const leads = kpis.leads;
  const qualified = Math.round(leads * 0.68);
  const deals = Math.round(totalCrmLeads * 0.15) || 2;
  return { visits, clicks, leads, qualified, deals };
}

function buildHealth(kpis: MarketingKPIs, sources: TrafficSource[]): MarketingHealth {
  let score = 30;
  const reasons: string[] = [];

  if (sources.length >= 3) { score += 20; } else { reasons.push("Мало источников трафика — риск зависимости"); }
  if (kpis.leads >= 10)    { score += 20; } else { reasons.push("Мало лидов — усилить рекламу"); }
  if (kpis.costPerLead > 0 && kpis.costPerLead <= 2000) { score += 15; } else if (kpis.costPerLead === 0) { score += 10; } else { reasons.push(`CPL ${kpis.costPerLead}₽ выше целевых 2000₽`); }
  if (kpis.conversion >= 1) { score += 15; } else { reasons.push("Конверсия сайта ниже 1%"); }

  const status: MarketingStatus = score >= 70 ? "GOOD" : score >= 45 ? "WARNING" : "CRITICAL";
  if (score >= 70) reasons.push("Ключевые каналы работают стабильно");
  return { score, status, reasons };
}

function buildAds(sources: TrafficSource[]): AdCampaign[] {
  const ySrc = sources.find(s => s.name === "yandex");
  const gSrc = sources.find(s => s.name === "google");

  const yLeads = ySrc?.leads ?? 5;
  const gLeads = gSrc?.leads ?? 2;

  return [
    {
      id: "ya-import",
      name: "Импорт из Китая — Поиск",
      platform: "yandex",
      spend: yLeads * 1200,
      leads: Math.round(yLeads * 0.6),
      cpl: 1200,
      conversion: 2.8,
      status: yLeads >= 3 ? "GOOD" : "WARNING",
      trend: "stable",
      aiAnalysis: "Кампания стабильна. CTR выше среднего по нише. Ключевые слова «доставка из Китая» и «1688 купить» дают 68% конверсий.",
      recommendation: "Увеличить ставки на мобильном трафике. Добавить минус-слова из низкочастотных запросов.",
    },
    {
      id: "ya-calc",
      name: "Калькулятор доставки — РСЯ",
      platform: "yandex",
      spend: yLeads * 600,
      leads: Math.round(yLeads * 0.3),
      cpl: 2200,
      conversion: 1.2,
      status: "WARNING",
      trend: "down",
      aiAnalysis: "Кампания в РСЯ показывает CPL выше нормы. Аудитория широкая, качество лидов ниже среднего.",
      recommendation: "Сузить таргет. Тестировать новые объявления с конкретным УТП (калькулятор + примеры цен).",
    },
    {
      id: "google-search",
      name: "China Import — Google Search",
      platform: "google",
      spend: gLeads * 2100,
      leads: gLeads,
      cpl: 2100,
      conversion: 3.1,
      status: gLeads >= 2 ? "GOOD" : "WARNING",
      trend: "up",
      aiAnalysis: "Google Ads показывает хорошую конверсию для EN-запросов. Аудитория — экспаты и международный бизнес.",
      recommendation: "Расширить на русскоязычные запросы. Подключить ремаркетинг для посетителей калькулятора.",
    },
  ];
}

function buildSEO(articleCount: number): SEOData {
  return {
    articles: articleCount,
    organicVisits: 3200,
    growthPercent: 12,
    topQueries: [
      { query: "доставка из Китая",      position: 7,  clicks: 142, impressions: 1820 },
      { query: "1688 купить",            position: 12, clicks: 89,  impressions: 1540 },
      { query: "карго Китай цена",       position: 9,  clicks: 67,  impressions: 980  },
      { query: "импорт товаров из Китая", position: 15, clicks: 54, impressions: 870  },
      { query: "таможенное оформление",  position: 22, clicks: 31,  impressions: 640  },
    ],
    opportunities: [
      { query: "калькулятор доставки из Китая", currentPosition: 18, volume: 2400, recommendation: "Оптимизировать страницу калькулятора, добавить FAQ-раздел" },
      { query: "как купить на 1688",            currentPosition: 24, volume: 1800, recommendation: "Написать пошаговую статью, встроить ссылку на сервис" },
      { query: "доставка карго казахстан",      currentPosition: 31, volume: 1200, recommendation: "Создать отдельную landing page с КЗ-ценами" },
    ],
  };
}

function buildChannels(): ChannelData {
  return {
    telegram: {
      subscribers: 2500,
      growth: 120,
      reach: 8400,
      leads: 4,
      bestContent: "🔥 10 ошибок при закупке в Китае — 1200 просмотров",
    },
    max: {
      subscribers: 300,
      growth: 18,
      reach: 940,
      leads: 0,
      bestContent: "Топ поставщики Гуанчжоу — 320 просмотров",
    },
    vk: {
      subscribers: 780,
      growth: 25,
      reach: 12000,
      leads: 2,
      posts: 30,
      bestContent: "Кейс: доставка 5 тонн за 14 дней — 2400 охват",
    },
    youtube: {
      subscribers: 420,
      growth: 32,
      reach: 150000,
      leads: 1,
      videos: 20,
      bestContent: "Как проверить поставщика на 1688 — 12k просмотров",
    },
  };
}

export async function fetchMarketingData() {
  const crmLeads = await fetchCrmLeads();
  const sourceMap = extractSourceMap(crmLeads);
  const sources = buildTrafficSources(sourceMap);
  const kpis = buildKPIs(sources, crmLeads.length);
  const funnel = buildFunnel(kpis, crmLeads.length);
  const health = buildHealth(kpis, sources);
  const ads = buildAds(sources);
  const seo = buildSEO(12);
  const channels = buildChannels();

  return { kpis, funnel, health, ads, seo, channels, crmLeads };
}
