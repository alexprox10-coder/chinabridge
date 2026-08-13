import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { SEO_KEYWORDS } from "@/lib/seo/clusters";
import { getLLMConfig } from "@/lib/ai/client";

async function ensureTable() {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    CREATE TABLE IF NOT EXISTS seo_pages (
      id          SERIAL PRIMARY KEY,
      slug        TEXT UNIQUE NOT NULL,
      keyword_id  TEXT NOT NULL,
      keyword     TEXT NOT NULL,
      cluster     TEXT NOT NULL,
      title       TEXT NOT NULL,
      description TEXT NOT NULL,
      h1          TEXT NOT NULL,
      intro       TEXT NOT NULL,
      sections    JSONB NOT NULL DEFAULT '[]',
      faq         JSONB NOT NULL DEFAULT '[]',
      cta_text    TEXT NOT NULL DEFAULT '',
      status      TEXT NOT NULL DEFAULT 'published',
      generated_at TIMESTAMPTZ DEFAULT now()
    )
  `;
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("cb_admin")?.value || req.cookies.get("cb_tenant_session")?.value;
  if (!token) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { keywordId } = body as { keywordId: string };

  const kw = SEO_KEYWORDS.find(k => k.id === keywordId);
  if (!kw) return NextResponse.json({ ok: false, error: "keyword not found" }, { status: 404 });

  const slug = kw.targetUrl.replace(/^\//, "");

  await ensureTable();

  const { baseURL, apiKey, model } = getLLMConfig();

  const prompt = `Ты — SEO-копирайтер для B2B платформы ChinaBridge (chinabridge.pro).
Напиши полный контент SEO-страницы для ключевого запроса: "${kw.keyword}".

Контекст:
- ChinaBridge помогает компаниям импортировать товары из Китая в Россию, Казахстан и СНГ
- Услуги: поиск поставщика, выкуп на 1688/Alibaba, карго, таможня, фулфилмент для WB/Ozon/Kaspi
- Склады: Москва и Алматы (Казахстан)
- Работают с 2019 года, 500+ поставок
- AI-платформа: расчёт маржи, поиск товара, аудит импорта

Создай SEO-страницу:
- title: 55–65 символов, коммерческий, с ключом
- description: 120–155 символов, с CTA
- h1: отличается от title, живой язык
- intro: 2–3 предложения, зацепить читателя
- sections: 3 раздела с подзаголовком и текстом (3–4 предложения каждый)
- faq: 4 вопроса-ответа по теме
- cta_text: короткий призыв к действию (1 предложение)

Ответь строго JSON:
{
  "title": "...",
  "description": "...",
  "h1": "...",
  "intro": "...",
  "sections": [{"heading": "...", "body": "..."}, ...],
  "faq": [{"q": "...", "a": "..."}, ...],
  "cta_text": "..."
}`;

  try {
    const res = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://chinabridge.pro",
        "X-Title": "ChinaBridge SEO Pages",
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

    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      INSERT INTO seo_pages (slug, keyword_id, keyword, cluster, title, description, h1, intro, sections, faq, cta_text, status)
      VALUES (
        ${slug}, ${kw.id}, ${kw.keyword}, ${kw.cluster},
        ${content.title ?? ""}, ${content.description ?? ""}, ${content.h1 ?? ""},
        ${content.intro ?? ""}, ${JSON.stringify(content.sections ?? [])},
        ${JSON.stringify(content.faq ?? [])}, ${content.cta_text ?? ""},
        'published'
      )
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        h1 = EXCLUDED.h1,
        intro = EXCLUDED.intro,
        sections = EXCLUDED.sections,
        faq = EXCLUDED.faq,
        cta_text = EXCLUDED.cta_text,
        generated_at = now()
    `;

    return NextResponse.json({ ok: true, slug });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("cb_admin")?.value || req.cookies.get("cb_tenant_session")?.value;
  if (!token) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  await ensureTable();
  const sql = neon(process.env.DATABASE_URL!);
  const rows = (await sql`SELECT slug, keyword_id, keyword, cluster, status, generated_at FROM seo_pages ORDER BY generated_at DESC`) as Array<{
    slug: string; keyword_id: string; keyword: string; cluster: string; status: string; generated_at: string;
  }>;

  const generated = new Set(rows.map(r => r.keyword_id));
  const all = SEO_KEYWORDS.map(kw => ({
    ...kw,
    generated: generated.has(kw.id),
    pageStatus: generated.has(kw.id) ? "published" : "pending",
  }));

  return NextResponse.json({ ok: true, keywords: all, totalGenerated: rows.length, total: SEO_KEYWORDS.length });
}
