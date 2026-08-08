"use client";
import { useState } from "react";
import Link from "next/link";
import { Search, ExternalLink, Calculator } from "lucide-react";

interface Product {
  name: string;
  name_en: string;
  price_min_cny: number;
  price_max_cny: number;
  moq: number;
  weight_per_unit_kg?: number;
  platforms?: string[];
  search_1688?: string;
  search_alibaba?: string;
  notes?: string;
}

interface SearchResult {
  category: string;
  import_notes: string;
  products: Product[];
  rate_limit_remaining?: number;
}

const EXAMPLES = [
  "детские велосипеды 16 дюймов",
  "LED светильники для склада",
  "спортивная одежда оптом",
  "запчасти для экскаватора",
  "товары для Wildberries недорого",
];

const CNY_RATE = 12.5;

function fmt(n: number) {
  return Math.round(n).toLocaleString("ru-RU");
}

export function ProductFinderUI() {
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
      const res = await fetch("/api/product-finder", {
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
              placeholder="Опишите товар для импорта из Китая..."
              className="w-full pl-10 pr-4 py-3 bg-[#0B1F3A] border border-[#243a5e] rounded-xl text-sm text-white placeholder:text-[#8899aa] outline-none focus:border-[#00A86B]/60 transition-colors"
            />
          </div>
          <button
            onClick={() => doSearch(query)}
            disabled={loading || !query.trim()}
            className="px-5 py-3 bg-[#00A86B] hover:bg-[#008f59] disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all whitespace-nowrap"
          >
            {loading ? "Ищу…" : "🔍 Найти"}
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
            <div className="absolute inset-3 flex items-center justify-center text-xl">🔍</div>
          </div>
          <p className="text-white font-semibold">AI ищет товары на рынке Китая…</p>
          <p className="text-[#8899aa] text-xs mt-1">Анализируем 1688, Alibaba, Taobao</p>
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
                {result.products.length} вариантов · {result.category}
              </h2>
              {result.import_notes && (
                <p className="text-[#8899aa] text-xs mt-0.5">{result.import_notes}</p>
              )}
            </div>
            <span className="text-[10px] px-2.5 py-1 bg-amber-900/20 border border-amber-700/30 text-amber-400 rounded-full">
              🤖 AI-рекомендации
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.products.map((p, i) => (
              <div key={i} className="card-glass rounded-2xl p-5 space-y-3 flex flex-col">
                {/* Header */}
                <div>
                  <h3 className="text-white font-semibold text-sm leading-tight">{p.name}</h3>
                  {p.name_en && <p className="text-[#8899aa] text-xs mt-0.5">{p.name_en}</p>}
                </div>

                {/* Price block */}
                <div className="bg-[#0B1F3A] rounded-xl p-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8899aa]">Цена закупки</span>
                    <span className="text-white font-semibold">
                      ¥{p.price_min_cny}–{p.price_max_cny}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8899aa]">≈ в рублях</span>
                    <span className="text-[#00A86B] font-medium">
                      {fmt(p.price_min_cny * CNY_RATE)}–{fmt(p.price_max_cny * CNY_RATE)} ₽
                    </span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-white/5 pt-1.5">
                    <span className="text-[#8899aa]">Мин. заказ (MOQ)</span>
                    <span className="text-white">{p.moq.toLocaleString("ru-RU")} шт</span>
                  </div>
                  {p.weight_per_unit_kg && p.weight_per_unit_kg > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-[#8899aa]">Вес единицы</span>
                      <span className="text-white">{p.weight_per_unit_kg} кг</span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {p.notes && (
                  <p className="text-[#8899aa] text-xs leading-relaxed">{p.notes}</p>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-auto pt-1">
                  {p.search_1688 && (
                    <a
                      href={`https://s.1688.com/selloffer/offerlist.htm?keywords=${encodeURIComponent(p.search_1688)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-900/20 border border-orange-700/30 text-orange-400 text-xs rounded-lg hover:bg-orange-900/30 transition-colors"
                    >
                      1688 <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {p.search_alibaba && (
                    <a
                      href={`https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(p.search_alibaba)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-yellow-900/20 border border-yellow-700/30 text-yellow-400 text-xs rounded-lg hover:bg-yellow-900/30 transition-colors"
                    >
                      Alibaba <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <Link
                    href="/delivery-calculator"
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-[#00A86B]/10 border border-[#00A86B]/30 text-[#00A86B] text-xs rounded-lg hover:bg-[#00A86B]/20 transition-colors ml-auto"
                  >
                    <Calculator className="w-3 h-3" /> Доставка
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <p className="text-[#8899aa] text-[11px] text-center">
            * Цены — рыночные оценки на основе AI-анализа. Проверяйте актуальные цены напрямую у поставщиков.
          </p>
          {typeof result.rate_limit_remaining === "number" && (
            <p className="text-[#8899aa] text-[11px] text-center">
              Осталось поисков сегодня: {result.rate_limit_remaining} ·{" "}
              <Link href="/signup" className="text-[#00A86B] hover:underline">
                Зарегистрируйтесь для неограниченного доступа
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
