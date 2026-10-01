import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const maxDuration = 120;

// Одноразовый инструмент: заливает контакты из JSON (результат
// parse-msp-registry.mjs --out=...) напрямую в process.env.DATABASE_URL —
// то же соединение, что использует всё приложение (не доверяем внешним
// credentials, которые могут указывать на другую БД). Нужен потому что
// прямой `pg`-коннект к Neon зависает на хендшейке из этого окружения
// (TCP SYN проходит, сам протокол — нет), хотя обычные HTTPS-запросы к
// Vercel работают без проблем — см. обсуждение в этой же сессии.
// Удаляется сразу после использования.
const SETUP_TOKEN = "cb-msp-bulkload-2026-10-01-a7f3";

interface Contact {
  name: string;
  inn: string;
  okved: string;
  okvedName: string;
  region: string;
  hasKeyword?: boolean;
  found?: string[];
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-setup-token");
  if (token !== SETUP_TOKEN) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { contacts?: Contact[] } | null;
  if (!body?.contacts?.length) return NextResponse.json({ error: "no contacts" }, { status: 400 });

  const sql = neon(process.env.DATABASE_URL!);
  let saved = 0;
  let withKeywords = 0;
  const errors: string[] = [];

  for (const c of body.contacts) {
    try {
      await sql`
        INSERT INTO outreach_contacts
          (company_name, inn, okvad, okvad_name, region, has_china_keywords, china_keywords_found, status, source)
        VALUES (${c.name}, ${c.inn}, ${c.okved}, ${c.okvedName}, ${c.region}, ${!!c.hasKeyword}, ${c.found ?? []}, 'new', 'msp_registry')
        ON CONFLICT (inn) DO UPDATE SET
          okvad = EXCLUDED.okvad, okvad_name = EXCLUDED.okvad_name,
          has_china_keywords = EXCLUDED.has_china_keywords, china_keywords_found = EXCLUDED.china_keywords_found
      `;
      saved++;
      if (c.hasKeyword) withKeywords++;
    } catch (e) {
      errors.push(`${c.inn}: ${String(e)}`);
    }
  }

  const totalRow = (await sql`SELECT COUNT(*)::int as cnt FROM outreach_contacts`) as Array<{ cnt: number }>;

  return NextResponse.json({
    ok: true,
    attempted: body.contacts.length,
    saved,
    with_china_keywords: withKeywords,
    total_in_db: totalRow[0]?.cnt,
    errors: errors.slice(0, 10),
  });
}
