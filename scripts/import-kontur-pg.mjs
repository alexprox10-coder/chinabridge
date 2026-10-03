import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
const { Client } = pg;

const __dir = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = join(__dir, 'kontur_leads.json');

const companies = JSON.parse(readFileSync(JSON_PATH, 'utf-8'));
console.log(`Загружено ${companies.length} компаний из JSON`);

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL не задан');
  process.exit(1);
}

const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
await client.connect();
console.log('✅ Подключено к PostgreSQL');

let inserted = 0, updated = 0, skipped = 0;

for (const c of companies) {
  const inn = (c['ИНН'] || '').trim();
  if (!inn) { skipped++; continue; }

  const revenue = parseInt(c['Выручка'] || '0', 10) || null;
  const employees = parseInt(c['Количество сотрудников'] || '0', 10) || null;

  let score = 20;
  if (revenue) {
    if (revenue > 500_000_000) score += 30;
    else if (revenue > 100_000_000) score += 20;
    else score += 10;
  }
  if (c['Электронная почта']) score += 15;
  if (c['Ссылка на сайт']) score += 10;
  if (employees && employees >= 20) score += 10;
  score = Math.min(score, 100);

  const extraJson = JSON.stringify({
    phone: c['Номер телефона'] || null,
    phone2: c['Дополнительный телефон 1'] || null,
    email: c['Электронная почта'] || null,
    email2: c['Дополнительная электронная почта 1'] || null,
    site_url: c['Ссылка на сайт'] || null,
    director: c['ФИО руководителя'] || null,
    director_inn: c['ИННФЛ руководителя'] || null,
    position: c['Должность руководителя'] || null,
    revenue: revenue,
    employees: employees,
    ogrn: c['ОГРН'] || null,
    fullName: c['Наименование'] || null,
    okvad_full: c['Основной вид деятельности'] || null,
    okvad_secondary: c['Другие виды деятельности'] || null,
    msp_category: c['Реестр МСП'] || null,
  });

  try {
    const result = await client.query(`
      INSERT INTO outreach_contacts
        (company_name, inn, okvad, okvad_name, region,
         has_china_keywords, china_keywords_found,
         lead_score, is_internet_seller, status, source)
      VALUES ($1, $2, $3, $4, $5, false, '{}', $6, true, 'new', 'kontur_compass')
      ON CONFLICT (inn) DO UPDATE SET
        okvad      = 'kontur_marketplace',
        okvad_name = EXCLUDED.okvad_name,
        lead_score = GREATEST(outreach_contacts.lead_score, EXCLUDED.lead_score),
        source     = 'kontur_compass'
      RETURNING (xmax = 0) as is_insert
    `, [
      c['Наименование'], inn, 'kontur_marketplace', extraJson,
      c['Регион регистрации'] || null, score
    ]);
    if (result.rows[0]?.is_insert) inserted++; else updated++;
    process.stdout.write('.');
  } catch (e) {
    console.error(`\nОшибка ${c['Наименование']}: ${e.message}`);
    skipped++;
  }
}

await client.end();
console.log(`\n\n✅ Готово: вставлено ${inserted}, обновлено ${updated}, пропущено ${skipped}`);
