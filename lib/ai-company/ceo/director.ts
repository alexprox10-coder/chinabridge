import type { DeptSummary, CeoAiReport, CeoMetrics } from "./types";

const OR_BASE  = "https://openrouter.ai/api/v1";
const OR_KEY   = process.env.OPENROUTER_API_KEY ?? "";
const OR_MODEL = process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash";

function buildPrompt(score: number, depts: DeptSummary[], m: CeoMetrics): string {
  const connected = depts.filter(d => d.status !== "IDLE");
  const critical  = depts.filter(d => d.status === "CRITICAL");
  const today = new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const deptLines = connected.map(d =>
    `- ${d.nameRu} (${d.status}): ${d.kpis[0]?.label} ${d.kpis[0]?.value}. Рек: ${d.recommendations[0] ?? "—"}`
  ).join("\n");

  const problems = depts.flatMap(d => d.problems.map(p => `${d.nameRu}: ${p}`)).slice(0, 5).join("\n");
  const opps     = connected.flatMap(d => d.recommendations).slice(0, 4).join("\n");

  return `Ты — CEO AI системы ChinaBridge (B2B-импорт из Китая в СНГ).
Сегодня: ${today}
Company Health: ${score}/100 | Отделов: ${connected.length}/${depts.length}
Выручка: ${m.revenue} | MRR: ${m.mrr} | Лиды: ${m.leads} | Сделки: ${m.activeDeals}

Отделы:
${deptLines}

Критические проблемы:
${critical.length > 0 ? critical.flatMap(d => d.problems).slice(0, 3).join("\n") : "Нет критических проблем"}

Ключевые возможности:
${opps}

Генерируй CEO ежедневный брифинг. ТОЛЬКО JSON (без markdown):
{
  "morningBriefing": "3-4 предложения — состояние компании и главный приоритет дня",
  "highlights": ["3 позитивных события или показателя за последнее время"],
  "problems": ["3 главные проблемы требующие действий CEO"],
  "opportunities": ["3 главные возможности для роста"],
  "todayActions": ["5 конкретных приоритетных действий CEO на сегодня"]
}`;
}

function buildFallback(score: number, depts: DeptSummary[], m: CeoMetrics): CeoAiReport {
  const connected = depts.filter(d => d.status !== "IDLE");
  const critical  = depts.filter(d => d.status === "CRITICAL");
  const good      = depts.filter(d => d.status === "GOOD");
  const topRecs   = connected.flatMap(d => d.recommendations).filter(Boolean).slice(0, 5);
  const topProbs  = depts.filter(d => d.problems.length > 0)
    .map(d => `${d.nameRu}: ${d.problems[0]}`).slice(0, 3);

  return {
    morningBriefing:
      `Компания ChinaBridge — Health ${score}/100. ` +
      `Подключено ${connected.length} из ${depts.length} отделов. ` +
      (critical.length > 0
        ? `Требуют внимания: ${critical.map(d => d.nameRu).join(", ")}.`
        : `${good.length} отделов в состоянии GOOD.`) +
      ` Лидов: ${m.leads}, активных сделок: ${m.activeDeals}.`,
    highlights: [
      `${good.length}/${connected.length} отделов работают в режиме GOOD`,
      m.leads > 0 ? `${m.leads} лидов в базе продаж` : "AI Company OS полностью активна",
      `${connected.map(d => d.agents.filter(a => a.connected).length).reduce((a, b) => a + b, 0)} AI-агентов активны`,
    ],
    problems: topProbs.length > 0 ? topProbs : ["Нет критических проблем — поддерживать текущие показатели"],
    opportunities: topRecs.slice(0, 3),
    todayActions: [
      ...topRecs.slice(0, 3),
      "Проверить KPI всех отделов и обновить цели",
      "Одобрить приоритетные решения в Decision Center",
    ].slice(0, 5),
  };
}

export async function generateCeoAiReport(
  healthScore: number,
  depts: DeptSummary[],
  metrics: CeoMetrics,
): Promise<CeoAiReport> {
  if (!OR_KEY) return buildFallback(healthScore, depts, metrics);

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
        messages: [{ role: "user", content: buildPrompt(healthScore, depts, metrics) }],
        temperature: 0.6,
        max_tokens: 800,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return buildFallback(healthScore, depts, metrics);
    const data   = await res.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";
    const clean  = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const p      = JSON.parse(clean);
    return {
      morningBriefing: p.morningBriefing ?? "",
      highlights:      p.highlights      ?? [],
      problems:        p.problems        ?? [],
      opportunities:   p.opportunities   ?? [],
      todayActions:    p.todayActions    ?? [],
    };
  } catch {
    return buildFallback(healthScore, depts, metrics);
  }
}
