import { NextRequest, NextResponse } from 'next/server';
import { ALL_KNOWLEDGE } from '@/lib/knowledge';

export const runtime = 'nodejs';
export const maxDuration = 20;

const SYSTEM = `Ты — AI-консультант ChinaBridge по импорту из Китая. Отвечай только на вопросы об импорте, логистике, поставщиках, таможне и связанных темах.

База знаний:
${ALL_KNOWLEDGE}

Правила:
- Отвечай кратко и по делу (2-4 предложения)
- Если вопрос о стоимости доставки — предложи использовать калькулятор
- Если ищут товар — предложи AI Поиск товаров
- Если ищут поставщика — предложи AI Поиск поставщиков
- Если не знаешь точного ответа — скажи что менеджер уточнит и дай Telegram @chinabridge
- Отвечай на русском языке
- В конце ответа добавь поле suggestions с массивом из 0-2 строк вида "tool:calculator", "tool:product-finder", "tool:supplier-finder" если они применимы
- Ответь ТОЛЬКО валидным JSON: { "answer": "...", "suggestions": [] }`;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const question = String(body.question ?? '').trim();

  if (!question || question.length < 2) {
    return NextResponse.json({ ok: false, error: 'Задайте вопрос' }, { status: 400 });
  }
  if (question.length > 500) {
    return NextResponse.json({ ok: false, error: 'Вопрос слишком длинный' }, { status: 400 });
  }

  const orKey = process.env.OPENROUTER_API_KEY;
  if (!orKey) {
    return NextResponse.json({ ok: false, error: 'AI временно недоступен' }, { status: 503 });
  }

  const history = Array.isArray(body.history)
    ? body.history.slice(-4).map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content).slice(0, 800),
      }))
    : [];

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${orKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://chinabridge.pro',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM },
          ...history,
          { role: 'user', content: question },
        ],
        max_tokens: 400,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(15000),
    });

    const aiData = await res.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response');

    const parsed = JSON.parse(content) as { answer?: string; suggestions?: string[] };
    const answer = parsed.answer?.trim();
    if (!answer) throw new Error('No answer in response');

    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions.filter((s: unknown) => typeof s === 'string').slice(0, 2)
      : [];

    // Сохраняем вопрос в DB для SEO-анализа (non-blocking)
    saveQuestion(question, answer).catch(() => {});

    return NextResponse.json({ ok: true, answer, suggestions });
  } catch (e) {
    console.error('[knowledge/chat]', e);
    return NextResponse.json({ ok: false, error: 'Ошибка AI. Попробуйте ещё раз.' }, { status: 500 });
  }
}

async function saveQuestion(question: string, answer: string) {
  if (question.length < 10) return;
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL!);

    let score = 5;
    const q = question.toLowerCase();
    if (question.length > 40) score += 2;
    else if (question.length > 25) score += 1;
    if (question.length < 15) score -= 2;
    const infoWords = ["как", "сколько", "почему", "что такое", "можно ли", "нужно ли", "когда", "зачем", "где"];
    if (infoWords.some(w => q.includes(w))) score += 1;
    const importWords = ["китай", "доставк", "таможн", "поставщик", "карго", "казахстан", "wb", "ozon", "1688", "alibaba", "выкуп", "импорт"];
    score += Math.min(importWords.filter(w => q.includes(w)).length, 2);
    score = Math.max(1, Math.min(10, score));

    const keyword = question.replace(/^(как|сколько|почему|что такое|можно ли|когда|зачем|где|есть ли)\s+/i, "").replace(/\?$/, "").trim();

    await sql`
      CREATE TABLE IF NOT EXISTS knowledge_questions (
        id SERIAL PRIMARY KEY, question TEXT NOT NULL, answer TEXT NOT NULL,
        keyword TEXT, seo_score INTEGER DEFAULT 5,
        page_created BOOLEAN DEFAULT false, page_slug TEXT,
        asked_at TIMESTAMPTZ DEFAULT now()
      )
    `;
    await sql`
      INSERT INTO knowledge_questions (question, answer, keyword, seo_score)
      VALUES (${question}, ${answer}, ${keyword}, ${score})
    `;
  } catch { /* silent */ }
}
