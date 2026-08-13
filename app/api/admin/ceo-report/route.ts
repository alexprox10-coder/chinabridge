import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getLLMConfig } from "@/lib/ai/client";
import { getDashboardStats, getLeads } from "@/lib/crm/client";
import { analyzeDealIntelligence } from "@/lib/market-intelligence/deal-intelligence";

function auth(req: NextRequest) {
  return req.cookies.get("cb_admin")?.value || req.cookies.get("cb_tenant_session")?.value;
}

async function ensureTable() {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    CREATE TABLE IF NOT EXISTS ceo_daily_reports (
      id         SERIAL PRIMARY KEY,
      date       TEXT NOT NULL UNIQUE,
      priorities JSONB NOT NULL DEFAULT '[]',
      alerts     JSONB NOT NULL DEFAULT '[]',
      insights   JSONB NOT NULL DEFAULT '[]',
      summary    TEXT NOT NULL DEFAULT '',
      stats      JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  return sql;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const sql = await ensureTable();
  const today = new Date().toISOString().slice(0, 10);
  const rows = await sql`SELECT * FROM ceo_daily_reports WHERE date = ${today} LIMIT 1` as Array<Record<string, unknown>>;

  if (!rows[0]) return NextResponse.json({ ok: true, report: null });

  const r = rows[0];
  return NextResponse.json({
    ok: true,
    report: {
      date:       r.date,
      priorities: r.priorities,
      alerts:     r.alerts,
      insights:   r.insights,
      summary:    r.summary,
      stats:      r.stats,
      createdAt:  r.created_at,
    },
  });
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { baseURL, apiKey, model } = getLLMConfig();
  if (!apiKey) return NextResponse.json({ ok: false, error: "no_api_key" }, { status: 500 });

  const sql = await ensureTable();

  // Собираем данные
  let stats: Record<string, unknown> = {};
  let hotLeads: Array<{ company?: string; name?: string; phone?: string; status?: string }> = [];
  let unansweredCount = 0;
  let dealSummary = { total: 0, hot: 0, pipeline: 0 };

  try {
    const [dashStats, leads] = await Promise.all([getDashboardStats(), getLeads()]);
    stats = dashStats as unknown as Record<string, unknown>;

    const now = Date.now();
    const unanswered = leads.filter(l =>
      l.status === "NEW" && now - new Date(l.created_at || 0).getTime() > 24 * 3600000
    );
    unansweredCount = unanswered.length;
    hotLeads = leads
      .filter(l => l.priority === "HOT")
      .slice(0, 5)
      .map(l => ({ company: l.company || l.name || "—", name: l.name, phone: l.phone, status: l.status }));

    const di = analyzeDealIntelligence(leads);
    dealSummary = { total: di.deals.length, hot: di.urgentDeals.length, pipeline: di.totalPipeline };
  } catch {}

  // SEO count
  let seoCount = 0;
  try {
    const seoRows = await sql`SELECT COUNT(*)::int AS n FROM seo_keywords_dynamic` as Array<{ n: number }>;
    seoCount = 201 + (seoRows[0]?.n ?? 0); // 201 static + dynamic
  } catch {}

  const today = new Date().toISOString().slice(0, 10);
  const weekday = new Date().toLocaleDateString("ru-RU", { weekday: "long" });

  const systemPrompt = `Ты AI-советник CEO компании ChinaBridge — B2B импорт из Китая для СНГ.
Пиши лаконично, конкретно, по делу. Ответ ТОЛЬКО JSON без markdown.`;

  const userPrompt = `Сегодня ${today} (${weekday}). Данные компании:

ЛИДЫ:
- Всего: ${(stats.total as number) ?? 0}
- HOT: ${hotLeads.length} (${hotLeads.map(l => l.company).join(", ") || "—"})
- Без ответа >24ч: ${unansweredCount}
- Конверсия: ${(stats.conversion as number) ?? 0}%
- Выручка: $${(stats.total_revenue as number) ?? 0}
- Потенциал: $${(stats.potential_value as number) ?? 0}

СДЕЛКИ:
- Всего в воронке: ${dealSummary.total}
- Срочных: ${dealSummary.hot}
- Сумма pipeline: $${dealSummary.pipeline}

SEO:
- Ключевых запросов в базе: ${seoCount}
- Статус: карта из 200+ ключей, крон добавляет 8/день

Сформируй CEO Daily Briefing:
{
  "summary": "1-2 предложения: главное за сегодня",
  "priorities": [
    { "n": 1, "action": "конкретное действие", "reason": "почему важно", "emoji": "🔥" },
    { "n": 2, "action": "...", "reason": "...", "emoji": "📞" },
    { "n": 3, "action": "...", "reason": "...", "emoji": "📈" }
  ],
  "alerts": [
    { "type": "warning|info|success", "text": "..." }
  ],
  "insights": [
    { "label": "...", "value": "...", "trend": "up|down|stable" }
  ]
}`;

  let report = { priorities: [], alerts: [], insights: [], summary: "" };

  try {
    const res = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://chinabridge.pro",
        "X-Title": "ChinaBridge CEO Report",
      },
      body: JSON.stringify({
        model, temperature: 0.4, max_tokens: 1000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(45000),
    });
    if (!res.ok) throw new Error(`llm_${res.status}`);
    const data = await res.json();
    report = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }

  const statsToSave = {
    total: stats.total, hot: hotLeads.length, unanswered: unansweredCount,
    conversion: stats.conversion, revenue: stats.total_revenue,
    pipeline: dealSummary.pipeline, seoCount,
  };

  await sql`
    INSERT INTO ceo_daily_reports (date, priorities, alerts, insights, summary, stats)
    VALUES (${today}, ${JSON.stringify(report.priorities ?? [])}, ${JSON.stringify(report.alerts ?? [])},
            ${JSON.stringify(report.insights ?? [])}, ${report.summary ?? ""},
            ${JSON.stringify(statsToSave)})
    ON CONFLICT (date) DO UPDATE
      SET priorities = EXCLUDED.priorities, alerts = EXCLUDED.alerts,
          insights = EXCLUDED.insights, summary = EXCLUDED.summary,
          stats = EXCLUDED.stats, created_at = NOW()
  `;

  return NextResponse.json({
    ok: true,
    report: { date: today, priorities: report.priorities, alerts: report.alerts, insights: report.insights, summary: report.summary, stats: statsToSave },
  });
}
