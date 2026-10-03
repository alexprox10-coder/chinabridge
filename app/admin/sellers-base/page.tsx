"use client";
import { useState, useEffect } from "react";
import { AdminNav } from "@/components/admin/AdminNav";

const VERTICALS = [
  { id: "home",        name: "Товары для дома",          icon: "🏠" },
  { id: "electronics", name: "Электроника",               icon: "🔌" },
  { id: "auto",        name: "Автотовары",                icon: "🚗" },
  { id: "tools",       name: "Инструмент",                icon: "🛠" },
  { id: "interior",    name: "Свет и интерьер",           icon: "💡" },
  { id: "clothing",    name: "Одежда и обувь",            icon: "👕" },
  { id: "beauty",      name: "Косметика",                 icon: "💄" },
  { id: "sports",      name: "Спорт и туризм",            icon: "🏋️" },
  { id: "kids",        name: "Детские товары",            icon: "🧸" },
  { id: "bags",        name: "Сумки и аксессуары",        icon: "👜" },
  { id: "marketplace", name: "Маркетплейс (TBD)",         icon: "🛍️" },
];

interface Contact {
  id: string;
  company_name: string;
  inn: string;
  okvad: string | null;
  okvad_name: string | null;
  region: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  product_vertical: string | null;
  lead_score: number | null;
  is_internet_seller: boolean | null;
  created_at: string;
}

interface Stats {
  total: number;
  byVertical: Record<string, number>;
  byStatus: Record<string, number>;
  withEmail: number;
  withPhone: number;
  internetSellers: number;
  scoreDistribution: { range: string; count: number }[];
}

const MSP_CMD = "node scripts/outreach/parse-msp-registry.mjs --limit=5000 --clear";

