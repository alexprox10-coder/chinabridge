import type { VkPost, IntentLead, IntentTier } from "./types";

interface ClassifyResult {
  score: number;
  tier: IntentTier;
  intent: string;
  product: string;
  location: string;
  contact: string;
  urgency: string;
  confidence: number;
}

const daysSince = (unixTs: number) =>
  Math.floor((Date.now() / 1000 - unixTs) / 86_400);

async function callClaude(post: VkPost): Promise<ClassifyResult | null> {
  const key = process.env.ANTHROPIC_API_KEY ?? "";
  if (!key) return null;

  const age = daysSince(post.date);
  const prompt = `Ты — классификатор лидов для ChinaBridge (карго и поиск поставщиков в Китае).

Проанализируй пост ВКонтакте. Верни ТОЛЬКО валидный JSON без markdown.

ПОСТ (${age} дн. назад):
"""
${post.text.slice(0, 800)}
"""
ПОИСКОВЫЙ ЗАПРОС: "${post.query}"

JSON:
{
  "score": <0-100>,
  "tier": <"HOT"|"WARM"|"COLD"|"IRRELEVANT">,
  "intent": "<краткое намерение>",
  "product": "<товар/категория или пусто>",
  "location": "<город/страна или пусто>",
  "contact": "<телефон, Telegram, ссылка из текста или пусто>",
  "urgency": "<high|medium|low|none>",
  "confidence": <0.0-1.0>
}

Score (сумма 100):
recency(20): сегодня=20, 7д=12, 30д=5, старше=0
explicit_need(25): явный поиск карго/посредника/поставщика Китай
commercial(20): признаки бизнеса (объём, бюджет, регулярность)
location(10): KZ/RU/Алматы/Москва
product_fit(10): 1688/Alibaba/конкретные товары из Китая
volume(5): упоминание партии/объёма
contactability(10): есть контакты

HOT≥70, WARM 40-69, COLD 20-39, IRRELEVANT<20`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 350,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = (data.content?.[0]?.text ?? "").trim();
    return JSON.parse(text) as ClassifyResult;
  } catch {
    return null;
  }
}

export async function classifyPost(post: VkPost): Promise<IntentLead | null> {
  if (!post.text || post.text.length < 15) return null;
  const result = await callClaude(post);
  if (!result || result.tier === "IRRELEVANT") return null;

  return {
    post_id:     post.post_id,
    query:       post.query,
    text:        post.text.slice(0, 500),
    author_name: post.author_name,
    author_link: post.link,
    posted_at:   new Date(post.date * 1000).toISOString(),
    tier:        result.tier,
    score:       result.score,
    intent:      result.intent,
    product:     result.product,
    location:    result.location,
    contact:     result.contact,
    urgency:     result.urgency,
    confidence:  result.confidence,
    source:      "vk",
  };
}
