import { NextRequest, NextResponse } from "next/server";
import { SEO_KEYWORDS, getClusterGroups } from "@/lib/seo/clusters";
import type { SeoKeyword } from "@/lib/seo/clusters";
import { getLLMConfig } from "@/lib/ai/client";

function auth(req: NextRequest) {
  return req.cookies.get("cb_admin")?.value || req.cookies.get("cb_tenant_session")?.value;
}

async function getDynamicKeywords(): Promise<SeoKeyword[]> {
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`SELECT * FROM seo_keywords_dynamic ORDER BY priority DESC, created_at DESC LIMIT 500`;
    return (rows as Record<string, string | number>[]).map(r => ({
      id:              String(r.id),
      keyword:         String(r.keyword),
      cluster:         String(r.cluster),
      clusterLabel:    String(r.cluster_label),
      clusterGroup:    r.cluster_group as SeoKeyword["clusterGroup"],
      type:            r.type as SeoKeyword["type"],
      estimatedTraffic: r.traffic as SeoKeyword["estimatedTraffic"],
      competition:     r.competition as SeoKeyword["competition"],
      priority:        Number(r.priority),
      pageTemplate:    r.template as SeoKeyword["pageTemplate"],
      targetUrl:       String(r.target_url),
      status:          (r.status ?? "pending") as SeoKeyword["status"],
    }));
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cluster  = searchParams.get("cluster") ?? "";
  const group    = searchParams.get("group")   ?? "";
  const status   = searchParams.get("status")  ?? "";
  const type     = searchParams.get("type")    ?? "";
  const priority = searchParams.get("priority") ? Number(searchParams.get("priority")) : 0;

  const dynamic  = await getDynamicKeywords();
  const all      = [...SEO_KEYWORDS, ...dynamic];

  let keywords = all;
  if (cluster)  keywords = keywords.filter(k => k.cluster === cluster);
  if (group)    keywords = keywords.filter(k => k.clusterGroup === group);
  if (status)   keywords = keywords.filter(k => k.status === status);
  if (type)     keywords = keywords.filter(k => k.type === type);
  if (priority) keywords = keywords.filter(k => k.priority >= priority);
  keywords = keywords.sort((a, b) => b.priority - a.priority);

  const groups = getClusterGroups();
  const stats = {
    total:        all.length,
    pending:      all.filter(k => k.status === "pending").length,
    briefReady:   all.filter(k => k.status === "brief_ready").length,
    pageCreated:  all.filter(k => k.status === "page_created").length,
    indexed:      all.filter(k => k.status === "indexed").length,
    highPriority: all.filter(k => k.priority >= 9).length,
    commercial:   all.filter(k => k.type === "commercial").length,
  };

  return NextResponse.json({ ok: true, keywords, groups, stats });
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { keyword, targetUrl, clusterLabel, type } = body as {
    keyword: string; targetUrl: string; clusterLabel: string; type: string;
  };

  if (!keyword) return NextResponse.json({ ok: false, error: "keyword required" }, { status: 400 });

  const { baseURL, apiKey, model } = getLLMConfig();
  if (!apiKey) return NextResponse.json({ ok: false, error: "no_api_key" }, { status: 500 });

  const systemPrompt = `Ты SEO-эксперт по B2B импорту из Китая (Россия, Казахстан, Узбекистан).
Пиши ТЗ для SEO-страниц на русском языке.
Ответ ТОЛЬКО JSON без markdown.`;

  const userPrompt = `Создай подробное SEO ТЗ для страницы по ключевику: "${keyword}"
Кластер: ${clusterLabel}, Тип: ${type}, URL: ${targetUrl}

Ответ в JSON:
{
  "title": "заголовок H1",
  "metaTitle": "мета-тег title (до 60 символов)",
  "metaDescription": "мета-описание (до 155 символов)",
  "h1": "заголовок H1",
  "intent": "что ищет пользователь",
  "audience": "целевая аудитория",
  "structure": ["раздел 1", "раздел 2", ...],
  "keyPoints": ["ключевой тезис 1", "ключевой тезис 2", ...],
  "lsi": ["LSI слово 1", "LSI слово 2", ...],
  "cta": "призыв к действию",
  "wordCount": 1200,
  "unique_angle": "уникальный угол / USP страницы"
}`;

  try {
    const res = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        Authorization:   `Bearer ${apiKey}`,
        "HTTP-Referer":  "https://chinabridge.pro",
        "X-Title":       "ChinaBridge SEO Clusters",
      },
      body: JSON.stringify({
        model, temperature: 0.3, max_tokens: 1500,
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
    const brief = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    return NextResponse.json({ ok: true, brief });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
