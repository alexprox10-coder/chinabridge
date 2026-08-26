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
  // Prefer direct Anthropic key, fall back to OpenRouter
  const anthropicKey  = process.env.ANTHROPIC_API_KEY ?? "";
  const openrouterKey = process.env.OPENROUTER_API_KEY ?? "";
  if (!anthropicKey && !openrouterKey) return null;

  const useOpenRouter = !anthropicKey && !!openrouterKey;
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

HOT≥65, WARM 30-64, COLD 15-29, IRRELEVANT<15

ВАЖНО: Если пост — реклама карго-компании, объявление о своих услугах, курс/обучение, новость или контент от провайдера — это IRRELEVANT (score<20). Нас интересуют ТОЛЬКО частные лица и бизнес, которые ИЩУТ карго/доставку/поставщика, а не предлагают.`;

  try {
    let res: Response;
    if (useOpenRouter) {
      const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
      res = await fetch(`${process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1"}/chat/completions`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${openrouterKey}`, "Content-Type": "application/json", "HTTP-Referer": "https://chinabridge.pro" },
        body: JSON.stringify({
          model,
          max_tokens: 350,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: AbortSignal.timeout(25_000),
      });
      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        console.error(`[classifier] OpenRouter ${res.status} model=${model}:`, errBody.slice(0, 300));
        return null;
      }
      const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
      const raw = (data.choices?.[0]?.message?.content ?? "").trim();
      if (!raw) { console.error("[classifier] empty content from OpenRouter"); return null; }
      const text = raw.replace(/```json\n?|\n?```/g, "").trim();
      return JSON.parse(text) as ClassifyResult;
    } else {
      res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": anthropicKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 350, messages: [{ role: "user", content: prompt }] }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) return null;
      const data = await res.json() as { content?: Array<{ text: string }> };
      const text = (data.content?.[0]?.text ?? "").trim();
      return JSON.parse(text) as ClassifyResult;
    }
  } catch (e) {
    console.error("[classifier] exception:", String(e));
    return null;
  }
}

export async function classifyPost(post: VkPost): Promise<IntentLead | null> {
  if (!post.text || post.text.length < 15) return null;
  const result = await callClaude(post);
  if (!result) return null;
  // Re-apply threshold in code (score takes priority over LLM tier label)
  if (result.score < 15 || result.tier === "IRRELEVANT") return null;
  if (result.score >= 65) result.tier = "HOT";
  else if (result.score >= 30) result.tier = "WARM";
  else if (result.score >= 15) result.tier = "COLD";

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
