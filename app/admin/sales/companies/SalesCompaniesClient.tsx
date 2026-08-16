"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface OfferResult {
  product: string;
  product_label: string;
  confidence: number;
  why: string;
  pain: string;
  value_prop: string;
  first_message: string;
  score: number;
  potential: string;
}

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
  ai_offer?: OfferResult | null;
  offer_loading?: boolean;
}

const SCORE_COLOR: Record<number, string> = {
  5: "text-red-400", 4: "text-orange-400", 3: "text-amber-400", 2: "text-slate-400", 1: "text-slate-600",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new:       { label: "Новый",    color: "bg-slate-700 text-slate-300" },
  reviewed:  { label: "Изучен",   color: "bg-blue-900/50 text-blue-300" },
  approved:  { label: "Одобрен",  color: "bg-green-900/50 text-green-300" },
  rejected:  { label: "Отклонён", color: "bg-red-900/50 text-red-300" },
  contacted: { label: "Связались",color: "bg-purple-900/50 text-purple-300" },
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
  const [filter, setFilter] = useState<FilterKey>("hot");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ai-sales-agent");
      if (res.ok) {
        const data = await res.json();
        const leads: Company[] = (data.leads ?? []).map((l: Company) => ({ ...l, ai_offer: undefined, offer_loading: false }));
        setCompanies(leads);

        // Auto-load offers for hot companies
        const hot = leads.filter(l => l.score >= 4 && l.status === "new").slice(0, 8);
        loadOffersForCompanies(hot, leads);
      }
    } catch {}
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadOffersForCompanies = async (targets: Company[], all: Company[]) => {
    // Mark as loading
    setCompanies(prev => prev.map(c =>
      targets.find(t => t.lead_id === c.lead_id) ? { ...c, offer_loading: true } : c
    ));

    // Load in batches of 3 to avoid rate limits
    for (let i = 0; i < targets.length; i += 3) {
      const batch = targets.slice(i, i + 3);
      await Promise.all(batch.map(async (lead) => {
        try {
          const res = await fetch("/api/admin/sales/offer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              company: lead.company,
              category: lead.category,
              website: lead.website,
              city: lead.city,
              imports: lead.imports,
              source: "import_leads",
            }),
          });
          if (res.ok) {
            const data = await res.json();
            setCompanies(prev => prev.map(c =>
              c.lead_id === lead.lead_id ? { ...c, ai_offer: data.offer, offer_loading: false } : c
            ));
          } else {
            setCompanies(prev => prev.map(c =>
              c.lead_id === lead.lead_id ? { ...c, ai_offer: null, offer_loading: false } : c
            ));
          }
        } catch {
          setCompanies(prev => prev.map(c =>
            c.lead_id === lead.lead_id ? { ...c, ai_offer: null, offer_loading: false } : c
          ));
        }
      }));
    }
  };

  const loadOfferForOne = async (lead: Company) => {
    if (lead.ai_offer !== undefined || lead.offer_loading) return;
    setCompanies(prev => prev.map(c => c.lead_id === lead.lead_id ? { ...c, offer_loading: true } : c));
    try {
      const res = await fetch("/api/admin/sales/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: lead.company, category: lead.category, website: lead.website, city: lead.city, imports: lead.imports }),
      });
      const data = res.ok ? await res.json() : {};
      setCompanies(prev => prev.map(c =>
        c.lead_id === lead.lead_id ? { ...c, ai_offer: data.offer ?? null, offer_loading: false } : c
      ));
    } catch {
      setCompanies(prev => prev.map(c => c.lead_id === lead.lead_id ? { ...c, ai_offer: null, offer_loading: false } : c));
    }
  };

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const filtered = companies.filter(c => {
    const matchSearch = !search
      || c.company.toLowerCase().includes(search.toLowerCase())
      || (c.category ?? "").toLowerCase().includes(search.toLowerCase())
      || (c.city ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ? true :
      filter === "hot" ? c.score >= 4 :
      filter === "new" ? c.status === "new" :
      filter === "contacted" ? c.status === "contacted" : true;
    return matchSearch && matchFilter;
  }).sort((a, b) => b.score - a.score);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggle = (c: Company) => {
    const id = c.lead_id;
    if (expanded !== id) {
      setExpanded(id);
      loadOfferForOne(c);
    } else {
      setExpanded(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/sales" className="text-slate-500 hover:text-white text-sm transition">← Назад</Link>
          </div>
          <h1 className="text-2xl font-bold text-white">🏢 Компании</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {filtered.length} из {companies.length} · офферы подгружаются автоматически для горячих
          </p>
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
        <div className="flex gap-1 flex-wrap">
          {FILTER_OPTIONS.map(opt => (
            <button key={opt.key} onClick={() => setFilter(opt.key)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                filter === opt.key ? "bg-red-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Company list */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Загрузка...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-600">Компании не найдены</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <div key={c.lead_id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              {/* Row */}
              <button
                onClick={() => toggle(c)}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-800/40 transition"
              >
                <span className={`text-base font-bold flex-shrink-0 ${SCORE_COLOR[c.score] ?? "text-slate-500"}`}>
                  {c.score_stars || "★".repeat(c.score)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-medium text-sm">{c.company}</span>
                    {STATUS_LABELS[c.status] && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_LABELS[c.status].color}`}>
                        {STATUS_LABELS[c.status].label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {c.category && <span className="text-slate-500 text-xs">{c.category}</span>}
                    {c.city && <span className="text-slate-600 text-xs">· {c.city}</span>}
                    {c.imports === "yes" && <span className="text-blue-500 text-xs">· импорт</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {c.offer_loading && (
                    <span className="w-3 h-3 border-2 border-slate-600 border-t-red-400 rounded-full animate-spin" />
                  )}
                  {c.ai_offer && !c.offer_loading && (
                    <span className="text-xs text-slate-400 hidden sm:block">{c.ai_offer.product_label}</span>
                  )}
                  <span className="text-slate-500 text-xs">{expanded === c.lead_id ? "▲" : "▼"}</span>
                </div>
              </button>

              {/* Expanded */}
              {expanded === c.lead_id && (
                <div className="border-t border-slate-800 px-4 py-4">
                  {c.offer_loading ? (
                    <div className="text-center py-4">
                      <div className="flex gap-1 justify-center mb-2">
                        {[0,150,300].map(d => (
                          <span key={d} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                      <p className="text-slate-500 text-xs">AI подбирает оффер...</p>
                    </div>
                  ) : c.ai_offer ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <p className="text-slate-500 text-xs mb-1">Оффер</p>
                          <p className="text-white text-sm font-medium">{c.ai_offer.product_label}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs mb-1">Уверенность</p>
                          <p className={`text-sm font-bold ${c.ai_offer.confidence >= 75 ? "text-green-400" : "text-amber-400"}`}>
                            {c.ai_offer.confidence}%
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs mb-1">Потенциал</p>
                          <p className="text-slate-300 text-sm">{c.ai_offer.potential}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs mb-1">Контакты</p>
                          <div className="space-y-0.5">
                            {c.phone && <a href={`tel:${c.phone}`} className="block text-blue-400 text-xs hover:text-blue-300">📞 {c.phone}</a>}
                            {c.email && <a href={`mailto:${c.email}`} className="block text-blue-400 text-xs hover:text-blue-300">✉ {c.email}</a>}
                            {!c.phone && !c.email && <span className="text-slate-600 text-xs">—</span>}
                          </div>
                        </div>
                      </div>

                      {c.ai_offer.pain && (
                        <div>
                          <p className="text-slate-500 text-xs mb-1">Боль → Ценность</p>
                          <p className="text-slate-300 text-xs">{c.ai_offer.pain}</p>
                          {c.ai_offer.value_prop && <p className="text-slate-400 text-xs mt-0.5">→ {c.ai_offer.value_prop}</p>}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-slate-500 text-xs">✉️ Первое сообщение</p>
                          <button
                            onClick={() => copy(c.ai_offer!.first_message, c.lead_id)}
                            className={`text-xs px-2 py-1 rounded transition font-medium ${
                              copied === c.lead_id ? "bg-green-700 text-green-200" : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                            }`}
                          >
                            {copied === c.lead_id ? "✓ Скопировано!" : "📋 Копировать"}
                          </button>
                        </div>
                        <div className="bg-slate-800 rounded-lg p-3">
                          <p className="text-slate-200 text-sm leading-relaxed">{c.ai_offer.first_message}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-1">
                        {c.website && (
                          <a href={c.website.startsWith("http") ? c.website : `https://${c.website}`}
                            target="_blank" rel="noreferrer"
                            className="text-xs text-slate-500 hover:text-slate-300">🌐 сайт</a>
                        )}
                        <Link
                          href={`/admin/sales/chat?company=${encodeURIComponent(c.company)}`}
                          className="ml-auto text-xs bg-red-600/30 hover:bg-red-600/50 text-red-300 px-3 py-1.5 rounded transition"
                        >
                          🤖 Спросить AI →
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs text-center py-3">Не удалось определить оффер</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
