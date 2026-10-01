// WB discovery — находит реальных продавцов категории через публичный
// поисковый JSON WB (https://search.wb.ru/...), без авторизации и без платных API.
// НЕ Seller API — тот работает только с собственным кабинетом продавца и не
// годится для разведки чужих магазинов (см. обсуждение marketplaces-mcp-ru).
//
// Пилот: категория "автозапчасти" (+ прицельные запросы под Changan/BYD/Geely,
// см. Приоритет 3), топ-50 продавцов по числу товаров в выдаче.
//
// Запуск: node scripts/outreach/wb-discovery.mjs [--queries="автозапчасти,..."] [--top=50] [--pages=8]

import pg from 'pg';
const { Client } = pg;

const DATABASE_URL =
  "postgresql://neondb_owner:npg_xDZUWkt3CiY0@ep-rapid-cell-aunj0ge5-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require";

const DEFAULT_QUERIES = [
  "автозапчасти",
  "автозапчасти changan",
  "автозапчасти byd",
  "автозапчасти geely",
];
const MOSCOW_DEST = -1257786; // -1257786 = склад/регион по умолчанию для публичного поиска WB

async function ensureColumns(client) {
  await client.query(`
    ALTER TABLE outreach_contacts
      ADD COLUMN IF NOT EXISTS marketplace_source TEXT,
      ADD COLUMN IF NOT EXISTS shop_name TEXT,
      ADD COLUMN IF NOT EXISTS shop_url TEXT,
      ADD COLUMN IF NOT EXISTS marketplace_seller_id TEXT,
      ADD COLUMN IF NOT EXISTS product_count INTEGER,
      ADD COLUMN IF NOT EXISTS product_category TEXT,
      ADD COLUMN IF NOT EXISTS phone TEXT
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_outreach_marketplace_source
      ON outreach_contacts (marketplace_source)
  `);
  // UNIQUE (не обычный) индекс — нужен для ON CONFLICT при дозаписи/повторном
  // запуске discovery без создания дублей одного и того же продавца.
  // Partial (WHERE ... IS NOT NULL) — чтобы не конфликтовать со строками из
  // МСП-реестра, где это поле всегда NULL (Postgres разрешает много NULL в
  // UNIQUE-индексе, но не разрешил бы много одинаковых непустых значений).
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_outreach_marketplace_seller_id_unique
      ON outreach_contacts (marketplace_seller_id) WHERE marketplace_seller_id IS NOT NULL
  `);
}

async function searchWbPage(query, page) {
  const url = `https://search.wb.ru/exactmatch/ru/common/v4/search?` + new URLSearchParams({
    query,
    resultset: "catalog",
    dest: String(MOSCOW_DEST),
    curr: "rub",
    spp: "30",
    appType: "1",
    lang: "ru",
    page: String(page),
    ab_testing: "false",
    suppressSpellcheck: "false",
  });

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`WB search HTTP ${res.status}`);
  const data = await res.json();
  return data?.products ?? data?.data?.products ?? [];
}

async function discoverSellers(queries, pages) {
  // supplierId -> { supplierId, shopName, productCount, sampleProductId }
  const sellers = new Map();

  for (const query of queries) {
    console.log(`\n[WB] Запрос: "${query}"`);
    for (let page = 1; page <= pages; page++) {
      let products;
      try {
        products = await searchWbPage(query, page);
      } catch (e) {
        console.log(`  стр.${page}: ошибка ${e.message} — пропускаю`);
        continue;
      }
      if (!products.length) {
        console.log(`  стр.${page}: пусто, останавливаюсь по этому запросу`);
        break;
      }
      for (const p of products) {
        const supplierId = p.supplierId != null ? String(p.supplierId) : null;
        if (!supplierId) continue;
        const entry = sellers.get(supplierId) ?? {
          supplierId,
          shopName: p.supplier || `WB Seller ${supplierId}`,
          productCount: 0,
          sampleProductId: p.id,
        };
        entry.productCount += 1;
        sellers.set(supplierId, entry);
      }
      console.log(`  стр.${page}: ${products.length} товаров, уникальных продавцов пока ${sellers.size}`);
      await new Promise((r) => setTimeout(r, 300)); // не долбить WB слишком часто
    }
  }

  return [...sellers.values()].sort((a, b) => b.productCount - a.productCount);
}

async function saveSellers(client, sellers, category) {
  let saved = 0;
  for (const s of sellers) {
    const shopUrl = `https://www.wildberries.ru/seller/${s.supplierId}`;
    try {
      await client.query(
        `INSERT INTO outreach_contacts
           (company_name, status, source, marketplace_source, shop_name, shop_url, marketplace_seller_id, product_count, product_category)
         VALUES ($1, 'discovered', 'wb_pilot', 'wb_pilot', $2, $3, $4, $5, $6)
         ON CONFLICT (marketplace_seller_id) WHERE marketplace_seller_id IS NOT NULL DO UPDATE SET
           product_count = EXCLUDED.product_count,
           shop_name = EXCLUDED.shop_name,
           shop_url = EXCLUDED.shop_url`,
        [s.shopName, s.shopName, shopUrl, s.supplierId, s.productCount, category]
      );
      saved++;
    } catch (e) {
      console.error(`Ошибка сохранения продавца ${s.supplierId}:`, e.message);
    }
  }
  return saved;
}

async function main() {
  const queriesArg = process.argv.find((a) => a.startsWith("--queries="));
  const queries = queriesArg ? queriesArg.split("=")[1].split(",") : DEFAULT_QUERIES;
  const topArg = process.argv.find((a) => a.startsWith("--top="));
  const top = topArg ? parseInt(topArg.split("=")[1], 10) : 50;
  const pagesArg = process.argv.find((a) => a.startsWith("--pages="));
  const pages = pagesArg ? parseInt(pagesArg.split("=")[1], 10) : 8;

  const startedAt = Date.now();

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log("Подключено к Neon");
  await ensureColumns(client);

  const allSellers = await discoverSellers(queries, pages);
  console.log(`\nВсего уникальных продавцов найдено: ${allSellers.length}`);

  const topSellers = allSellers.slice(0, top);
  const saved = await saveSellers(client, topSellers, "автозапчасти");

  await client.end();

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`\nГотово. Сохранено/обновлено продавцов: ${saved}/${topSellers.length}. Время: ${elapsed}с`);
  console.log(`Топ-5 по числу товаров:`);
  for (const s of topSellers.slice(0, 5)) {
    console.log(`  ${s.shopName} (ID ${s.supplierId}) — ${s.productCount} товаров`);
  }
}

main().catch((e) => {
  console.error("ОШИБКА:", e.message);
  process.exit(1);
});
