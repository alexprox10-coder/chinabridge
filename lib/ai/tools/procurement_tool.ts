// PROCUREMENT AI — анализ товара по фото инвойса или по ссылке/описанию.
// Переиспользует OCR из ChinaBridge Docs (lib/docs/ocr.ts) для изображений/PDF.
import { extractDocumentData } from "@/lib/docs/ocr";

const OR_KEY = () => process.env.OPENROUTER_API_KEY ?? "";
const OR_MODEL = process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash";

export const procurementToolDefinition = {
  type: "function" as const,
  function: {
    name: "analyze_product_or_supplier",
    description:
      "Анализирует товар: по фото/PDF инвойса (читает через OCR), по ссылке на 1688/Alibaba, " +
      "или по текстовому описанию. Возвращает название, цену, категорию и на что обратить " +
      "внимание при проверке поставщика.",
    parameters: {
      type: "object",
      properties: {
        source_type: { type: "string", enum: ["document", "url", "text"] },
        document_base64: { type: "string", description: "Base64 фото/PDF инвойса, если source_type=document" },
        document_mime_type: { type: "string" },
        url: { type: "string", description: "Ссылка на 1688/Alibaba, если source_type=url" },
        text_description: { type: "string", description: "Текстовое описание товара, если source_type=text" },
      },
      required: ["source_type"],
    },
  },
};

interface ProcurementInput {
  source_type: "document" | "url" | "text";
  document_base64?: string;
  document_mime_type?: string;
  url?: string;
  text_description?: string;
}

export async function runProcurementAnalysis(input: ProcurementInput) {
  if (input.source_type === "document" && input.document_base64) {
    const extracted = await extractDocumentData(
      input.document_base64,
      input.document_mime_type || "image/jpeg"
    );
    const item = extracted.items[0];
    return {
      source: "invoice_ocr",
      product_name_ru: item?.name_ru,
      product_name_cn: item?.name_cn,
      price_per_unit: item?.unit_price,
      total_price: item?.total_price,
      currency: item?.currency,
      quantity: item?.quantity,
      supplier: extracted.supplier,
      confidence: extracted.confidence,
      full_extracted_items: extracted.items,
    };
  }

  if (input.source_type === "url" && input.url) {
    if (!OR_KEY()) return { error: "OPENROUTER_API_KEY не настроен" };
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OR_KEY()}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://chinabridge.pro",
        "X-Title": "ChinaBridge AI Procurement",
      },
      body: JSON.stringify({
        model: OR_MODEL,
        max_tokens: 800,
        messages: [
          {
            role: "user",
            content:
              `Проанализируй товар по ссылке: ${input.url}\n` +
              `Определи: категорию товара, примерный ценовой диапазон на заводе в юанях, ` +
              `типичный MOQ для такой категории, на что обратить внимание при проверке поставщика. ` +
              `Ответь ТОЛЬКО в JSON: {"category":"","price_range_cny":"","typical_moq":"","supplier_check_points":[]}`,
          },
        ],
      }),
    });
    if (!resp.ok) return { error: `OpenRouter error ${resp.status}` };
    const data = (await resp.json()) as { choices: Array<{ message: { content: string } }> };
    const text = data.choices?.[0]?.message?.content ?? "{}";
    try {
      return JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      return { error: "Не удалось разобрать ответ AI", raw: text };
    }
  }

  return { source: "text_description", product_description: input.text_description, needs_price_input: true };
}
