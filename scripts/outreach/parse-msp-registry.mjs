// Загружает открытые данные ФНС (реестр МСП), фильтрует по 10 товарным вертикалям
// (ОКВЭД 46.x + 47.x + 45.3x), рассчитывает Lead Score, сохраняет через Vercel API.
//
// Запуск (PowerShell скачивает архив, Node.js парсит):
//   node scripts/outreach/parse-msp-registry.mjs --zip=<path> [--limit=5000] [--clear] [--api=https://chinabridge.pro]
//
// Или используй scripts/outreach/run-msp.ps1 который делает всё автоматически.

import fs from 'node:fs';
import { pipeline } from 'node:stream/promises';
import os from 'node:os';
import path from 'node:path';

const API_BASE = process.argv.find(a => a.startsWith("--api="))?.split("=")[1] ?? "https://chinabridge.pro";
const IMPORT_KEY = "chinabridge-msp-2024";

// ── 10 товарных вертикалей ────────────────────────────────────────────────────
const VERTICALS = [
  { id: "home",        name: "Товары для дома",          priority: 1, retail: ["47.55","47.59"], wholesale: ["46.47","46.49","46.49.5"] },
  { id: "electronics", name: "Электроника и аксессуары", priority: 1, retail: ["47.41","47.42","47.43","47.54"], wholesale: ["46.43","46.43.1","46.43.2","46.43.4","46.51","46.52"] },
  { id: "auto",        name: "Автотовары и запчасти",    priority: 1, retail: ["45.32","47.78.9"], wholesale: ["45.31","46.72.2"] },
  { id: "tools",       name: "Инструмент и оборудование",priority: 1, retail: ["47.52"], wholesale: ["46.69","46.74"] },
  { id: "interior",    name: "Свет, мебель, интерьер",   priority: 1, retail: ["47.54","47.59"], wholesale: ["46.43","46.47"] },
  { id: "clothing",    name: "Одежда и обувь",           priority: 2, retail: ["47.71","47.72"], wholesale: ["46.42","46.42.2"] },
  { id: "beauty",      name: "Косметика и уход",         priority: 2, retail: ["47.75"], wholesale: ["46.45"] },
  { id: "sports",      name: "Спорт и туризм",           priority: 2, retail: ["47.64"], wholesale: ["46.49"] },
  { id: "kids",        name: "Детские товары и игрушки", priority: 2, retail: ["47.65"], wholesale: ["46.49.4"] },
  { id: "bags",        name: "Сумки и аксессуары",       priority: 2, retail: ["47.72","47.77"], wholesale: ["46.49.4"] },
];

const INTERNET_SELLER_CODES = ["47.91", "47.91.2", "47.91.29"];

const EXCLUDED_PREFIXES = [
  "45.11","45.19","45.20","45.40",
  "46.46","47.73",
  "47.11","47.22","47.23","47.24",
  "47.81","47.82",
  "47.76",
  "64","65","66","68",
  "69","70","71","72","73","74","75",
  "77","78","79",
  "80","81","82",
  "84","85","86","87","88",
];

function codeStartsWith(code, prefix) {
  return code === prefix || code.startsWith(prefix + ".");
}
function isExcluded(okved) {
  if (!okved) return true;
  return EXCLUDED_PREFIXES.some(p => codeStartsWith(okved, p));
}
function matchVertical(okved) {
  if (!okved || isExcluded(okved)) return null;
  const code = okved.trim();
  const isInternet = INTERNET_SELLER_CODES.some(c => codeStartsWith(code, c));
  for (const v of VERTICALS) {
    const inRetail    = v.retail.some(c => codeStartsWith(code, c));
    const inWholesale = v.wholesale.some(c => codeStartsWith(code, c));
    if (inRetail || inWholesale) {
      return { vertical: v.id, verticalName: v.name, isInternet, score: (inRetail ? 20 : 15) + (isInternet ? 30 : 0) };
    }
  }
  if (isInternet) return { vertical: "marketplace", verticalName: "Маркетплейс (TBD)", isInternet: true, score: 30 };
  return null;
}

