import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const maxDuration = 300;

function isAuthorized(req: NextRequest) {
  return !!(req.cookies.get("cb_admin")?.value || req.cookies.get("cb_tenant_session")?.value);
}

const PIPELINE_STATUSES = ["new","analyzing","sourced","kp_ready","contacted","negotiating","deal","rejected"];

interface AnalysisResult {
  product_category: string;
  what_they_sell: string;
  who_are_clients: string;
  geography: string;
  china_fit: string;
  suggested_goods: string;
  kp_message: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  priority_reason: string;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const sql = neon(process.env.DATABASE_URL!);

  const rows = await sql`
    SELECT id, company_name, inn, okvad, okvad_name, region,
           lead_score, is_internet_seller, status, created_at
    FROM outreach_contacts
    WHERE source = 'kontur_compass'
    ORDER BY lead_score DESC NULLS LAST, created_at DESC
    LIMIT 200
  `;

  const leads = rows.map(r => {
    let extra: Record<string, unknown> = {};
    try { extra = JSON.parse(r.okvad_name as string ?? "{}"); } catch {}
    return {
      id: r.id,
      company_name: r.company_name,
      inn: r.inn,
      region: r.region,
      lead_score: Number(r.lead_score) || 0,
      status: r.status || "new",
      created_at: r.created_at,
      phone: extra.phone as string | null,
      email: extra.email as string | null,
      site_url: extra.site_url as string | null,
      director: extra.director as string | null,
      position: extra.position as string | null,
      revenue: extra.revenue as number | null,
      employees: extra.employees as number | null,
      okvad_full: extra.okvad_full as string | null,
      product_category: extra.product_category as string | null,
      supplier_found: extra.supplier_found as string | null,
      msp_category: extra.msp_category as string | null,
      what_they_sell: extra.what_they_sell as string | null,
      who_are_clients: extra.who_are_clients as string | null,
      china_fit: extra.china_fit as string | null,
      suggested_goods: extra.suggested_goods as string | null,
      kp_message: extra.kp_message as string | null,
      ai_priority: extra.ai_priority as string | null,
      priority_reason: extra.priority_reason as string | null,
    };
  });

  const byStage = Object.fromEntries(PIPELINE_STATUSES.map(s => [s, leads.filter(l => l.status === s)]));
  return NextResponse.json({ ok: true, leads, byStage, total: leads.length });
}

export async function PATCH(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const sql = neon(process.env.DATABASE_URL!);
  const body = await req.json();
  const { id, status, note, product_category, supplier_found } = body;

  if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });

  // Get current record
  const rows = await sql`SELECT okvad_name FROM outreach_contacts WHERE id = ${id} AND source = 'kontur_compass'`;
  if (!rows.length) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

  let extra: Record<string, unknown> = {};
  try { extra = JSON.parse(rows[0].okvad_name as string ?? "{}"); } catch {}

  if (product_category !== undefined) extra.product_category = product_category;
  if (supplier_found !== undefined) extra.supplier_found = supplier_found;
  if (note !== undefined) extra.note = note;

  await sql`
    UPDATE outreach_contacts
    SET status     = COALESCE(${status ?? null}, status),
        okvad_name = ${JSON.stringify(extra)}
    WHERE id = ${id} AND source = 'kontur_compass'
  `;

  return NextResponse.json({ ok: true });
}

