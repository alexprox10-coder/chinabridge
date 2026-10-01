import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest) {
  return !!(req.cookies.get("cb_admin")?.value || req.cookies.get("cb_tenant_session")?.value);
}

const db = () => neon(process.env.DATABASE_URL!);

// outreach_replies никогда не создавалась ни одним скриптом — запрос к ней
// падал с "relation does not exist", весь Promise.all летел в catch, и вся
// статистика показывала 500 вместо реальных данных. Самосоздаём, как и
// остальные таблицы в проекте, вместо падения.
let tablesEnsured = false;
async function ensureTables() {
  if (tablesEnsured) return;
  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    CREATE TABLE IF NOT EXISTS outreach_replies (
      id SERIAL PRIMARY KEY,
      contact_id UUID REFERENCES outreach_contacts(id) ON DELETE CASCADE,
      reply_text TEXT,
      sentiment TEXT,
      action TEXT,
      summary TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  tablesEnsured = true;
}

// GET — статистика + последние контакты/письма/ответы для дашборда
export async function GET(req: NextRequest) {
  const debug = req.nextUrl.searchParams.get("debug") === "1";

  if (!isAuthorized(req)) {
    if (debug) return NextResponse.json({ error: "unauthorized", cookies: req.cookies.getAll().map(c => c.name) }, { status: 401 });
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const sql = db();
    await ensureTables();

    const [stats, contacts, replies] = await Promise.all([
      sql`SELECT status, COUNT(*) as count FROM outreach_contacts GROUP BY status`,
      sql`SELECT id, company_name, inn, okvad_name, region, email, phone, has_china_keywords, status, created_at,
                 marketplace_source, shop_name, shop_url, product_count, product_category
          FROM outreach_contacts ORDER BY created_at DESC LIMIT 50`,
      sql`SELECT r.id, r.reply_text, r.sentiment, r.action, r.summary, r.created_at, c.company_name
          FROM outreach_replies r LEFT JOIN outreach_contacts c ON c.id = r.contact_id
          ORDER BY r.created_at DESC LIMIT 20`,
    ]);

    const statsMap: Record<string, number> = {};
    for (const row of stats as Array<{ status: string; count: string }>) {
      statsMap[row.status] = Number(row.count);
    }

    return NextResponse.json({ stats: statsMap, contacts, replies, _debug: debug ? { statsRaw: stats, hasDbUrl: !!process.env.DATABASE_URL } : undefined });
  } catch (e) {
    return NextResponse.json({ error: "query_failed", message: String(e), stack: debug ? (e as Error)?.stack : undefined }, { status: 500 });
  }
}
