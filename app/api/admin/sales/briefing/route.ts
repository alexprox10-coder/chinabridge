import { NextRequest, NextResponse } from "next/server";
import { getLLMConfig } from "@/lib/ai/client";
import { getAllLeads } from "@/lib/import-leads/crm";
import { getLeads } from "@/lib/crm/client";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(req: NextRequest) {
  return !!(req.cookies.get("cb_admin")?.value || req.cookies.get("cb_tenant_session")?.value);
}

interface OfferResult {
  product: string;
  product_label: string;
  confidence: number;
  why: string;
  pain: string;
  value_prop: string;
  first_message: string;
  score: number;
  potential: string;
}

async function selectOffer(
  company: string,
  category: string,
  website: string,
  city: string,
  imports: string,
  baseURL: string,
  apiKey: string,
  model: string
): Promise<OfferResult> {
  const res = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://chinabridge.pro",
      "X-Title": "ChinaBridge Offer Selector",
    },
    body: JSON.stringify({
      model,
      max_tokens: 600,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Ты эксперт по продажам ChinaBridge. Определи оффер и верни JSON:
{"product":"DIRECT_IMPORT"|"SUPPLIER_SEARCH"|"UNIT_ECONOMICS"|"WHITE_IMPORT"|"AI_PLATFORM","product_label":"Название RU","confidence":0-100,"why":"Почему этот продукт (1-2 предложения)","pain":"Главная боль","value_prop":"Ценность с цифрами","first_message":"Первое сообщение (3-4 предложения, конкретное, без 'Уважаемый')","score":1-5,"potential":"низкий"|"средний"|"высокий"|"очень высокий"}`,
        },
        {
          role: "user",
          content: `Компания: ${company}\nКатегория: ${category || "—"}\nСайт: ${website || "—"}\nГород: ${city || "—"}\nИмпорт: ${imports || "unknown"}`,
        },
      ],
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error("LLM error");
  const data = await res.json();
  return JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { baseURL, apiKey, model } = getLLMConfig();
  if (!apiKey) return NextResponse.json({ error: "no api key" }, { status: 500 });

  const [importLeads, crmLeads] = await Promise.all([
    getAllLeads("chinabridge").catch(() => []),
    getLeads().catch(() => []),
  ]);

  const hot = importLeads
    .filter(l => l.score >= 4 && l.status === "new")
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const now = Date.now();
  const crmStats = {
    total: crmLeads.length,
    hot: crmLeads.filter(l => l.priority === "HOT").length,
    unanswered: crmLeads.filter(l => l.status === "NEW" && now - new Date(l.created_at || 0).getTime() > 86400000).length,
    negotiation: crmLeads.filter(l => l.status === "NEGOTIATION").length,
    offer_sent: crmLeads.filter(l => l.status === "OFFER_SENT").length,
  };

  const companiesWithOffers = await Promise.all(
    hot.map(async lead => {
      try {
        const offer = await selectOffer(
          lead.company,
          lead.category,
          lead.website,
          lead.city,
          lead.imports,
          baseURL,
          apiKey,
          model
        );
        return {
          lead_id: lead.lead_id,
          company: lead.company,
          category: lead.category,
          city: lead.city,
          website: lead.website,
          score: lead.score,
          score_stars: lead.score_stars,
          phone: lead.phone,
          email: lead.email,
          offer,
        };
      } catch {
        return {
          lead_id: lead.lead_id,
          company: lead.company,
          category: lead.category,
          city: lead.city,
          website: lead.website,
          score: lead.score,
          score_stars: lead.score_stars,
          phone: lead.phone,
          email: lead.email,
          offer: null,
        };
      }
    })
  );

  return NextResponse.json({
    hot_companies: companiesWithOffers,
    crm_stats: crmStats,
    generated_at: new Date().toISOString(),
  });
}
