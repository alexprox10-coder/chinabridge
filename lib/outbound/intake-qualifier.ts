// Parser Club Intake Qualifier — Claude Haiku 4.5
// Classifies raw lead text: intent, score, stream, reply draft
// OUTBOUND_ENABLE_AUTOREPLY=false is HARD default — reply draft is never auto-sent

import Anthropic from "@anthropic-ai/sdk";

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

export interface QualificationResult {
  intent: LeadIntent;
  lead_score: number;          // 0-100 AI-assigned
  evidence_score: number;      // 0-100 lightweight evidence from text
  stream: 1 | 4 | null;       // 1=China→KZ, 4=Existing Supplier; null=not applicable
  qualification_reason: string;
  key_signals: string[];
  ai_reply_draft: string;      // NEVER auto-sent; human approval required
  product_hint: string;        // product mentioned in text (if any)
  geography_hint: string;      // geography mentioned
}

const SYSTEM_PROMPT = `Ты — ИИ-квалификатор лидов для ChinaBridge: платформы грузоперевозок из Китая в Казахстан и Россию.

Твоя задача: проанализировать сообщение потенциального клиента и вернуть JSON-оценку.

INTENT типы:
- DELIVERY — клиент хочет доставить конкретный товар из Китая
- EXISTING_SUPPLIER — клиент уже работает с поставщиком в Китае и ищет логистику
- SUPPLIER_SEARCH — клиент ищет поставщика в Китае
- WHOLESALE — оптовая закупка товаров
- B2B_IMPORT — бизнес-импорт, B2B запрос
- PRICE_CHECK — запрос цены/тарифов на доставку
- GENERAL_QUESTION — общий вопрос о сервисе
- NOISE — нецелевое сообщение (реклама, спам, не по теме)
- UNKNOWN — невозможно определить

STREAM:
- 1 = China→KZ (доставка из Китая в Казахстан) — основной поток
- 4 = Existing Supplier (клиент с уже найденным поставщиком) — доп. поток
- null = не относится к нашим потокам

ПРАВИЛА оценки lead_score (0-100):
- 80-100: горячий лид с конкретным товаром, объёмом, срочностью
- 60-79: тёплый лид с явным намерением
- 40-59: средний потенциал, есть запрос но без деталей
- 20-39: слабый сигнал
- 0-19: нецелевой (NOISE/UNKNOWN)

ПРАВИЛА evidence_score (0-100) — оцениваем доказательства из текста:
- +30 если упомянут конкретный товар
- +20 если есть объём или количество
- +20 если есть конкретный поставщик или ссылка
- +15 если упомянута цена
- +15 если есть срок или срочность

ai_reply_draft: ТОЛЬКО на русском языке, дружелюбно, 2-3 предложения, без обещаний конкретных цен. Начинать с приветствия. НИКОГДА не упоминать что ты ИИ.

Верни ТОЛЬКО JSON без markdown, без пояснений.`;

const RESPONSE_SCHEMA = {
  type: "object" as const,
  properties: {
    intent: { type: "string" },
    lead_score: { type: "number" },
    evidence_score: { type: "number" },
    stream: { },
    qualification_reason: { type: "string" },
    key_signals: { type: "array", items: { type: "string" } },
    ai_reply_draft: { type: "string" },
    product_hint: { type: "string" },
    geography_hint: { type: "string" },
  },
  required: ["intent", "lead_score", "evidence_score", "qualification_reason", "key_signals", "ai_reply_draft"],
};

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export async function qualifyLead(
  text: string,
  context?: { username?: string; chat?: string; source?: string }
): Promise<QualificationResult> {
  const contextStr = context
    ? `\nКонтекст: источник=${context.source ?? "unknown"}, чат=${context.chat ?? "—"}, username=${context.username ?? "анонимно"}`
    : "";

  const userMessage = `Сообщение клиента:\n${text}${contextStr}\n\nВерни JSON-оценку.`;

  try {
    const response = await getClient().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "{}";
    const parsed = JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());

    return {
      intent: (parsed.intent as LeadIntent) ?? "UNKNOWN",
      lead_score: Math.min(100, Math.max(0, Number(parsed.lead_score ?? 0))),
      evidence_score: Math.min(100, Math.max(0, Number(parsed.evidence_score ?? 0))),
      stream: parsed.stream === 1 ? 1 : parsed.stream === 4 ? 4 : null,
      qualification_reason: String(parsed.qualification_reason ?? ""),
      key_signals: Array.isArray(parsed.key_signals) ? parsed.key_signals : [],
      ai_reply_draft: String(parsed.ai_reply_draft ?? ""),
      product_hint: String(parsed.product_hint ?? ""),
      geography_hint: String(parsed.geography_hint ?? ""),
    };
  } catch {
    return {
      intent: "UNKNOWN",
      lead_score: 0,
      evidence_score: 0,
      stream: null,
      qualification_reason: "Ошибка квалификации",
      key_signals: [],
      ai_reply_draft: "",
      product_hint: "",
      geography_hint: "",
    };
  }
}
