import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

function isAuthorized(req: NextRequest) {
  return !!(req.cookies.get("cb_admin")?.value || req.cookies.get("cb_tenant_session")?.value);
}

const db = () => neon(process.env.DATABASE_URL!);

// GET — статистика + последние контакты/письма/ответы для дашборда
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sql = db();

  const [stats, contacts, replies] = await Promise.all([
    sql`SELECT status, COUNT(*) as count FROM outreach_contacts GROUP BY status`.catch(() => []),
    sql`SELECT id, company_name, inn, okvad_name, region, email, has_china_keywords, status, created_at
        FROM outreach_contacts ORDER BY created_at DESC LIMIT 50`.catch(() => []),
    sql`SELECT r.id, r.reply_text, r.sentiment, r.action, r.summary, r.created_at, c.company_name
        FROM outreach_replies r LEFT JOIN outreach_contacts c ON c.id = r.contact_id
        ORDER BY r.created_at DESC LIMIT 20`.catch(() => []),
  ]);

  const statsMap: Record<string, number> = {};
  for (const row of stats as Array<{ status: string; count: string }>) {
    statsMap[row.status] = Number(row.count);
  }

  return NextResponse.json({ stats: statsMap, contacts, replies });
}
