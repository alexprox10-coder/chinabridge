import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APIFY_TOKEN = process.env.APIFY_API_TOKEN ?? "";
const APIFY_BASE = "https://api.apify.com/v2";
const ACTOR = "compass~crawler-google-places";

const N8N_BASE = process.env.N8N_BASE_URL ?? "https://n8n.arendadom24.ru";
const N8N_KEY = process.env.N8N_API_KEY ?? "";
const WB_TABLE_ID = "ZUdd2z8BpyvePLeX";

function isAuthorized(req: NextRequest) {
  return !!(req.cookies.get("cb_admin")?.value || req.cookies.get("cb_tenant_session")?.value);
}

function scoreFromReviews(reviews: number): number {
  if (reviews >= 5000) return 90;
  if (reviews >= 1000) return 75;
  if (reviews >= 500) return 60;
  if (reviews >= 100) return 45;
  if (reviews >= 20) return 30;
  return 15;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { action } = body;

  // ── START: запускает Apify актор ──────────────────────────────────────────
  if (action === "start") {
    if (!APIFY_TOKEN) return NextResponse.json({ error: "APIFY_API_TOKEN not configured" }, { status: 500 });
    const { searchStrings = ["оптовый магазин Алматы"], limit = 50 } = body;

    const input = {
      searchStringsArray: searchStrings,
      maxCrawledPlaces: Math.min(Number(limit) || 50, 200),
      language: "ru",
      maxImages: 0,
      scrapePlaceDetailPage: false,
      includeHistogram: false,
      includeOpeningHours: false,
      includePeopleAlsoSearch: false,
      city: "Almaty",
      country: "KZ",
      countryCode: "kz",
    };

    const res = await fetch(`${APIFY_BASE}/acts/${ACTOR}/runs?token=${APIFY_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).catch(() => null);

    if (!res?.ok) {
      const text = await res?.text().catch(() => "");
      return NextResponse.json({ error: `apify_start_failed: ${text}` }, { status: 502 });
    }

    const data = (await res.json()).data ?? {};
    return NextResponse.json({
      ok: true,
      runId: data.id,
      datasetId: data.defaultDatasetId,
      status: data.status,
    });
  }

  // ── STATUS: проверяет статус запуска ──────────────────────────────────────
  if (action === "status") {
    if (!APIFY_TOKEN) return NextResponse.json({ error: "APIFY_API_TOKEN not configured" }, { status: 500 });
    const { runId } = body;
    if (!runId) return NextResponse.json({ error: "runId required" }, { status: 400 });

    const res = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${APIFY_TOKEN}`).catch(() => null);
    if (!res?.ok) return NextResponse.json({ error: "run_not_found" }, { status: 404 });

    const run = (await res.json()).data ?? {};
    return NextResponse.json({
      ok: true,
      status: run.status,          // READY / RUNNING / SUCCEEDED / FAILED
      itemCount: run.stats?.savedItemCount ?? 0,
      datasetId: run.defaultDatasetId,
    });
  }

  // ── FETCH: забирает результаты из датасета ────────────────────────────────
  if (action === "fetch") {
    if (!APIFY_TOKEN) return NextResponse.json({ error: "APIFY_API_TOKEN not configured" }, { status: 500 });
    const { datasetId, limit = 100, offset = 0 } = body;
    if (!datasetId) return NextResponse.json({ error: "datasetId required" }, { status: 400 });

    const res = await fetch(
      `${APIFY_BASE}/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=${limit}&offset=${offset}`,
    ).catch(() => null);

    if (!res?.ok) return NextResponse.json({ error: "dataset_fetch_failed" }, { status: 502 });

    const raw = await res.text();
    const items: Record<string, unknown>[] = JSON.parse(raw.replace(/[\uD800-\uDFFF]/g, "")) ?? [];

    const leads = items
      .filter(p => p.title || p.phone)
      .map(p => ({
        company: String(p.title ?? "").slice(0, 200),
        phone: String(p.phone ?? ""),
        website: String(p.website ?? ""),
        address: String(p.address ?? ""),
        city: String(p.city ?? ""),
        category: String(p.categoryName ?? ""),
        rating: Number(p.totalScore ?? 0),
        reviews: Number(p.reviewsCount ?? 0),
        score: scoreFromReviews(Number(p.reviewsCount ?? 0)),
      }));

    // Meta
    const metaRes = await fetch(`${APIFY_BASE}/datasets/${datasetId}?token=${APIFY_TOKEN}`).catch(() => null);
    const meta = metaRes?.ok ? ((await metaRes.json()).data ?? {}) : {};

    return NextResponse.json({ ok: true, leads, total: meta.itemCount ?? leads.length });
  }

  // ── IMPORT: сохраняет лиды в n8n DataTable (WB Sellers) ──────────────────
  if (action === "import") {
    const { leads = [] } = body as { leads: { company: string; category: string; score: number; phone: string; website: string }[] };
    if (!leads.length) return NextResponse.json({ error: "leads array is empty" }, { status: 400 });

    const rows = leads.map(l => ({
      company: l.company || "",
      category: l.category || "",
      score: l.score ?? 0,
      phone: l.phone || "",
      email: l.website || "",  // website как email-placeholder, discovery workflow найдёт настоящий
    }));

    // Разбиваем на батчи по 50
    const BATCH = 50;
    let imported = 0;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const res = await fetch(`${N8N_BASE}/api/v1/data-tables/${WB_TABLE_ID}/rows`, {
        method: "POST",
        headers: { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ data: batch }),
        signal: AbortSignal.timeout(15000),
      }).catch(() => null);
      if (res?.ok) imported += batch.length;
    }

    return NextResponse.json({ ok: true, imported, total: leads.length });
  }

  // ── DEBUG: показывает формат ответа n8n rows API ─────────────────────────
  if (action === "debug_rows") {
    if (!N8N_KEY) return NextResponse.json({ error: "N8N_API_KEY not configured" }, { status: 500 });
    const r = await fetch(
      `${N8N_BASE}/api/v1/data-tables/${WB_TABLE_ID}/rows?take=2`,
      { headers: { "X-N8N-API-KEY": N8N_KEY } },
    ).catch(() => null);
    if (!r?.ok) return NextResponse.json({ error: "fetch_failed", status: r?.status }, { status: 502 });
    const json = await r.json();
    return NextResponse.json({ ok: true, keys: Object.keys(json), sample: json });
  }

  // ── DEDUPE: удаляет дублирующиеся строки по company ──────────────────────
  if (action === "dedupe") {
    if (!N8N_KEY) return NextResponse.json({ error: "N8N_API_KEY not configured" }, { status: 500 });

    // Получаем все строки
    const allRows: { id: string; data: Record<string, unknown> }[] = [];
    let page = 0;
    const PAGE = 500;
    while (true) {
      const r = await fetch(
        `${N8N_BASE}/api/v1/data-tables/${WB_TABLE_ID}/rows?take=${PAGE}&skip=${page * PAGE}`,
        { headers: { "X-N8N-API-KEY": N8N_KEY } },
      ).catch(() => null);
      if (!r?.ok) break;
      const json = await r.json();
      const items: { id: string; data: Record<string, unknown> }[] = json.rows ?? json.data ?? json.items ?? [];
      allRows.push(...items);
      if (items.length < PAGE) break;
      page++;
    }

    // Находим дубли — оставляем первую запись, удаляем остальные с тем же company
    const seen = new Map<string, boolean>();
    const toDelete: string[] = [];
    for (const row of allRows) {
      const key = String(row.data?.company ?? row.data?.Company ?? "").trim().toLowerCase();
      if (!key) continue;
      if (seen.has(key)) {
        toDelete.push(row.id);
      } else {
        seen.set(key, true);
      }
    }

    // Удаляем дубли
    let deleted = 0;
    for (const rowId of toDelete) {
      const r = await fetch(`${N8N_BASE}/api/v1/data-tables/${WB_TABLE_ID}/rows/${rowId}`, {
        method: "DELETE",
        headers: { "X-N8N-API-KEY": N8N_KEY },
      }).catch(() => null);
      if (r?.ok) deleted++;
    }

    return NextResponse.json({
      ok: true,
      total: allRows.length,
      duplicates: toDelete.length,
      deleted,
    });
  }

  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}
