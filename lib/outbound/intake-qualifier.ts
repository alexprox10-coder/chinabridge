// Parser Club Intake Qualifier — Claude Haiku 4.5 via OpenRouter
// Full §9 JSON schema: intent, scores, supplier_exists, weight, volume, evidence[], confidence
// OUTBOUND_ENABLE_AUTOREPLY=false is HARD default — reply draft is never auto-sent

export type LeadIntent =
  | "DELIVERY"
  | "EXISTING_SUPPLIER"
  | "SUPPLIER_SEARCH"
  | "WHOLESALE"
  | "B2B_IMPORT"
  | "GENERAL_QUESTION"
  | "PRICE_CHECK"
  | "NOISE"
  | "UNKNOWN";

export type Urgency = "HIGH" | "MEDIUM" | "LOW" | null;
export type BusinessType = "BUSINESS" | "INDIVIDUAL" | "UNKNOWN";

export interface EvidenceItem {
  field: string;
  value: string | number | boolean | null;
  source: "message" | "inference" | "context";
  type: "VERIFIED_FACT" | "AI_INFERENCE" | "UNKNOWN";
}

export interface QualificationResult {
  // Intent
  intent: LeadIntent;
  intent_subtype: string;
  // Geography
  country: string;        // KZ | RU | UNKNOWN | OTHER
  city: string;
  destination: string;
  // Product
  product: string | null;
  product_category: string;
  // Business context
  business_type: BusinessType;
  supplier_exists: boolean;
  // Cargo params
  weight_kg: number | null;
  volume_m3: number | null;
  packages: number | null;
  urgency: Urgency;
  // Offer
  recommended_offer: string;
  // Scores (0-100)
  lead_score: number;
  evidence_score: number;
  confidence: number;
  // Stream (1=China→KZ, 4=Existing Supplier)
  stream: 1 | 4 | null;
  // Explanation
  qualification_reason: string;
  key_signals: string[];
  evidence: EvidenceItem[];
  // Reply draft (NEVER auto-sent)
  ai_reply_draft: string;
  // Hints for UI
  product_hint: string;
  geography_hint: string;
}

const SYSTEM_PROMPT = `Ты — AI-квалификатор входящих B2B/B2C лидов ChinaBridge: платформы грузоперевозок из Китая в Казахстан и Россию.

ГЛАВНОЕ ПРАВИЛО: НЕ ПРИДУМЫВАЙ ДАННЫЕ. Если информация не указана явно — используй null.

Отделяй VERIFIED_FACT (написано явно) от AI_INFERENCE (выводишь из контекста).

INTENT типы:
- DELIVERY — клиент хочет доставить конкретный товар из Китая
- EXISTING_SUPPLIER — клиент уже работает с поставщиком в Китае, нужна только логистика (ПРИОРИТЕТ)
- SUPPLIER_SEARCH — клиент ищет поставщика в Китае
- WHOLESALE — оптовая закупка
- B2B_IMPORT — B2B импорт
- PRICE_CHECK — запрос тарифов/цены на доставку
- GENERAL_QUESTION — общий вопрос
- NOISE — нерелевантное сообщение/спам
- UNKNOWN — невозможно определить

STREAM:
- 1 = China→KZ (основной поток ChinaBridge)
- 4 = Existing Supplier (поставщик уже есть в Китае)
- null = не применимо

SCORING lead_score (0-100):
+25 явный запрос на доставку
+20 существующий поставщик в Китае
+15 направление Китай→KZ
+10 Алматы/Астана
+10 указан вес/объём
+10 срок/срочность
+10 коммерческий контекст
-25 общий вопрос
-30 образовательный вопрос
-40 спам
-50 нерелевантная ниша

SCORING evidence_score (0-100):
+30 конкретный товар упомянут
+20 объём/количество/вес
+20 конкретный поставщик/ссылка
+15 цена упомянута
+15 срок/срочность

RECOMMENDED_OFFER mapping:
DELIVERY+KZ → GROUPAGE_DELIVERY
EXISTING_SUPPLIER+KZ → EXISTING_SUPPLIER_DELIVERY
EXISTING_SUPPLIER+regular → REGULAR_IMPORT
SUPPLIER_SEARCH → SUPPLIER_SEARCH
прочее → GENERAL

ai_reply_draft: ТОЛЬКО русский язык, 2-3 предложения, без конкретных цен, начинать с приветствия, не упоминать что ты ИИ.
Для EXISTING_SUPPLIER: акцент на "поставщика менять не нужно, возьмём логистику".

Верни ТОЛЬКО валидный JSON (без markdown):
{
  "intent": "...",
  "intent_subtype": "...",
  "country": "KZ|RU|UNKNOWN|OTHER",
  "city": "...",
  "destination": "...",
  "product": null,
  "product_category": "...",
  "business_type": "BUSINESS|INDIVIDUAL|UNKNOWN",
  "supplier_exists": false,
  "weight_kg": null,
  "volume_m3": null,
  "packages": null,
  "urgency": "HIGH|MEDIUM|LOW|null",
  "recommended_offer": "...",
  "lead_score": 0,
  "evidence_score": 0,
  "confidence": 0,
  "stream": null,
  "qualification_reason": "...",
  "key_signals": [],
  "evidence": [{"field":"...","value":"...","source":"message|inference|context","type":"VERIFIED_FACT|AI_INFERENCE|UNKNOWN"}],
  "ai_reply_draft": "...",
  "product_hint": "...",
  "geography_hint": "..."
}`;

