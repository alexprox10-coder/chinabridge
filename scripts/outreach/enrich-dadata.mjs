// Обогащает outreach_contacts email/телефоном через DaData API по ИНН.
// Токен: зарегистрироваться на dadata.ru → личный кабинет → API-ключи (бесплатно, 10 000 запросов).
//
// Запуск: DADATA_TOKEN=xxxxx node scripts/outreach/enrich-dadata.mjs [--limit=100]

import pg from 'pg';
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

async function main() {
  if (!DADATA_TOKEN) {
    console.error("ОШИБКА: переменная окружения DADATA_TOKEN не задана.");
    console.error("Получить токен: https://dadata.ru/api/ → регистрация → личный кабинет");
    process.exit(1);
  }

  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : 100;

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
    // DaData: не более 10 запросов/сек на бесплатном тарифе
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log(`\nНайдено email: ${found}/${contacts.length}`);
  await client.end();
}

main().catch((e) => {
  console.error("ОШИБКА:", e.message);
  process.exit(1);
});
