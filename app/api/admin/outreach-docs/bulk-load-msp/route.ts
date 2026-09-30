import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const maxDuration = 60;

// ВРЕМЕННЫЙ one-off endpoint: переносит МСП-контакты, загруженные ранее через
// внешний n8n Postgres-credential (который, как выяснилось, указывает на
// ДРУГУЮ базу, чем сама app), в реальную БД приложения (process.env.DATABASE_URL).
// Удалить сразу после однократного использования.
const SETUP_TOKEN = "cb-msp-migrate-7f3a9d21-one-off";

interface MspContact {
  name: string;
  inn: string;
  okved: string;
  okvedName: string;
  region: string;
  hasKeyword?: boolean;
  found?: string[];
}

async function ensureTable() {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`CREATE TABLE IF NOT EXISTS outreach_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    company_name TEXT NOT NULL,
    inn TEXT UNIQUE,
    okvad TEXT,
    okvad_name TEXT,
    region TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    has_china_keywords BOOLEAN DEFAULT FALSE,
    china_keywords_found TEXT[],
    status TEXT DEFAULT 'new',
    email_sent_at TIMESTAMPTZ,
    reply_received_at TIMESTAMPTZ,
    reply_text TEXT,
    source TEXT DEFAULT 'msp_registry'
  )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_outreach_contacts_status ON outreach_contacts(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_outreach_contacts_email ON outreach_contacts(email)`;
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-setup-token");
  if (token !== SETUP_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const contacts = (await req.json()) as MspContact[];
  if (!Array.isArray(contacts)) {
    return NextResponse.json({ error: "expected array" }, { status: 400 });
  }

  await ensureTable();
  const sql = neon(process.env.DATABASE_URL!);

  let inserted = 0;
  for (const c of contacts) {
    try {
      await sql`
        INSERT INTO outreach_contacts (company_name, inn, okvad, okvad_name, region, has_china_keywords, china_keywords_found, status, source)
        VALUES (${c.name}, ${c.inn}, ${c.okved}, ${c.okvedName}, ${c.region}, ${!!c.hasKeyword}, ${c.found || []}, 'new', 'msp_registry')
        ON CONFLICT (inn) DO NOTHING
      `;
      inserted++;
    } catch {
      // пропускаем некорректные записи (дубли/пустой ИНН и т.п.)
    }
  }

  const countRows = (await sql`SELECT COUNT(*)::int as cnt FROM outreach_contacts`) as Array<{ cnt: number }>;

  return NextResponse.json({ ok: true, processed: contacts.length, attempted_insert: inserted, total_in_db: countRows[0]?.cnt ?? 0 });
}
