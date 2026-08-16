"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Company {
  lead_id: string;
  company: string;
  website: string;
  category: string;
  city: string;
  country: string;
  imports: string;
  score: number;
  score_stars: string;
  why: string;
  offer: string;
  message: string;
  status: string;
  created_at: string;
  phone?: string;
  email?: string;
}

const SCORE_COLOR: Record<number, string> = {
  5: "text-red-400",
  4: "text-orange-400",
  3: "text-amber-400",
  2: "text-slate-400",
  1: "text-slate-600",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new:       { label: "Новый",    color: "bg-slate-700 text-slate-300" },
  reviewed:  { label: "Изучен",   color: "bg-blue-900/50 text-blue-300" },
  approved:  { label: "Одобрен",  color: "bg-green-900/50 text-green-300" },
  rejected:  { label: "Отклонён", color: "bg-red-900/50 text-red-300" },
  contacted: { label: "Связались",color: "bg-purple-900/50 text-purple-300" },
};

const OFFER_LABELS: Record<string, string> = {
  "Прямой импорт":   "🚢 Прямой импорт",
  "Поиск поставщика":"🔍 Поиск поставщика",
  "Юнит-экономика":  "📊 Юнит-экономика",
  "Белый импорт":    "✅ Белый импорт",
  "AI Platform":     "🤖 AI Platform",
};

type FilterKey = "all" | "hot" | "new" | "contacted";

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: "all",       label: "Все" },
  { key: "hot",       label: "🔥 Горячие (4-5★)" },
  { key: "new",       label: "Новые" },
  { key: "contacted", label: "Связались" },
];

