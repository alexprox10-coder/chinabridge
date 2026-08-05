import type { DepartmentReport, CompanyMetrics, CeoRecommendation, CeoTask, DeptStatus } from "./types";

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY ?? "";
const OR_MODEL = "anthropic/claude-haiku-4.5";

export interface CeoAnalysis {
  companyHealth: DeptStatus;
  healthScore: number;
  summary: string;
  recommendations: CeoRecommendation[];
  tasks: CeoTask[];
}

function buildFallbackAnalysis(departments: DepartmentReport[], metrics: CompanyMetrics): CeoAnalysis {
  const criticalDepts = departments.filter(d => d.status === "CRITICAL");
  const warningDepts = departments.filter(d => d.status === "WARNING");
  const idleDepts = departments.filter(d => d.status === "IDLE");
  const connectedDepts = departments.filter(d => d.status !== "IDLE").length;

  const health: DeptStatus = criticalDepts.length > 0 ? "CRITICAL" : warningDepts.length > 2 ? "WARNING" : "WARNING";
  const score = Math.max(20, Math.round(
    (connectedDepts / departments.length) * 50 +
    (metrics.leads > 20 ? 30 : metrics.leads > 5 ? 15 : 5) +
    (criticalDepts.length === 0 ? 20 : 0)
  ));

  const recs: CeoRecommendation[] = [];
  const tasks: CeoTask[] = [];

  if (metrics.leads < 10) {
    recs.push({
      id: "rec_1",
      problem: "Недостаточно лидов в воронке продаж",
      analysis: `В базе только ${metrics.leads} лидов — для выхода на операционную прибыль нужно минимум 50.`,
      action: "Запустить ежедневный Import Client Finder и настроить Platform Sales Finder",
      owner: "Sales Department",
      priority: "HIGH",
    });
    tasks.push({
      id: "task_1",
      title: "Запустить автоматический поиск лидов",
      description: "Активировать Vercel Cron для ежедневного запуска Import Client Finder в 09:00 МСК",
      department: "Sales Department",
      priority: "HIGH",
      deadline: "3 дня",
      status: "pending",
    });
  }

  if (idleDepts.length > 4) {
    recs.push({
      id: "rec_2",
      problem: `${idleDepts.length} из 8 отделов не подключены к AI OS`,
      analysis: "Без данных из отделов CEO AI не может анализировать компанию целостно.",
      action: "Приоритетно подключить Marketing и Analytics отделы",
      owner: "Operations Department",
      priority: "MEDIUM",
    });
    tasks.push({
      id: "task_2",
      title: "Подключить Marketing агента",
      description: "Интегрировать Яндекс.Директ / VK Реклама API для получения метрик рекламы",
      department: "Marketing Department",
      priority: "MEDIUM",
      deadline: "14 дней",
      status: "pending",
    });
  }

  recs.push({
    id: "rec_3",
    problem: "Нет данных о выручке и конверсии воронки",
    analysis: "Revenue = 0, Profit = 0 — финансовые показатели недоступны.",
    action: "Подключить финансовые таблицы n8n и CRM для отслеживания выручки",
    owner: "Analytics Department",
    priority: "HIGH",
  });

  const summary = criticalDepts.length > 0
    ? `Компания в критическом состоянии: ${criticalDepts.map(d => d.nameRu).join(", ")} требуют немедленного внимания. Подключено ${connectedDepts} из 8 отделов.`
    : `Система запущена. Подключено ${connectedDepts} из 8 отделов. ${metrics.leads} лидов в базе. Приоритет — расширение воронки продаж и подключение остальных отделов.`;

  return { companyHealth: health, healthScore: score, summary, recommendations: recs, tasks };
}

export async function generateCeoReport(
  departments: DepartmentReport[],
  metrics: CompanyMetrics
): Promise<CeoAnalysis> {
  if (!OPENROUTER_KEY) return buildFallbackAnalysis(departments, metrics);

  const deptSummary = departments.map(d => ({
    name: d.nameRu,
    status: d.status,
    agents_connected: d.agents.filter(a => a.connected).length,
    total_agents: d.agents.length,
    key_kpis: d.kpis.slice(0, 3).map(k => `${k.label}: ${k.value}`).join(", "),
    problems: d.problems.join("; ") || "нет",
  }));

  const prompt = `Ты CEO AI системы ChinaBridge — компании по услугам импорта из Китая для малого и среднего бизнеса.

Данные компании:
- Лидов в базе: ${metrics.leads}
- Активных сделок: ${metrics.activeDeals}
- Выручка: ${metrics.revenue > 0 ? `₽${metrics.revenue.toLocaleString()}` : "нет данных"}
- Подключённые отделы: ${departments.filter(d => d.status !== "IDLE").length} из 8

Состояние отделов:
${JSON.stringify(deptSummary, null, 2)}

Создай CEO-отчёт в JSON (ТОЛЬКО JSON, без markdown):
{
  "companyHealth": "GOOD|WARNING|CRITICAL",
  "healthScore": число 0-100,
  "summary": "2-3 предложения — общая оценка ситуации по-русски",
  "recommendations": [
    {
      "id": "rec_1",
      "problem": "Конкретная проблема",
      "analysis": "1-2 предложения — почему это проблема, цифры",
      "action": "Конкретное действие для решения",
      "owner": "Название отдела",
      "priority": "HIGH|MEDIUM|LOW"
    }
  ],
  "tasks": [
    {
      "id": "task_1",
      "title": "Краткое название задачи",
      "description": "Что нужно сделать конкретно",
      "department": "Название отдела",
      "priority": "HIGH|MEDIUM|LOW",
      "deadline": "3 дня|7 дней|14 дней|30 дней",
      "status": "pending"
    }
  ]
}

Требования:
- 3-5 рекомендаций, от критичных к менее важным
- 3-5 задач с чёткими дедлайнами
- Всё на русском языке
- Конкретные числа и факты`;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://chinabridge.pro",
        "X-Title": "ChinaBridge AI Company OS",
      },
      body: JSON.stringify({
        model: OR_MODEL,
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) return buildFallbackAnalysis(departments, metrics);
    const data = await res.json();
    const text: string = data.choices?.[0]?.message?.content ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return buildFallbackAnalysis(departments, metrics);

    const parsed = JSON.parse(jsonMatch[0]) as CeoAnalysis;
    parsed.healthScore = Math.max(0, Math.min(100, Number(parsed.healthScore) || 50));
    if (!["GOOD", "WARNING", "CRITICAL", "IDLE"].includes(parsed.companyHealth)) {
      parsed.companyHealth = "WARNING";
    }
    return parsed;
  } catch {
    return buildFallbackAnalysis(departments, metrics);
  }
}
