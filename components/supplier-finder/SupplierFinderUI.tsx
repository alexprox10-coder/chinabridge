"use client";
import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

interface ScoreBreakdown {
  reliability?: number;
  price?: number;
  quality?: number;
  communication?: number;
}

interface Supplier {
  type: string;
  region: string;
  platform: string;
  price_level: string;
  price_min_cny: number;
  price_max_cny: number;
  moq_min: number;
  moq_max: number;
  quality_level: string;
  reliability_score: number;
  score_breakdown?: ScoreBreakdown;
  pros?: string[];
  cons?: string[];
  verification_tips?: string;
}

interface SearchResult {
  market_overview: string;
  suppliers: Supplier[];
  rate_limit_remaining?: number;
}

const EXAMPLES = [
  "велосипеды детские 16 дюймов",
  "светодиодные прожекторы",
  "спортивный текстиль",
  "пластиковая упаковка",
  "электроника для маркетплейса",
];

const QUALITY_LABELS: Record<string, string> = {
  basic: "Эконом",
  standard: "Стандарт",
  premium: "Премиум",
};

const PRICE_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: "Низкая цена", color: "text-emerald-400" },
  medium: { label: "Средняя цена", color: "text-amber-400" },
  high: { label: "Высокая цена", color: "text-red-400" },
};

const PLATFORM_COLORS: Record<string, string> = {
  "1688": "text-orange-400 border-orange-700/30 bg-orange-900/20",
  "Alibaba": "text-yellow-400 border-yellow-700/30 bg-yellow-900/20",
  "Taobao": "text-pink-400 border-pink-700/30 bg-pink-900/20",
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? "bg-emerald-500" : value >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-[#8899aa] w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-[#243a5e] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-white w-6 text-right">{value}</span>
    </div>
  );
}

