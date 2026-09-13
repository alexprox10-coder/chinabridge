// Импорт лидов из n8n DataTable ZUdd2z8BpyvePLeX в outbound_leads
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { outboundLeads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export const runtime = "nodejs";
export const maxDuration = 60;

const N8N_BASE = process.env.N8N_BASE_URL ?? "https://n8n.arendadom24.ru";
const N8N_KEY  = process.env.N8N_API_KEY ?? "";
const TABLE_ID = "ZUdd2z8BpyvePLeX"; // WB Sellers DataTable

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
    const vertical = body.vertical ?? "KZ_AUTO";
    const country = body.country ?? "KZ";

    // Получаем лиды из n8n DataTable
    const dtRes = await fetch(
      `${N8N_BASE}/api/v1/data-tables/${TABLE_ID}/rows?limit=${limit}`,
      { headers: { "X-N8N-API-KEY": N8N_KEY }, signal: AbortSignal.timeout(30000) }
    );

    if (!dtRes.ok) {
      return NextResponse.json({ ok: false, error: `n8n DataTable error: ${dtRes.status}` }, { status: 502 });
    }

    const dtData = await dtRes.json();
    const rows: Record<string, string>[] = dtData.rows ?? dtData.data ?? [];

    const db = await getDb();
    let imported = 0;
    let skipped = 0;

    for (const row of rows) {
      const companyName = row["company"] ?? row["Company"] ?? row["name"] ?? "";
      const phone       = row["phone"] ?? row["Phone"] ?? "";
      const website     = row["website"] ?? row["Website"] ?? "";
      const category    = row["category"] ?? row["Category"] ?? "";
      const city        = row["city"] ?? row["City"] ?? "Алматы";
      const email       = row["email"] ?? row["Email"] ?? "";
      const address     = row["address"] ?? row["Address"] ?? "";

      if (!companyName) { skipped++; continue; }

      const dedupHash = makeDedup(companyName, phone, website);

      // Проверяем дубликат
      const existing = await db
        .select({ id: outboundLeads.id })
        .from(outboundLeads)
        .where(eq(outboundLeads.dedupHash, dedupHash))
        .limit(1);

      if (existing.length) { skipped++; continue; }

      const outboundId = `ob_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();

      await db.insert(outboundLeads).values({
        outboundId,
        tenantId: "tenant-chinabridge",
        stage: "FOUND",
        companyName,
        phone,
        website,
        domain: website ? new URL(website.startsWith("http") ? website : `https://${website}`).hostname.replace("www.", "") : "",
        marketplace: detectMarketplace(website),
        country,
        city,
        email,
        address,
        category: category || detectCategory(address + " " + companyName),
        source: "GOOGLE_MAPS",
        dedupHash,
        campaign: "pilot-v1",
        vertical,
        createdAt: now,
        updatedAt: now,
      });

      imported++;
    }

    return NextResponse.json({ ok: true, imported, skipped, total: rows.length });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
