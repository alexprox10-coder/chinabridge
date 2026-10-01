// Ozon discovery — аналог wb-discovery.mjs для Ozon: публичный фронтовый
// composer-api (без авторизации, без Seller API), та же логика группировки
// по продавцу и отбора топ-N по числу товаров.
//
// ЧЕСТНОЕ ПРЕДУПРЕЖДЕНИЕ (см. отчёт после пилота): Ozon защищён анти-ботом
// Qrator с JS-челленджем — это не IP-бан конкретной песочницы, а структурная
// защита, которая, по открытым источникам, блокирует именно обычные HTTP-клиенты
// (requests/fetch) вне headless-браузера. Скрипт написан по ТЗ и может
// сработать с другого окружения/IP, но не гарантирован так же, как WB-версия.
// Если видите ошибку/таймаут — это ожидаемо, не баг скрипта (см. ТЗ: "если
// Ozon-дискавери забуксовал — не тратим время на обход защиты в рамках пилота").
//
// Запуск: node scripts/outreach/ozon-discovery.mjs [--queries="..."] [--top=50] [--pages=8]

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
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_outreach_marketplace_seller_id_unique
      ON outreach_contacts (marketplace_seller_id) WHERE marketplace_seller_id IS NOT NULL
  `);
}

// Ozon отдаёт структуру страницы как набор "виджетов" (widgetStates), каждый —
// JSON-строка. Виджет с товарами поиска обычно называется searchResultsV2
// (имя может меняться between релизов фронта — это нестабильный недокументированный
// формат, в отличие от WB). Ищем любой виджет, где есть массив items с seller.
function extractSellersFromComposerPage(json) {
  const sellers = new Map();
  const widgetStates = json?.widgetStates ?? {};
  for (const [key, raw] of Object.entries(widgetStates)) {
    if (!key.toLowerCase().includes("searchresults") && !key.toLowerCase().includes("skugrid")) continue;
    let parsed;
    try { parsed = JSON.parse(raw); } catch { continue; }
    const items = parsed?.items ?? parsed?.gridItems ?? [];
    for (const item of items) {
      const sellerId = item?.sellerId ?? item?.seller?.id ?? item?.seller_id;
      const sellerName = item?.sellerName ?? item?.seller?.name ?? item?.seller_name;
      if (!sellerId) continue;
      const entry = sellers.get(String(sellerId)) ?? {
        sellerId: String(sellerId),
        shopName: sellerName || `Ozon Seller ${sellerId}`,
        productCount: 0,
      };
      entry.productCount += 1;
      sellers.set(String(sellerId), entry);
    }
  }
  return sellers;
}

async function searchOzonPage(query, page) {
  const url = `https://www.ozon.ru/api/composer-api.bx/page/json/v2?url=${encodeURIComponent(`/search/?text=${query}&page=${page}`)}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json",
      "Accept-Language": "ru-RU,ru;q=0.9",
      "Referer": "https://www.ozon.ru/",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Ozon HTTP ${res.status}`);
  return res.json();
}

async function discoverSellers(queries, pages) {
  const sellers = new Map();
  for (const query of queries) {
    console.log(`\n[Ozon] Запрос: "${query}"`);
    for (let page = 1; page <= pages; page++) {
      let json;
      try {
        json = await searchOzonPage(query, page);
      } catch (e) {
        console.log(`  стр.${page}: ошибка ${e.message} — пропускаю`);
        continue;
      }
      const pageSellers = extractSellersFromComposerPage(json);
      if (!pageSellers.size) {
        console.log(`  стр.${page}: продавцов не извлечено (формат виджета мог измениться, либо антибот отдал заглушку) — останавливаюсь по этому запросу`);
        break;
      }
      for (const [id, s] of pageSellers) {
        const entry = sellers.get(id) ?? { ...s, productCount: 0 };
        entry.productCount += s.productCount;
        sellers.set(id, entry);
      }
      console.log(`  стр.${page}: продавцов пока ${sellers.size}`);
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  return [...sellers.values()].sort((a, b) => b.productCount - a.productCount);
}

async function saveSellers(client, sellers, category) {
  let saved = 0;
  for (const s of sellers) {
    const shopUrl = `https://www.ozon.ru/seller/${s.sellerId}`;
    try {
      await client.query(
        `INSERT INTO outreach_contacts
           (company_name, status, source, marketplace_source, shop_name, shop_url, marketplace_seller_id, product_count, product_category)
         VALUES ($1, 'discovered', 'ozon_pilot', 'ozon_pilot', $2, $3, $4, $5, $6)
         ON CONFLICT (marketplace_seller_id) WHERE marketplace_seller_id IS NOT NULL DO UPDATE SET
           product_count = EXCLUDED.product_count,
           shop_name = EXCLUDED.shop_name,
           shop_url = EXCLUDED.shop_url`,
        [s.shopName, s.shopName, shopUrl, s.sellerId, s.productCount, category]
      );
      saved++;
    } catch (e) {
      console.error(`Ошибка сохранения продавца ${s.sellerId}:`, e.message);
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

  if (allSellers.length === 0) {
    console.log("\n⚠️ Ozon-дискавери не дал ни одного продавца — вероятно, антибот (Qrator) блокирует обычный HTTP-клиент.");
    console.log("Это ожидаемый риск по ТЗ, не обязательно баг скрипта. См. комментарий в начале файла.");
  }

  const topSellers = allSellers.slice(0, top);
  const saved = await saveSellers(client, topSellers, "автозапчасти");
  await client.end();

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`\nГотово. Сохранено/обновлено продавцов: ${saved}/${topSellers.length}. Время: ${elapsed}с`);
  for (const s of topSellers.slice(0, 5)) {
    console.log(`  ${s.shopName} (ID ${s.sellerId}) — ${s.productCount} товаров`);
  }
}

main().catch((e) => {
  console.error("ОШИБКА:", e.message);
  process.exit(1);
});
