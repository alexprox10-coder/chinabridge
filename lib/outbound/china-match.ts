// China Match: finds best Chinese supplier/price for a given product
const OR_KEY = () => process.env.OPENROUTER_API_KEY ?? "";

export interface ChinaMatch {
  product_name: string;
  source: "1688" | "Alibaba" | "Taobao";
  search_1688: string;
  search_alibaba: string;
  price_min_cny: number;
  price_max_cny: number;
  moq: number;
  region: string;
  match_confidence: number; // 0.0–1.0
  quality_level: "basic" | "standard" | "premium";
  reliability_score: number; // 0–100
  market_overview: string;
}

export interface ChinaMatchResult {
  ok: boolean;
  match?: ChinaMatch;
  error?: string;
}

const SYSTEM = `Ты — эксперт по закупкам из Китая. Найди лучший вариант для импорта конкретного товара.

Верни реалистичные оптовые цены в юанях (CNY) на 1688.com / Alibaba.com за единицу.
match_confidence (0.0-1.0): насколько уверенно ты можешь сопоставить этот товар с китайским предложением.
Если товар нельзя уверенно сопоставить — укажи match_confidence < 0.5.

Ответ строго JSON без markdown:
{
  "product_name": "Название товара",
  "source": "1688",
  "search_1688": "中文关键词",
  "search_alibaba": "english keyword",
  "price_min_cny": 15,
  "price_max_cny": 45,
  "moq": 50,
  "region": "Гуандун",
  "match_confidence": 0.85,
  "quality_level": "standard",
  "reliability_score": 78,
  "market_overview": "1-2 предложения о рынке"
}`;

export async function findChinaMatch(
  productName: string,
  productNameEn: string,
  category: string,
): Promise<ChinaMatchResult> {
  const query = `Товар для импорта: "${productName}" (${productNameEn}). Категория: ${category}. Найди оптовые цены на 1688/Alibaba.`;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OR_KEY()}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://chinabridge.pro",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: query },
        ],
        max_tokens: 600,
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(18000),
    });

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    const match = JSON.parse(content) as ChinaMatch;
    if (!match.price_min_cny || !match.search_1688) throw new Error("Invalid match data");

    return { ok: true, match };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
