import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const maxDuration = 120;

// Временный инструмент для живой проверки WB/Ozon discovery с сети Vercel —
// Claude Code окружение не может ни достучаться напрямую до Postgres (pg-драйвер
// зависает на хендшейке даже когда голый TCP-коннект проходит), ни пройти
// антибот WB (403 на каждый вариант эндпоинта). Эндпоинт удаляется после
// диагностики, не предназначен для постоянного использования.
const SETUP_TOKEN = "cb-mp-discovery-diag-f2a9c1";

const db = () => neon(process.env.DATABASE_URL!);

const WB_QUERIES = ["автозапчасти", "автозапчасти changan", "автозапчасти byd", "автозапчасти geely"];

async function ensureColumns() {
  const sql = db();
  await sql`
    ALTER TABLE outreach_contacts
      ADD COLUMN IF NOT EXISTS marketplace_source TEXT,
      ADD COLUMN IF NOT EXISTS shop_name TEXT,
      ADD COLUMN IF NOT EXISTS shop_url TEXT,
      ADD COLUMN IF NOT EXISTS marketplace_seller_id TEXT,
      ADD COLUMN IF NOT EXISTS product_count INTEGER,
      ADD COLUMN IF NOT EXISTS product_category TEXT,
      ADD COLUMN IF NOT EXISTS phone TEXT
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_outreach_marketplace_source ON outreach_contacts (marketplace_source)`;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_outreach_marketplace_seller_id_unique
      ON outreach_contacts (marketplace_seller_id) WHERE marketplace_seller_id IS NOT NULL
  `;
}

async function searchWbPage(query: string, page: number) {
  const url = `https://search.wb.ru/exactmatch/ru/common/v4/search?` + new URLSearchParams({
    query, resultset: "catalog", dest: "-1257786", curr: "rub", spp: "30",
    appType: "1", lang: "ru", page: String(page), ab_testing: "false", suppressSpellcheck: "false",
  });
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json",
      "Referer": "https://www.wildberries.ru/",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`WB HTTP ${res.status}`);
  const data = (await res.json()) as { products?: Array<{ supplierId?: number; supplier?: string }> };
  return data?.products ?? [];
}

async function discoverWb(pages: number) {
  const sellers = new Map<string, { shopName: string; productCount: number }>();
  const log: string[] = [];
  for (const query of WB_QUERIES) {
    for (let page = 1; page <= pages; page++) {
      let products: Array<{ supplierId?: number; supplier?: string }>;
      try {
        products = await searchWbPage(query, page);
      } catch (e) {
        log.push(`"${query}" стр.${page}: ошибка ${String(e)}`);
        continue;
      }
      if (!products.length) { log.push(`"${query}" стр.${page}: пусто`); break; }
      for (const p of products) {
        if (p.supplierId == null) continue;
        const id = String(p.supplierId);
        const entry = sellers.get(id) ?? { shopName: p.supplier || `WB ${id}`, productCount: 0 };
        entry.productCount += 1;
        sellers.set(id, entry);
      }
    }
  }
  return { sellers, log };
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-setup-token");
  if (token !== SETUP_TOKEN) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const pages = Number(body.pages ?? 8);
  const top = Number(body.top ?? 50);

  try {
    await ensureColumns();
    const { sellers, log } = await discoverWb(pages);

    const sorted = [...sellers.entries()].sort((a, b) => b[1].productCount - a[1].productCount).slice(0, top);

    const sql = db();
    let saved = 0;
    for (const [id, s] of sorted) {
      const shopUrl = `https://www.wildberries.ru/seller/${id}`;
      await sql`
        INSERT INTO outreach_contacts
          (company_name, status, source, marketplace_source, shop_name, shop_url, marketplace_seller_id, product_count, product_category)
        VALUES (${s.shopName}, 'discovered', 'wb_pilot', 'wb_pilot', ${s.shopName}, ${shopUrl}, ${id}, ${s.productCount}, 'автозапчасти')
        ON CONFLICT (marketplace_seller_id) WHERE marketplace_seller_id IS NOT NULL DO UPDATE SET
          product_count = EXCLUDED.product_count, shop_name = EXCLUDED.shop_name, shop_url = EXCLUDED.shop_url
      `;
      saved++;
    }

    return NextResponse.json({
      ok: true,
      total_unique_sellers: sellers.size,
      saved,
      top5: sorted.slice(0, 5).map(([id, s]) => ({ id, ...s })),
      log,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
