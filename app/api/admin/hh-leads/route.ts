import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(req: NextRequest) {
  return !!(req.cookies.get("cb_admin")?.value || req.cookies.get("cb_tenant_session")?.value);
}

const HH_BASE = "https://api.hh.ru";
const HH_UA = "ChinaBridge/1.0 (alex@chinabridge.pro)";

interface HHItem {
  id: string;
  name: string;
  area?: { name: string };
  employer?: { id: string; name: string; alternate_url?: string };
}

interface HHEmployer {
  id: string;
  name: string;
  alternate_url?: string;
  site_url?: string;
  description?: string;
  vacancies_count?: number;
  area?: { name: string };
}

const QUERIES = [
  { text: "менеджер маркетплейс wildberries",        cat: "wb" },
  { text: "менеджер маркетплейс ozon",               cat: "wb" },
  { text: "закупщик байер поставщик Китай",          cat: "china" },
  { text: "менеджер ВЭД внешнеэкономическая Китай",  cat: "import" },
];

async function hhSearch(query: string): Promise<HHItem[]> {
  try {
    const url = `${HH_BASE}/vacancies?text=${encodeURIComponent(query)}&per_page=50&order_by=publication_time`;
    const r = await fetch(url, { headers: { "HH-User-Agent": HH_UA }, signal: AbortSignal.timeout(12000) });
    if (!r.ok) return [];
    const d = await r.json();
    return Array.isArray(d.items) ? d.items : [];
  } catch { return []; }
}

