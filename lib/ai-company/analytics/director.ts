import type {
  SalesAnalytics, MarketingAnalytics, ContentAnalytics, FinanceAnalytics,
  CompanyHealth, BIInsight, AnalyticsRecommendation, AnalyticsDirectorReport,
} from "./types";

const OR_BASE  = "https://openrouter.ai/api/v1";
const OR_KEY   = process.env.OPENROUTER_API_KEY ?? "";
const OR_MODEL = process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash";

function buildPrompt(
  health: CompanyHealth,
  sales: SalesAnalytics,
  marketing: MarketingAnalytics,
  content: ContentAnalytics,
  finance: FinanceAnalytics,
  insights: BIInsight[],
): string {
  return `Ты — Analytics Director AI компании ChinaBridge (B2B-импорт из Китая).
Твоя роль: генерировать CEO Daily BI Report на основе данных всех отделов.

COMPANY HEALTH SCORE: ${health.score}/100 (${health.status})
- Продажи: ${sales.score}/100 | Лидов: ${sales.totalLeads} | HOT: ${sales.hotLeads} | Конверсия: ${sales.conversion}%
- Маркетинг: ${marketing.score}/100 | Трафик: ${marketing.visitors.toLocaleString()} | Лидов: ${marketing.leads} | CPL: ${marketing.cpl}₽
- Контент: ${content.score}/100 | Материалов: ${content.totalMaterials} | Просмотров: ${content.totalViews.toLocaleString()}
- Финансы: ${finance.score}/100 | ${finance.connected ? `Выручка: ${finance.revenue}₽ | Прибыль: ${finance.netProfit}₽ | Маржа: ${finance.margin}%` : "Данные не подключены"}

BI INSIGHTS (${insights.length} сигналов):
${insights.slice(0, 4).map(i => `- [${i.type.toUpperCase()}] ${i.title}: ${i.dataPoint}`).join("\n")}

Ответь ТОЛЬКО JSON (без markdown):
{
  "summary": "2-3 предложения — общая картина бизнеса сегодня",
  "bestDepartment": "название лучшего отдела",
  "problemDepartment": "название проблемного отдела",
  "todayActions": ["действие 1", "действие 2", "действие 3"],
  "recommendations": [
    {
      "id": "r1",
      "problem": "проблема",
      "cause": "причина",
      "solution": "решение",
      "department": "отдел",
      "priority": "HIGH",
      "deadline": "сегодня / 3 дня / неделя"
    }
  ]
}`;
}

function buildFallback(
  health: CompanyHealth,
  sales: SalesAnalytics,
  marketing: MarketingAnalytics,
  content: ContentAnalytics,
  finance: FinanceAnalytics,
  insights: BIInsight[],
): AnalyticsDirectorReport {
  const recs: AnalyticsRecommendation[] = [
    {
      id: "r1",
      problem: `${sales.staleLeads} лидов без обработки`,
      cause: "Отсутствие SLA на обработку входящих заявок",
      solution: "Ввести правило: HOT-лид — контакт в течение 2 часов. Настроить Telegram-уведомление.",
      department: "Sales",
      priority: "HIGH",
      deadline: "сегодня",
    },
    {
      id: "r2",
      problem: `Конверсия сайта ${((marketing.leads / Math.max(marketing.visitors, 1)) * 100).toFixed(2)}%`,
      cause: "Отсутствие CTA и лид-магнита на ключевых страницах",
      solution: "Добавить pop-up с калькулятором на главную + кнопку «Получить КП» в шапку.",
      department: "Marketing",
      priority: "HIGH",
      deadline: "3 дня",
    },
    {
      id: "r3",
      problem: "Shorts выходят нерегулярно",
      cause: "Нет ежедневного автоматического триггера публикации",
      solution: "Запустить Shorts AI на базе готового пула 10 сценариев. Цель: 1 Shorts/день.",
      department: "Content",
      priority: "MEDIUM",
      deadline: "неделя",
    },
    {
      id: "r4",
      problem: !finance.connected ? "Finance Module отключён" : `Маржа ${finance.margin}%`,
      cause: !finance.connected ? "Данные о сделках не вносятся в систему" : "Высокие операционные расходы",
      solution: !finance.connected
        ? "Начать вести таблицу finance_orders: каждая закрытая сделка = запись"
        : "Аудит расходов: оптимизировать логистику и комиссии платформ",
      department: "Finance",
      priority: "HIGH",
      deadline: !finance.connected ? "сегодня" : "неделя",
    },
  ];

  const todayActions = [
    `Проверить и обработать ${sales.hotLeads} HOT-лидов в CRM`,
    "Запустить ежедневный Shorts AI по готовому сценарию",
    `${insights[0]?.recommendation ?? "Провести анализ конкурентов по ключевым запросам"}`,
  ];

  const bestDept = health.departments.reduce((a, b) => a.score > b.score ? a : b);
  const worstDept = health.departments.reduce((a, b) => a.score < b.score ? a : b);

  const summary = `Company Health Score: ${health.score}/100 (${health.status}). ` +
    `Лучший отдел — ${bestDept.name} (${bestDept.score}/100). ` +
    `Требует внимания — ${worstDept.name} (${worstDept.score}/100).`;

  return {
    summary,
    health,
    sales,
    marketing,
    content,
    finance,
    insights,
    recommendations: recs,
    bestDepartment: bestDept.name,
    problemDepartment: worstDept.name,
    todayActions,
    generatedAt: new Date().toISOString(),
  };
}

export async function generateAnalyticsDirectorReport(
  health: CompanyHealth,
  sales: SalesAnalytics,
  marketing: MarketingAnalytics,
  content: ContentAnalytics,
  finance: FinanceAnalytics,
  insights: BIInsight[],
): Promise<AnalyticsDirectorReport> {
  if (!OR_KEY) return buildFallback(health, sales, marketing, content, finance, insights);

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
        messages: [{ role: "user", content: buildPrompt(health, sales, marketing, content, finance, insights) }],
        temperature: 0.4,
        max_tokens: 1200,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) return buildFallback(health, sales, marketing, content, finance, insights);

    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      summary: parsed.summary ?? "",
      health,
      sales,
      marketing,
      content,
      finance,
      insights,
      recommendations: parsed.recommendations ?? [],
      bestDepartment: parsed.bestDepartment ?? "",
      problemDepartment: parsed.problemDepartment ?? "",
      todayActions: parsed.todayActions ?? [],
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return buildFallback(health, sales, marketing, content, finance, insights);
  }
}
