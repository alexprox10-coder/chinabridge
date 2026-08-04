import type { AnalysisResult, ScoreResult, LeadScore } from "./types";
import type { ImportLeadsConfig } from "./config";
import { applyMessageTemplate } from "./config";

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY ?? "";
const OR_MODEL = "anthropic/claude-haiku-4.5";

const STARS: Record<LeadScore, string> = {
  5: "⭐⭐⭐⭐⭐",
  4: "⭐⭐⭐⭐",
  3: "⭐⭐⭐",
  2: "⭐⭐",
  1: "⭐",
};

async function claudeScore(
  analysis: AnalysisResult,
  website: string,
  config: ImportLeadsConfig
): Promise<ScoreResult | null> {
  if (!OPENROUTER_KEY) return null;
  try {
    const prompt = `Ты эксперт по B2B продажам услуг импорта из Китая.

Компания: ${analysis.company}
Сайт: ${website}
Категория: ${analysis.category}
Город: ${analysis.city}
Импортирует: ${analysis.imports}
Сигналы Китая: ${analysis.china_signals.join(", ") || "нет"}
Описание: ${analysis.description}

Компания продавец услуг: ${config.companyName} (${config.website})

Оцени лид и верни JSON (ТОЛЬКО JSON):
{
  "score": число от 1 до 5,
  "why": "2-3 предложения: почему этот лид интересен или неинтересен",
  "offer": "Конкретное предложение для этой компании: что именно предложить (поиск фабрики / белый импорт / логистика / сертификация / расчёт себестоимости)",
  "message": "Персонализированное сообщение для этой компании (2-4 предложения, без шаблонности)"
}

Критерии оценки:
5 — собственный бренд + маркетплейсы + большой ассортимент + нет своего импорта
4 — активный магазин/бренд, вероятно закупает через посредников
3 — среднее: есть товары, но неясно где закупают
2 — маленькая компания или не подходит по категории
1 — услуги без товаров, производство в России, неинтересно`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://chinabridge.pro",
        "X-Title": "ChinaBridge Import Finder",
      },
      body: JSON.stringify({
        model: OR_MODEL,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const result = JSON.parse(jsonMatch[0]) as ScoreResult;
    result.score = Math.max(1, Math.min(5, Math.round(result.score))) as LeadScore;
    return result;
  } catch {
    return null;
  }
}

function heuristicScore(analysis: AnalysisResult): ScoreResult {
  let score: LeadScore = 2;

  if (analysis.imports === "yes") score = 4;
  else if (analysis.imports === "likely") score = 3;
  else if (analysis.imports === "no") score = 1;

  if (analysis.china_signals.length > 0) score = Math.min(5, (score + 1)) as LeadScore;

  const why =
    analysis.imports === "yes"
      ? "Компания уже импортирует — можно предложить лучшие условия."
      : analysis.imports === "likely"
      ? "Компания продаёт товары — вероятно закупает через посредников."
      : "Компания не похожа на импортёра.";

  const offer =
    analysis.category === "мебель" || analysis.category === "товары для дома"
      ? "Поиск фабрики в Китае + белый импорт + логистика"
      : "Расчёт себестоимости + поиск поставщика";

  const message = `Здравствуйте! Посмотрели вашу компанию ${analysis.company}. Помогаем бизнесу в категории "${analysis.category}" находить производителей в Китае и организовывать белый импорт. Готовы бесплатно сделать расчёт.`;

  return { score, why, offer, message };
}

export async function scoreLead(
  analysis: AnalysisResult,
  website: string,
  config: ImportLeadsConfig
): Promise<ScoreResult & { score_stars: string }> {
  const result = (await claudeScore(analysis, website, config)) ?? heuristicScore(analysis);

  const message = result.message || applyMessageTemplate(config.messageTemplate, {
    company: analysis.company,
    category: analysis.category,
    website: config.website,
  });

  return { ...result, message, score_stars: STARS[result.score] };
}

export { STARS };