export default function SellersBasePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterVertical, setFilterVertical] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterMinScore, setFilterMinScore] = useState<number>(0);
  const [enriching, setEnriching] = useState(false);
  const [enrichAll, setEnrichAll] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState<{ processed: number; total: number; found: number } | null>(null);
  const [enrichResult, setEnrichResult] = useState("");
  const [cmdCopied, setCmdCopied] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterVertical !== "all") params.set("vertical", filterVertical);
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterMinScore > 0) params.set("minScore", String(filterMinScore));
      const res = await fetch(`/api/admin/sellers-base?${params}`);
      const data = await res.json();
      if (data.ok) {
        setStats(data.stats);
        setContacts(data.contacts ?? []);
      }
    } catch {}
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [filterVertical, filterStatus, filterMinScore]);

  async function runEnrich() {
    setEnriching(true);
    setEnrichResult("");
    try {
      const res = await fetch("/api/admin/outreach-docs/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 30, source: "msp_registry" }),
      });
      const data = await res.json();
      if (data.ok) {
        setEnrichResult(`✓ Обработано ${data.processed}, найдено контактов: ${data.found}`);
        loadData();
      }
    } catch {}
    setEnriching(false);
  }

  async function runEnrichAll() {
    const total = stats?.byStatus?.new ?? 0;
    if (!total) return;
    setEnrichAll(true);
    setEnrichProgress({ processed: 0, total, found: 0 });
    setEnrichResult("");
    let totalProcessed = 0;
    let totalFound = 0;
    while (true) {
      try {
        const res = await fetch("/api/admin/outreach-docs/enrich", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limit: 100, source: "msp_registry" }),
        });
        const data = await res.json();
        if (!data.ok || data.processed === 0) break;
        totalProcessed += data.processed;
        totalFound += data.found;
        setEnrichProgress({ processed: totalProcessed, total, found: totalFound });
        if (data.processed < 100) break;
        await new Promise(r => setTimeout(r, 2000));
      } catch { break; }
    }
    setEnrichAll(false);
    setEnrichProgress(null);
    setEnrichResult(`✓ Полный прогон завершён: обработано ${totalProcessed}, найдено: ${totalFound}`);
    loadData();
  }

  async function copyCmd() {
    await navigator.clipboard.writeText(MSP_CMD);
    setCmdCopied(true);
    setTimeout(() => setCmdCopied(false), 1500);
  }

  const scoreColor = (score: number | null) => {
    if (!score) return "text-slate-500";
    if (score >= 60) return "text-emerald-400";
    if (score >= 35) return "text-amber-400";
    return "text-slate-400";
  };

  const scoreBadge = (score: number | null) => {
    if (!score) return "bg-slate-800 text-slate-500";
    if (score >= 60) return "bg-emerald-900/50 text-emerald-400";
    if (score >= 35) return "bg-amber-900/50 text-amber-400";
    return "bg-slate-800 text-slate-400";
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Заголовок */}
        <div>
          <h1 className="text-2xl font-bold text-white">База продавцов</h1>
          <p className="text-slate-500 text-sm mt-1">
            Реестр МСП → ОКВЭД 46/47 (10 товарных вертикалей) → DaData обогащение → Lead Score
          </p>
        </div>

        {/* Шаг 1: загрузка из реестра */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📥</span>
            <span className="text-white font-semibold">Шаг 1 — Загрузить из реестра МСП</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400">локально</span>
          </div>
          <p className="text-slate-500 text-xs mb-3">
            Скачивает реестр МСП (ФНС, ~2 ГБ), фильтрует 10 товарных вертикалей (ОКВЭД 46.x + 47.x).
            Флаг <code className="bg-slate-800 px-1 rounded">--clear</code> сначала удаляет старые записи.
            Запускать локально — нужен прямой доступ к Neon.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-slate-300 bg-slate-800/80 px-3 py-2 rounded-lg font-mono overflow-x-auto whitespace-nowrap">
              {MSP_CMD}
            </code>
            <button onClick={copyCmd} className="shrink-0 px-3 py-2 rounded-lg text-xs border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white transition">
              {cmdCopied ? "✓" : "Копировать"}
            </button>
          </div>
        </div>

        {/* Статистика */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Всего компаний", value: stats.total, color: "text-white" },
              { label: "Интернет-продавцы (47.91)", value: stats.internetSellers, color: "text-emerald-400" },
              { label: "Найдено email", value: stats.withEmail, color: "text-sky-400" },
              { label: "Найдено телефон", value: stats.withPhone, color: "text-violet-400" },
            ].map(s => (
              <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                <div className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
                <div className="text-slate-500 text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* По вертикалям */}
        {stats && Object.keys(stats.byVertical).length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-3 text-sm">По товарным вертикалям</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {VERTICALS.filter(v => stats.byVertical[v.id]).map(v => (
                <button
                  key={v.id}
                  onClick={() => setFilterVertical(filterVertical === v.id ? "all" : v.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition ${
                    filterVertical === v.id
                      ? "bg-sky-900/50 border-sky-700 text-sky-300"
                      : "bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  <span>{v.icon}</span>
                  <span className="flex-1 text-left">{v.name}</span>
                  <span className={`tabular-nums font-bold ${filterVertical === v.id ? "text-sky-400" : "text-slate-400"}`}>
                    {stats.byVertical[v.id]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Статусы + обогащение */}
        <div className="bg-slate-900 border border-sky-900/40 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">✨</span>
            <span className="text-white font-semibold">Шаг 2 — Обогащение через DaData</span>
          </div>

          {stats && (
            <div className="flex flex-wrap gap-2">
              {[
                { key: "new",       label: "Новые",          color: "bg-slate-700 text-slate-300" },
                { key: "enriched",  label: "Обогащены",      color: "bg-sky-900/50 text-sky-400" },
                { key: "no_contact",label: "Нет контактов",  color: "bg-slate-800 text-slate-500" },
              ].map(s => (
                <button
                  key={s.key}
                  onClick={() => setFilterStatus(filterStatus === s.key ? "all" : s.key)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition border ${
                    filterStatus === s.key ? "border-sky-600" : "border-transparent"
                  } ${s.color}`}
                >
                  {s.label}: {stats.byStatus[s.key] ?? 0}
                </button>
              ))}
              <button onClick={loadData} disabled={loading} className="text-xs px-3 py-1.5 rounded-full border border-slate-700 text-slate-400 hover:text-white transition">
                {loading ? "⏳" : "↻ Обновить"}
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={runEnrich}
              disabled={enriching || enrichAll || !stats?.byStatus?.new}
              className="px-4 py-2 rounded-lg text-sm font-medium border bg-sky-900/20 border-sky-800 text-sky-400 hover:bg-sky-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {enriching ? "⏳ Обогащаю..." : "▶ Обогатить 30"}
            </button>
            <button
              onClick={runEnrichAll}
              disabled={enriching || enrichAll || !stats?.byStatus?.new}
              className="px-4 py-2 rounded-lg text-sm font-medium border bg-emerald-900/20 border-emerald-800 text-emerald-400 hover:bg-emerald-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {enrichAll
                ? `⏳ ${enrichProgress?.processed ?? 0} / ${enrichProgress?.total ?? 0} (найдено: ${enrichProgress?.found ?? 0})`
                : `▶▶ Обогатить все (${stats?.byStatus?.new ?? 0})`}
            </button>
          </div>
          {enrichResult && (
            <p className={`text-xs ${enrichResult.startsWith("✗") ? "text-red-400" : "text-emerald-400"}`}>{enrichResult}</p>
          )}
        </div>

        {/* Фильтр по score */}
        <div className="flex flex-wrap items-center gap-4 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
          <span className="text-sm text-slate-400 shrink-0">Lead Score ≥</span>
          <div className="flex gap-2 flex-wrap">
            {[0, 20, 35, 50, 60].map(v => (
              <button
                key={v}
                onClick={() => setFilterMinScore(v)}
                className={`text-xs px-3 py-1 rounded-full border transition font-medium ${
                  filterMinScore === v
                    ? "bg-sky-900/50 border-sky-700 text-sky-400"
                    : "border-slate-700 text-slate-500 hover:text-slate-300"
                }`}
              >
                {v === 0 ? "Все" : `${v}+`}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-600 ml-auto">{contacts.length} компаний</span>
        </div>

        {/* Таблица */}
        {contacts.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800/60 text-slate-400 text-left">
                  <th className="px-3 py-2 text-xs font-medium">Компания</th>
                  <th className="px-3 py-2 text-xs font-medium">Вертикаль</th>
                  <th className="px-3 py-2 text-xs font-medium">ОКВЭД</th>
                  <th className="px-3 py-2 text-xs font-medium">Регион</th>
                  <th className="px-3 py-2 text-xs font-medium">Email</th>
                  <th className="px-3 py-2 text-xs font-medium">Телефон</th>
                  <th className="px-3 py-2 text-xs font-medium">Score</th>
                  <th className="px-3 py-2 text-xs font-medium">Статус</th>
                </tr>
              </thead>
              <tbody>
                {contacts.slice(0, 50).map(c => {
                  const v = VERTICALS.find(x => x.id === c.product_vertical);
                  return (
                    <tr key={c.id} className="border-t border-slate-800/60 hover:bg-slate-800/30 transition">
                      <td className="px-3 py-2 text-xs">
                        <div className="text-white max-w-[200px] truncate">{c.company_name}</div>
                        <div className="text-slate-600 text-xs">{c.inn}</div>
                      </td>
                      <td className="px-3 py-2 text-xs whitespace-nowrap">
                        {v ? <span className="text-slate-300">{v.icon} {v.name}</span> : <span className="text-slate-600">—</span>}
                        {c.is_internet_seller && <span className="ml-1 text-emerald-500" title="47.91 интернет-торговля">●</span>}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-400 whitespace-nowrap">{c.okvad || "—"}</td>
                      <td className="px-3 py-2 text-xs text-slate-400 max-w-[100px] truncate">{c.region || "—"}</td>
                      <td className="px-3 py-2 text-xs text-sky-400">{c.email || <span className="text-slate-700">—</span>}</td>
                      <td className="px-3 py-2 text-xs text-sky-400">{c.phone || <span className="text-slate-700">—</span>}</td>
                      <td className="px-3 py-2 text-xs">
                        <span className={`px-2 py-0.5 rounded font-bold tabular-nums ${scoreBadge(c.lead_score)}`}>
                          {c.lead_score ?? 0}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <span className={`px-1.5 py-0.5 rounded ${
                          c.status === "enriched"   ? "bg-sky-900/50 text-sky-400" :
                          c.status === "no_contact" ? "bg-slate-800 text-slate-500" :
                          "bg-slate-700 text-slate-400"
                        }`}>{c.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {contacts.length > 50 && (
              <div className="px-4 py-2 bg-slate-800/30 text-slate-500 text-xs text-center border-t border-slate-800">
                Показано 50 из {contacts.length} — используй фильтры чтобы сузить выборку
              </div>
            )}
          </div>
        )}

        {contacts.length === 0 && !loading && (
          <div className="text-center py-16 text-slate-600">
            <div className="text-4xl mb-3">🛒</div>
            <div className="text-lg font-medium text-slate-500 mb-1">База пустая</div>
            <div className="text-sm">Запусти скрипт загрузки МСП-реестра выше</div>
          </div>
        )}

      </main>
    </div>
  );
}