// shared helper — analyzes one company with OpenRouter
async function analyzeCompany(
  companyName: string,
  extra: Record<string, unknown>,
  siteUrl: string | null,
  okvadFull: string | null,
): Promise<{ analysis: AnalysisResult; siteText: string; aiError?: string }> {
  const orBase = (process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1").replace(/\/$/, "");
  const orModel = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
  const orKey = process.env.OPENROUTER_API_KEY ?? "";

  const defaultAnalysis: AnalysisResult = {
    product_category: okvadFull
      ? okvadFull.replace(/^\d+\.?\d*\s*/, "").split(" ").slice(0, 4).join(" ").toLowerCase()
      : "неизвестно",
    what_they_sell: "",
    who_are_clients: "",
    geography: extra.region as string || "",
    china_fit: "",
    suggested_goods: "",
    kp_message: "",
    priority: "MEDIUM",
    priority_reason: "",
  };

  // Scrape site
  let siteText = "";
  if (siteUrl) {
    try {
      const fcRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.FIRECRAWL_API_KEY}` },
        body: JSON.stringify({ url: siteUrl, formats: ["markdown"], onlyMainContent: true }),
        signal: AbortSignal.timeout(10000),
      });
      if (fcRes.ok) {
        const fcData = await fcRes.json();
        siteText = (fcData.data?.markdown ?? fcData.markdown ?? "").slice(0, 3000);
      }
    } catch { /* site unavailable */ }
  }

  const revenue = extra.revenue ? `${Math.round(Number(extra.revenue) / 1_000_000)} млн ₽` : "неизвестна";
  const employees = extra.employees ? `${extra.employees} чел` : "неизвестно";
  const okvadSecondary = extra.okvad_secondary as string | null;

  const systemMsg = `Ты аналитик компании ChinaBridge — мы помогаем российским компаниям закупать товары в Китае (1688, Alibaba, Taobao) и доставлять в Россию/Казахстан. Наши цены на 30-50% ниже местных оптовиков. Ты отвечаешь ТОЛЬКО валидным JSON-объектом без markdown-оберток.`;

  const userMsg = `Проанализируй компанию-лид:
Название: ${companyName}
ОКВЭД основной: ${okvadFull ?? "не указан"}
${okvadSecondary ? `ОКВЭД доп: ${okvadSecondary.slice(0, 300)}` : ""}
Выручка: ${revenue}
Сотрудников: ${employees}
Регион: ${extra.region || "неизвестен"}
${siteUrl ? `Сайт: ${siteUrl}` : "Сайт: не указан"}
${siteText ? `\nКонтент сайта:\n${siteText}` : "\n(сайт недоступен — анализируй по ОКВЭД и названию)"}

Верни JSON:
{"product_category":"3-5 слов категория","what_they_sell":"1-2 предложения что продают/производят","who_are_clients":"кто покупатели B2B/B2C","china_fit":"почему нужны товары из Китая","suggested_goods":"3-5 категорий товаров из Китая","kp_message":"готовое первое сообщение директору в WhatsApp (2-3 предложения конкретная польза)","priority":"HIGH или MEDIUM или LOW","priority_reason":"причина приоритета"}`;

  if (!orKey) {
    return { analysis: defaultAnalysis, siteText, aiError: "OPENROUTER_API_KEY not set" };
  }

  try {
    const aiRes = await fetch(`${orBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${orKey}`,
        "HTTP-Referer": "https://chinabridge.pro",
        "X-Title": "ChinaBridge Lead Analysis",
      },
      body: JSON.stringify({
        model: orModel,
        max_tokens: 900,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: userMsg },
        ],
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text().catch(() => aiRes.statusText);
      throw new Error(`OpenRouter ${aiRes.status}: ${errText.slice(0, 200)}`);
    }

    const aiData = await aiRes.json();
    const raw = aiData.choices?.[0]?.message?.content?.trim() ?? "";
    if (!raw) throw new Error("Empty AI response");

    // Extract JSON (strip any accidental fences)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`No JSON in response: ${raw.slice(0, 100)}`);
    const parsed = JSON.parse(jsonMatch[0]);
    return { analysis: { ...defaultAnalysis, ...parsed }, siteText };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { analysis: defaultAnalysis, siteText, aiError: msg };
  }
}

// POST — AI analyze single company
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const sql = neon(process.env.DATABASE_URL!);
  const { id } = await req.json();

  const rows = await sql`SELECT company_name, inn, okvad_name FROM outreach_contacts WHERE id = ${id} AND source = 'kontur_compass'`;
  if (!rows.length) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

  const rawOkvad = rows[0].okvad_name;
  let extra: Record<string, unknown> = {};
  try {
    extra = typeof rawOkvad === "object" && rawOkvad !== null
      ? (rawOkvad as Record<string, unknown>)
      : JSON.parse(rawOkvad as string ?? "{}");
  } catch {}

  const siteUrl = extra.site_url as string | null;
  const okvadFull = extra.okvad_full as string | null;
  const companyName = rows[0].company_name as string;

  const { analysis, siteText, aiError } = await analyzeCompany(companyName, extra, siteUrl, okvadFull);

  Object.assign(extra, {
    product_category: analysis.product_category,
    what_they_sell: analysis.what_they_sell,
    who_are_clients: analysis.who_are_clients,
    china_fit: analysis.china_fit,
    suggested_goods: analysis.suggested_goods,
    kp_message: analysis.kp_message,
    ai_priority: analysis.priority,
    priority_reason: analysis.priority_reason,
    site_text_snippet: siteText.slice(0, 400),
  });

  await sql`
    UPDATE outreach_contacts
    SET status     = CASE WHEN status IN ('new', 'analyzing') THEN 'kp_ready' ELSE status END,
        okvad_name = ${JSON.stringify(extra)}
    WHERE id = ${id} AND source = 'kontur_compass'
  `;

  return NextResponse.json({ ok: true, analysis, aiError: aiError ?? null });
}

// PUT — batch analyze all unanalyzed leads (up to 10 per call)
export async function PUT(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const sql = neon(process.env.DATABASE_URL!);

  const rows = await sql`
    SELECT id, company_name, okvad_name FROM outreach_contacts
    WHERE source = 'kontur_compass'
      AND status NOT IN ('rejected', 'deal', 'kp_ready', 'contacted', 'negotiating')
      AND (
        okvad_name::text NOT LIKE '%"kp_message":"%'
        OR okvad_name::text LIKE '%"kp_message":""%'
        OR okvad_name::text LIKE '%"kp_message":null%'
        OR okvad_name::text LIKE '%"kp_message":""%'
      )
    ORDER BY lead_score DESC NULLS LAST
    LIMIT 10
  `;

  const results: { id: number; name: string; ok: boolean; error?: string }[] = [];

  for (const row of rows) {
    const rawOkvad = row.okvad_name;
    let extra: Record<string, unknown> = {};
    try {
      extra = typeof rawOkvad === "object" && rawOkvad !== null
        ? (rawOkvad as Record<string, unknown>)
        : JSON.parse(rawOkvad as string ?? "{}");
    } catch {}

    const siteUrl = extra.site_url as string | null;
    const okvadFull = extra.okvad_full as string | null;
    const companyName = row.company_name as string;

    const { analysis, siteText, aiError } = await analyzeCompany(companyName, extra, siteUrl, okvadFull);

    Object.assign(extra, {
      product_category: analysis.product_category,
      what_they_sell: analysis.what_they_sell,
      who_are_clients: analysis.who_are_clients,
      china_fit: analysis.china_fit,
      suggested_goods: analysis.suggested_goods,
      kp_message: analysis.kp_message,
      ai_priority: analysis.priority,
      priority_reason: analysis.priority_reason,
      site_text_snippet: siteText.slice(0, 400),
    });

    try {
      await sql`
        UPDATE outreach_contacts
        SET status = CASE WHEN status IN ('new', 'analyzing') THEN 'kp_ready' ELSE status END,
            okvad_name = ${JSON.stringify(extra)}
        WHERE id = ${row.id} AND source = 'kontur_compass'
      `;
      results.push({ id: Number(row.id), name: companyName, ok: !aiError, error: aiError });
    } catch (e) {
      results.push({ id: Number(row.id), name: companyName, ok: false, error: String(e) });
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
