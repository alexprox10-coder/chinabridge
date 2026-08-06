import type { ImportLeadEnhanced, PlatformLead, PipelineHealth, FollowupItem, SalesKPI, SalesRecommendation, SalesTask } from "./types";

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY ?? "";
const OR_MODEL = "anthropic/claude-haiku-4.5";
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";

export interface DirectorAnalysis {
  summary: string;
  recommendations: SalesRecommendation[];
  tasks: SalesTask[];
}

function buildFallback(kpis: SalesKPI, pipeline: PipelineHealth): DirectorAnalysis {
  const recs: SalesRecommendation[] = [];
  const tasks: SalesTask[] = [];

  if (kpis.importLeadsHot > 0) {
    recs.push({
      id: "rec_1",
      problem: `${kpis.importLeadsHot} горячих лидов из Import Finder без контакта`,
      analysis: `Лиды с оценкой 4-5 звёзд найдены, но не обработаны менеджером.`,
      action: "Связаться с HOT лидами сегодня, предложить бесплатный расчёт доставки",
      priority: "HIGH",
    });
    tasks.push({
      id: "task_1",
      title: `Обработать ${kpis.importLeadsHot} горячих лидов`,
      description: "Открыть Import Leads, отфильтровать HOT, отправить персональное сообщение каждому",
      priority: "HIGH",
      deadline: "Сегодня",
      status: "pending",
    });
  }

  if (pipeline.stale7d > 2) {
    recs.push({
      id: "rec_2",
      problem: `${pipeline.stale7d} сделок без активности более 7 дней`,
      analysis: "Зависшие сделки снижают конверсию и занимают место в воронке.",
      action: "Связаться с каждым, уточнить статус. Если нет интереса — закрыть как LOST",
      priority: "HIGH",
    });
    tasks.push({
      id: "task_2",
      title: "Follow-up по зависшим сделкам",
      description: `Обзвонить ${pipeline.stale7d} клиентов без активности за последние 7 дней`,
      priority: "HIGH",
      deadline: "2 дня",
      status: "pending",
    });
  }

  if (kpis.platformLeadsTotal === 0) {
    recs.push({
      id: "rec_3",
      problem: "База Platform Leads пуста",
      analysis: "Нет потенциальных покупателей платформы ChinaBridge.",
      action: "Добавить первые 10 карго-компаний вручную, оценить их потребности",
      priority: "MEDIUM",
    });
  }

  if (kpis.conversion < 10) {
    recs.push({
      id: "rec_4",
      problem: `Конверсия в сделку ${kpis.conversion}% — ниже нормы`,
      analysis: "Цель: 15-20%. Причина: возможно нет квалификации лидов на входе.",
      action: "Добавить квалификацию на этапе первого контакта. Спрашивать бюджет и срок.",
      priority: "MEDIUM",
    });
  }

  const summary = `Отдел продаж: ${kpis.importLeadsTotal} лидов в Import Finder (${kpis.importLeadsHot} горячих), ${kpis.newLeads} новых заявок, ${kpis.deals} сделок. Конверсия ${kpis.conversion}%. ${pipeline.problems.length > 0 ? "Есть проблемы: " + pipeline.problems[0] : "Воронка в норме."}`;

  return { summary, recommendations: recs, tasks };
}

