// Загружает открытые данные ФНС (реестр МСП), фильтрует по 10 товарным вертикалям
// (ОКВЭД 46.x + 47.x + 45.3x), рассчитывает Lead Score, сохраняет в Neon.
//
// Запуск: node scripts/outreach/parse-msp-registry.mjs [--limit=5000] [--clear]
//   --limit=N  максимум записей (default: 5000)
//   --clear    сначала удалить все source='msp_registry' из базы

import pg from 'pg';
import fs from 'node:fs';
import { pipeline } from 'node:stream/promises';
import os from 'node:os';
import path from 'node:path';

const { Client } = pg;

const DATABASE_URL =
  "postgresql://neondb_owner:npg_xDZUWkt3CiY0@ep-rapid-cell-aunj0ge5-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require";

const OPENDATA_INDEX_URL = "https://www.nalog.gov.ru/opendata/7707329152-rsmp/";

// ── 10 товарных вертикалей ────────────────────────────────────────────────────
// codes: массив ОКВЭД-кодов (точное совпадение или prefix.)
// retailBonus: очки за розничный ОКВЭД; wholesaleBonus — за оптовый
const VERTICALS = [
  {
    id: "home",
    name: "Товары для дома",
    priority: 1,
    retail:    ["47.55", "47.59"],
    wholesale: ["46.47", "46.49", "46.49.5"],
  },
  {
    id: "electronics",
    name: "Электроника и аксессуары",
    priority: 1,
    retail:    ["47.41", "47.42", "47.43", "47.54"],
    wholesale: ["46.43", "46.43.1", "46.43.2", "46.43.4", "46.51", "46.52"],
  },
  {
    id: "auto",
    name: "Автотовары и запчасти",
    priority: 1,
    retail:    ["45.32", "47.78.9"],
    wholesale: ["45.31", "46.72.2"],
  },
  {
    id: "tools",
    name: "Инструмент и оборудование",
    priority: 1,
    retail:    ["47.52"],
    wholesale: ["46.69", "46.74"],
  },
  {
    id: "interior",
    name: "Свет, мебель, интерьер",
    priority: 1,
    retail:    ["47.54", "47.59"],
    wholesale: ["46.43", "46.47"],
  },
  {
    id: "clothing",
    name: "Одежда и обувь",
    priority: 2,
    retail:    ["47.71", "47.72"],
    wholesale: ["46.42", "46.42.2"],
  },
  {
    id: "beauty",
    name: "Косметика и уход",
    priority: 2,
    retail:    ["47.75"],
    wholesale: ["46.45"],
  },
  {
    id: "sports",
    name: "Спорт и туризм",
    priority: 2,
    retail:    ["47.64"],
    wholesale: ["46.49"],
  },
  {
    id: "kids",
    name: "Детские товары и игрушки",
    priority: 2,
    retail:    ["47.65"],
    wholesale: ["46.49.4"],
  },
  {
    id: "bags",
    name: "Сумки и аксессуары",
    priority: 2,
    retail:    ["47.72", "47.77"],
    wholesale: ["46.49.4"],
  },
];

// Интернет-торговля — самый высокий приоритет, +30 очков
const INTERNET_SELLER_CODES = ["47.91", "47.91.2", "47.91.29"];

// Исключения — не брать в базу
const EXCLUDED_PREFIXES = [
  "45.11", "45.19", "45.20", "45.40",          // продажа автомобилей/мотоциклов
  "46.46", "47.73",                             // фармацевтика
  "47.11", "47.22", "47.23", "47.24",           // продукты питания
  "47.81", "47.82",                             // рынки с едой
  "47.76",                                      // цветы/живые растения
  "64", "65", "66",                             // финансы/страхование
  "68",                                         // недвижимость
  "69", "70", "71", "72", "73", "74", "75",     // профессиональные услуги
  "77", "78", "79",                             // аренда/кадры/туроператоры
  "80", "81", "82",                             // охрана/клининг/офис-услуги
  "84", "85", "86", "87", "88",                 // госуправление/образование/медицина
];

function codeStartsWith(code, prefix) {
  return code === prefix || code.startsWith(prefix + ".");
}

function isExcluded(okved) {
  if (!okved) return true;
  return EXCLUDED_PREFIXES.some(p => codeStartsWith(okved, p));
}

