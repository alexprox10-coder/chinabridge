import type { AnalysisResult } from "./types";

const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY ?? "";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? "";

async function scrapeWebsite(url: string): Promise<{ markdown: string; title: string } | null> {
  if (!FIRECRAWL_KEY) return null;
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        timeout: 15000,
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      markdown: (data.data?.markdown ?? data.markdown ?? "").slice(0, 6000),
      title: data.data?.metadata?.title ?? data.metadata?.title ?? "",
    };
  } catch {
    return null;
  }
}

async function claudeAnalyze(url: string, content: string, title: string): Promise<AnalysisResult | null> {
  if (!ANTHROPIC_KEY) return null;
  try {
    const prompt = `Ты аналитик B2B продаж. Изучи сайт компании и верни JSON-ответ (ТОЛЬКО JSON без markdown).

URL: ${url}
Заголовок: ${title}
Контент сайта:
${content}

Верни JSON строго в этом формате:
{
  "company": "Название компании",
  "category": "Категория товаров (мебель/электроника/одежда/автозапчасти/товары для дома/оборудование/другое)",
  "city": "Город (или пустая строка)",
  "country": "Страна (Россия/Казахстан/Беларусь/другое)",
  "phone": "Телефон (или пустая строка)",
  "email": "Email (или пустая строка)",
  "telegram": "Telegram (или пустая строка)",
  "imports": "yes/no/likely",
  "china_signals": ["список сигналов о работе с Китаем, например: 1688, Alibaba, Китай, импорт, карго"],
  "description": "1-2 предложения: чем занимается компания и почему интересна для импорта из Китая"
}

Правила для поля imports:
- yes: на сайте явно написано что импортируют из Китая
- no: компания производит сама или это услуги без товаров
- likely: продают товары, вероятно закупают (маркетплейсы, магазины, оптовики)`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const text = data.content?.[0]?.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]) as AnalysisResult;
  } catch {
    return null;
  }
}

export async function analyzeWebsite(url: string): Promise<AnalysisResult | null> {
  const scraped = await scrapeWebsite(url);
  if (!scraped) return null;
  return claudeAnalyze(url, scraped.markdown, scraped.title);
}
