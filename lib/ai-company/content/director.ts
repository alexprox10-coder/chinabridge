import type {
  ContentKPIs, ContentHealth, SEOContent, TelegramStats, YouTubeStats,
  ShortsStats, ImageAI, ContentRecommendation, ContentTask,
  ContentDirectorReport, ContentPriority,
} from "./types";

const OPENROUTER_URL = (process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1") + "/chat/completions";
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY ?? "";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash";

function buildPrompt(kpis: ContentKPIs, health: ContentHealth, seo: SEOContent, telegram: TelegramStats, youtube: YouTubeStats): string {
  return `Ты — Content Director AI компании ChinaBridge (B2B импорт из Китая).

ДАННЫЕ КОНТЕНТ-ОТДЕЛА:
Health Score: ${health.score}/100 (${health.status})
Всего материалов: ${kpis.totalMaterials} | Статьи: ${kpis.articles} | Telegram-постов: ${kpis.telegramPosts}
YouTube-видео: ${kpis.youtubeVideos} | Shorts: ${kpis.shorts}
Всего просмотров: ${kpis.totalViews.toLocaleString()} | Подписчиков: ${kpis.subscribers}
Лучший контент: ${kpis.bestContent}

SEO: ${seo.published} статей, трафик ${seo.organicTraffic} визитов
SEO-возможности: ${seo.opportunities.map(o => `«${o.query}» (поз. ${o.position})`).join(", ")}

Telegram: ${telegram.totalPosts} постов, рост ${telegram.subscribersGrowth} подписчиков
YouTube: ${youtube.totalVideos} видео, ${youtube.totalViews.toLocaleString()} просмотров, удержание ${youtube.avgRetention}%

ПРОБЛЕМЫ: ${health.reasons.join(" | ")}

Составь контент-отчёт в формате JSON:
{
  "summary": "2-3 предложения о состоянии контент-отдела",
  "recommendations": [
    {
      "id": "rec_1",
      "problem": "Название проблемы",
      "analysis": "1-2 предложения анализа",
      "action": "Конкретное действие",
      "owner": "SEO AI / Telegram AI / YouTube AI / Shorts AI / Content Director",
      "priority": "HIGH|MEDIUM|LOW"
    }
  ],
  "tasks": [
    {
      "id": "task_1",
      "title": "Название задачи",
      "description": "Что конкретно сделать",
      "type": "article|post|shorts|video|image|prompt",
      "channel": "telegram|youtube|vk|blog|ads|max",
      "priority": "HIGH|MEDIUM|LOW",
      "deadline": "2026-08-XX",
      "status": "pending",
      "source": "director|marketing|seo|sales"
    }
  ]
}

Дай 4-5 рекомендаций и 5-6 задач. Фокус: SEO Казахстан, Shorts рост, Telegram монетизация.
Отвечай ТОЛЬКО JSON, без markdown.`;
}

interface AIAnalysis {
  summary: string;
  recommendations: ContentRecommendation[];
  tasks: ContentTask[];
}

function buildFallback(kpis: ContentKPIs, health: ContentHealth, seo: SEOContent): AIAnalysis {
  const w1 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const w2 = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  const w3 = new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10);

  const recs: ContentRecommendation[] = [
    {
      id: "rec_1",
      problem: "Нет контента по рынку Казахстана",
      analysis: `Запрос «белый импорт Китай Казахстан» на позиции ${seo.opportunities.find(o => o.query.includes("Казахстан"))?.position ?? 31} при объёме 1200+ в месяц. Сегмент полностью не охвачен.`,
      action: "Написать 3 статьи про импорт в Казахстан: схема, документы, цены. Создать отдельный лендинг для КЗ-рынка.",
      owner: "SEO AI",
      priority: "HIGH" as ContentPriority,
    },
    {
      id: "rec_2",
      problem: "Shorts не масштабированы",
      analysis: `${kpis.shorts} Shorts при охвате 2250 просмотров — потенциал роста ×3 при ежедневном выпуске.`,
      action: "Запустить ежедневный выпуск Shorts. Использовать Shorts AI для автогенерации сценариев.",
      owner: "Shorts AI",
      priority: "HIGH" as ContentPriority,
    },
    {
      id: "rec_3",
      problem: "Telegram не генерирует лиды",
      analysis: `${kpis.subscribers} подписчиков при 0–2 лидах из канала в месяц. CTA в постах слабые.`,
      action: "Добавить CTA в каждый пост. Закрепить пост с калькулятором. Тест: 1 продающий пост в неделю.",
      owner: "Telegram AI",
      priority: "MEDIUM" as ContentPriority,
    },
    {
      id: "rec_4",
      problem: "SEO-статьи не конвертируют в лиды",
      analysis: `${seo.organicTraffic} визитов, конверсия < 0.5%. Нет лид-магнитов и CTA к калькулятору.`,
      action: "Добавить CTA-блок к каждой статье. Создать чек-лист проверки поставщика как лид-магнит.",
      owner: "SEO AI",
      priority: "MEDIUM" as ContentPriority,
    },
    {
      id: "rec_5",
      problem: "Низкая системность контент-плана",
      analysis: "Публикации нерегулярны, нет единой редакционной стратегии на месяц.",
      action: "Создать контент-план на 30 дней с темами недели и распределением по каналам.",
      owner: "Content Director",
      priority: "LOW" as ContentPriority,
    },
  ];

  const tasks: ContentTask[] = [
    {
      id: "task_1",
      title: "Статья: Белый импорт Китай — Казахстан",
      description: "2500+ слов, SEO-оптимизация, схема документов, цены карго КЗ",
      type: "article", channel: "blog", priority: "HIGH", deadline: w1, status: "pending", source: "seo",
    },
    {
      id: "task_2",
      title: "Запустить ежедневные Shorts",
      description: "5 Shorts в неделю из пула Shorts AI. Серия №1: «3 ошибки импортёра»",
      type: "shorts", channel: "youtube", priority: "HIGH", deadline: w1, status: "pending", source: "director",
    },
    {
      id: "task_3",
      title: "Pinned-пост в Telegram с CTA",
      description: "Закрепить пост «Рассчитайте доставку из Китая за 2 минуты» со ссылкой на калькулятор",
      type: "post", channel: "telegram", priority: "HIGH", deadline: w1, status: "pending", source: "marketing",
    },
    {
      id: "task_4",
      title: "Статья: Как купить на 1688 без посредников",
      description: "Пошаговый гайд 2500 слов со скриншотами и встроенным калькулятором",
      type: "article", channel: "blog", priority: "MEDIUM", deadline: w2, status: "pending", source: "seo",
    },
    {
      id: "task_5",
      title: "YouTube: Импорт в Казахстан — полная схема",
      description: "Видео 12–15 мин по структуре HOOK → Проблема → Решение → CTA",
      type: "video", channel: "youtube", priority: "MEDIUM", deadline: w2, status: "pending", source: "director",
    },
    {
      id: "task_6",
      title: "Лид-магнит: чек-лист проверки поставщика PDF",
      description: "2 страницы, распространять через Telegram-канал и статьи блога",
      type: "image", channel: "telegram", priority: "LOW", deadline: w3, status: "pending", source: "sales",
    },
  ];

  return {
    summary: `Контент-отдел работает в режиме ${health.status} (Health Score: ${health.score}/100). Создано ${kpis.totalMaterials} материалов, лучший канал — YouTube с ${kpis.totalViews.toLocaleString()} просмотрами. Главные точки роста: SEO-контент для Казахстана и масштабирование Shorts до ежедневного выпуска.`,
    recommendations: recs,
    tasks,
  };
}

export async function generateContentDirectorReport(
  kpis: ContentKPIs,
  health: ContentHealth,
  seo: SEOContent,
  telegram: TelegramStats,
  youtube: YouTubeStats,
  shorts: ShortsStats,
  imageAI: ImageAI,
): Promise<ContentDirectorReport> {
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
          messages: [{ role: "user", content: buildPrompt(kpis, health, seo, telegram, youtube) }],
          temperature: 0.4,
          max_tokens: 2000,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        const text: string = data?.choices?.[0]?.message?.content ?? "";
        const parsed = JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()) as Partial<AIAnalysis>;
        if (parsed.summary && parsed.recommendations?.length) {
          return {
            summary: parsed.summary,
            health, kpis, seo, telegram, youtube, shorts, imageAI,
            recommendations: parsed.recommendations ?? [],
            tasks: parsed.tasks ?? [],
            generatedAt,
          };
        }
      }
    } catch {
      // fallback below
    }
  }

  const fallback = buildFallback(kpis, health, seo);
  return { ...fallback, health, kpis, seo, telegram, youtube, shorts, imageAI, generatedAt };
}
