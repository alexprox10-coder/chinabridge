// Загружает открытые данные ФНС (реестр МСП), фильтрует ОКВЭД 46 (опт. торговля)
// и компании с "китайскими" ключевыми словами в названии, сохраняет в Neon.
//
// ВАЖНО: официальный реестр МСП НЕ содержит текстового описания деятельности —
// только название, ИНН, ОГРН, ОКВЭД-коды и регион. Поэтому фильтр по ключевым
// словам работает только по названию компании (слабее, чем поиск по описанию).
//
// Формат данных: ZIP с XML, публикуется на file.nalog.ru/opendata/7707329152-rsmp/
// Файл переиздаётся с новой датой в имени, поэтому сначала парсим страницу
// открытых данных чтобы найти актуальную ссылку на архив.
//
// Запуск: node scripts/outreach/parse-msp-registry.mjs [--region=77] [--limit=2000]

import pg from 'pg';
import fs from 'node:fs';
import { pipeline } from 'node:stream/promises';
import os from 'node:os';
import path from 'node:path';

const { Client } = pg;

const DATABASE_URL =
  "postgresql://neondb_owner:npg_xDZUWkt3CiY0@ep-rapid-cell-aunj0ge5-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require";

const OPENDATA_INDEX_URL = "https://www.nalog.gov.ru/opendata/7707329152-rsmp/";
const TARGET_OKVED_PREFIXES = ["46."]; // оптовая торговля — всё 46.x

const CHINA_KEYWORDS = [
  "китай", "china", "гуанчжоу", "guangzhou", "шэньчжэнь", "shenzhen",
  "карго", "импорт", "1688", "alibaba", "yiwu", "иу трейд", "кантон",
];

function hasChinaKeyword(name) {
  const lower = (name || "").toLowerCase();
  const found = CHINA_KEYWORDS.filter((kw) => lower.includes(kw));
  return { hasKeyword: found.length > 0, found };
}

async function findLatestArchiveUrl() {
  const res = await fetch(OPENDATA_INDEX_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ChinaBridgeBot/1.0)" },
  });
  if (!res.ok) throw new Error(`Не удалось открыть страницу открытых данных: HTTP ${res.status}`);
  const html = await res.text();
  const match = html.match(/https?:\/\/file\.nalog\.ru\/opendata\/7707329152-rsmp\/data-[\d]+-structure-[\d]+\.zip/i);
  if (!match) throw new Error("Ссылка на архив не найдена на странице открытых данных — возможно, изменилась структура страницы ФНС");
  return match[0];
}

// Реестр МСП поставляется как ZIP с множеством XML-файлов (по регионам/буквам).
// Полная реализация распаковки ZIP+парсинга XML потоково требует доп. библиотек
// (unzipper/sax). Ниже — каркас с точками расширения; сама распаковка и парсинг
// вынесены в отдельные функции, чтобы их можно было заменить без переписывания
// остального пайплайна (загрузка, фильтрация, запись в БД).
// Архив ~2 ГБ — не помещается в один ArrayBuffer в этом окружении, поэтому
// стримим сразу на диск, а затем распаковываем через yauzl.open (файловый
// режим, без загрузки всего ZIP в память).
async function downloadArchiveToDisk(url) {
  const dest = path.join(os.tmpdir(), "chinabridge-rsmp.zip");
  console.log(`Скачиваю архив на диск: ${url}\n  → ${dest}`);
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`Скачивание не удалось: HTTP ${res.status}`);
  await pipeline(res.body, fs.createWriteStream(dest));
  const { size } = fs.statSync(dest);
  console.log(`Архив загружен: ${(size / 1024 / 1024).toFixed(1)} МБ`);
  return dest;
}