export function SupplierFinderUI() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const doSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/supplier-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });
      const data = await res.json();
      if (!data.ok) setError(data.error ?? "Ошибка поиска");
      else setResult(data);
    } catch {
      setError("Ошибка соединения. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Search box */}
      <div className="card-glass rounded-2xl p-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8899aa]" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doSearch(query)}
              placeholder="Название товара или описание..."
              className="w-full pl-10 pr-4 py-3 bg-[#0B1F3A] border border-[#243a5e] rounded-xl text-sm text-white placeholder:text-[#8899aa] outline-none focus:border-[#00A86B]/60 transition-colors"
            />
          </div>
          <button
            onClick={() => doSearch(query)}
            disabled={loading || !query.trim()}
            className="px-5 py-3 bg-[#00A86B] hover:bg-[#008f59] disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all whitespace-nowrap"
          >
            {loading ? "Анализ…" : "🏭 Найти"}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-[#8899aa] text-xs">Примеры:</span>
          {EXAMPLES.map(ex => (
            <button
              key={ex}
              onClick={() => { setQuery(ex); doSearch(ex); }}
              className="text-xs px-3 py-1 bg-white/5 hover:bg-[#00A86B]/10 border border-white/10 hover:border-[#00A86B]/30 text-[#8899aa] hover:text-[#00A86B] rounded-full transition-all"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card-glass rounded-2xl p-10 text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-[#00A86B]/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#00A86B] animate-spin" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-b-[#00A86B]/40 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
            <div className="absolute inset-3 flex items-center justify-center text-xl">🏭</div>
          </div>
          <p className="text-white font-semibold">AI анализирует рынок поставщиков…</p>
          <p className="text-[#8899aa] text-xs mt-1">Оцениваем типы поставщиков и рыночные паттерны</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="card-glass rounded-2xl p-5 border border-red-900/30 bg-red-900/10 text-center">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-white font-semibold">
                {result.suppliers.length} типов поставщиков
              </h2>
              {result.market_overview && (
                <p className="text-[#8899aa] text-xs mt-0.5">{result.market_overview}</p>
              )}
            </div>
            <span className="text-[10px] px-2.5 py-1 bg-amber-900/20 border border-amber-700/30 text-amber-400 rounded-full">
              🤖 AI-оценка
            </span>
          </div>

          <div className="space-y-4">
            {result.suppliers.map((s, i) => {
              const scoreColor = s.reliability_score >= 80 ? "text-emerald-400" : s.reliability_score >= 60 ? "text-amber-400" : "text-red-400";
              const scoreBg = s.reliability_score >= 80 ? "bg-emerald-500" : s.reliability_score >= 60 ? "bg-amber-500" : "bg-red-500";
              const priceInfo = PRICE_LABELS[s.price_level] ?? PRICE_LABELS.medium;
              const platformClass = PLATFORM_COLORS[s.platform] ?? "text-slate-400 border-slate-700/30 bg-slate-900/20";

              return (
                <div key={i} className="card-glass rounded-2xl p-5 space-y-4">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm">{s.type}</h3>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        <span className="text-xs text-[#8899aa]">📍 {s.region}</span>
                        <span className={`text-[10px] px-2 py-0.5 border rounded-full ${platformClass}`}>
                          {s.platform}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/10 text-[#8899aa] rounded-full">
                          {QUALITY_LABELS[s.quality_level] ?? s.quality_level}
                        </span>
                      </div>
                    </div>

                    {/* Score circle */}
                    <div className="text-center shrink-0">
                      <div className={`text-2xl font-bold ${scoreColor}`}>{s.reliability_score}</div>
                      <div className="text-[10px] text-[#8899aa]">Supplier Score</div>
                      <div className="w-10 h-1 rounded-full bg-[#243a5e] mx-auto mt-1 overflow-hidden">
                        <div className={`h-full rounded-full ${scoreBg}`} style={{ width: `${s.reliability_score}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Price + MOQ */}
                  <div className="grid grid-cols-3 gap-2 bg-[#0B1F3A] rounded-xl p-3 text-center">
                    <div>
                      <p className="text-[10px] text-[#8899aa] mb-0.5">Цена</p>
                      <p className="text-white text-xs font-medium">¥{s.price_min_cny}–{s.price_max_cny}</p>
                      <p className={`text-[10px] ${priceInfo.color}`}>{priceInfo.label}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#8899aa] mb-0.5">МОQ</p>
                      <p className="text-white text-xs font-medium">{s.moq_min}–{s.moq_max} шт</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#8899aa] mb-0.5">Качество</p>
                      <p className="text-white text-xs font-medium">{QUALITY_LABELS[s.quality_level] ?? s.quality_level}</p>
                    </div>
                  </div>

                  {/* Score breakdown */}
                  {s.score_breakdown && (
                    <div className="space-y-1.5">
                      {s.score_breakdown.reliability !== undefined && (
                        <ScoreBar label="Надёжность" value={s.score_breakdown.reliability} />
                      )}
                      {s.score_breakdown.quality !== undefined && (
                        <ScoreBar label="Качество" value={s.score_breakdown.quality} />
                      )}
                      {s.score_breakdown.price !== undefined && (
                        <ScoreBar label="Ценовой уровень" value={s.score_breakdown.price} />
                      )}
                      {s.score_breakdown.communication !== undefined && (
                        <ScoreBar label="Коммуникация" value={s.score_breakdown.communication} />
                      )}
                    </div>
                  )}

                  {/* Pros / Cons */}
                  {(s.pros?.length || s.cons?.length) && (
                    <div className="grid grid-cols-2 gap-3">
                      {s.pros && s.pros.length > 0 && (
                        <div>
                          <p className="text-[10px] text-emerald-400 font-medium mb-1">✓ Плюсы</p>
                          <ul className="space-y-0.5">
                            {s.pros.map((pro, j) => (
                              <li key={j} className="text-[11px] text-[#8899aa] leading-relaxed">• {pro}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {s.cons && s.cons.length > 0 && (
                        <div>
                          <p className="text-[10px] text-red-400 font-medium mb-1">✗ Минусы</p>
                          <ul className="space-y-0.5">
                            {s.cons.map((con, j) => (
                              <li key={j} className="text-[11px] text-[#8899aa] leading-relaxed">• {con}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Verification tips */}
                  {s.verification_tips && (
                    <div className="bg-[#00A86B]/5 border border-[#00A86B]/20 rounded-xl p-3">
                      <p className="text-[10px] text-[#00A86B] font-medium mb-1">💡 На что обратить внимание</p>
                      <p className="text-[11px] text-[#8899aa] leading-relaxed">{s.verification_tips}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <p className="text-[#8899aa] text-[11px] text-center">
            * Supplier Score — AI-оценка на основе типичных паттернов рынка, не является рейтингом конкретных компаний.
          </p>
          {typeof result.rate_limit_remaining === "number" && (
            <p className="text-[#8899aa] text-[11px] text-center">
              Осталось поисков сегодня: {result.rate_limit_remaining} ·{" "}
              <Link href="/signup" className="text-[#00A86B] hover:underline">
                Зарегистрироваться
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
