import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getLLMConfig } from "@/lib/ai/client";
import { SEO_KEYWORDS } from "@/lib/seo/clusters";

export async function GET(req: NextRequest) {
  const cronHeader = req.headers.get("x-vercel-cron");
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET ?? "chinabridge-cron";
  if (!cronHeader && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { baseURL, apiKey, model } = getLLMConfig();
  if (!apiKey) return NextResponse.json({ ok: false, error: "no_api_key" }, { status: 500 });

  const sql = neon(process.env.DATABASE_URL!);

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS seo_keywords_dynamic (
        id          TEXT PRIMARY KEY,
        keyword     TEXT NOT NULL,
        cluster     TEXT NOT NULL,
        cluster_label TEXT NOT NULL,
        cluster_group TEXT NOT NULL,
        type        TEXT NOT NULL,
        traffic     TEXT NOT NULL DEFAULT 'medium',
        competition TEXT NOT NULL DEFAULT 'medium',
        priority    INTEGER NOT NULL DEFAULT 7,
        template    TEXT NOT NULL DEFAULT 'landing',
        target_url  TEXT NOT NULL,
        status      TEXT NOT NULL DEFAULT 'pending',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
  } catch (e) {
    return NextResponse.json({ ok: false, error: `db_init: ${e}` }, { status: 500 });
  }

  // Существующие URL (статические + динамические)
  const staticUrls = SEO_KEYWORDS.map(k => k.targetUrl);
  const dynRows = (await sql`SELECT target_url FROM seo_keywords_dynamic`) as Array<{ target_url: string }>;
  const existingUrls = new Set([...staticUrls, ...dynRows.map(r => r.target_url)]);

  // Счётчик для промпта
  const countRows = (await sql`SELECT COUNT(*)::int AS n FROM seo_keywords_dynamic`) as Array<{ n: number }>;
  const existingCount = SEO_KEYWORDS.length + (countRows[0]?.n ?? 0);
  const existingClusters = [...new Set(SEO_KEYWORDS.map(k => k.clusterLabel))].join(", ");

  const systemPrompt = `Ты SEO-эксперт по B2B импорту из Китая для рынков СНГ (Россия, Казахстан, Узбекистан, Беларусь).
Ответ ТОЛЬКО в JSON без markdown.`;

  const userPrompt = `Сейчас в базе ${existingCount} ключевых запросов по кластерам: ${existingClusters}.

Придумай 8 НОВЫХ ключевых запросов, которых ещё нет в базе.
Фокусируй на: специфические товарные ниши, длинный хвост, новые гео, коммерческие запросы с деньгами/расчётами, FAQ.

Ответ:
{
  "keywords": [
    {
      "keyword": "...",
      "cluster": "geo-kz|geo-ru|geo-uz|geo-by|cat-*|com-*|info-*",
      "cluster_label": "название кластера",
      "cluster_group": "geo|category|commercial|informational",
      "type": "commercial|informational",
      "traffic": "low|medium|high",
      "competition": "low|medium|high",
      "priority": 6,
      "template": "landing|blog|faq|category",
      "target_url": "/slug-url"
    }
  ]
}`;

  let newKeywords: Array<{
    keyword: string; cluster: string; cluster_label: string;
    cluster_group: string; type: string; traffic: string;
    competition: string; priority: number; template: string; target_url: string;
  }> = [];

  try {
    const res = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://chinabridge.pro",
        "X-Title": "ChinaBridge SEO Cron",
      },
      body: JSON.stringify({
        model, temperature: 0.7, max_tokens: 1200,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(45000),
    });
    if (!res.ok) throw new Error(`llm_${res.status}`);
    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    newKeywords = parsed.keywords ?? [];
  } catch (e) {
    return NextResponse.json({ ok: false, error: `llm: ${e}` }, { status: 500 });
  }

  const unique = newKeywords.filter(k => k.target_url && !existingUrls.has(k.target_url));

  const inserted: string[] = [];
  for (const k of unique) {
    const id = `dyn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    try {
      await sql`
        INSERT INTO seo_keywords_dynamic
          (id, keyword, cluster, cluster_label, cluster_group, type, traffic, competition, priority, template, target_url)
        VALUES
          (${id}, ${k.keyword}, ${k.cluster}, ${k.cluster_label}, ${k.cluster_group},
           ${k.type}, ${k.traffic}, ${k.competition}, ${k.priority}, ${k.template}, ${k.target_url})
        ON CONFLICT (id) DO NOTHING
      `;
      inserted.push(k.keyword);
    } catch {}
  }

  console.log(`[seo-cron] Added ${inserted.length} keywords: ${inserted.join(", ")}`);
  return NextResponse.json({ ok: true, added: inserted.length, keywords: inserted });
}
