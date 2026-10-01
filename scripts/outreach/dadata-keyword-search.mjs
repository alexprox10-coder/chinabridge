// Альтернатива parse-msp-registry.mjs: вместо скачивания 2ГБ архива ФНС
// (упирается в троттлинг nalog.ru с облачных IP + медленный интернет),
// ищем компании напрямую через DaData suggest/party — поиск по ключевому
// слову в названии + фильтр по ОКВЭД, без скачивания чего-либо крупного.
// Каждый запрос — несколько КБ, бесплатный тариф 10 000 запросов/день.
//
// Запуск: DADATA_TOKEN=xxx node scripts/outreach/dadata-keyword-search.mjs [--out=file.json]

import fs from 'node:fs';

const DADATA_TOKEN = process.env.DADATA_TOKEN;
const DADATA_SUGGEST_URL = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party";

// Ключевые слова, с высокой вероятностью встречающиеся в названиях реальных
// импортёров/карго-компаний/опта, работающих с Китаем.
const KEYWORDS = [
  "карго", "китай трейд", "импорт китай", "китай логистик", "гуанчжоу",
  "шэньчжэнь", "китайский опт", "азия трейд", "востокимпорт", "1688",
  "кантон", "иу трейд", "альянс карго", "восток карго", "трансазия",
];

async function searchParty(query) {
  const res = await fetch(DADATA_SUGGEST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Accept": "application/json",
      "Authorization": `Token ${DADATA_TOKEN}`,
    },
    body: JSON.stringify({
      query,
      count: 20,
      status: ["ACTIVE"],
      filters: [{ okved: "46" }], // оптовая торговля — та же цель, что и в МСП-пайплайне
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`DaData HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.suggestions ?? [];
}

async function main() {
  if (!DADATA_TOKEN) {
    console.error("ОШИБКА: DADATA_TOKEN не задан.");
    process.exit(1);
  }

  const outArg = process.argv.find((a) => a.startsWith("--out="));
  const outFile = outArg ? outArg.split("=")[1] : null;

  const byInn = new Map();
  for (const kw of KEYWORDS) {
    try {
      const results = await searchParty(kw);
      let added = 0;
      for (const r of results) {
        const d = r.data;
        if (!d?.inn || byInn.has(d.inn)) continue;
        byInn.set(d.inn, {
          name: d.name?.short_with_opf || d.name?.full_with_opf || r.value,
          inn: d.inn,
          okved: d.okved || "",
          okvedName: "",
          region: d.address?.data?.region_with_type || "",
          hasKeyword: true,
          found: [kw],
          phone: d.phones?.[0]?.value || null,
          email: d.emails?.[0]?.value || null,
        });
        added++;
      }
      console.log(`"${kw}": найдено ${results.length}, новых ${added} (всего уникальных ${byInn.size})`);
    } catch (e) {
      console.log(`"${kw}": ошибка ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  const contacts = [...byInn.values()];
  console.log(`\nИтого уникальных компаний: ${contacts.length}`);

  if (outFile) {
    fs.writeFileSync(outFile, JSON.stringify(contacts, null, 2), "utf-8");
    console.log(`Сохранено в ${outFile}`);
  } else {
    console.log(JSON.stringify(contacts, null, 2));
  }
}

main().catch((e) => {
  console.error("ОШИБКА:", e.message);
  process.exit(1);
});