export function SalesCompaniesClient() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selected, setSelected] = useState<Company | null>(null);
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerData, setOfferData] = useState<Record<string, unknown> | null>(null);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ai-sales-agent");
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.leads ?? []);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const filtered = companies.filter(c => {
    const matchSearch = !search || c.company.toLowerCase().includes(search.toLowerCase())
      || c.category?.toLowerCase().includes(search.toLowerCase())
      || c.city?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ? true :
      filter === "hot" ? c.score >= 4 :
      filter === "new" ? c.status === "new" :
      filter === "contacted" ? c.status === "contacted" : true;
    return matchSearch && matchFilter;
  }).sort((a, b) => b.score - a.score);

  const getOffer = async (c: Company) => {
    setSelected(c);
    setOfferData(null);
    setOfferLoading(true);
    try {
      const res = await fetch("/api/admin/sales/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: c.company,
          category: c.category,
          website: c.website,
          city: c.city,
          imports: c.imports,
          source: "import_leads",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setOfferData(data.offer);
      }
    } catch {}
    setOfferLoading(false);
  };

  const copy = (text: string) => navigator.clipboard.writeText(text).catch(() => {});

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/sales" className="text-slate-500 hover:text-white text-sm transition">← Назад</Link>
          </div>
          <h1 className="text-2xl font-bold text-white">🏢 Компании</h1>
          <p className="text-slate-500 text-sm mt-0.5">{filtered.length} из {companies.length} компаний</p>
        </div>
        <Link href="/admin/market-intelligence"
          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm px-4 py-2 rounded-lg transition">
          + Найти новые
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          placeholder="Поиск по компании, категории, городу..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-800 text-white text-sm rounded-lg px-4 py-2 placeholder-slate-500 outline-none focus:border-slate-600 transition"
        />
        <div className="flex gap-1">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                filter === opt.key
                  ? "bg-red-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Company List */}
        <div className="lg:col-span-2 space-y-2">
          {loading ? (
            <div className="text-center py-12 text-slate-500">Загрузка...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-600">Компании не найдены</div>
          ) : (
            filtered.map(c => (
              <button
                key={c.lead_id}
                onClick={() => getOffer(c)}
                className={`w-full text-left p-4 rounded-xl border transition ${
                  selected?.lead_id === c.lead_id
                    ? "bg-slate-800 border-red-700"
                    : "bg-slate-900 border-slate-800 hover:border-slate-600"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium text-sm">{c.company}</span>
                      <span className={`text-sm font-bold ${SCORE_COLOR[c.score] ?? "text-slate-500"}`}>
                        {c.score_stars || "★".repeat(c.score)}
                      </span>
                      {c.status && STATUS_LABELS[c.status] && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_LABELS[c.status].color}`}>
                          {STATUS_LABELS[c.status].label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {c.category && <span className="text-slate-500 text-xs">{c.category}</span>}
                      {c.city && <span className="text-slate-600 text-xs">· {c.city}</span>}
                      {c.imports === "yes" && <span className="text-blue-500 text-xs">· 🌐 импорт</span>}
                    </div>
                    {c.offer && (
                      <p className="text-slate-400 text-xs mt-1 truncate">
                        {OFFER_LABELS[c.offer] ?? c.offer}
                      </p>
                    )}
                  </div>
                  <span className="text-slate-600 text-xs flex-shrink-0">→</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Company Card */}
        <div className="lg:sticky lg:top-4">
          {!selected ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">🏢</div>
              <p className="text-slate-500 text-sm">Выбери компанию для анализа</p>
              <p className="text-slate-700 text-xs mt-1">AI определит оффер и напишет первое сообщение</p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              {/* Company Header */}
              <div>
                <h3 className="text-white font-semibold">{selected.company}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {selected.category && <span className="text-slate-400 text-xs">{selected.category}</span>}
                  {selected.city && <span className="text-slate-500 text-xs">· {selected.city}</span>}
                </div>
                {selected.website && (
                  <a href={selected.website.startsWith("http") ? selected.website : `https://${selected.website}`}
                    target="_blank" rel="noreferrer"
                    className="text-red-400 hover:text-red-300 text-xs mt-1 block truncate transition">
                    {selected.website}
                  </a>
                )}
              </div>

              {/* Score */}
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs">Score</span>
                <span className={`font-bold ${SCORE_COLOR[selected.score] ?? "text-slate-500"}`}>
                  {selected.score_stars || "★".repeat(selected.score)} / 5
                </span>
              </div>

              {/* Why */}
              {selected.why && (
                <div>
                  <p className="text-slate-500 text-xs mb-1">Почему интересен:</p>
                  <p className="text-slate-300 text-xs leading-relaxed">{selected.why}</p>
                </div>
              )}

              {/* Contact */}
              {(selected.phone || selected.email) && (
                <div className="space-y-1">
                  {selected.phone && <p className="text-xs text-slate-400">📞 {selected.phone}</p>}
                  {selected.email && <p className="text-xs text-slate-400">✉️ {selected.email}</p>}
                </div>
              )}

              <hr className="border-slate-800" />

              {/* AI Offer */}
              {offerLoading ? (
                <div className="text-center py-4">
                  <div className="flex gap-1 justify-center">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <p className="text-slate-500 text-xs mt-2">AI подбирает оффер...</p>
                </div>
              ) : offerData ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-slate-500 text-xs mb-1">Рекомендованный оффер:</p>
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium text-sm">
                        {String(offerData.product_label ?? "")}
                      </span>
                      <span className={`text-xs font-bold ${
                        Number(offerData.confidence) >= 80 ? "text-green-400" :
                        Number(offerData.confidence) >= 60 ? "text-amber-400" : "text-slate-500"
                      }`}>
                        {String(offerData.confidence ?? 0)}% уверен
                      </span>
                    </div>
                  </div>

                  {offerData.pain && (
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Боль клиента:</p>
                      <p className="text-slate-300 text-xs">{String(offerData.pain)}</p>
                    </div>
                  )}

                  {offerData.value_prop && (
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Ценность:</p>
                      <p className="text-slate-300 text-xs">{String(offerData.value_prop)}</p>
                    </div>
                  )}

                  {offerData.first_message && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-slate-500 text-xs">Первое сообщение:</p>
                        <button
                          onClick={() => copy(String(offerData.first_message))}
                          className="text-xs text-slate-500 hover:text-white transition"
                        >
                          копировать
                        </button>
                      </div>
                      <div className="bg-slate-800 rounded-lg p-3">
                        <p className="text-slate-200 text-xs leading-relaxed">{String(offerData.first_message)}</p>
                      </div>
                    </div>
                  )}

                  <Link
                    href={`/admin/sales/chat?company=${encodeURIComponent(selected.company)}&category=${encodeURIComponent(selected.category ?? "")}`}
                    className="block text-center bg-red-600 hover:bg-red-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                  >
                    🤖 Открыть в AI Chat
                  </Link>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-slate-600 text-xs">Нажми на компанию для AI-анализа</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
