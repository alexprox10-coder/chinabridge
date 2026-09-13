// Импорт лидов из n8n DataTable ZUdd2z8BpyvePLeX в outbound_leads
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import crypto from "crypto";

export const runtime = "nodejs";
export const maxDuration = 60;

const N8N_BASE = process.env.N8N_BASE_URL ?? "https://n8n.arendadom24.ru";
const N8N_KEY  = process.env.N8N_API_KEY ?? "";
const TABLE_ID = "ZUdd2z8BpyvePLeX";

function makeDedup(...parts: string[]) {
  return crypto.createHash("md5").update(parts.join("|").toLowerCase()).digest("hex");
}

function detectCategory(raw: string): string {
  const c = raw.toLowerCase();
  if (c.includes("авто") || c.includes("auto") || c.includes("запчаст")) return "AUTO_ACCESSORIES";
  if (c.includes("электрон") || c.includes("телефон") || c.includes("компьютер")) return "ELECTRONICS";
  if (c.includes("одежд") || c.includes("обувь") || c.includes("textile")) return "CLOTHING";
  if (c.includes("мебел") || c.includes("дом") || c.includes("home")) return "HOME";
  if (c.includes("строй") || c.includes("материал") || c.includes("инструм")) return "TOOLS";
  if (c.includes("продукт") || c.includes("еда") || c.includes("food")) return "CONSUMER_GOODS";
  return "OTHER";
}

function detectMarketplace(website: string): string {
  if (!website) return "NONE";
  if (website.includes("kaspi")) return "KASPI";
  if (website.includes("wildberries") || website.includes("wb.ru")) return "WB";
  if (website.includes("ozon")) return "OZON";
  return "NONE";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const limit = body.limit ?? 100;
    const vertical = (body.vertical ?? "KZ_AUTO") as string;
    const country  = (body.country  ?? "KZ") as string;

    const sql = neon(process.env.DATABASE_URL!);

    // Диагностика: проверим что таблица есть
    let tableExists = false;
    try {
      const check = await sql`
        SELECT 1 FROM information_schema.tables
        WHERE table_schema='public' AND table_name='outbound_leads'
        LIMIT 1
      `;
      tableExists = check.length > 0;
    } catch {
      return NextResponse.json({ ok: false, error: "DB connection failed" }, { status: 500 });
    }

    if (!tableExists) {
      return NextResponse.json({ ok: false, error: "outbound_leads table not found — run /api/outbound/init first" }, { status: 500 });
    }

    const cursor = (body.cursor ?? null) as string | null;

    // Получаем лиды из n8n DataTable (cursor pagination)
    const n8nUrl = cursor
      ? `${N8N_BASE}/api/v1/data-tables/${TABLE_ID}/rows?cursor=${encodeURIComponent(cursor)}`
      : `${N8N_BASE}/api/v1/data-tables/${TABLE_ID}/rows`;

    const dtRes = await fetch(
      n8nUrl,
      { headers: { "X-N8N-API-KEY": N8N_KEY }, signal: AbortSignal.timeout(30000) }
    );

    if (!dtRes.ok) {
      const errText = await dtRes.text().catch(() => "");
      return NextResponse.json({ ok: false, error: `n8n DataTable error: ${dtRes.status} ${errText.slice(0, 200)}` }, { status: 502 });
    }

    const dtData = await dtRes.json();
    const rows: Record<string, string>[] = dtData.data ?? dtData.rows ?? [];
    const nextCursor: string | null = dtData.nextCursor ?? null;

    let imported = 0;
    let skipped  = 0;

    for (const row of rows) {
      const companyName = row["company"] ?? row["Company"] ?? row["name"] ?? "";
      const phone       = row["phone"]   ?? row["Phone"]   ?? "";
      const website     = row["website"] ?? row["Website"] ?? "";
      const category    = row["category"] ?? row["Category"] ?? "";
      const city        = row["city"]    ?? row["City"]    ?? "Алматы";
      const email       = row["email"]   ?? row["Email"]   ?? "";
      const telegram    = row["telegram"] ?? "";
      const source      = row["source"]  ?? "GOOGLE_MAPS";

      if (!companyName) { skipped++; continue; }

      const dedupHash = makeDedup(companyName, phone, website);

      // Проверяем дубликат
      const existing = await sql`
        SELECT id FROM outbound_leads WHERE dedup_hash = ${dedupHash} LIMIT 1
      `;
      if (existing.length > 0) { skipped++; continue; }

      const outboundId = `ob_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();

      let domain = "";
      try {
        if (website) domain = new URL(website.startsWith("http") ? website : `https://${website}`).hostname.replace("www.", "");
      } catch { /* ignore invalid URLs */ }

      await sql`
        INSERT INTO outbound_leads (
          outbound_id, tenant_id, stage, company_name, phone, website,
          domain, marketplace, country, city, email, telegram,
          category, source, dedup_hash, campaign, vertical,
          created_at, updated_at
        ) VALUES (
          ${outboundId}, 'tenant-chinabridge', 'FOUND',
          ${companyName}, ${phone}, ${website},
          ${domain}, ${detectMarketplace(website)}, ${country}, ${city}, ${email}, ${telegram},
          ${category || detectCategory(city + " " + companyName)},
          ${source}, ${dedupHash}, 'pilot-v1', ${vertical},
          ${now}, ${now}
        )
      `;
      imported++;
    }

    return NextResponse.json({ ok: true, imported, skipped, total: rows.length, nextCursor });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