// Возвращает { vertical, verticalName, priority, isInternet, baseScore } или null
function matchVertical(okved) {
  if (!okved || isExcluded(okved)) return null;
  const code = okved.trim();

  const isInternet = INTERNET_SELLER_CODES.some(c => codeStartsWith(code, c));

  for (const v of VERTICALS) {
    const inRetail    = v.retail.some(c => codeStartsWith(code, c));
    const inWholesale = v.wholesale.some(c => codeStartsWith(code, c));
    if (inRetail || inWholesale) {
      const okvedScore = inRetail ? 20 : 15;
      const internetBonus = isInternet ? 30 : 0;
      return {
        vertical:     v.id,
        verticalName: v.name,
        priority:     v.priority,
        isInternet,
        baseScore:    okvedScore + internetBonus,
      };
    }
  }

  // Интернет-продавец, но категория не определена — тоже берём
  if (isInternet) {
    return {
      vertical:     "marketplace",
      verticalName: "Маркетплейс (категория TBD)",
      priority:     1,
      isInternet:   true,
      baseScore:    30,
    };
  }

  return null;
}

// ── Загрузка архива МСП ───────────────────────────────────────────────────────
async function findLatestArchiveUrl() {
  const res = await fetch(OPENDATA_INDEX_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ChinaBridgeBot/1.0)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} на странице открытых данных ФНС`);
  const html = await res.text();
  const match = html.match(/https?:\/\/file\.nalog\.ru\/opendata\/7707329152-rsmp\/data-[\d]+-structure-[\d]+\.zip/i);
  if (!match) throw new Error("Ссылка на архив не найдена — возможно, изменилась структура страницы ФНС");
  return match[0];
}

async function downloadArchiveToDisk(url) {
  const dest = path.join(os.tmpdir(), "chinabridge-rsmp.zip");
  for (let attempt = 1; attempt <= 8; attempt++) {
    const existingSize = fs.existsSync(dest) ? fs.statSync(dest).size : 0;
    const headRes = await fetch(url, { method: "HEAD" });
    const totalSize = parseInt(headRes.headers.get("content-length") || "0", 10);
    if (existingSize > 0 && existingSize >= totalSize) {
      console.log(`Архив уже скачан: ${(existingSize / 1024 / 1024).toFixed(1)} МБ`);
      return dest;
    }
    console.log(`[${attempt}/8] Скачиваю ${existingSize > 0 ? "докачка с " + (existingSize / 1024 / 1024).toFixed(1) + " МБ" : "с нуля"}, всего ${(totalSize / 1024 / 1024).toFixed(1)} МБ`);
    try {
      const res = await fetch(url, {
        headers: existingSize > 0 ? { Range: `bytes=${existingSize}-` } : {},
      });
      if (!res.ok && res.status !== 206) throw new Error(`HTTP ${res.status}`);
      const writeStream = fs.createWriteStream(dest, { flags: existingSize > 0 && res.status === 206 ? "a" : "w" });
      await pipeline(res.body, writeStream);
      const { size } = fs.statSync(dest);
      if (size >= totalSize) { console.log(`Скачано полностью: ${(size / 1024 / 1024).toFixed(1)} МБ`); return dest; }
    } catch (e) {
      console.log(`Обрыв (${e.message}), докачиваю...`);
    }
  }
  throw new Error("Не удалось скачать за 8 попыток");
}

async function forEachXmlEntry(zipPath, onXmlEntry) {
  let yauzl;
  try { yauzl = (await import("yauzl")).default; }
  catch { throw new Error("Установите пакет: npm install yauzl --save"); }

  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
      if (err) return reject(err);
      zipfile.readEntry();
      zipfile.on("entry", (entry) => {
        if (!/\.xml$/i.test(entry.fileName)) { zipfile.readEntry(); return; }
        zipfile.openReadStream(entry, (err2, stream) => {
          if (err2) return reject(err2);
          const chunks = [];
          stream.on("data", (c) => chunks.push(c));
          stream.on("end", async () => {
            let keepGoing = true;
            try { keepGoing = await onXmlEntry(entry.fileName, Buffer.concat(chunks)); }
            catch (e) { return reject(e); }
            if (keepGoing === false) { zipfile.close(); return resolve(); }
            zipfile.readEntry();
          });
          stream.on("error", reject);
        });
      });
      zipfile.on("end", resolve);
      zipfile.on("error", reject);
    });
  });
}

async function parseXmlEntry(xmlBuffer) {
  let sax;
  try { sax = (await import("sax")).default; }
  catch { throw new Error("Установите пакет: npm install sax --save"); }

  return new Promise((resolve, reject) => {
    const results = [];
    let current = null;
    const parser = sax.parser(true, { trim: true });
    parser.onopentag = (node) => {
      if (node.name === "Документ") { current = { name: "", inn: "", okved: "", okvedName: "", region: "" }; return; }
      if (!current) return;
      if (node.name === "ОргВклМСП") { current.inn = node.attributes.ИННЮЛ || ""; current.name = node.attributes.НаимОрг || ""; }
      if (node.name === "СвОКВЭДОсн") { current.okved = node.attributes.КодОКВЭД || ""; current.okvedName = node.attributes.НаимОКВЭД || ""; }
      if (node.name === "Регион") { current.region = node.attributes.Наим || ""; }
    };
    parser.onclosetag = (name) => {
      if (name === "Документ" && current) { if (current.inn && current.name) results.push(current); current = null; }
    };
    parser.onerror = reject;
    parser.onend = () => resolve(results);
    parser.write(xmlBuffer.toString("utf-8")).close();
  });
}

// ── Сохранение в базу ─────────────────────────────────────────────────────────
async function saveContacts(client, contacts, stats) {
  let saved = 0;
  for (const c of contacts) {
    const match = matchVertical(c.okved);
    if (!match) continue;
    try {
      await client.query(
        `INSERT INTO outreach_contacts
           (company_name, inn, okvad, okvad_name, region,
            has_china_keywords, china_keywords_found,
            product_vertical, lead_score, is_internet_seller,
            status, source)
         VALUES ($1,$2,$3,$4,$5, false,'{}', $6,$7,$8, 'new','msp_registry')
         ON CONFLICT (inn) DO UPDATE SET
           okvad = EXCLUDED.okvad,
           okvad_name = EXCLUDED.okvad_name,
           product_vertical = EXCLUDED.product_vertical,
           lead_score = EXCLUDED.lead_score,
           is_internet_seller = EXCLUDED.is_internet_seller`,
        [
          c.name, c.inn, c.okved, c.okvedName, c.region,
          match.vertical, match.baseScore, match.isInternet,
        ]
      );
      saved++;
      stats[match.vertical] = (stats[match.vertical] || 0) + 1;
      if (match.isInternet) stats._internet = (stats._internet || 0) + 1;
    } catch (e) {
      console.error(`Ошибка сохранения ${c.inn}:`, e.message);
    }
  }
  return saved;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : 5000;
  const doClear = process.argv.includes("--clear");

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log("Подключено к Neon");

  // Добавляем колонки если ещё нет
  await client.query(`
    ALTER TABLE outreach_contacts
      ADD COLUMN IF NOT EXISTS product_vertical TEXT,
      ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS is_internet_seller BOOLEAN DEFAULT false
  `);

  if (doClear) {
    const { rowCount } = await client.query(`DELETE FROM outreach_contacts WHERE source = 'msp_registry'`);
    console.log(`Очищено ${rowCount} старых записей source='msp_registry'`);
  }

  const archiveUrl = await findLatestArchiveUrl();
  console.log(`Архив: ${archiveUrl}`);
  const zipPath = await downloadArchiveToDisk(archiveUrl);

  let totalSaved = 0;
  let totalScanned = 0;
  let filesSeen = 0;
  const verticalStats = {};

  try {
    await forEachXmlEntry(zipPath, async (name, buffer) => {
      filesSeen++;
      const parsed = await parseXmlEntry(buffer);
      totalScanned += parsed.length;

      const matched = parsed.filter((c) => matchVertical(c.okved) !== null);
      if (matched.length) {
        const batch = matched.slice(0, limit - totalSaved);
        const saved = await saveContacts(client, batch, verticalStats);
        totalSaved += saved;
        console.log(`${name}: отсканировано ${parsed.length}, подходящих ${matched.length}, сохранено ${saved} (итого ${totalSaved}/${limit})`);
      }
      return totalSaved < limit;
    });
  } finally {
    try { fs.unlinkSync(zipPath); } catch {}
  }

  console.log(`\n──────────────────────────────────────`);
  console.log(`XML-файлов обработано: ${filesSeen}`);
  console.log(`Всего отсканировано компаний: ${totalScanned}`);
  console.log(`Сохранено в базу: ${totalSaved}`);
  console.log(`\nПо вертикалям:`);
  for (const [k, v] of Object.entries(verticalStats)) {
    if (k === "_internet") continue;
    const name = VERTICALS.find(x => x.id === k)?.name || k;
    console.log(`  ${name}: ${v}`);
  }
  if (verticalStats._internet) {
    console.log(`  ↳ из них интернет-продавцы (47.91.x): ${verticalStats._internet}`);
  }

  await client.end();
}

main().catch((e) => {
  console.error("ОШИБКА:", e?.message || e);
  console.error(e?.stack || "");
  process.exit(1);
});
