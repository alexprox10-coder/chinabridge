import { NextRequest, NextResponse } from "next/server";
import { getAllLeads } from "@/lib/import-leads/crm";
import { getLLMConfig } from "@/lib/ai/client";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(req: NextRequest) {
  return !!(req.cookies.get("cb_admin")?.value || req.cookies.get("cb_tenant_session")?.value);
}

interface LeadRecommendation {
  lead_id: string;
  priority: number;
  urgency: "HOT" | "WARM" | "COLD";
  contactToday: boolean;
  reason: string;
  action: "Позвонить" | "WhatsApp" | "Telegram" | "Email";
  openingMessage: string;
  estimatedDeal: string;
  dealScore: number;
}

async function analyzeLeadsWithAI(leads: Array<Record<string, unknown>>): Promise<LeadRecommendation[]> {
  const { baseURL, apiKey, model } = getLLMConfig();
  if (!apiKey) return [];

  const leadsJson = JSON.stringify(leads, null, 0);

  const systemPrompt = `Ты AI Sales Agent компании ChinaBridge — платформы для импорта товаров из Китая.
Анализируй лиды и возвращай ТОЛЬКО JSON массив рекомендаций (без markdown).

Контекст: ChinaBridge помогает компаниям организовать прямой импорт из Китая — снижает себестоимость товаров на 15-35%, берёт на себя логистику, растаможку и поиск поставщиков.

Типы лидов:
- HHRU_PARSER: компания ищет менеджера по маркетплейсам → значит активно растёт, нужна логистика из Китая
- WB_PARSER: продавец на Wildberries → прямой ICP, закупает товар
- AI_AUDIT: сам запросил аудит → тёплый лид, интерес уже есть
- Остальные: холоднее

Структура каждого элемента массива:
{
  "lead_id": "id из лида",
  "priority": 1,
  "urgency": "HOT" | "WARM" | "COLD",
  "contactToday": true | false,
  "reason": "Конкретная причина на русском: что именно говорит о потенциале (вакансии, SKU, аудит и т.д.)",
  "action": "Позвонить" | "WhatsApp" | "Telegram" | "Email",
  "openingMessage": "Персональное открывающее сообщение от лица ChinaBridge на русском, 2-3 предложения",
  "estimatedDeal": "30,000–100,000 ₽/мес",
  "dealScore": 75
}

Правила:
- priority: 1=самый срочный, по возрастанию
- Если есть phone — рекомендуй Позвонить или WhatsApp
- Если только email — Email
- openingMessage: персональный, не шаблонный, упоминай конкретику из лида
- HOT: contactToday=true, priority 1-5
- WARM: contactToday=false, priority 6-10
- COLD: priority 11+
- Верни отсортированный по priority массив, максимум 15 элементов`;

  const userPrompt = `Лиды для анализа (${leads.length} штук):\n${leadsJson}\n\nВерни JSON массив рекомендаций.`;

  const res = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://chinabridge.pro",
      "X-Title": "ChinaBridge AI Sales Agent",
    },
    body: JSON.stringify({
      model,
      temperature: 0.25,
      max_tokens: 3000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
    signal: AbortSignal.timeout(50000),
  });

  if (!res.ok) return [];
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw);
  // ответ может быть { recommendations: [...] } или просто [...]
  const arr = Array.isArray(parsed) ? parsed : (parsed.recommendations ?? parsed.leads ?? []);
  return arr as LeadRecommendation[];
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const limit = Number(body.limit ?? 15);

  const allLeads = await getAllLeads("chinabridge");

  // Берём лиды которые не отклонены, сортируем по score
  const candidates = allLeads
    .filter(l => l.status !== "rejected")
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(l => {
      let extra: Record<string, unknown> = {};
      try { extra = JSON.parse(l.message ?? "{}"); } catch {}
      return {
        lead_id: l.lead_id,
        company: l.company,
        website: l.website,
        category: l.category,
        city: l.city,
        source: l.source,
        score: l.score,
        imports: l.imports,
        phone: l.phone ? "есть" : "",
        email: l.email ? "есть" : "",
        telegram: l.telegram ? "есть" : "",
        status: l.status,
        created_at: l.created_at,
        vacancyCount: extra.vacancyCount,
        vacancyName: extra.vacancyName,
        inn: extra.inn,
        director: extra.director,
        isActive: extra.isActive,
        leadScore: extra.leadScore ?? extra.optimizationScore,
        searchCategory: extra.searchCategory,
        description: typeof extra.description === "string" ? extra.description.slice(0, 200) : undefined,
        intermediaryProbability: extra.intermediaryProbability,
      };
    });

  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, recommendations: [], total: 0 });
  }

  const recommendations = await analyzeLeadsWithAI(candidates);

  // Обогащаем рекомендации данными из оригинальных лидов
  const leadsMap = Object.fromEntries(allLeads.map(l => [l.lead_id, l]));
  const enriched = recommendations.map(rec => ({
    ...rec,
    lead: leadsMap[rec.lead_id] ?? null,
  }));

  return NextResponse.json({ ok: true, recommendations: enriched, total: candidates.length });
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const allLeads = await getAllLeads("chinabridge");
  const active = allLeads.filter(l => l.status !== "rejected");
  return NextResponse.json({
    ok: true,
    stats: {
      total: active.length,
      hot: active.filter(l => l.score >= 4).length,
      new: active.filter(l => l.status === "new").length,
      contacted: active.filter(l => l.status === "contacted").length,
    },
  });
}
