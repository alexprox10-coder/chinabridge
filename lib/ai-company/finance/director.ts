import type {
  RevenueData, CostData, ProfitData, UnitEconomics, ForecastData,
  SaaSMetrics, FinanceHealth, FinanceRecommendation, FinanceDirectorReport,
} from "./types";

const OR_BASE  = "https://openrouter.ai/api/v1";
const OR_KEY   = process.env.OPENROUTER_API_KEY ?? "";
const OR_MODEL = process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash";

function buildPrompt(
  health: FinanceHealth,
  revenue: RevenueData,
  profit: ProfitData,
  unitEco: UnitEconomics,
  forecast: ForecastData,
): string {
  return `Ты — Finance Director AI компании ChinaBridge (B2B-импорт из Китая).
Генерируй CEO финансовый отчёт.

HEALTH: ${health.score}/100 (${health.status})
Выручка: ${revenue.total.toLocaleString()}₽ / мес | Рост: +${revenue.growth}% | MRR: ${revenue.mrr.toLocaleString()}₽
Расходы: ${profit.costs.toLocaleString()}₽ | Прибыль: ${profit.profit.toLocaleString()}₽ | Маржа: ${profit.margin}%
ROI: ${profit.roi}% | LTV/CAC: ${unitEco.ltvToCac}x | CAC: ${unitEco.cac.toLocaleString()}₽
Прогноз (3 мес, оптимистичный MRR): ${forecast.optimistic.mrr3m.toLocaleString()}₽
Лучший канал по марже: ${profit.bestChannel}

Ответь ТОЛЬКО JSON (без markdown):
{
  "summary": "3 предложения — финансовое состояние компании",
  "recommendations": [
    {"id":"r1","problem":"проблема","solution":"решение","impact":"эффект","priority":"HIGH","deadline":"срок"}
  ],
  "topDecision": "главное стратегическое решение для CEO (1 предложение)"
}`;
}

function buildFallback(
  health: FinanceHealth,
  revenue: RevenueData,
  costs: CostData,
  profit: ProfitData,
  unitEco: UnitEconomics,
  forecast: ForecastData,
  saas: SaaSMetrics,
): FinanceDirectorReport {
  const recs: FinanceRecommendation[] = [
    {
      id: "f1",
      problem: "SaaS направление имеет маржу 85% — не масштабируется",
      solution: "Запустить SaaS-пакет для импортёров: 35 000₽/мес. Цель: 10 клиентов за 3 месяца.",
      impact: `MRR +${(35000 * 10).toLocaleString()}₽ при нулевом CAC роста`,
      priority: "HIGH",
      deadline: "3 недели",
    },
    {
      id: "f2",
      problem: `SEO лиды: CAC ${Math.round(unitEco.byChannel[0]?.cac ?? 2700).toLocaleString()}₽ vs Яндекс ${Math.round(unitEco.byChannel[1]?.cac ?? 25200).toLocaleString()}₽`,
      solution: "Перераспределить 30% рекламного бюджета в контент / SEO.",
      impact: "Снижение среднего CAC на 25-35%",
      priority: "HIGH",
      deadline: "1 месяц",
    },
    {
      id: "f3",
      problem: !revenue.connected ? "Finance Module не подключён" : "Нет системного MRR-трекинга",
      solution: !revenue.connected
        ? "Начать вносить каждую сделку в n8n finance_orders. Потребуется 30 мин/нед."
        : "Внедрить ежемесячный MRR-отчёт: фиксировать новые, расширенные, ушедшие.",
      impact: "Полная прозрачность финансов для CEO и инвесторов",
      priority: "HIGH",
      deadline: "сегодня",
    },
    {
      id: "f4",
      problem: "Консалтинг имеет маржу 65% — недозагружен",
      solution: "Выделить консалтинг как отдельный продукт с landing-page. Цель: 12 клиентов/мес.",
      impact: "+280 000₽ к выручке при текущих ресурсах",
      priority: "MEDIUM",
      deadline: "1 месяц",
    },
  ];

  const topDecision = revenue.connected
    ? "Масштабировать SaaS-направление: маржа 85%, LTV/CAC > 20x — это лучший актив компании"
    : "Подключить Finance Module к n8n — без данных CEO работает вслепую";

  const summary =
    `Finance Health: ${health.score}/100 (${health.status}). ` +
    `Выручка ${(revenue.total / 1000000).toFixed(2)} млн₽/мес, маржа ${profit.margin}%, прибыль ${(profit.profit / 1000).toFixed(0)}К₽. ` +
    (revenue.connected
      ? `LTV/CAC ${unitEco.ltvToCac}x — unit-экономика ${unitEco.rating}.`
      : "Finance Module не подключён — данные из smart-mock.");

  return {
    summary,
    health,
    revenue,
    costs,
    profit,
    unitEconomics: unitEco,
    forecast,
    saas,
    recommendations: recs,
    ceoSummary: {
      revenue: revenue.total,
      profit: profit.profit,
      margin: profit.margin,
      mrr: revenue.mrr,
      topDecision,
    },
    generatedAt: new Date().toISOString(),
  };
}

export async function generateFinanceDirectorReport(
  health: FinanceHealth,
  revenue: RevenueData,
  costs: CostData,
  profit: ProfitData,
  unitEco: UnitEconomics,
  forecast: ForecastData,
  saas: SaaSMetrics,
): Promise<FinanceDirectorReport> {
  if (!OR_KEY) {
    return buildFallback(health, revenue, costs, profit, unitEco, forecast, saas);
  }
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
        messages: [{ role: "user", content: buildPrompt(health, revenue, profit, unitEco, forecast) }],
        temperature: 0.4,
        max_tokens: 900,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) return buildFallback(health, revenue, costs, profit, unitEco, forecast, saas);

    const data  = await res.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed  = JSON.parse(cleaned);

    return {
      summary: parsed.summary ?? "",
      health,
      revenue,
      costs,
      profit,
      unitEconomics: unitEco,
      forecast,
      saas,
      recommendations: parsed.recommendations ?? [],
      ceoSummary: {
        revenue: revenue.total,
        profit: profit.profit,
        margin: profit.margin,
        mrr: revenue.mrr,
        topDecision: parsed.topDecision ?? "",
      },
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return buildFallback(health, revenue, costs, profit, unitEco, forecast, saas);
  }
}
