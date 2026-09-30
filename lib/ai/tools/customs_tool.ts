// CUSTOMS AI — переиспользует реальные модули ChinaBridge Docs:
// lib/docs/hs_classifier.ts (classifyHSCode) + lib/docs/duty_calculator.ts (calculateDuties).
import { classifyHSCode } from "@/lib/docs/hs_classifier";
import { calculateDuties } from "@/lib/docs/duty_calculator";
import type { ExtractedData } from "@/lib/docs/ocr";

export const customsToolDefinition = {
  type: "function" as const,
  function: {
    name: "calculate_customs",
    description:
      "Определяет код ТН ВЭД ЕАЭС и рассчитывает таможенную пошлину, НДС и сборы. " +
      "ВАЖНО: код ТН ВЭД носит предварительный характер, финальную классификацию " +
      "должен подтвердить таможенный представитель — всегда упоминай это при низкой уверенности.",
    parameters: {
      type: "object",
      properties: {
        product_name_ru: { type: "string" },
        product_name_cn: { type: "string" },
        description: { type: "string" },
        unit: { type: "string", description: "Единица измерения, например pcs" },
        price_cny: { type: "number", description: "Цена за партию целиком в юанях" },
        currency: { type: "string", enum: ["CNY", "USD", "EUR"] },
        destination_country: { type: "string", enum: ["RU", "KZ"] },
      },
      required: ["product_name_ru", "price_cny", "destination_country"],
    },
  },
};

interface CustomsInput {
  product_name_ru: string;
  product_name_cn?: string;
  description?: string;
  unit?: string;
  price_cny: number;
  currency?: string;
  destination_country: "RU" | "KZ";
}

export async function runCustomsAnalysis(input: CustomsInput) {
  const item: ExtractedData["items"][0] = {
    name_cn: input.product_name_cn || "",
    name_ru: input.product_name_ru,
    description: input.description || "",
    quantity: 1,
    unit: input.unit || "pcs",
    unit_price: input.price_cny,
    total_price: input.price_cny,
    currency: input.currency || "CNY",
    weight_net: 0,
    weight_gross: 0,
    origin_country: "CN",
  };

  const hs = await classifyHSCode(item);
  const duty = calculateDuties(item, hs, input.destination_country);

  return {
    hs_code: hs.hs_code,
    hs_confidence: hs.confidence,
    confidence_note:
      hs.confidence < 0.85
        ? "Требует проверки специалистом — несколько кодов подходят"
        : "Высокая уверенность классификации",
    requires_certificate: hs.requires_certificate,
    certificate_type: hs.certificate_type,
    duty: {
      duty_rate_percent: duty.duty_rate_percent,
      duty_amount: duty.duty_amount,
      vat_rate_percent: duty.vat_rate_percent,
      vat_amount: duty.vat_amount,
      customs_fee: duty.customs_fee,
      total_duties: duty.total_duties,
      currency: duty.currency,
    },
    disclaimer: "Код ТН ВЭД предварительный. Финальную классификацию должен подтвердить таможенный представитель.",
  };
}
