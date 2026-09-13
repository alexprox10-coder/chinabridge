// Generates Reason to Contact + Personalized Message
// Per ТЗ §22-26: product-first, no generic claims, no fake economics
const OR_KEY = () => process.env.OPENROUTER_API_KEY ?? "";

import type { DiscoveredProduct } from "./product-discovery";
import type { ChinaMatch } from "./china-match";
import type { EconomicsResult } from "./economics";

export interface MessagingInput {
  companyName: string;
  category: string;
  city: string;
  country: "KZ" | "RU";
  marketplace: string;
  products: DiscoveredProduct[];
  chinaMatch?: ChinaMatch | null;
  economics?: EconomicsResult | null;
  matchConfidence: number;
}

export interface MessagingResult {
  ok: boolean;
  reason_to_contact: string;
  personalized_message: string;
  pitch_type: "SELLER_OUTBOUND" | "B2B_IMPORT";
  message_quality_score: number;
  error?: string;
}

export async function generateMessage(input: MessagingInput): Promise<MessagingResult> {
  const {
    companyName, category, city, country, marketplace,
    products, chinaMatch, economics, matchConfidence,
  } = input;

  const cityDisplay = city || (country === "KZ" ? "Алматы" : "Москва");
  const marketplaceDisplay = marketplace && marketplace !== "NONE" ? marketplace : null;
  const countryDisplay = country === "KZ" ? "Казахстан" : "Россия";

  // Only include economic claims if confidence is high and we have real data
  const hasValidEconomics = economics?.calculation_valid && matchConfidence >= 0.7;
  const topProduct = products[0];

  const economicsContext = hasValidEconomics && economics ? `
ЭКОНОМИКА (проверено):
- Цена в Китае (avg): ${chinaMatch?.price_min_cny}–${chinaMatch?.price_max_cny} CNY
- Landed cost: ~$${economics.landed_cost_usd}
- Margin потенциал: ~${Math.round(economics.estimated_margin * 100)}%
` : "Экономика: данных недостаточно для конкретных цифр — не использовать числа.";

  const prompt = `Ты — менеджер ChinaBridge. Задача: написать ПРИЧИНУ обращения и ПЕРВОЕ сообщение.

ДАННЫЕ О КОМПАНИИ:
- Название: ${companyName}
- Категория: ${category}
- Город: ${cityDisplay}, ${countryDisplay}
- Маркетплейс: ${marketplaceDisplay ?? "не определён"}
- Товар: ${topProduct?.name ?? category}

${economicsContext}

ПРАВИЛА:
1. Причина обращения — почему именно этой компании интересно предложение? (1-2 предложения, конкретно)
2. Сообщение — 3-4 предложения для Telegram/WhatsApp. Начать НЕ со "Здравствуйте". Упомянуть товар, маркетплейс, конкретный повод.
3. НЕ писать "экономия 20-40%" если нет подтверждённых данных.
4. НЕ писать "самая низкая цена". Предложить РАСЧЁТ, не гарантию.

pitch_type: "SELLER_OUTBOUND" (продавец с маркетплейса) или "B2B_IMPORT" (бизнес с импортом).

Ответ JSON:
{"reason": "причина", "message": "текст", "pitch_type": "SELLER_OUTBOUND"}`;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OR_KEY()}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://chinabridge.pro",
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4-5",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 600,
        temperature: 0.4,
      }),
      signal: AbortSignal.timeout(20000),
    });

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim() ?? "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const parsed = JSON.parse(jsonMatch[0]) as {
      reason?: string;
      message?: string;
      pitch_type?: string;
    };

    const reason = parsed.reason ?? "";
    const message = parsed.message ?? "";
    const pitch_type = (parsed.pitch_type === "B2B_IMPORT" ? "B2B_IMPORT" : "SELLER_OUTBOUND") as "SELLER_OUTBOUND" | "B2B_IMPORT";

    // Quality score: penalize for missing product/marketplace references
    let quality = 60;
    if (reason.length > 50) quality += 15;
    if (message.includes(topProduct?.name ?? "") || message.includes(category)) quality += 10;
    if (marketplaceDisplay && message.includes(marketplaceDisplay)) quality += 10;
    if (message.length > 100 && message.length < 500) quality += 5;

    return {
      ok: true,
      reason_to_contact: reason,
      personalized_message: message,
      pitch_type,
      message_quality_score: Math.min(100, quality),
    };
  } catch (e) {
    return {
      ok: false,
      reason_to_contact: "",
      personalized_message: "",
      pitch_type: "SELLER_OUTBOUND",
      message_quality_score: 0,
      error: String(e),
    };
  }
}
