import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getLLMConfig } from "@/lib/ai/client";

async function ensureTable() {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    CREATE TABLE IF NOT EXISTS knowledge_questions (
      id          SERIAL PRIMARY KEY,
      question    TEXT NOT NULL,
      answer      TEXT NOT NULL,
      keyword     TEXT,
      seo_score   INTEGER DEFAULT 5,
      page_created BOOLEAN DEFAULT false,
      page_slug   TEXT,
      asked_at    TIMESTAMPTZ DEFAULT now()
    )
  `;
}

function calcSeoScore(question: string): { score: number; keyword: string } {
  let score = 5;
  const q = question.toLowerCase();

  if (question.length > 40) score += 2;
  else if (question.length > 25) score += 1;
  if (question.length < 15) score -= 2;

  const infoWords = ["как", "сколько", "почему", "что такое", "можно ли", "нужно ли", "когда", "зачем", "где"];
  if (infoWords.some(w => q.includes(w))) score += 1;

  const importWords = ["китай", "доставк", "таможн", "поставщик", "карго", "растаможк", "казахстан", "wildberries", "wb", "ozon", "maркетплейс", "1688", "alibaba", "выкуп", "импорт"];
  const matchCount = importWords.filter(w => q.includes(w)).length;
  score += Math.min(matchCount, 2);

  score = Math.max(1, Math.min(10, score));

  // Извлечь ключевое слово (убрать вопросительные слова)
  const cleaned = question
    .replace(/^(как|сколько|почему|что такое|можно ли|нужно ли|когда|зачем|где|есть ли)\s+/i, "")
    .replace(/\?$/, "")
    .trim();
  const keyword = cleaned.length > 5 ? cleaned : question.replace(/\?$/, "").trim();

  return { score, keyword };
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("cb_admin")?.value || req.cookies.get("cb_tenant_session")?.value;
  if (!token) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  await ensureTable();
  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT id, question, answer, keyword, seo_score, page_created, page_slug, asked_at
    FROM knowledge_questions
    ORDER BY seo_score DESC, asked_at DESC
    LIMIT 200
  ` as Array<{
    id: number; question: string; answer: string; keyword: string;
    seo_score: number; page_created: boolean; page_slug: string | null; asked_at: string;
  }>;

  return NextResponse.json({ ok: true, questions: rows });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("cb_admin")?.value || req.cookies.get("cb_tenant_session")?.value;
  if (!token) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { questionId } = body as { questionId: number };

  await ensureTable();
  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`SELECT * FROM knowledge_questions WHERE id = ${questionId} LIMIT 1` as Array<{
    id: number; question: string; answer: string; keyword: string;
  }>;
  const q = rows[0];
  if (!q) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

  const slug = q.keyword
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s]/gi, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[а-яё]/g, (c) => ({ а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"yo",ж:"zh",з:"z",и:"i",й:"j",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"c",ч:"ch",ш:"sh",щ:"shh",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya" }[c] ?? c))
    .slice(0, 60);

  const { baseURL, apiKey, model } = getLLMConfig();

  const prompt = `Ты — SEO-копирайтер для платформы ChinaBridge (импорт из Китая).
На основе вопроса клиента и ответа создай полную SEO-страницу.

Вопрос: ${q.question}
Ответ AI: ${q.answer}
Ключевой запрос: ${q.keyword}

Создай SEO-страницу:
- title: 55–65 символов, коммерческий
- description: 120–155 символов с CTA
- h1: живой, отличается от title
- intro: 2–3 предложения
- sections: 3 раздела {heading, body} (3–4 предложения каждый)
- faq: 4 вопроса-ответа
- cta_text: короткий призыв к действию

JSON: { "title":"...","description":"...","h1":"...","intro":"...","sections":[...],"faq":[...],"cta_text":"..." }`;

  try {
    const res = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://chinabridge.pro",
        "X-Title": "ChinaBridge Knowledge SEO",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.6,
        max_tokens: 1800,
      }),
    });

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    const content = JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim());

    await sql`
      INSERT INTO seo_pages (slug, keyword_id, keyword, cluster, title, description, h1, intro, sections, faq, cta_text, status)
      VALUES (
        ${slug}, ${"kq-" + q.id}, ${q.keyword}, ${"knowledge"},
        ${content.title ?? ""}, ${content.description ?? ""}, ${content.h1 ?? ""},
        ${content.intro ?? ""}, ${JSON.stringify(content.sections ?? [])},
        ${JSON.stringify(content.faq ?? [])}, ${content.cta_text ?? ""},
        'published'
      )
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title, description = EXCLUDED.description,
        h1 = EXCLUDED.h1, intro = EXCLUDED.intro,
        sections = EXCLUDED.sections, faq = EXCLUDED.faq,
        cta_text = EXCLUDED.cta_text, generated_at = now()
    `;

    await sql`UPDATE knowledge_questions SET page_created = true, page_slug = ${slug} WHERE id = ${questionId}`;

    return NextResponse.json({ ok: true, slug });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
