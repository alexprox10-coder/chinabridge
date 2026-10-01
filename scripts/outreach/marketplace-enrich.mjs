// Единый enrichment для всех маркетплейс-пайплайнов (WB, Ozon — и будущий
// Kaspi тем же паттерном): открывает публичную страницу магазина продавца,
// ищет ИНН (площадки обязаны публиковать его по закону о маркировке продавцов —
// в отличие от телефона/email, которые скрыты), затем по ИНН запрашивает
// DaData (тот же подход, что и enrich-dadata.mjs для МСП — не переизобретаем).
//
// Если по найденному ИНН уже есть строка в outreach_contacts (пересечение с
// МСП-реестром или с другой площадкой) — переносим маркетплейс-поля на неё и
// удаляем дублирующую discovery-строку вместо двух записей на одну компанию.
//
// Запуск: DADATA_TOKEN=xxxxx node scripts/outreach/marketplace-enrich.mjs [--limit=100] [--source=wb_pilot|ozon_pilot]

import pg from 'pg';
const { Client } = pg;

const DATABASE_URL =
  "postgresql://neondb_owner:npg_xDZUWkt3CiY0@ep-rapid-cell-aunj0ge5-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require";

const DADATA_TOKEN = process.env.DADATA_TOKEN;
const DADATA_URL = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party";

const INN_PATTERN = /ИНН[:\s№]*?(\d{10}|\d{12})/iu;

async function fetchShopPage(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "ru-RU,ru;q=0.9",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function extractInn(html) {
  const match = html.match(INN_PATTERN);
  return match ? match[1] : null;
}

async function findByInn(inn) {
  const res = await fetch(DADATA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Token ${DADATA_TOKEN}`,
    },
    body: JSON.stringify({ query: inn }),
  });
  if (!res.ok) throw new Error(`DaData HTTP ${res.status}`);
  const data = await res.json();
  const suggestion = data.suggestions?.[0]?.data;
  if (!suggestion) return null;
  return {
    companyName: suggestion.name?.short_with_opf || suggestion.name?.full_with_opf || null,
    email: suggestion.emails?.[0]?.value || null,
    phone: suggestion.phones?.[0]?.value || null,
  };
}

async function mergeIntoExistingOrUpdate(client, row, inn, dadata) {
  const existing = await client.query(
    `SELECT id FROM outreach_contacts WHERE inn = $1 AND id != $2 LIMIT 1`,
    [inn, row.id]
  );

  if (existing.rows.length) {
    const targetId = existing.rows[0].id;
    await client.query(
      `UPDATE outreach_contacts SET
         marketplace_source = $1, shop_name = $2, shop_url = $3,
         marketplace_seller_id = $4, product_count = $5, product_category = $6,
         email = COALESCE($7, email), phone = COALESCE($8, phone),
         status = 'enriched'
       WHERE id = $9`,
      [row.marketplace_source, row.shop_name, row.shop_url, row.marketplace_seller_id,
       row.product_count, row.product_category, dadata?.email ?? null, dadata?.phone ?? null, targetId]
    );
    await client.query(`DELETE FROM outreach_contacts WHERE id = $1`, [row.id]);
    return { merged: true };
  }

  await client.query(
    `UPDATE outreach_contacts SET
       inn = $1, company_name = COALESCE($2, company_name),
       email = COALESCE($3, email), phone = COALESCE($4, phone), status = 'enriched'
     WHERE id = $5`,
    [inn, dadata?.companyName ?? null, dadata?.email ?? null, dadata?.phone ?? null, row.id]
  );
  return { merged: false };
}

async function enrichSource(client, source, limit) {
  const { rows } = await client.query(
    `SELECT id, shop_name, shop_url, marketplace_source, marketplace_seller_id, product_count, product_category
     FROM outreach_contacts
     WHERE marketplace_source = $1 AND status = 'discovered'
     ORDER BY product_count DESC
     LIMIT $2`,
    [source, limit]
  );

  console.log(`\n=== ${source} — обрабатываю ${rows.length} продавцов ===`);
  let innFound = 0;
  let contactFound = 0;

  for (const row of rows) {
    try {
      const html = await fetchShopPage(row.shop_url);
      const inn = extractInn(html);

      if (!inn) {
        await client.query(`UPDATE outreach_contacts SET status = 'no_inn_found' WHERE id = $1`, [row.id]);
        console.log(`✗ ${row.shop_name}: ИНН не найден на странице`);
        continue;
      }

      innFound++;
      let dadata = null;
      try {
        dadata = await findByInn(inn);
      } catch (e) {
        console.log(`  (DaData ошибка для ИНН ${inn}: ${e.message})`);
      }
      if (dadata?.phone || dadata?.email) contactFound++;

      const result = await mergeIntoExistingOrUpdate(client, row, inn, dadata);
      console.log(
        `✓ ${row.shop_name}: ИНН ${inn}${result.merged ? " (объединено с существующей записью)" : ""}` +
        `${dadata?.phone ? `, тел: ${dadata.phone}` : ""}${dadata?.email ? `, email: ${dadata.email}` : ""}`
      );
    } catch (e) {
      console.error(`Ошибка для ${row.shop_name}:`, e.message);
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  return { total: rows.length, innFound, contactFound };
}

async function main() {
  if (!DADATA_TOKEN) {
    console.error("ОШИБКА: переменная окружения DADATA_TOKEN не задана (dadata.ru → Настройки → API-ключи, бесплатно).");
    process.exit(1);
  }

  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : 50;
  const sourceArg = process.argv.find((a) => a.startsWith("--source="));
  const sources = sourceArg ? [sourceArg.split("=")[1]] : ["wb_pilot", "ozon_pilot"];

  const startedAt = Date.now();
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log("Подключено к Neon");

  const results = {};
  for (const source of sources) {
    results[source] = await enrichSource(client, source, limit);
  }

  await client.end();
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

  console.log(`\n=== ИТОГ (${elapsed}с) ===`);
  for (const [source, r] of Object.entries(results)) {
    const innPct = r.total ? ((r.innFound / r.total) * 100).toFixed(0) : 0;
    const contactPct = r.total ? ((r.contactFound / r.total) * 100).toFixed(0) : 0;
    const contactOfInnPct = r.innFound ? ((r.contactFound / r.innFound) * 100).toFixed(0) : 0;
    console.log(`${source}: обработано ${r.total}, ИНН найден ${r.innFound} (${innPct}%), контакт найден ${r.contactFound} (${contactPct}% от всех, ${contactOfInnPct}% от нашедших ИНН)`);
  }

  if (results.wb_pilot && results.ozon_pilot) {
    const wbRate = results.wb_pilot.total ? results.wb_pilot.contactFound / results.wb_pilot.total : 0;
    const ozonRate = results.ozon_pilot.total ? results.ozon_pilot.contactFound / results.ozon_pilot.total : 0;
    console.log(`\nЛучше показал себя: ${wbRate === ozonRate ? "одинаково" : wbRate > ozonRate ? "WB" : "Ozon"}`);
  }
}

main().catch((e) => {
  console.error("ОШИБКА:", e.message);
  process.exit(1);
});