export async function generateSalesDirectorReport(
  kpis: SalesKPI,
  pipeline: PipelineHealth,
  importLeads: ImportLeadEnhanced[],
  platformLeads: PlatformLead[],
  followupQueue: FollowupItem[]
): Promise<DirectorAnalysis> {
  if (!OPENROUTER_KEY) return buildFallback(kpis, pipeline);

  const topLeads = importLeads.slice(0, 5).map(l => ({
    company: l.company,
    category: l.category,
    score100: l.score100,
    temperature: l.temperature,
    why: l.why?.slice(0, 100),
  }));

  const prompt = `Ты Sales Director AI компании ChinaBridge — сервиса импорта товаров из Китая.

KPI отдела:
- Новых заявок: ${kpis.newLeads}
- Горячих лидов (CRM): ${kpis.hotLeads}
- В переговорах: ${kpis.negotiation}
- КП отправлено: ${kpis.proposals}
- Сделок: ${kpis.deals}
- Выручка: ₽${kpis.revenue.toLocaleString()}
- Конверсия: ${kpis.conversion}%
- Import Finder лидов: ${kpis.importLeadsTotal} (горячих: ${kpis.importLeadsHot})
- Platform Leads: ${kpis.platformLeadsTotal}

Pipeline:
- Активных сделок: ${pipeline.active}
- Зависших (>7 дней): ${pipeline.stale7d}
- Горячих лидов CRM: ${pipeline.hot}
- Проблемы: ${pipeline.problems.join("; ") || "нет"}

Топ лидов из Import Finder:
${JSON.stringify(topLeads, null, 2)}

Follow-up очередь: ${followupQueue.length} лидов требуют контакта

Создай отчёт Sales Director в JSON (ТОЛЬКО JSON):
{
  "summary": "3-4 предложения — оценка состояния отдела продаж по-русски",
  "recommendations": [
    {
      "id": "rec_1",
      "problem": "Конкретная проблема отдела",
      "analysis": "Почему это проблема, цифры",
      "action": "Конкретное действие",
      "priority": "HIGH|MEDIUM|LOW"
    }
  ],
  "tasks": [
    {
      "id": "task_1",
      "title": "Краткое название",
      "description": "Что делать конкретно",
      "priority": "HIGH|MEDIUM|LOW",
      "deadline": "Сегодня|2 дня|7 дней|14 дней",
      "status": "pending"
    }
  ]
}

Требования: 3-5 рекомендаций, 3-5 задач, всё на русском.`;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://chinabridge.pro",
        "X-Title": "ChinaBridge Sales Director AI",
      },
      body: JSON.stringify({
        model: OR_MODEL,
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return buildFallback(kpis, pipeline);
    const data = await res.json();
    const text: string = data.choices?.[0]?.message?.content ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return buildFallback(kpis, pipeline);
    const parsed = JSON.parse(match[0]) as DirectorAnalysis;
    return parsed;
  } catch {
    return buildFallback(kpis, pipeline);
  }
}

export async function notifyHotLeads(leads: ImportLeadEnhanced[]): Promise<number> {
  if (!BOT_TOKEN || !CHAT_ID) return 0;
  // Отправлять HOT + WARM (score >= 40 из 100, т.е. оценка >= 2)
  const toNotify = leads
    .filter(l => l.temperature === "HOT" || l.temperature === "WARM")
    .slice(0, 10);
  let sent = 0;
  for (const lead of toNotify) {
    const tempIcon = lead.temperature === "HOT" ? "🔥" : "🌡️";
    const text =
      `${tempIcon} *Sales Alert — ${lead.temperature === "HOT" ? "Горячий" : "Тёплый"} лид*\n\n` +
      `Компания: *${lead.company}*\n` +
      `Категория: ${lead.category}\n` +
      `Город: ${lead.city}\n` +
      `Score: ${lead.score100}/100 ⭐\n` +
      `Вероятность: ${lead.probability}%\n\n` +
      `Почему: ${lead.why?.slice(0, 120) ?? "—"}\n\n` +
      `Предложение: ${lead.offer?.slice(0, 120) ?? "—"}\n\n` +
      `Действие: ${lead.nextAction}\n` +
      `${lead.phone ? `📞 ${lead.phone}` : ""}${lead.telegram ? ` | @${lead.telegram.replace("@","")}` : ""}\n` +
      `🌐 ${lead.website}`;
    try {
      await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(text)}&parse_mode=Markdown&disable_web_page_preview=true`,
        { signal: AbortSignal.timeout(5000) }
      );
      sent++;
    } catch {
      // ignore
    }
  }
  return sent;
}