function normalizeText(text: string): string {
  return text
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/​| /g, " ") // zero-width space, nbsp
    .trim();
}

async function callOpenRouter(userMessage: string): Promise<string> {
  const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY ?? "";
  if (!OPENROUTER_KEY) throw new Error("OPENROUTER_API_KEY not set");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://chinabridge.pro",
      "X-Title": "ChinaBridge Intake Qualifier",
    },
    body: JSON.stringify({
      model: process.env.QUALIFIER_MODEL ?? "anthropic/claude-haiku-4-5",
      max_tokens: 1024,
      temperature: 0.1,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "{}";
}

function parseQualification(raw: string): QualificationResult {
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const p = JSON.parse(cleaned);

  const clamp = (v: unknown) => Math.min(100, Math.max(0, Number(v ?? 0)));

  return {
    intent: (p.intent as LeadIntent) ?? "UNKNOWN",
    intent_subtype: String(p.intent_subtype ?? ""),
    country: String(p.country ?? "UNKNOWN"),
    city: String(p.city ?? ""),
    destination: String(p.destination ?? ""),
    product: p.product ? String(p.product) : null,
    product_category: String(p.product_category ?? ""),
    business_type: (p.business_type as BusinessType) ?? "UNKNOWN",
    supplier_exists: Boolean(p.supplier_exists),
    weight_kg: p.weight_kg !== null && p.weight_kg !== undefined ? Number(p.weight_kg) : null,
    volume_m3: p.volume_m3 !== null && p.volume_m3 !== undefined ? Number(p.volume_m3) : null,
    packages: p.packages !== null && p.packages !== undefined ? Math.round(Number(p.packages)) : null,
    urgency: ["HIGH", "MEDIUM", "LOW"].includes(String(p.urgency)) ? (p.urgency as Urgency) : null,
    recommended_offer: String(p.recommended_offer ?? "GENERAL"),
    lead_score: clamp(p.lead_score),
    evidence_score: clamp(p.evidence_score),
    confidence: clamp(p.confidence),
    stream: p.stream === 1 ? 1 : p.stream === 4 ? 4 : null,
    qualification_reason: String(p.qualification_reason ?? ""),
    key_signals: Array.isArray(p.key_signals) ? p.key_signals.map(String) : [],
    evidence: Array.isArray(p.evidence) ? p.evidence : [],
    ai_reply_draft: String(p.ai_reply_draft ?? ""),
    product_hint: String(p.product_hint ?? p.product ?? ""),
    geography_hint: String(p.geography_hint ?? p.city ?? p.country ?? ""),
  };
}

function buildFallback(reason: string): QualificationResult {
  return {
    intent: "UNKNOWN", intent_subtype: "", country: "UNKNOWN", city: "",
    destination: "", product: null, product_category: "", business_type: "UNKNOWN",
    supplier_exists: false, weight_kg: null, volume_m3: null, packages: null,
    urgency: null, recommended_offer: "GENERAL", lead_score: 0, evidence_score: 0,
    confidence: 0, stream: null, qualification_reason: reason, key_signals: [],
    evidence: [], ai_reply_draft: "", product_hint: "", geography_hint: "",
  };
}

export async function qualifyLead(
  rawText: string,
  context?: { username?: string; chat?: string; source?: string; chat_url?: string }
): Promise<{ result: QualificationResult; normalizedText: string }> {
  const normalizedText = normalizeText(rawText);

  const contextStr = [
    context?.source && `Источник: ${context.source}`,
    context?.chat && `Чат: ${context.chat}`,
    context?.chat_url && `URL чата: ${context.chat_url}`,
    context?.username && `Username: @${context.username}`,
  ].filter(Boolean).join(", ");

  const userMessage = `Сообщение клиента:\n${normalizedText}${contextStr ? `\n\nКонтекст: ${contextStr}` : ""}\n\nВерни JSON-квалификацию.`;

  // §25: retry once on failure
  let lastError = "";
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const raw = await callOpenRouter(userMessage);
      const result = parseQualification(raw);
      return { result, normalizedText };
    } catch (err) {
      lastError = String(err);
      if (attempt < 2) await new Promise(r => setTimeout(r, 1500));
    }
  }

  return { result: buildFallback(`AI error after 2 attempts: ${lastError}`), normalizedText };
}
