// Product Discovery: determines what a company sells and typical price range
const OR_KEY = () => process.env.OPENROUTER_API_KEY ?? "";

export interface DiscoveredProduct {
  name: string;
  name_en: string;
  price_min_kzt?: number;
  price_max_kzt?: number;
  price_min_rub?: number;
  price_max_rub?: number;
  weight_kg: number;
  category: string;
  platforms: string[];
  search_1688: string;
  search_alibaba: string;
}

export interface ProductDiscoveryResult {
  ok: boolean;
  category: string;
  import_notes: string;
  products: DiscoveredProduct[];
  error?: string;
}

const SYSTEM = `Ты — эксперт по импорту из Китая. Компания из Казахстана/России продаёт товары определённой категории.
Твоя задача: определить 3-5 типичных товаров этой категории для импорта из Китая.

Обязательные поля:
- search_1688: ТОЛЬКО китайские иероглифы
- search_alibaba: ТОЛЬКО английский
- weight_kg: вес одной единицы товара в кг (реалистично)
- price_min/max_kzt: розничная цена на Kaspi.kz в тенге (для KZ компаний)

Ответ строго JSON без markdown:
{
  "category": "название категории",
  "import_notes": "1-2 предложения о специфике импорта",
  "products": [
    {
      "name": "Название товара на русском",
      "name_en": "Product name in English",
      "price_min_kzt": 15000,
      "price_max_kzt": 45000,
      "weight_kg": 0.5,
      "category": "AUTO_ACCESSORIES",
      "platforms": ["1688", "Alibaba"],
      "search_1688": "中文关键词",
      "search_alibaba": "english keyword"
    }
  ]
}`;

export async function discoverProducts(
  companyName: string,
  category: string,
  city: string,
  country: string,
): Promise<ProductDiscoveryResult> {
  const query = `Компания "${companyName}" из ${city}, ${country === "KZ" ? "Казахстан" : "Россия"}. Категория: ${category}. Определи типичные товары для импорта.`;

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
        max_tokens: 1200,
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(20000),
    });

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    const parsed = JSON.parse(content) as ProductDiscoveryResult;
    if (!Array.isArray(parsed.products) || parsed.products.length === 0) {
      throw new Error("No products in response");
    }

    return { ...parsed, ok: true };
  } catch (e) {
    return { ok: false, category, import_notes: "", products: [], error: String(e) };
  }
}
