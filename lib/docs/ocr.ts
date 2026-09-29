// ChinaBridge Docs — OCR module
// PDF: extract text via pdf-parse → send as text to Gemini (no vision needed)
// Images: send as image_url to Gemini Vision
import pdfParse from "pdf-parse";

const OR_KEY = () => process.env.OPENROUTER_API_KEY ?? "";
const OR_MODEL = process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash";

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

async function callOpenRouter(messages: object[]): Promise<string> {
  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OR_KEY()}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://chinabridge.pro",
      "X-Title": "ChinaBridge Docs OCR",
    },
    body: JSON.stringify({
      model: OR_MODEL,
      max_tokens: 4000,
      messages,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`OCR API error: ${resp.status} — ${errText}`);
  }

  const data = (await resp.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? "";
}

export async function extractDocumentData(
  fileBase64: string,
  mimeType: string
): Promise<ExtractedData> {
  let raw: string;

  if (mimeType === "application/pdf") {
    // Extract text from PDF — no vision API needed
    const pdfBuffer = Buffer.from(fileBase64, "base64");
    const parsed = await pdfParse(pdfBuffer);
    const pdfText = parsed.text?.trim();

    if (!pdfText || pdfText.length < 20) {
      throw new Error("PDF не содержит текста. Попробуйте загрузить как JPG или PNG.");
    }

    raw = await callOpenRouter([
      {
        role: "user",
        content: `${OCR_PROMPT}\n\nТекст документа:\n\`\`\`\n${pdfText.slice(0, 8000)}\n\`\`\``,
      },
    ]);
  } else {
    // Image: use Gemini Vision via OpenRouter
    const imageMime = mimeType.startsWith("image/") ? mimeType : "image/jpeg";
    raw = await callOpenRouter([
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${imageMime};base64,${fileBase64}` },
          },
          { type: "text", text: OCR_PROMPT },
        ],
      },
    ]);
  }

  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("OCR вернул не-JSON ответ");
  return JSON.parse(match[0]) as ExtractedData;
}