async function hhEmployer(id: string): Promise<HHEmployer | null> {
  try {
    const r = await fetch(`${HH_BASE}/employers/${id}`, { headers: { "HH-User-Agent": HH_UA }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

async function dadataByName(name: string, token: string) {
  try {
    const r = await fetch("https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Token ${token}` },
      body: JSON.stringify({ query: name, count: 1 }),
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) return null;
    const d = await r.json();
    const s = d.suggestions?.[0]?.data;
    if (!s) return null;
    return {
      inn: s.inn as string | undefined,
      fullName: (s.name?.full_with_opf as string) || undefined,
      director: (s.management?.name as string) || undefined,
      address: (s.address?.value as string) || undefined,
    };
  } catch { return null; }
}

function calcScore(emp: HHEmployer, vacCount: number, cat: string): number {
  let s = 20;
  if (emp.site_url) s += 20;
  if (vacCount >= 3) s += 20;
  else if (vacCount >= 2) s += 10;
  if (cat === "wb" || cat === "ozon") s += 25;
  if (cat === "china" || cat === "import") s += 20;
  if (emp.description && emp.description.length > 150) s += 10;
  return Math.min(s, 100);
}

// GET — читаем из Neon, возвращаем в формате, совместимом с HhLeadsClient
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });

  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT id, company_name, inn, okvad, okvad_name, region,
           lead_score, is_internet_seller, status, created_at
    FROM outreach_contacts
    WHERE source = 'hh_ru'
    ORDER BY lead_score DESC NULLS LAST
    LIMIT 200
  `;

  const leads = rows.map(r => {
    let extra: Record<string, unknown> = {};
    try { extra = JSON.parse(r.okvad_name as string ?? "{}"); } catch {}
    return {
      id: r.id,
      lead_id: String(r.id),
      company: r.company_name as string,
      city: r.region ?? "",
      category: r.okvad ?? "",
      source: "HHRU",
      status: r.status,
      score: Math.round((Number(r.lead_score) || 0) / 20),
      created_at: r.created_at,
      message: JSON.stringify({
        inn:           r.inn,
        website:       extra.site_url ?? null,
        leadScore:     Number(r.lead_score) || 0,
        searchCategory: r.okvad,
        employerUrl:   extra.alternate_url,
        vacancyName:   extra.vacancyName,
        vacancyCount:  extra.vacancyCount,
        director:      extra.director,
        address:       extra.address,
        fullName:      extra.fullName ?? r.company_name,
        isActive:      true,
        description:   extra.description,
      }),
    };
  });

  return NextResponse.json({ ok: true, leads });
}

// POST — парсим HH.ru → DaData (параллельно) → сохраняем в Neon (~25s total)
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });

  const sql = neon(process.env.DATABASE_URL!);
  const dadataToken = process.env.DADATA_TOKEN ?? "";

  // Шаг 1: параллельно ищем по всем запросам (~4-8s)
  const allItems = (await Promise.all(QUERIES.map(q => hhSearch(q.text).then(items => items.map(i => ({ ...i, _cat: q.cat })))))).flat();

  // Дедупликация по employer.id, берём лучшую категорию и считаем вакансии
  const seen = new Map<string, { name: string; alternateUrl: string; city: string; vacCount: number; cat: string; vacName: string }>();
  for (const item of allItems) {
    if (!item.employer?.id) continue;
    const eid = item.employer.id;
    if (seen.has(eid)) {
      seen.get(eid)!.vacCount++;
    } else {
      seen.set(eid, {
        name:         item.employer.name,
        alternateUrl: item.employer.alternate_url ?? "",
        city:         item.area?.name ?? "",
        vacCount:     1,
        cat:          (item as HHItem & { _cat: string })._cat,
        vacName:      item.name,
      });
    }
  }

  // Топ-40 по числу вакансий
  const candidates = [...seen.values()]
    .sort((a, b) => b.vacCount - a.vacCount)
    .slice(0, 40);

  // Шаг 2: DaData параллельно пачками по 8 (~10-12s)
  const BATCH = 8;
  const enriched: Array<typeof candidates[0] & { inn?: string; fullName?: string; director?: string; address?: string }> = [];

  for (let i = 0; i < candidates.length; i += BATCH) {
    const batch = candidates.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(c => dadataToken ? dadataByName(c.name, dadataToken) : Promise.resolve(null))
    );
    for (let j = 0; j < batch.length; j++) {
      const d = results[j];
      if (!d?.inn) continue; // без ИНН пропускаем
      enriched.push({ ...batch[j], inn: d.inn, fullName: d.fullName, director: d.director, address: d.address });
    }
  }

  // Шаг 3: сохраняем в Neon (~5s)
  let saved = 0;
  for (const c of enriched) {
    try {
      const score = Math.min(
        20
        + (c.alternateUrl ? 10 : 0)
        + (c.vacCount >= 3 ? 20 : c.vacCount >= 2 ? 10 : 0)
        + (c.cat === "wb" || c.cat === "ozon" ? 25 : 20)
        + (c.address ? 10 : 0),
        100
      );

      const extra = JSON.stringify({
        alternate_url: c.alternateUrl || null,
        site_url:      null,
        vacancyName:   c.vacName,
        vacancyCount:  c.vacCount,
        fullName:      c.fullName ?? c.name,
        director:      c.director ?? null,
        address:       c.address ?? null,
        description:   null,
      });

      await sql`
        INSERT INTO outreach_contacts
          (company_name, inn, okvad, okvad_name, region,
           has_china_keywords, china_keywords_found,
           lead_score, is_internet_seller, status, source)
        VALUES (
          ${c.name}, ${c.inn!}, ${c.cat}, ${extra}, ${c.city},
          ${c.cat === "china" || c.cat === "import"},
          ${c.cat === "china" || c.cat === "import" ? ["china","import"] : []},
          ${score}, false, 'new', 'hh_ru'
        )
        ON CONFLICT (inn) DO UPDATE SET
          okvad      = EXCLUDED.okvad,
          okvad_name = EXCLUDED.okvad_name,
          lead_score = GREATEST(outreach_contacts.lead_score, EXCLUDED.lead_score),
          source     = 'hh_ru'
      `;
      saved++;
    } catch { /* skip */ }
  }

  return NextResponse.json({ ok: true, saved, total: candidates.length, enriched: enriched.length });
}
