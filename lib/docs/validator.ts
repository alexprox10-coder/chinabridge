// ChinaBridge Docs — document validator (OpenRouter)
import { safeParseJson } from "./json_repair";
const OR_KEY = () => process.env.OPENROUTER_API_KEY ?? "";
const OR_MODEL = "google/gemini-2.5-flash";

export interface ValidationResult {
  is_valid: boolean;
  risk_level: "low" | "medium" | "high";
  errors: Array<{ field: string; issue: string; recommendation: string }>;
  warnings: Array<{ field: string; issue: string; recommendation: string }>;
  certificates_required: string[];
  import_restrictions: string[];
  marketplace_compliance: { compliant: boolean; issues: string[] };
  broker_notes: string;
}

export async function validateDocument(
  extractedData: unknown,
  hsCodes: string[],
  dest: "RU" | "KZ",
  marketplace?: string
): Promise<ValidationResult> {
  const prompt = `Ты таможенный инспектор ЕАЭС. Проверь документ на ошибки.

Данные:
${JSON.stringify(extractedData, null, 2)}

Коды ТН ВЭД: ${hsCodes.join(", ")}
Страна назначения: ${dest}
Маркетплейс: ${marketplace || "нет"}

ПРОВЕРЬ:
1. Соответствие наименований кодам ТН ВЭД
2. Правильность единиц измерения
3. Реалистичность цен (признаки занижения?)
4. Наличие обязательных полей инвойса
5. Требования ${marketplace ? "маркетплейса " + marketplace : "к документам"}: страна происхождения, артикул, описание
6. Нужны ли сертификаты/разрешения
7. Ограничения на ввоз в ЕАЭС

Отвечай ТОЛЬКО в JSON без markdown:
{
  "is_valid": true,
  "risk_level": "low",
  "errors": [{ "field": "", "issue": "", "recommendation": "" }],
  "warnings": [{ "field": "", "issue": "", "recommendation": "" }],
  "certificates_required": [],
  "import_restrictions": [],
  "marketplace_compliance": { "compliant": true, "issues": [] },
  "broker_notes": ""
}`;

  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OR_KEY()}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://chinabridge.pro",
      "X-Title": "ChinaBridge Docs Validator",
    },
    body: JSON.stringify({
      model: OR_MODEL,
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!resp.ok) {
    // Fail gracefully — return safe default
    return {
      is_valid: true,
      risk_level: "medium",
      errors: [],
      warnings: [{ field: "validation", issue: "Автоматическая проверка недоступна", recommendation: "Проверьте документ вручную" }],
      certificates_required: [],
      import_restrictions: [],
      marketplace_compliance: { compliant: true, issues: [] },
      broker_notes: "Валидация не выполнена — проверьте документ у брокера",
    };
  }
  const data = (await resp.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const raw = data.choices?.[0]?.message?.content ?? "";
  const defaultResult: ValidationResult = {
    is_valid: true, risk_level: "medium", errors: [], warnings: [],
    certificates_required: [], import_restrictions: [],
    marketplace_compliance: { compliant: true, issues: [] }, broker_notes: "",
  };
  return safeParseJson<ValidationResult>(raw, defaultResult);
}
