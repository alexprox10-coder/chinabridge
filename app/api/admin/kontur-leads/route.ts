import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(req: NextRequest) {
  return !!(req.cookies.get("cb_admin")?.value || req.cookies.get("cb_tenant_session")?.value);
}

const PIPELINE_STATUSES = ["new","analyzing","sourced","kp_ready","contacted","negotiating","deal","rejected"];

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

  let productCategory = "неизвестно";

  if (siteUrl) {
    try {
      // Firecrawl scrape
      const fcRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.FIRECRAWL_API_KEY}` },
        body: JSON.stringify({ url: siteUrl, formats: ["markdown"], onlyMainContent: true }),
        signal: AbortSignal.timeout(20000),
      });
      if (fcRes.ok) {
        const fcData = await fcRes.json();
        const markdown = fcData.data?.markdown ?? fcData.markdown ?? "";
        // Claude analyze
        const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.ANTHROPIC_API_KEY!,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 100,
            messages: [{
              role: "user",
              content: `Компания: ${companyName}\nОКВЭД: ${okvadFull}\nСайт (первые 2000 символов):\n${markdown.slice(0,2000)}\n\nОпредели основную категорию товаров этой компании в 2-4 слова (например: "косметика и гигиена", "текстиль оптом", "строительные материалы"). Ответь ТОЛЬКО категорией, без пояснений.`
            }],
          }),
          signal: AbortSignal.timeout(15000),
        });
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          productCategory = aiData.content?.[0]?.text?.trim() ?? "неизвестно";
        }
      }
    } catch { /* use okvad as fallback */ }
  }

  // Fallback to ОКВЭД description
  if (productCategory === "неизвестно" && okvadFull) {
    const parts = okvadFull.replace(/^\d+\.?\d*\s*/, "").split(" ").slice(0, 4);
    productCategory = parts.join(" ").toLowerCase();
  }

  extra.product_category = productCategory;

  await sql`
    UPDATE outreach_contacts
    SET status     = CASE WHEN status = 'new' THEN 'analyzing' ELSE status END,
        okvad_name = ${JSON.stringify(extra)}
    WHERE id = ${id} AND source = 'kontur_compass'
  `;

  return NextResponse.json({ ok: true, product_category: productCategory });
}
