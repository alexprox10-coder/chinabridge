import type {
  MarketingKPIs, MarketingFunnel, MarketingHealth, AdCampaign,
  SEOData, ChannelData, MarketingRecommendation, MarketingTask,
  ContentRequest, MarketingDirectorReport, MarketingPriority,
} from "./types";

const OPENROUTER_URL = (process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1") + "/chat/completions";
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY ?? "";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash";

function buildPrompt(kpis: MarketingKPIs, health: MarketingHealth, ads: AdCampaign[], seo: SEOData, channels: ChannelData): string {
  const topCampaigns = ads.map(a => `  - ${a.name} (${a.platform}): расход ${a.spend}₽, лидов ${a.leads}, CPL ${a.cpl}₽, статус ${a.status}`).join("\n");
  const topSrc = kpis.trafficSources.slice(0, 4).map(s => `  - ${s.label}: ${s.sessions} визитов, ${s.leads} лидов, CPL ${s.cpl || 0}₽`).join("\n");

  return `Ты — Marketing Director AI компании ChinaBridge (B2B грузоперевозки и импорт из Китая).

МАРКЕТИНГОВЫЕ ДАННЫЕ:
Health Score: ${health.score}/100 (${health.status})
Посетители: ${kpis.visitors.toLocaleString()} | Лидов: ${kpis.leads} | Конверсия: ${kpis.conversion}%
CPL средний: ${kpis.costPerLead}₽ | Лучший канал: ${kpis.bestChannel} | ROI: ${kpis.roi}%
SEO-статей: ${seo.articles} | Органический трафик: ${seo.organicVisits} (+${seo.growthPercent}%)
Telegram: ${channels.telegram.subscribers} подписчиков | YouTube: ${channels.youtube.subscribers} | VK: ${channels.vk.subscribers}

ИСТОЧНИКИ ТРАФИКА:
${topSrc}

РЕКЛАМНЫЕ КАМПАНИИ:
${topCampaigns}

ПРОБЛЕМЫ HEALTH SCORE:
${health.reasons.join("\n")}

Составь маркетинговый отчёт в формате JSON:
{
  "summary": "2-3 предложения о текущем состоянии маркетинга",
  "recommendations": [
    {
      "id": "rec_1",
      "problem": "Чёткое название проблемы",
      "analysis": "1-2 предложения анализа",
      "action": "Конкретное действие для решения",
      "owner": "Кто отвечает (Ads AI / SEO AI / Content / Marketing Director)",
      "priority": "HIGH|MEDIUM|LOW"
    }
  ],
  "tasks": [
    {
      "id": "task_1",
      "title": "Название задачи",
      "description": "Что конкретно нужно сделать",
      "department": "Content|Marketing|Sales",
      "priority": "HIGH|MEDIUM|LOW",
      "deadline": "2026-XX-XX",
      "status": "pending"
    }
  ],
  "contentRequests": [
    {
      "type": "article|post|shorts|video",
      "title": "Название контента",
      "topic": "Тема для контент-отдела",
      "channel": "Telegram|YouTube|VK|Blog",
      "priority": "HIGH|MEDIUM|LOW",
      "reason": "Зачем нужен этот контент"
    }
  ]
}

Дай 4-5 рекомендаций, 4-5 задач, 3 контент-заявки. Отвечай ТОЛЬКО JSON, без markdown.`;
}

interface DirectorAnalysis {
  summary: string;
  recommendations: MarketingRecommendation[];
  tasks: MarketingTask[];
  contentRequests: ContentRequest[];
}

function buildFallback(kpis: MarketingKPIs, health: MarketingHealth): DirectorAnalysis {
  const tomorrow = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const twoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

  const recs: MarketingRecommendation[] = [
    {
      id: "rec_1",
      problem: "CPL выше целевого уровня",
      analysis: `Средняя стоимость лида ${kpis.costPerLead}₽ при целевом показателе 2000₽. Рекламный бюджет расходуется неэффективно.`,
      action: "Провести аудит кампаний Яндекс Директ. Отключить неэффективные группы объявлений, перераспределить бюджет на конвертирующие ключи.",
      owner: "Ads AI",
      priority: kpis.costPerLead > 2500 ? "HIGH" : "MEDIUM" as MarketingPriority,
    },
    {
      id: "rec_2",
      problem: "Недостаточно SEO-трафика",
      analysis: "Органический трафик составляет малую долю. Контентный маркетинг недоразвит для B2B ниши.",
      action: "Написать 4 статьи в месяц по высокочастотным запросам. Приоритет: «калькулятор доставки», «импорт 1688», «таможня Китай».",
      owner: "SEO AI",
      priority: "MEDIUM",
    },
    {
      id: "rec_3",
      problem: "Telegram-канал не генерирует лиды",
      analysis: `${kpis.trafficSources.find(s => s.name === "telegram")?.leads ?? 0} лидов из Telegram при 2500+ подписчиках — низкая монетизация аудитории.`,
      action: "Добавить CTA в каждый пост. Запустить еженедельный разбор кейса с ссылкой на калькулятор. Тестировать pinned-сообщение с офером.",
      owner: "Content",
      priority: "MEDIUM",
    },
    {
      id: "rec_4",
      problem: "Нет ремаркетинга на лидов",
      analysis: "Посетители, просмотревшие калькулятор, не получают повторных касаний в рекламе.",
      action: "Настроить ремаркетинг в Яндексе на аудиторию калькулятора. Создать 3 варианта объявлений: «оффер», «кейс», «гарантия».",
      owner: "Ads AI",
      priority: "LOW",
    },
  ];

  const tasks: MarketingTask[] = [
    {
      id: "task_1",
      title: "Аудит рекламных кампаний Яндекс",
      description: "Проверить все активные кампании, отключить группы с CPL > 3000₽, перераспределить бюджет",
      department: "Marketing",
      priority: "HIGH",
      deadline: tomorrow,
      status: "pending",
    },
    {
      id: "task_2",
      title: "Контент-план на август",
      description: "Составить план: 4 статьи для блога, 12 постов Telegram, 2 Shorts YouTube",
      department: "Content",
      priority: "HIGH",
      deadline: tomorrow,
      status: "pending",
    },
    {
      id: "task_3",
      title: "Настроить UTM-метки",
      description: "Проставить UTM-метки на все рекламные ссылки для корректной атрибуции источников",
      department: "Marketing",
      priority: "MEDIUM",
      deadline: twoWeeks,
      status: "pending",
    },
    {
      id: "task_4",
      title: "Landing page для Казахстана",
      description: "Создать страницу «доставка в Казахстан» с ценами и кейсами — SEO-возможность",
      department: "Content",
      priority: "MEDIUM",
      deadline: twoWeeks,
      status: "pending",
    },
  ];

  const contentRequests: ContentRequest[] = [
    { type: "article",  title: "Как купить на 1688 без посредников в 2026", topic: "пошаговый гайд 1688", channel: "Blog",     priority: "HIGH",   reason: "3-я позиция в SEO по целевому запросу" },
    { type: "post",     title: "Кейс: 5 контейнеров мебели за 18 дней",     topic: "кейс доставки",     channel: "Telegram", priority: "HIGH",   reason: "Доверие + CTR на сайт" },
    { type: "shorts",   title: "3 ошибки при растаможке из Китая",           topic: "таможня ошибки",    channel: "YouTube",  priority: "MEDIUM", reason: "Виральный формат, SEO YouTube" },
  ];

  return {
    summary: `Маркетинг работает в режиме ${health.status}. Health Score: ${health.score}/100. ${kpis.leads} лидов привлечено, лучший канал — ${kpis.bestChannel}. ${health.reasons[0] ?? "Основные метрики в норме."}`,
    recommendations: recs,
    tasks,
    contentRequests,
  };
}

export async function generateMarketingDirectorReport(
  kpis: MarketingKPIs,
  funnel: MarketingFunnel,
  health: MarketingHealth,
  ads: AdCampaign[],
  seo: SEOData,
  channels: ChannelData,
): Promise<MarketingDirectorReport> {
  const generatedAt = new Date().toISOString();

  if (OPENROUTER_KEY) {
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [{ role: "user", content: buildPrompt(kpis, health, ads, seo, channels) }],
          temperature: 0.4,
          max_tokens: 2000,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        const text = data?.choices?.[0]?.message?.content ?? "";
        const parsed = JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()) as Partial<DirectorAnalysis>;
        if (parsed.summary && parsed.recommendations?.length) {
          return {
            summary: parsed.summary,
            health,
            kpis,
            funnel,
            ads,
            seo,
            channels,
            recommendations: parsed.recommendations ?? [],
            tasks: parsed.tasks ?? [],
            contentRequests: parsed.contentRequests ?? [],
            generatedAt,
          };
        }
      }
    } catch {
      // fallback
    }
  }

  const fallback = buildFallback(kpis, health);
  return {
    ...fallback,
    health,
    kpis,
    funnel,
    ads,
    seo,
    channels,
    generatedAt,
  };
}
