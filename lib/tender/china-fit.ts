// China Import Fit classifier — GPT-4o via OpenRouter
// Runs ONLY for pre-filtered candidates (ТЗ §40-42)

import type { RawTender, ChinaFitResult, ChinaFitCategory } from "./types";
import { DEFAULT_WEIGHTS, HIGH_PRIORITY_CATEGORIES, CHINA_FIT_OKPD2 } from "./types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function heuristicFit(t: RawTender): number {
  const text = `${t.subject} ${t.category ?? ""} ${t.description ?? ""}`.toLowerCase();
  let score = 0;

  // ОКПД2 prefix match
  const okpd = t.category?.match(/\d{2}/)?.[0] ?? "";
  if (okpd && CHINA_FIT_OKPD2[okpd]) score += 30;

  // Keyword match
  const hits = HIGH_PRIORITY_CATEGORIES.filter(kw => text.includes(kw)).length;
  score += Math.min(hits * 10, 40);

  // Contract size bonus
  if (t.final_price >= 10_000_000) score += 10;
  else if (t.final_price >= 2_000_000) score += 5;

  return Math.min(score, 80); // heuristic caps at 80, AI can go higher
}

export async function classifyChinaFit(t: RawTender): Promise<ChinaFitResult> {
  const apiKey = process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY;

  // Fast heuristic check first
  const hScore = heuristicFit(t);

  if (!apiKey || hScore < 20) {
    // Skip AI for obviously irrelevant items
    const cat: ChinaFitCategory = hScore >= 60 ? "HIGH" : hScore >= 35 ? "MEDIUM" : hScore >= 15 ? "LOW" : "IRRELEVANT";
    return {
      score: hScore,
      category: cat,
      product_category: t.category ?? "Неизвестно",
      reasoning: "Эвристическая оценка по ключевым словам и ОКПД2",
      chinese_analogs: hScore >= 40,
      import_restrictions: false,
      certification_needed: false,
      official_import_possible: hScore >= 30,
      factors: {
        chinese_manufacturable: Math.round(DEFAULT_WEIGHTS.chinese_manufacturable * (hScore / 100)),
        commodity_product:      Math.round(DEFAULT_WEIGHTS.commodity_product * (hScore / 100)),
        import_likelihood:      Math.round(DEFAULT_WEIGHTS.import_likelihood * (hScore / 100)),
        contract_volume:        t.final_price >= 5_000_000 ? 10 : 5,
        sourcing_margin:        5,
        delivery_geography:     5,
        repeat_procurement:     0,
      },
    };
  }

  const prompt = `Ты — эксперт по международной торговле и импорту из Китая для B2B-компаний.

Оцени тендерную закупку по возможности sourcing из Китая:

ПРЕДМЕТ ЗАКУПКИ: ${t.subject}
КАТЕГОРИЯ (ОКПД2): ${t.category ?? "не указана"}
НАЧАЛЬНАЯ ЦЕНА: ${t.initial_price.toLocaleString("ru")} ₽
ЦЕНА ПОБЕДИТЕЛЯ: ${t.final_price.toLocaleString("ru")} ₽
КОЛИЧЕСТВО: ${t.quantity ? `${t.quantity} ${t.unit ?? "ед."}` : "не указано"}
СРОК ПОСТАВКИ: ${t.delivery_deadline ? `${t.delivery_deadline} дней` : "не указан"}
ОПИСАНИЕ: ${t.description ? t.description.slice(0, 300) : "нет"}

Верни JSON (без markdown):
{
  "score": <0-100, итоговая оценка China Import Fit>,
  "category": <"HIGH"|"MEDIUM"|"LOW"|"IRRELEVANT">,
  "product_category": "<название товарной категории на русском>",
  "reasoning": "<1-2 предложения почему такая оценка>",
  "chinese_analogs": <true|false — есть ли производители в Китае>,
  "import_restrictions": <true|false — есть ли ограничения на импорт>,
  "certification_needed": <true|false — нужна ли сертификация>,
  "official_import_possible": <true|false — возможен ли официальный белый импорт>,
  "factors": {
    "chinese_manufacturable": <0-25>,
    "commodity_product": <0-15>,
    "import_likelihood": <0-20>,
    "contract_volume": <0-10>,
    "sourcing_margin": <0-10>,
    "delivery_geography": <0-10>,
    "repeat_procurement": <0-10>
  }
}

Критерии HIGH (score 70-100): оборудование, электроника, мебель, светотехника, текстиль, инструменты, комплектующие — то, что массово производится в КНР.
Критерии IRRELEVANT: услуги, строительство, медицина, питание, охрана.`;

  try {
    const resp = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://chinabridge.pro",
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4-5",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!resp.ok) throw new Error(`OpenRouter ${resp.status}`);
    const data = await resp.json() as { choices: Array<{ message: { content: string } }> };
    const content = data.choices[0]?.message?.content ?? "{}";
    const result = JSON.parse(content.replace(/```json\n?|```/g, "").trim()) as ChinaFitResult;

    // Validate
    result.score = Math.max(0, Math.min(100, result.score ?? hScore));
    return result;
  } catch {
    // Fallback to heuristic on AI error
    const cat: ChinaFitCategory = hScore >= 60 ? "HIGH" : hScore >= 35 ? "MEDIUM" : hScore >= 15 ? "LOW" : "IRRELEVANT";
    return {
      score: hScore,
      category: cat,
      product_category: t.category ?? "Неизвестно",
      reasoning: "AI недоступен, использована эвристика",
      chinese_analogs: hScore >= 40,
      import_restrictions: false,
      certification_needed: false,
      official_import_possible: hScore >= 30,
      factors: {
        chinese_manufacturable: Math.round(DEFAULT_WEIGHTS.chinese_manufacturable * (hScore / 100)),
        commodity_product: Math.round(DEFAULT_WEIGHTS.commodity_product * (hScore / 100)),
        import_likelihood: Math.round(DEFAULT_WEIGHTS.import_likelihood * (hScore / 100)),
        contract_volume: t.final_price >= 5_000_000 ? 10 : 5,
        sourcing_margin: 5,
        delivery_geography: 5,
        repeat_procurement: 0,
      },
    };
  }
}
