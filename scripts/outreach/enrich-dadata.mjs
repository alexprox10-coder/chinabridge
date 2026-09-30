// Обогащает контакты из JSON-файла (результат parse-msp-registry.mjs --out=...)
// email/телефоном через DaData API по ИНН, и пишет итоговый JSON,
// готовый к загрузке в Neon (через n8n Postgres node, если прямой доступ
// к БД недоступен из текущего окружения).
//
// Токен: личный кабинет dadata.ru → Настройки → API-ключи (бесплатно, 10 000 запросов/день).
//
// Запуск: DADATA_TOKEN=xxxxx node scripts/outreach/enrich-dadata.mjs --in=/tmp/msp-contacts.json --out=/tmp/msp-enriched.json [--limit=100]
//
// Если DATABASE_URL доступен напрямую (обычный локальный запуск, не песочница),
// можно опустить --out и обогащение сразу запишется в outreach_contacts.

import pg from 'pg';
import fs from 'node:fs';
const { Client } = pg;

const DATABASE_URL =
  "postgresql://neondb_owner:npg_xDZUWkt3CiY0@ep-rapid-cell-aunj0ge5-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require";

const DADATA_TOKEN = process.env.DADATA_TOKEN;
const DADATA_URL = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party";

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
    email: suggestion.emails?.[0]?.value || null,
    phone: suggestion.phones?.[0]?.value || null,
    website: suggestion.address?.value || null,
  };
}

async function enrichFromFile(inFile, outFile, limit) {
  const contacts = JSON.parse(fs.readFileSync(inFile, "utf-8"));
  // приоритет — компании с китайскими ключевыми словами в названии
  contacts.sort((a, b) => (b.hasKeyword === true) - (a.hasKeyword === true));
  const batch = contacts.slice(0, limit);

  console.log(`Обрабатываю ${batch.length} компаний из ${inFile}`);
  let found = 0;
  const results = [];

  for (const c of batch) {
    try {
      const result = await findByInn(c.inn);
      const enriched = {
        company_name: c.name,
        inn: c.inn,
        okvad: c.okved,
        okvad_name: c.okvedName,
        region: c.region,
        has_china_keywords: !!c.hasKeyword,
        china_keywords_found: c.found || [],
        email: result?.email || null,
        phone: result?.phone || null,
        website: result?.website || null,
        status: result?.email ? "enriched" : "new",
      };
      results.push(enriched);
      if (result?.email) {
        found++;
        console.log(`✓ ${c.name}: ${result.email}`);
      } else {
        console.log(`✗ ${c.name}: email не найден`);
      }
    } catch (e) {
      console.error(`Ошибка для ${c.name} (ИНН ${c.inn}):`, e.message);
    }
    await new Promise((r) => setTimeout(r, 150)); // лимит DaData: не более ~10 запросов/сек
  }

  fs.writeFileSync(outFile, JSON.stringify(results, null, 2), "utf-8");
  console.log(`\nНайдено email: ${found}/${batch.length}. Сохранено в ${outFile}`);
}

async function enrichFromDb(limit) {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log("Подключено к Neon");

  const { rows: contacts } = await client.query(
    `SELECT id, company_name, inn FROM outreach_contacts
     WHERE status = 'new' AND email IS NULL AND inn IS NOT NULL
     ORDER BY has_china_keywords DESC, created_at ASC
     LIMIT $1`,
    [limit]
  );

  console.log(`Обрабатываю ${contacts.length} компаний`);
  let found = 0;

  for (const c of contacts) {
    try {
      const result = await findByInn(c.inn);
      if (result?.email) {
        await client.query(
          `UPDATE outreach_contacts SET email = $1, phone = $2, website = $3, status = 'enriched' WHERE id = $4`,
          [result.email, result.phone, result.website, c.id]
        );
        found++;
        console.log(`✓ ${c.company_name}: ${result.email}`);
      } else {
        console.log(`✗ ${c.company_name}: email не найден`);
      }
    } catch (e) {
      console.error(`Ошибка для ${c.company_name} (ИНН ${c.inn}):`, e.message);
    }
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log(`\nНайдено email: ${found}/${contacts.length}`);
  await client.end();
}

async function main() {
  if (!DADATA_TOKEN) {
    console.error("ОШИБКА: переменная окружения DADATA_TOKEN не задана.");
    process.exit(1);
  }

  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : 100;
  const inArg = process.argv.find((a) => a.startsWith("--in="));
  const outArg = process.argv.find((a) => a.startsWith("--out="));

  if (inArg) {
    await enrichFromFile(inArg.split("=")[1], outArg ? outArg.split("=")[1] : "/tmp/msp-enriched.json", limit);
  } else {
    await enrichFromDb(limit);
  }
}

main().catch((e) => {
  console.error("ОШИБКА:", e.message);
  process.exit(1);
});
