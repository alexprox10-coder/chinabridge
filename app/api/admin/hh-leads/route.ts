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

// POST — парсим HH.ru → DaData → сохраняем в Neon
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });

  const sql = neon(process.env.DATABASE_URL!);
  const dadataToken = process.env.DADATA_TOKEN ?? "";

  // Собираем уникальных работодателей по всем запросам
  const seen = new Map<string, { vacCount: number; cat: string; vacName: string; city: string }>();

  for (const q of QUERIES) {
    const items = await hhSearch(q.text);
    for (const item of items) {
      if (!item.employer?.id) continue;
      const eid = item.employer.id;
      if (seen.has(eid)) {
        seen.get(eid)!.vacCount++;
      } else {
        seen.set(eid, { vacCount: 1, cat: q.cat, vacName: item.name, city: item.area?.name ?? "" });
      }
    }
  }

  // Ограничиваем — сортируем по числу вакансий (больше вакансий = приоритет)
  const employers = [...seen.entries()]
    .sort((a, b) => b[1].vacCount - a[1].vacCount)
    .slice(0, 60);

  let saved = 0;

  for (const [eid, { vacCount, cat, vacName, city }] of employers) {
    try {
      const emp = await hhEmployer(eid);
      if (!emp) continue;

      // DaData — ищем по имени чтобы получить ИНН
      const dadata = dadataToken ? await dadataByName(emp.name, dadataToken) : null;
      if (!dadata?.inn) {
        // Без ИНН не сохраняем — невозможно дедуплицировать
        continue;
      }

      const score = calcScore(emp, vacCount, cat);
      const region = emp.area?.name ?? city;

      const extra = JSON.stringify({
        alternate_url: emp.alternate_url ?? null,
        site_url:      emp.site_url ?? null,
        vacancyName:   vacName,
        vacancyCount:  vacCount,
        fullName:      dadata.fullName ?? emp.name,
        director:      dadata.director ?? null,
        address:       dadata.address ?? null,
        description:   emp.description ? emp.description.replace(/<[^>]+>/g, "").slice(0, 400) : null,
      });

      await sql`
        INSERT INTO outreach_contacts
          (company_name, inn, okvad, okvad_name, region,
           has_china_keywords, china_keywords_found,
           lead_score, is_internet_seller, status, source)
        VALUES (
          ${emp.name},
          ${dadata.inn},
          ${cat},
          ${extra},
          ${region},
          ${cat === "china" || cat === "import"},
          ${cat === "china" || cat === "import" ? ["china","import"] : []},
          ${score},
          ${!!emp.site_url},
          'new',
          'hh_ru'
        )
        ON CONFLICT (inn) DO UPDATE SET
          okvad        = EXCLUDED.okvad,
          okvad_name   = EXCLUDED.okvad_name,
          lead_score   = GREATEST(outreach_contacts.lead_score, EXCLUDED.lead_score),
          source       = 'hh_ru',
          is_internet_seller = EXCLUDED.is_internet_seller
      `;
      saved++;
    } catch { /* пропускаем ошибочные записи */ }

    await new Promise(r => setTimeout(r, 150));
  }

  return NextResponse.json({ ok: true, saved, total: employers.length });
}
