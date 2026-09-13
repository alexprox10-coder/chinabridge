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

export type RecommendedOffer =
  | "DELIVERY" | "EXISTING_SUPPLIER_IMPORT" | "SOURCING"
  | "CONSOLIDATION" | "WHITE_IMPORT" | "UNIT_ECONOMICS" | "OTHER";

export type NextBestAction =
  | "SHOW_ECONOMICS" | "ASK_SUPPLIER_STATUS" | "CALCULATE_DELIVERY"
  | "OFFER_SOURCING" | "REQUEST_QUANTITY" | "CONTACT_NOW"
  | "FOLLOW_UP" | "NO_ACTION";

export interface MessagingResult {
  ok: boolean;
  reason_to_contact: string;
  personalized_message: string;
  pitch_type: "SELLER_OUTBOUND" | "B2B_IMPORT" | "SOURCING" | "DELIVERY";
  recommended_offer: RecommendedOffer;
  next_best_action: NextBestAction;
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

  const hasChina = !!chinaMatch && (chinaMatch.match_confidence ?? 0) >= 0.5;
  const chinaProduct = hasChina ? (chinaMatch!.product_name || "") : "";
  const chinaPrice = hasChina ? `${chinaMatch!.price_min_cny}–${chinaMatch!.price_max_cny} CNY` : "";

  const prompt = `Ты — менеджер по продажам ChinaBridge. Пишешь ПЕРВОЕ холодное сообщение конкретному бизнесу.

КОМПАНИЯ: ${companyName}
ГОРОД: ${cityDisplay}, ${countryDisplay}
КАТЕГОРИЯ: ${category}
МАРКЕТПЛЕЙС: ${marketplaceDisplay ?? "не определён"}
ТОВАР: ${topProduct?.name ?? category}
${hasChina ? `ТОВАР В КИТАЕ: ${chinaProduct} (${chinaPrice})` : ""}
${hasChina ? `УВЕРЕННОСТЬ MATCH: ${Math.round((chinaMatch!.match_confidence ?? 0) * 100)}%` : ""}

${economicsContext}

ЖЁСТКИЕ ПРАВИЛА (нарушение = провал):
1. ЗАПРЕЩЕНО: "снизим на 20-40%", "самая низкая цена", "выгодно на X%", любые % без расчёта
2. ЗАПРЕЩЕНО: "Здравствуйте", "Добрый день" в начале сообщения
3. ЗАПРЕЩЕНО: шаблон "Мы помогаем оптовикам снижать себестоимость" — это для всех, не для них
4. ОБЯЗАТЕЛЬНО: упомянуть конкретный товар компании, а не просто категорию
5. ОБЯЗАТЕЛЬНО: объяснить ПОЧЕМУ именно им пишем (маркетплейс + товар + opportunity)
6. Сообщение: 3-4 предложения, Telegram/WhatsApp формат, разговорный стиль
7. Если нет экономики — предложи СДЕЛАТЬ расчёт, а не утверждай экономию

ВЫБЕРИ pitch_type:
- "SELLER_OUTBOUND" — продавец маркетплейса (Kaspi/WB/Ozon), может снизить себестоимость
- "DELIVERY" — нужна доставка из Китая, есть поставщик
- "SOURCING" — ищет поставщика в Китае
- "B2B_IMPORT" — оптовый импортёр

ВЫБЕРИ recommended_offer (один из):
DELIVERY, EXISTING_SUPPLIER_IMPORT, SOURCING, CONSOLIDATION, WHITE_IMPORT, UNIT_ECONOMICS, OTHER

ВЫБЕРИ next_best_action (один из):
SHOW_ECONOMICS, ASK_SUPPLIER_STATUS, CALCULATE_DELIVERY, OFFER_SOURCING, REQUEST_QUANTITY, CONTACT_NOW

Ответ строго JSON:
{
  "reason": "1-2 конкретных предложения — почему пишем именно им",
  "message": "текст сообщения",
  "pitch_type": "SELLER_OUTBOUND",
  "recommended_offer": "UNIT_ECONOMICS",
  "next_best_action": "SHOW_ECONOMICS"
}`;

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
      recommended_offer?: string;
      next_best_action?: string;
    };

    const reason = parsed.reason ?? "";
    const message = parsed.message ?? "";
    const validPitchTypes = ["SELLER_OUTBOUND", "B2B_IMPORT", "SOURCING", "DELIVERY"];
    const pitch_type = (validPitchTypes.includes(parsed.pitch_type ?? "") ? parsed.pitch_type : "SELLER_OUTBOUND") as MessagingResult["pitch_type"];
    const validOffers = ["DELIVERY","EXISTING_SUPPLIER_IMPORT","SOURCING","CONSOLIDATION","WHITE_IMPORT","UNIT_ECONOMICS","OTHER"];
    const recommended_offer = (validOffers.includes(parsed.recommended_offer ?? "") ? parsed.recommended_offer : "OTHER") as MessagingResult["recommended_offer"];
    const validActions = ["SHOW_ECONOMICS","ASK_SUPPLIER_STATUS","CALCULATE_DELIVERY","OFFER_SOURCING","REQUEST_QUANTITY","CONTACT_NOW","FOLLOW_UP","NO_ACTION"];
    const next_best_action = (validActions.includes(parsed.next_best_action ?? "") ? parsed.next_best_action : "CONTACT_NOW") as MessagingResult["next_best_action"];

    // Quality score — strict rules
    let quality = 40;
    if (reason.length > 60) quality += 15;
    // Specific product mention
    if (topProduct?.name && message.toLowerCase().includes(topProduct.name.toLowerCase().split(" ")[0])) quality += 15;
    else if (message.includes(category)) quality += 5;
    // Marketplace mention
    if (marketplaceDisplay && message.includes(marketplaceDisplay)) quality += 10;
    // No generic spam phrases
    const spamPhrases = ["снижать себестоимость", "20-40%", "30-50%", "самая низкая", "лучшие условия на рынке"];
    const hasSpam = spamPhrases.some(p => message.toLowerCase().includes(p));
    if (hasSpam) quality -= 25;
    // Length ok
    if (message.length > 80 && message.length < 500) quality += 10;
    // Has economics reference only if valid
    if (hasValidEconomics && message.includes("расчёт")) quality += 10;

    return {
      ok: true,
      reason_to_contact: reason,
      personalized_message: message,
      pitch_type,
      recommended_offer,
      next_best_action,
      message_quality_score: Math.max(0, Math.min(100, quality)),
    };
  } catch (e) {
    return {
      ok: false,
      reason_to_contact: "",
      personalized_message: "",
      pitch_type: "SELLER_OUTBOUND",
      recommended_offer: "OTHER",
      next_best_action: "NO_ACTION",
      message_quality_score: 0,
      error: String(e),
    };
  }
}
