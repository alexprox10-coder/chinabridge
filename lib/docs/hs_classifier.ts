// ChinaBridge Docs — ТН ВЭД ЕАЭС classifier (OpenRouter)
import type { ExtractedData } from "./ocr";

const OR_KEY = () => process.env.OPENROUTER_API_KEY ?? "";
const OR_MODEL = "google/gemini-2.5-flash";

export interface HSClassification {
  hs_code: string;
  hs_code_clean: string;
  description_ru: string;
  confidence: number;
  alternatives: Array<{ hs_code: string; description_ru: string; reason: string }>;
  duty_rate_percent: number;
  vat_rate_percent: number;
  excise: boolean;
  notes: string;
  requires_certificate: boolean;
  certificate_type: string;
}

export async function classifyHSCode(
  item: ExtractedData["items"][0]
): Promise<HSClassification> {
  const prompt = `Ты таможенный декларант ЕАЭС с 15-летним опытом.

Определи код ТН ВЭД ЕАЭС для товара:

Название (CN): ${item.name_cn}
Название (RU): ${item.name_ru}
Описание: ${item.description}
Единица: ${item.unit}
Страна происхождения: ${item.origin_country}

Правила:
1. Актуальная редакция ТН ВЭД ЕАЭС 2024
2. Код 10-значный (без пробелов в clean-поле)
3. Учитывай материал, назначение, способ применения
4. Укажи реальную ставку пошлины для данного кода
5. Укажи нужны ли сертификаты EAC/ГОСТ для ввоза в ЕАЭС

Отвечай ТОЛЬКО в JSON без markdown:
{
  "hs_code": "XXXX XX XXX X",
  "hs_code_clean": "XXXXXXXXXX",
  "description_ru": "Официальное наименование по ТН ВЭД",
  "confidence": 0.9,
  "alternatives": [
    { "hs_code": "XXXXXXXXXX", "description_ru": "", "reason": "" }
  ],
  "duty_rate_percent": 10,
  "vat_rate_percent": 20,
  "excise": false,
  "notes": "",
  "requires_certificate": true,
  "certificate_type": "EAC TR TS 004/2011"
}`;

  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OR_KEY()}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://chinabridge.pro",
      "X-Title": "ChinaBridge Docs HS Classifier",
    },
    body: JSON.stringify({
      model: OR_MODEL,
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!resp.ok) throw new Error(`Classifier API error: ${resp.status}`);
  const data = (await resp.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const raw = data.choices?.[0]?.message?.content ?? "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Classifier вернул не-JSON");
  return JSON.parse(match[0]) as HSClassification;
}
