import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(req: NextRequest) {
  return !!(req.cookies.get("cb_admin")?.value || req.cookies.get("cb_tenant_session")?.value);
}

const db = () => neon(process.env.DATABASE_URL!);
const DADATA_URL = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party";

async function findByInn(inn: string, token: string) {
  const res = await fetch(DADATA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": `Token ${token}` },
    body: JSON.stringify({ query: inn }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const suggestion = data.suggestions?.[0]?.data;
  if (!suggestion) return null;
  return {
    email: suggestion.emails?.[0]?.value || null,
    phone: suggestion.phones?.[0]?.value || null,
    website: suggestion.address?.value || null,
  };
}

// POST — обогащает до `limit` контактов со статусом 'new' через DaData.
// Ограничен по времени (Vercel maxDuration=60s), поэтому limit по умолчанию небольшой.
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const token = process.env.DADATA_TOKEN;
  if (!token) return NextResponse.json({ error: "DADATA_TOKEN не настроен на сервере" }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const limit = Math.min(Number(body.limit) || 30, 100);
  const source: string | null = body.source || null;

  const sql = db();
  const contacts = (source
    ? await sql`
        SELECT id, company_name, inn FROM outreach_contacts
        WHERE status = 'new' AND email IS NULL AND inn IS NOT NULL AND source = ${source}
        ORDER BY lead_score DESC NULLS LAST, created_at ASC
        LIMIT ${limit}
      `
    : await sql`
        SELECT id, company_name, inn FROM outreach_contacts
        WHERE status = 'new' AND email IS NULL AND inn IS NOT NULL
        ORDER BY has_china_keywords DESC, created_at ASC
        LIMIT ${limit}
      `
  ) as Array<{ id: string; company_name: string; inn: string }>;

  let found = 0;
  const details: Array<{ company: string; email: string | null }> = [];

  for (const c of contacts) {
    try {
      const result = await findByInn(c.inn, token);
      if (result?.email) {
        await sql`UPDATE outreach_contacts SET email = ${result.email}, phone = ${result.phone}, status = 'enriched' WHERE id = ${c.id}`;
        found++;
      } else {
        // Всегда двигаем статус вперёд — иначе одни и те же контакты попадают в следующую пачку
        await sql`UPDATE outreach_contacts SET status = 'no_contact', phone = ${result?.phone ?? null} WHERE id = ${c.id}`;
      }
      details.push({ company: c.company_name, email: result?.email || null });
    } catch {
      await sql`UPDATE outreach_contacts SET status = 'no_contact' WHERE id = ${c.id}`.catch(() => null);
      details.push({ company: c.company_name, email: null });
    }
    await new Promise((r) => setTimeout(r, 120));
  }

  return NextResponse.json({ ok: true, processed: contacts.length, found, details });
}
