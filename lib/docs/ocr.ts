// ChinaBridge Docs — OCR via OpenRouter (Claude for PDFs, Gemini for images)
const OR_KEY = () => process.env.OPENROUTER_API_KEY ?? "";
const IMAGE_MODEL = process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash";
const PDF_MODEL = "anthropic/claude-opus-4-5";

const OCR_PROMPT = `Ты эксперт по таможенным документам Китай → ЕАЭС.

Проанализируй этот документ и извлеки ВСЕ данные. Читай иероглифы внимательно.

ОБЯЗАТЕЛЬНО извлеки:
1. Тип документа (инвойс/упаковочный лист/CMR/сертификат)
2. Название товара (на китайском И переводи на русский)
3. Описание товара (материал, назначение, характеристики)
4. Количество единиц и единицу измерения
5. Цену за единицу и общую сумму с валютой
6. Вес нетто и брутто (если есть)
7. Страну происхождения, поставщика, покупателя
8. Дату и номер документа

ВАЖНО:
- Если несколько позиций — извлеки каждую отдельно
- Читай числа очень точно — проверяй каждую строку
- Переводи торговые названия на понятный русский язык
- Отмечай поля "null" если данные отсутствуют или неразборчивы

Отвечай ТОЛЬКО в JSON без markdown-обёрток:
{
  "doc_type": "invoice|packing_list|cmr|certificate|other",
  "doc_number": "",
  "doc_date": "YYYY-MM-DD or null",
  "supplier": { "name_cn": "", "name_en": "", "address": "" },
  "buyer": { "name": "", "address": "" },
  "items": [
    {
      "name_cn": "",
      "name_ru": "",
      "description": "",
      "quantity": 0,
      "unit": "pcs|kg|m|box",
      "unit_price": 0.0,
      "total_price": 0.0,
      "currency": "CNY|USD|EUR",
      "weight_net": 0.0,
      "weight_gross": 0.0,
      "origin_country": "CN"
    }
  ],
  "total_amount": 0.0,
  "total_currency": "CNY",
  "total_weight_net": 0.0,
  "total_weight_gross": 0.0,
  "confidence": 0.95,
  "issues": []
}`;

export interface ExtractedData {
  doc_type: string;
  doc_number: string;
  doc_date: string | null;
  supplier: { name_cn: string; name_en: string; address: string };
  buyer: { name: string; address: string };
  items: Array<{
    name_cn: string;
    name_ru: string;
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    total_price: number;
    currency: string;
    weight_net: number;
    weight_gross: number;
    origin_country: string;
  }>;
  total_amount: number;
  total_currency: string;
  total_weight_net: number;
  total_weight_gross: number;
  confidence: number;
  issues: string[];
}

export async function extractDocumentData(
  fileBase64: string,
  mimeType: string
): Promise<ExtractedData> {
  const isPdf = mimeType === "application/pdf";

  // PDF: use Claude via OpenRouter with document content type
  // Image: use Gemini via OpenRouter with image_url
  const contentBlock = isPdf
    ? {
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: fileBase64,
        },
      }
    : {
        type: "image_url",
        image_url: {
          url: `data:${mimeType.startsWith("image/") ? mimeType : "image/jpeg"};base64,${fileBase64}`,
        },
      };

  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OR_KEY()}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://chinabridge.pro",
      "X-Title": "ChinaBridge Docs OCR",
    },
    body: JSON.stringify({
      model: isPdf ? PDF_MODEL : IMAGE_MODEL,
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: [contentBlock, { type: "text", text: OCR_PROMPT }],
        },
      ],
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`OCR API error: ${resp.status} — ${errText}`);
  }

  const data = (await resp.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const raw = data.choices?.[0]?.message?.content ?? "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("OCR вернул не-JSON ответ");
  return JSON.parse(match[0]) as ExtractedData;
}
