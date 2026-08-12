import { NextRequest, NextResponse } from "next/server";
import { callLLM } from "@/lib/ai/client";

export const runtime = "nodejs";
export const maxDuration = 60;

async function fetchSiteText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{2,}/g, " ")
      .slice(0, 6000);
  } catch {
    return "";
  }
}

const SYSTEM = `Ты AI-аналитик ChinaBridge — платформы для импорта из Китая.
Анализируй сайт компании и возвращай JSON (без markdown, только объект).

Структура ответа:
{
  "companyName": "название компании",
  "businessType": "интернет-магазин | оптовик | маркетплейс-продавец | производитель | другое",
  "categories": ["категория1", "категория2"],
  "marketplaces": ["wb", "ozon", "kaspi", "amazon"],
  "optimizationScore": 7.8,
  "intermediaryProbability": 65,
  "costReductionPotential": "18-24",
  "seoOpportunities": 127,
  "chinaSourceable": 4,
  "totalCategories": 6,
  "insights": [
    {"type": "success", "text": "..."},
    {"type": "warning", "text": "..."},
    {"type": "opportunity", "text": "..."}
  ],
  "recommendations": ["рек 1", "рек 2", "рек 3"],
  "summary": "краткое резюме 2 предложения"
}

Правила:
- optimizationScore: 1-10 (насколько выгодно работать с ChinaBridge)
- intermediaryProbability: % вероятности что работают через посредников (не напрямую из Китая)
- costReductionPotential: диапазон % снижения себестоимости при прямых закупках
- seoOpportunities: оценка числа SEO-запросов без покрытия в их нише
- chinaSourceable: сколько категорий товаров можно закупать напрямую в Китае
- Insights: 3-5 штук, тип: success (✅ что хорошо), warning (⚠️ проблема), opportunity (💡 возможность)
- Всегда возвращай реалистичные, но оптимистичные данные для B2B продаж
- Если сайт не загрузился — анализируй по URL и домену`;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { url, name, email, phone } = body as {
    url?: string;
    name?: string;
    email?: string;
    phone?: string;
  };

  if (!url) return NextResponse.json({ ok: false, error: "no_url" }, { status: 400 });

  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

  const siteText = await fetchSiteText(normalizedUrl);

  const userPrompt = `Сайт: ${normalizedUrl}

Содержимое страницы:
${siteText || "(не удалось загрузить — анализируй по URL)"}

Верни JSON-аудит.`;

  let audit: Record<string, unknown> = {};
  try {
    const raw = await callLLM(SYSTEM, [{ role: "user", content: userPrompt }]);
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    audit = JSON.parse(cleaned);
  } catch {
    audit = {
      companyName: "Компания",
      businessType: "интернет-магазин",
      categories: ["Товары"],
      marketplaces: [],
      optimizationScore: 7.0,
      intermediaryProbability: 60,
      costReductionPotential: "15-25",
      seoOpportunities: 90,
      chinaSourceable: 3,
      totalCategories: 4,
      insights: [
        { type: "opportunity", text: "Прямые закупки в Китае могут снизить себестоимость на 15-25%" },
        { type: "warning", text: "Возможна работа через посредников с наценкой 30-40%" },
        { type: "success", text: "Ниша имеет высокий потенциал для импорта из Китая" },
      ],
      recommendations: [
        "Провести аудит текущих поставщиков и сравнить с прямыми ценами на 1688.com",
        "Рассчитать unit economics с учётом прямой логистики из Китая",
        "Протестировать 1-2 товарные категории с прямой поставкой",
      ],
      summary: "Компания работает в нише с высоким потенциалом прямых закупок из Китая. ChinaBridge может помочь снизить себестоимость и увеличить маржу.",
    };
  }

  // Сохраняем лид если передан контакт
  if (email || phone) {
    try {
      const { saveLead } = await import("@/lib/import-leads/crm");
      const leadId = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const rawScore = (audit.optimizationScore as number) ?? 7;
      const leadScore = (rawScore >= 9 ? 5 : rawScore >= 7 ? 4 : rawScore >= 5 ? 3 : rawScore >= 3 ? 2 : 1) as 1|2|3|4|5;
      await saveLead({
        lead_id: leadId,
        company: String(audit.companyName ?? url),
        website: normalizedUrl,
        category: String((audit.categories as string[])?.[0] ?? ""),
        city: "",
        country: "RU",
        phone: phone ?? "",
        email: email ?? "",
        telegram: "",
        source: "AI_AUDIT",
        imports: "likely",
        score: leadScore,
        score_stars: "⭐".repeat(leadScore),
        why: String((audit.insights as {text:string}[])?.[0]?.text ?? ""),
        offer: String((audit.recommendations as string[])?.[0] ?? ""),
        message: JSON.stringify({ name, audit }),
        created_at: new Date().toISOString(),
        company_id: "chinabridge",
        status: "new",
      });
    } catch {}
  }

  return NextResponse.json({ ok: true, audit, url: normalizedUrl });
}
