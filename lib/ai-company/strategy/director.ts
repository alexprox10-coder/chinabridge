import type {
  StrategyHealth, StrategyDirectorReport, StrategyRecommendation,
  MarketData, Opportunity, Competitor, Trend,
} from "./types";
import type { StrategyData } from "./data";

const OR_BASE  = "https://openrouter.ai/api/v1";
const OR_KEY   = process.env.OPENROUTER_API_KEY ?? "";
const OR_MODEL = process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash";

function buildPrompt(health: StrategyHealth, data: StrategyData): string {
  const topMarket = [...data.markets].sort((a, b) => b.score - a.score)[0];
  const topOpp    = [...data.opportunities].sort((a, b) => b.score - a.score)[0];
  return `Ты — Strategy Director AI компании ChinaBridge (B2B-импорт из Китая в СНГ).
Генерируй CEO Strategic Report.

HEALTH: ${health.score}/100 (${health.status})
Market Score: ${health.marketScore} | Innovation: ${health.innovationScore} | Competitive: ${health.competitiveScore}
Возможностей: ${health.opportunitiesCount}
Лучший рынок: ${topMarket.name} (score ${topMarket.score}/10, рост +${topMarket.growth}%/год)
Топ возможность: ${topOpp.title} (score ${topOpp.score}/10, потенциал ${topOpp.potential})
Главные сильные стороны: ${health.strengths.join("; ")}
Главные риски: ${health.risks.join("; ")}

Ответь ТОЛЬКО JSON (без markdown):
{
  "summary": "3 предложения — стратегическое состояние компании и главный вывод",
  "recommendations": [
    {"id":"s1","title":"заголовок","description":"описание","impact":"эффект","priority":"HIGH","timeline":"срок"}
  ],
  "topOpportunity": "главная возможность месяца (1 предложение)",
  "topRisk": "главный риск (1 предложение)",
  "topDecision": "главное стратегическое решение для CEO (1 предложение)",
  "saasReadiness": 78
}`;
}

function buildFallback(data: StrategyData): StrategyDirectorReport {
  const health = data.health;

  const recs: StrategyRecommendation[] = [
    {
      id: "s1",
      title: "Запустить White Label SaaS за 90 дней",
      description: "Продать CRM-платформу 10 карго компаниям по 35К₽/мес. Маржа 85%, нулевой COGS роста.",
      impact: "MRR +350К₽, новый продуктовый revenue stream",
      priority: "HIGH",
      timeline: "90 дней",
    },
    {
      id: "s2",
      title: "Казахстан: запустить отдельный оффер",
      description: "Создать лендинг + таргет для казахстанских импортёров. Рынок +28%/год, конкурентов почти нет.",
      impact: "5-10 новых клиентов в первый месяц",
      priority: "HIGH",
      timeline: "30 дней",
    },
    {
      id: "s3",
      title: "Партнёрская программа: 10 агентов за 60 дней",
      description: "Реферальная программа — агент получает 10% от первой сделки. Масштабируется без рекламных затрат.",
      impact: "+30% к выручке без роста CAC",
      priority: "HIGH",
      timeline: "60 дней",
    },
    {
      id: "s4",
      title: "Таможенный AI-калькулятор — первый на рынке",
      description: "Автоматический расчёт ТН ВЭД и пошлин. Нет аналогов среди карго компаний СНГ.",
      impact: "Конкурентное преимущество, конверсия +20%",
      priority: "HIGH",
      timeline: "60 дней",
    },
  ];

  return {
    summary:
      `Strategy Health: ${health.score}/100 (${health.status}). ` +
      "ChinaBridge готов к переходу из карго-сервиса в full-stack импортную платформу. " +
      "Казахстан и White Label SaaS — два главных ускорителя роста на ближайшие 90 дней.",
    health,
    markets:       data.markets,
    competitors:   data.competitors,
    opportunities: data.opportunities,
    productIdeas:  data.productIdeas,
    growthActions: data.growthActions,
    trends:        data.trends,
    recommendations: recs,
    ceoInsight: {
      topOpportunity: "White Label SaaS для карго: маржа 85%, рынок не занят, запуск за 90 дней",
      topRisk:        "Конкуренты начинают копировать калькуляторы — нужно ускориться с AI-фичами",
      topDecision:    "Запустить SaaS Beta и Казахстан параллельно — оба направления с низким барьером входа",
      saasReadiness:  72,
    },
    generatedAt: new Date().toISOString(),
  };
}

export async function generateStrategyDirectorReport(data: StrategyData): Promise<StrategyDirectorReport> {
  if (!OR_KEY) return buildFallback(data);

  try {
    const res = await fetch(`${OR_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OR_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://chinabridge.pro",
      },
      body: JSON.stringify({
        model: OR_MODEL,
        messages: [{ role: "user", content: buildPrompt(data.health, data) }],
        temperature: 0.5,
        max_tokens: 900,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) return buildFallback(data);

    const json  = await res.json();
    const text: string = json?.choices?.[0]?.message?.content ?? "";
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const p     = JSON.parse(clean);

    return {
      summary:         p.summary ?? "",
      health:          data.health,
      markets:         data.markets,
      competitors:     data.competitors,
      opportunities:   data.opportunities,
      productIdeas:    data.productIdeas,
      growthActions:   data.growthActions,
      trends:          data.trends,
      recommendations: p.recommendations ?? [],
      ceoInsight: {
        topOpportunity: p.topOpportunity ?? "",
        topRisk:        p.topRisk ?? "",
        topDecision:    p.topDecision ?? "",
        saasReadiness:  typeof p.saasReadiness === "number" ? p.saasReadiness : 72,
      },
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return buildFallback(data);
  }
}