// Обрабатывает ZIP файл за файлом (без загрузки всего архива в память),
// вызывая onXmlEntry(name, buffer) для каждого XML внутри, последовательно.
// onXmlEntry возвращает false чтобы остановить обработку досрочно (тогда
// оставшиеся записи в ZIP не распаковываются и не читаются).
async function forEachXmlEntry(zipPath, onXmlEntry) {
  let yauzl;
  try {
    yauzl = (await import("yauzl")).default;
  } catch {
    throw new Error(
      "Пакет 'yauzl' не установлен. Выполните: npm install yauzl --save"
    );
  }

  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
      if (err) return reject(err);
      zipfile.readEntry();
      zipfile.on("entry", (entry) => {
        if (!/\.xml$/i.test(entry.fileName)) {
          zipfile.readEntry();
          return;
        }
        zipfile.openReadStream(entry, (err2, stream) => {
          if (err2) return reject(err2);
          const chunks = [];
          stream.on("data", (c) => chunks.push(c));
          stream.on("end", async () => {
            let keepGoing = true;
            try {
              keepGoing = await onXmlEntry(entry.fileName, Buffer.concat(chunks));
            } catch (e) {
              return reject(e);
            }
            if (keepGoing === false) {
              zipfile.close();
              return resolve();
            }
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

// Реальная схема реестра МСП (подтверждено на примере разбора датасета,
// см. habr.com/ru/articles/358654):
//   <Документ ИдДок="...">
//     <ОргВклМСП ИННЮЛ="7712345678" НаимОрг="ООО РОМАШКА"/>
//     <СвОКВЭД><СвОКВЭДОсн КодОКВЭД="46.41" НаимОКВЭД="..."/></СвОКВЭД>
//     <СведМН><Регион Наим="МОСКОВСКАЯ"/></СведМН>
//   </Документ>
async function parseXmlEntry(xmlBuffer) {
  let sax;
  try {
    sax = (await import("sax")).default;
  } catch {
    throw new Error("Пакет 'sax' не установлен. Выполните: npm install sax --save");
  }

  return new Promise((resolve, reject) => {
    const results = [];
    let current = null;
    const parser = sax.parser(true, { trim: true });

    parser.onopentag = (node) => {
      if (node.name === "Документ") {
        current = { name: "", inn: "", okved: "", okvedName: "", region: "" };
        return;
      }
      if (!current) return;
      if (node.name === "ОргВклМСП") {
        current.inn = node.attributes.ИННЮЛ || "";
        current.name = node.attributes.НаимОрг || "";
      }
      if (node.name === "СвОКВЭДОсн") {
        current.okved = node.attributes.КодОКВЭД || "";
        current.okvedName = node.attributes.НаимОКВЭД || "";
      }
      if (node.name === "Регион") {
        current.region = node.attributes.Наим || "";
      }
    };
    parser.onclosetag = (name) => {
      if (name === "Документ" && current) {
        if (current.inn && current.name) results.push(current);
        current = null;
      }
    };
    parser.onerror = reject;
    parser.onend = () => resolve(results);
    parser.write(xmlBuffer.toString("utf-8")).close();
  });
}

async function saveContacts(client, contacts) {
  let saved = 0;
  for (const c of contacts) {
    const { hasKeyword, found } = hasChinaKeyword(c.name);
    try {
      await client.query(
        `INSERT INTO outreach_contacts
           (company_name, inn, okvad, okvad_name, region, has_china_keywords, china_keywords_found, status, source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'new','msp_registry')
         ON CONFLICT (inn) DO UPDATE SET
           okvad = EXCLUDED.okvad, okvad_name = EXCLUDED.okvad_name,
           has_china_keywords = EXCLUDED.has_china_keywords,
           china_keywords_found = EXCLUDED.china_keywords_found`,
        [c.name, c.inn, c.okved, c.okvedName, c.region, hasKeyword, found]
      );
      saved++;
    } catch (e) {
      console.error(`Ошибка сохранения ${c.inn}:`, e.message);
    }
  }
  return saved;
}

async function main() {
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : 2000;

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log("Подключено к Neon");

  const archiveUrl = await findLatestArchiveUrl();
  const zipPath = await downloadArchiveToDisk(archiveUrl);

  let totalSaved = 0;
  let totalWithChina = 0;
  let filesSeen = 0;

  try {
    await forEachXmlEntry(zipPath, async (name, buffer) => {
      filesSeen++;
      const parsed = await parseXmlEntry(buffer);
      const filtered = parsed.filter((c) => TARGET_OKVED_PREFIXES.some((p) => c.okved.startsWith(p)));
      if (filtered.length) {
        const saved = await saveContacts(client, filtered.slice(0, limit - totalSaved));
        totalSaved += saved;
        totalWithChina += filtered.filter((c) => hasChinaKeyword(c.name).hasKeyword).length;
        console.log(`${name}: ОКВЭД-46 найдено = ${filtered.length}, сохранено = ${saved} (всего ${totalSaved}/${limit})`);
      }
      return totalSaved < limit; // false останавливает обработку ZIP досрочно
    });
  } finally {
    fs.unlinkSync(zipPath);
  }

  console.log(`\nОбработано XML-файлов: ${filesSeen}`);
  console.log(`Итого: сохранено ${totalSaved} компаний, из них с китайскими ключевыми словами в названии: ${totalWithChina}`);
  await client.end();
}

main().catch((e) => {
  console.error("ОШИБКА:", e?.message || e);
  console.error(e?.stack || "(нет stack trace)");
  process.exit(1);
});
