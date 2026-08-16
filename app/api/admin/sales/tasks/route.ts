import { NextRequest, NextResponse } from "next/server";
import { getLLMConfig } from "@/lib/ai/client";
import { getLeads } from "@/lib/crm/client";
import { getAllLeads } from "@/lib/import-leads/crm";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(req: NextRequest) {
  return !!(req.cookies.get("cb_admin")?.value || req.cookies.get("cb_tenant_session")?.value);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [crmLeads, importLeads] = await Promise.all([
    getLeads().catch(() => []),
    getAllLeads("chinabridge").catch(() => []),
  ]);

  const now = Date.now();
  const unanswered = crmLeads.filter(l =>
    l.status === "NEW" && now - new Date(l.created_at || 0).getTime() > 24 * 3600000
  );
  const inNegotiation = crmLeads.filter(l => l.status === "NEGOTIATION");
  const offerSent = crmLeads.filter(l => l.status === "OFFER_SENT");
  const hotImport = importLeads.filter(l => l.score >= 4 && l.status === "new").slice(0, 5);

  const { baseURL, apiKey, model } = getLLMConfig();
  if (!apiKey) return NextResponse.json({ tasks: fallbackTasks(unanswered, inNegotiation, hotImport) });

  const context = {
    date: new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" }),
    unanswered: unanswered.map(l => ({ name: l.name, product: l.product, hours: Math.round((now - new Date(l.created_at).getTime()) / 3600000) })),
    negotiation: inNegotiation.map(l => ({ name: l.name, product: l.product, value: l.estimated_value })),
    offerSent: offerSent.map(l => ({ name: l.name, product: l.product })),
    hotLeads: hotImport.map(l => ({ company: l.company, category: l.category, score: l.score, offer: l.offer })),
  };

  const res = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://chinabridge.pro",
      "X-Title": "ChinaBridge Sales Tasks",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Ты Sales Manager ChinaBridge. Генерируй ежедневный список задач на основе данных CRM.
Возвращай ТОЛЬКО JSON: { "tasks": [ { "id": 1, "priority": "HIGH"|"MEDIUM"|"LOW", "type": "CALL"|"MESSAGE"|"PROPOSAL"|"FOLLOWUP"|"RESEARCH", "title": "...", "description": "...", "lead": "имя клиента или компании" } ] }
Максимум 8 задач, отсортированных по приоритету.`,
        },
        {
          role: "user",
          content: `Данные на ${context.date}:\n${JSON.stringify(context, null, 2)}\n\nСгенерируй задачи на сегодня.`,
        },
      ],
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) return NextResponse.json({ tasks: fallbackTasks(unanswered, inNegotiation, hotImport) });

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw);
  return NextResponse.json({ tasks: parsed.tasks ?? [] });
}

function fallbackTasks(
  unanswered: Array<{ name: string; product: string; created_at?: string }>,
  negotiation: Array<{ name: string; product: string }>,
  hotLeads: Array<{ company: string; offer: string }>
) {
  const tasks = [];
  let id = 1;
  for (const l of unanswered.slice(0, 3)) {
    tasks.push({ id: id++, priority: "HIGH", type: "CALL", title: `Связаться с ${l.name}`, description: `Лид без ответа более 24 часов. Товар: ${l.product}`, lead: l.name });
  }
  for (const l of negotiation.slice(0, 2)) {
    tasks.push({ id: id++, priority: "HIGH", type: "FOLLOWUP", title: `Follow-up: ${l.name}`, description: `Активные переговоры. Товар: ${l.product}`, lead: l.name });
  }
  for (const l of hotLeads.slice(0, 3)) {
    tasks.push({ id: id++, priority: "MEDIUM", type: "MESSAGE", title: `Написать ${l.company}`, description: `Горячий лид (score 4+). Предложение: ${l.offer}`, lead: l.company });
  }
  return tasks;
}
