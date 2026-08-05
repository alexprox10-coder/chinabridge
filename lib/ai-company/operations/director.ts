import type {
  OperationsHealth, OperationsKPIs, Deal, Partner, CargoItem,
  DocumentRecord, ClientRecord, RiskAlert, OperationsRecommendation,
  OperationsDirectorReport,
} from "./types";

const OR_BASE  = "https://openrouter.ai/api/v1";
const OR_KEY   = process.env.OPENROUTER_API_KEY ?? "";
const OR_MODEL = process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash";

function buildPrompt(
  health: OperationsHealth,
  kpis: OperationsKPIs,
  risks: RiskAlert[],
  deals: Deal[],
  clients: ClientRecord[],
): string {
  const highRisks = risks.filter(r => r.priority === "HIGH");
  return `Ты — Operations Director AI компании ChinaBridge (B2B-импорт из Китая).
Генерируй краткий CEO-отчёт по операционному отделу.

HEALTH: ${health.score}/100 (${health.status})
KPIs: активных сделок ${kpis.activeDeals}, грузов ${kpis.activeCargo}, на таможне ${kpis.inCustoms}, доставлено ${kpis.delivered}
HIGH рисков: ${highRisks.length}
Проблемы: ${health.risks.join("; ")}
Клиентов без контакта >10 дней: ${clients.filter(c => c.lastContactDays >= 10).length}

Главные риски:
${highRisks.slice(0, 3).map(r => `- ${r.title}: ${r.description.slice(0, 100)}`).join("\n")}

Ответь ТОЛЬКО JSON (без markdown):
{
  "summary": "2-3 предложения — состояние операций сегодня",
  "topAction": "самое важное действие прямо сейчас (1 предложение)",
  "recommendations": [
    {"id":"r1","text":"текст","priority":"HIGH","department":"Operations","deadline":"сегодня"}
  ]
}`;
}

function buildFallback(
  health: OperationsHealth,
  kpis: OperationsKPIs,
  deals: Deal[],
  partners: Partner[],
  cargos: CargoItem[],
  documents: DocumentRecord[],
  clients: ClientRecord[],
  risks: RiskAlert[],
): OperationsDirectorReport {
  const highRisks = risks.filter(r => r.priority === "HIGH");
  const atRiskClients = clients.filter(c => c.lastContactDays >= 10);

  const recs: OperationsRecommendation[] = [
    ...(highRisks.length > 0 ? [{
      id: "r1",
      text: highRisks[0].solution,
      priority: "HIGH" as const,
      department: "Operations",
      deadline: "сегодня",
    }] : []),
    ...(atRiskClients.length > 0 ? [{
      id: "r2",
      text: `Связаться с ${atRiskClients.map(c => c.name).join(", ")} — нет контакта ${Math.max(...atRiskClients.map(c => c.lastContactDays))} дней`,
      priority: "HIGH" as const,
      department: "Client Success",
      deadline: "сегодня",
    }] : []),
    {
      id: "r3",
      text: `Проверить статус ${documents.filter(d => d.status === "MISSING").length} отсутствующих документов`,
      priority: "HIGH" as const,
      department: "Documents AI",
      deadline: "48 часов",
    },
    {
      id: "r4",
      text: `Запросить подтверждение у ${partners.filter(p => p.status === "AT_RISK").map(p => p.name).join(", ")}`,
      priority: "MEDIUM" as const,
      department: "China Partner AI",
      deadline: "3 дня",
    },
  ];

  const delivered = deals.filter(d => d.status === "DELIVERED").length;
  const shipping  = cargos.filter(c => c.status === "SHIPPING").length;

  const summary =
    `Operations Health: ${health.score}/100 (${health.status}). ` +
    `Активных сделок: ${kpis.activeDeals}, грузов в пути: ${shipping}. ` +
    (highRisks.length > 0
      ? `Требуют немедленного внимания: ${highRisks.length} критических риска.`
      : `Критических рисков нет. ${delivered} сделок успешно завершено.`);

  const topAction = highRisks[0]?.solution ?? "Актуализировать статус всех активных сделок";

  return {
    summary,
    health,
    kpis,
    deals,
    partners,
    cargos,
    documents,
    clients,
    risks,
    recommendations: recs,
    topAction,
    generatedAt: new Date().toISOString(),
  };
}

export async function generateOperationsDirectorReport(
  health: OperationsHealth,
  kpis: OperationsKPIs,
  deals: Deal[],
  partners: Partner[],
  cargos: CargoItem[],
  documents: DocumentRecord[],
  clients: ClientRecord[],
  risks: RiskAlert[],
): Promise<OperationsDirectorReport> {
  if (!OR_KEY) {
    return buildFallback(health, kpis, deals, partners, cargos, documents, clients, risks);
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
        messages: [{ role: "user", content: buildPrompt(health, kpis, risks, deals, clients) }],
        temperature: 0.4,
        max_tokens: 800,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) return buildFallback(health, kpis, deals, partners, cargos, documents, clients, risks);

    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      summary: parsed.summary ?? "",
      health,
      kpis,
      deals,
      partners,
      cargos,
      documents,
      clients,
      risks,
      recommendations: parsed.recommendations ?? [],
      topAction: parsed.topAction ?? "",
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return buildFallback(health, kpis, deals, partners, cargos, documents, clients, risks);
  }
}