async function forEachXmlEntry(zipPath, onXmlEntry) {
  let yauzl;
  try { yauzl = (await import("yauzl")).default; }
  catch { throw new Error("npm install yauzl"); }
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
      if (err) return reject(err);
      zipfile.readEntry();
      zipfile.on("entry", (entry) => {
        if (!/\.xml$/i.test(entry.fileName)) { zipfile.readEntry(); return; }
        zipfile.openReadStream(entry, (err2, stream) => {
          if (err2) return reject(err2);
          const chunks = [];
          stream.on("data", c => chunks.push(c));
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
  catch { throw new Error("npm install sax"); }
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

// Отправка батча через PowerShell (Node.js HTTP заблокирован firewall)
// JSON и PS-скрипт пишем в temp-файлы, запускаем powershell -File (без cmd.exe)
async function postBatch(contacts, clear = false) {
  const { execFileSync } = await import('node:child_process');
  const ts = Date.now();
  const tmpFile = path.join(os.tmpdir(), `msp-batch-${ts}.json`);
  const tmpPs1  = path.join(os.tmpdir(), `msp-post-${ts}.ps1`);

  try {
    fs.writeFileSync(tmpFile, JSON.stringify({ contacts, clear }), "utf-8");
    const url = `${API_BASE}/api/admin/sellers-base/import`;

    const psScript = `$body = Get-Content -Path '${tmpFile}' -Raw -Encoding UTF8
$headers = @{'x-import-key'='${IMPORT_KEY}'; 'Content-Type'='application/json'}
try {
  $r = Invoke-RestMethod -Uri '${url}' -Method POST -Body $body -Headers $headers -TimeoutSec 60
  Write-Output ('OK:' + $r.saved)
} catch {
  Write-Output ('ERR:' + $_.Exception.Message)
}`;
    fs.writeFileSync(tmpPs1, psScript, "utf-8");

    let out;
    try {
      out = execFileSync('powershell', ['-NoProfile', '-NonInteractive', '-File', tmpPs1], {
        encoding: "utf-8",
        stdio: ["pipe","pipe","pipe"]
      }).trim();
    } catch (e) {
      throw new Error(`PowerShell failed (exit ${e.status}): ${e.stderr || e.message}`);
    }

    if (out.startsWith("OK:")) return { ok: true, saved: parseInt(out.slice(3), 10) };
    throw new Error(out || "PowerShell returned empty output");
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
    try { fs.unlinkSync(tmpPs1); } catch {}
  }
}

async function main() {
  const limitArg = process.argv.find(a => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : 5000;
  const doClear = process.argv.includes("--clear");
  const zipArg = process.argv.find(a => a.startsWith("--zip="));
  const zipPath = zipArg?.split("=")[1];

  if (!zipPath || !fs.existsSync(zipPath)) {
    console.error("Укажи путь к ZIP: --zip=C:\\path\\to\\rsmp.zip");
    console.error("Или запусти: scripts/outreach/run-msp.ps1");
    process.exit(1);
  }

  console.log(`ZIP: ${zipPath} (${(fs.statSync(zipPath).size / 1024 / 1024).toFixed(1)} МБ)`);
  console.log(`Лимит: ${limit}, Очистка: ${doClear}`);

  let totalSaved = 0;
  let totalScanned = 0;
  let filesSeen = 0;
  const verticalStats = {};
  let pendingBatch = [];
  let firstBatch = true;

  async function flushBatch(force = false) {
    if (pendingBatch.length === 0) return;
    if (!force && pendingBatch.length < 100) return;
    const batch = pendingBatch.splice(0, 100);
    const result = await postBatch(batch, firstBatch && doClear);
    firstBatch = false;
    totalSaved += result.saved;
    process.stdout.write(`  → батч ${batch.length} отправлен, сохранено: ${result.saved} (итого ${totalSaved}/${limit})\n`);
  }

  await forEachXmlEntry(zipPath, async (name, buffer) => {
    filesSeen++;
    const parsed = await parseXmlEntry(buffer);
    totalScanned += parsed.length;

    for (const c of parsed) {
      if (totalSaved + pendingBatch.length >= limit) break;
      const match = matchVertical(c.okved);
      if (!match) continue;
      pendingBatch.push({ name: c.name, inn: c.inn, okved: c.okved, okvedName: c.okvedName, region: c.region, vertical: match.vertical, score: match.score, isInternet: match.isInternet });
      verticalStats[match.vertical] = (verticalStats[match.vertical] || 0) + 1;
      if (match.isInternet) verticalStats._internet = (verticalStats._internet || 0) + 1;
    }

    if (parsed.length > 0) {
      process.stdout.write(`${name}: ${parsed.length} записей, в батче: ${pendingBatch.length}\n`);
    }
    await flushBatch();
    return totalSaved + pendingBatch.length < limit;
  });

  await flushBatch(true);

  console.log(`\n──────────────────────────────────────`);
  console.log(`XML-файлов: ${filesSeen}, отсканировано: ${totalScanned}, сохранено: ${totalSaved}`);
  console.log(`\nПо вертикалям:`);
  for (const [k, v] of Object.entries(verticalStats)) {
    if (k === "_internet") continue;
    console.log(`  ${VERTICALS.find(x => x.id === k)?.name || k}: ${v}`);
  }
  if (verticalStats._internet) console.log(`  ↳ интернет-продавцы: ${verticalStats._internet}`);
}

main().catch(e => { console.error("ОШИБКА:", e?.message || e); process.exit(1); });
