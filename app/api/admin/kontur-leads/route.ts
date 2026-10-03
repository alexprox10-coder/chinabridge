import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const maxDuration = 60;

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

// POST — AI analyze a company's website to determine product category
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const sql = neon(process.env.DATABASE_URL!);
  const { id } = await req.json();

  const rows = await sql`SELECT company_name, inn, okvad_name FROM outreach_contacts WHERE id = ${id} AND source = 'kontur_compass'`;
  if (!rows.length) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

  let extra: Record<string, unknown> = {};
  try { extra = JSON.parse(rows[0].okvad_name as string ?? "{}"); } catch {}

  const siteUrl = extra.site_url as string | null;
  const okvadFull = extra.okvad_full as string | null;
  const companyName = rows[0].company_name as string;

  let analysis: AnalysisResult = {
    product_category: "неизвестно",
    what_they_sell: "",
    who_are_clients: "",
    geography: extra.region as string || "",
    china_fit: "",
    suggested_goods: "",
    kp_message: "",
    priority: "MEDIUM",
    priority_reason: "",
  };

  let siteMarkdown = "";
  if (siteUrl) {
    try {
      const fcRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.FIRECRAWL_API_KEY}` },
        body: JSON.stringify({ url: siteUrl, formats: ["markdown"], onlyMainContent: true }),
        signal: AbortSignal.timeout(20000),
      });
      if (fcRes.ok) {
        const fcData = await fcRes.json();
        siteMarkdown = (fcData.data?.markdown ?? fcData.markdown ?? "").slice(0, 3000);
      }
    } catch { /* no site data */ }
  }

  try {
    const revenue = extra.revenue ? `${Math.round(Number(extra.revenue) / 1_000_000)} млн ₽` : "неизвестна";
    const employees = extra.employees ? `${extra.employees} чел` : "неизвестно";
    const okvadSecondary = extra.okvad_secondary as string | null;
    const prompt = `Ты аналитик компании ChinaBridge — мы помогаем российским компаниям закупать товары в Китае (1688, Alibaba, Taobao) и доставлять их в Россию/Казахстан. Наши цены на 30-50% ниже чем местные оптовики.

Проанализируй компанию-лид:
Название: ${companyName}
ОКВЭД основной: ${okvadFull}
${okvadSecondary ? `ОКВЭД дополнительные: ${okvadSecondary.slice(0, 300)}` : ""}
Выручка: ${revenue}
Сотрудников: ${employees}
Регион: ${extra.region || "неизвестен"}
${siteUrl ? `Сайт: ${siteUrl}` : "Сайт: не указан"}
${siteMarkdown ? `\nКонтент сайта:\n${siteMarkdown}` : "\n(сайт недоступен или не указан — анализируй по ОКВЭД и названию)"}

Ответь СТРОГО в формате JSON (без markdown, без пояснений вне JSON):
{
  "product_category": "3-5 слов — категория товаров",
  "what_they_sell": "1-2 предложения что именно продают/производят",
  "who_are_clients": "кто их покупатели (B2B/B2C, отрасли, розница/опт)",
  "china_fit": "почему им нужны товары из Китая — конкретно",
  "suggested_goods": "3-5 конкретных категорий товаров из Китая которые им подойдут",
  "kp_message": "готовое первое сообщение директору на WhatsApp/Telegram (2-3 предложения, без воды, конкретная польза)",
  "priority": "HIGH или MEDIUM или LOW",
  "priority_reason": "почему такой приоритет (выручка, ниша, очевидная потребность)"
}`;

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (aiRes.ok) {
      const aiData = await aiRes.json();
      const raw = aiData.content?.[0]?.text?.trim() ?? "{}";
      const parsed = JSON.parse(raw.replace(/^```json\n?/, "").replace(/\n?```$/, ""));
      analysis = { ...analysis, ...parsed };
    }
  } catch {
    // fallback: use ОКВЭД
    if (okvadFull) {
      const parts = okvadFull.replace(/^\d+\.?\d*\s*/, "").split(" ").slice(0, 4);
      analysis.product_category = parts.join(" ").toLowerCase();
    }
  }

  // Merge all analysis fields into extra
  Object.assign(extra, {
    product_category: analysis.product_category,
    what_they_sell: analysis.what_they_sell,
    who_are_clients: analysis.who_are_clients,
    china_fit: analysis.china_fit,
    suggested_goods: analysis.suggested_goods,
    kp_message: analysis.kp_message,
    ai_priority: analysis.priority,
    priority_reason: analysis.priority_reason,
    site_markdown_snippet: siteMarkdown.slice(0, 500),
  });

  await sql`
    UPDATE outreach_contacts
    SET status     = CASE WHEN status = 'new' THEN 'analyzing' ELSE status END,
        okvad_name = ${JSON.stringify(extra)}
    WHERE id = ${id} AND source = 'kontur_compass'
  `;

  return NextResponse.json({ ok: true, analysis });
}
