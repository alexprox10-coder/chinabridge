"use client";

import { useState } from "react";

interface TradeMapResult {
  hs_code: string;
  description: string;
  china_export_usd: number | null;
  kz_import_usd: number | null;
  ru_import_usd: number | null;
  top_exporters: string[];
  notes: string;
}

const PRESET_CATEGORIES = [
  { label: "Автозапчасти", hs: "8708", query: "auto parts" },
  { label: "Электроника", hs: "8517", query: "consumer electronics" },
  { label: "Авто-аксессуары", hs: "8714", query: "vehicle accessories" },
  { label: "Инструменты", hs: "8467", query: "power tools" },
  { label: "Одежда", hs: "6110", query: "apparel knitwear" },
  { label: "Игрушки", hs: "9503", query: "toys games" },
];

export default function TradeMapPage() {
  const [query, setQuery] = useState("");
  const [hsCode, setHsCode] = useState("");
  const [results, setResults] = useState<TradeMapResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [savedSearches, setSavedSearches] = useState<{query: string; hs: string; notes: string; ts: string}[]>([]);

  async function handleSearch() {
    if (!query && !hsCode) return;
    setLoading(true);
    setResults([]);

    // Trade Map research is manual — we generate the research URL and guidance
    // The actual data comes from trademap.org (ITC) via manual lookup
    await new Promise(r => setTimeout(r, 600));

    const mockResults: TradeMapResult[] = [
      {
        hs_code: hsCode || "8708",
        description: query || "Automotive parts & accessories",
        china_export_usd: null,
        kz_import_usd: null,
        ru_import_usd: null,
        top_exporters: ["CN", "DE", "JP", "KR", "MX"],
        notes: "Откройте trademap.org для актуальных данных по этому коду HS.",
      },
    ];
    setResults(mockResults);
    setLoading(false);
  }

  function handlePreset(preset: typeof PRESET_CATEGORIES[0]) {
    setHsCode(preset.hs);
    setQuery(preset.query);
  }

  function handleSave() {
    if (!query && !hsCode) return;
    setSavedSearches(prev => [
      { query, hs: hsCode, notes, ts: new Date().toLocaleString("ru") },
      ...prev.slice(0, 19),
    ]);
    setNotes("");
  }

  const tradeMapUrl = `https://www.trademap.org/Product_SelCountry_TS.aspx?nvpm=1%7c156%7c%7c%7c%7c${hsCode || "8708"}%7c%7c%7c4%7c1%7c1%7c2%7c2%7c1%7c2%7c1%7c1`;
  const sitcUrl = `https://comtrade.un.org/data/?reporter=156&partner=all&hs=${hsCode || "8708"}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🗺️</span>
          <h1 className="text-2xl font-bold text-white">Trade Map Research</h1>
          <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded">Ручное исследование</span>
        </div>
        <p className="text-slate-400 text-sm">
          Анализ товарных потоков Китай → KZ/RU для поиска outbound возможностей.
          Данные из ITC Trade Map (trademap.org) — открывайте ссылки для актуальных цифр.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search panel */}
        <div className="lg:col-span-2 space-y-5">
          {/* Preset categories */}
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Быстрый выбор</div>
            <div className="flex flex-wrap gap-2">
              {PRESET_CATEGORIES.map(p => (
                <button
                  key={p.hs}
                  onClick={() => handlePreset(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    hsCode === p.hs
                      ? "bg-red-600/20 border-red-500 text-red-300"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  {p.label} <span className="text-slate-500">HS {p.hs}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search inputs */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">HS Code</label>
                <input
                  type="text"
                  value={hsCode}
                  onChange={e => setHsCode(e.target.value)}
                  placeholder="8708"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Категория / товар</label>
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="auto parts, electronics..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                />
              </div>
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors"
            >
              {loading ? "Поиск..." : "Исследовать"}
            </button>
          </div>

          {/* External links */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Источники данных</div>
            <div className="space-y-2">
              <a
                href={tradeMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors group"
              >
                <div>
                  <div className="text-sm text-white font-medium">ITC Trade Map</div>
                  <div className="text-xs text-slate-400">trademap.org — Китайский экспорт HS {hsCode || "8708"}</div>
                </div>
                <span className="text-slate-500 group-hover:text-white transition-colors">→</span>
              </a>
              <a
                href={sitcUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors group"
              >
                <div>
                  <div className="text-sm text-white font-medium">UN Comtrade</div>
                  <div className="text-xs text-slate-400">comtrade.un.org — Глобальная торговля</div>
                </div>
                <span className="text-slate-500 group-hover:text-white transition-colors">→</span>
              </a>
              <a
                href={`https://1688.com/chanpin/${encodeURIComponent(query || "автозапчасти")}.html`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors group"
              >
                <div>
                  <div className="text-sm text-white font-medium">1688.com</div>
                  <div className="text-xs text-slate-400">Поиск поставщиков в Китае</div>
                </div>
                <span className="text-slate-500 group-hover:text-white transition-colors">→</span>
              </a>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Заметки по исследованию</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Объём рынка, ключевые игроки, ценовой диапазон, выводы..."
              rows={4}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none"
            />
            <button
              onClick={handleSave}
              className="mt-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Сохранить заметку
            </button>
          </div>
        </div>

        {/* Saved searches sidebar */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Сохранённые исследования</div>
            {savedSearches.length === 0 ? (
              <div className="text-slate-500 text-xs text-center py-4">
                Нет сохранённых<br />исследований
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {savedSearches.map((s, i) => (
                  <div
                    key={i}
                    onClick={() => { setQuery(s.query); setHsCode(s.hs); setNotes(s.notes); }}
                    className="cursor-pointer p-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <div className="text-xs text-white font-medium">{s.query || `HS ${s.hs}`}</div>
                    {s.hs && <div className="text-xs text-slate-400">HS {s.hs}</div>}
                    {s.notes && <div className="text-xs text-slate-500 mt-1 line-clamp-2">{s.notes}</div>}
                    <div className="text-xs text-slate-600 mt-1">{s.ts}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ICP priorities */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">ICP Приоритеты</div>
            <div className="space-y-2 text-xs">
              <div className="font-medium text-red-400">🇰🇿 KZ</div>
              <div className="text-slate-300 ml-2">• Автозапчасти (HS 8708)</div>
              <div className="text-slate-300 ml-2">• Авто-аксессуары (HS 8714)</div>
              <div className="text-slate-300 ml-2">• Электроника (HS 8517)</div>
              <div className="font-medium text-blue-400 mt-3">🇷🇺 RU</div>
              <div className="text-slate-300 ml-2">• Электроника (HS 8517)</div>
              <div className="text-slate-300 ml-2">• Маркетплейс-продавцы</div>
              <div className="text-slate-300 ml-2">• Промышленное оборудование</div>
            </div>
          </div>

          {/* Key message */}
          <div className="bg-slate-900 border border-amber-800/40 rounded-xl p-4">
            <div className="text-xs text-amber-400 uppercase tracking-wider mb-2">Ключевой оффер</div>
            <div className="text-xs text-slate-300 leading-relaxed">
              "Поставщик уже есть — менять его не нужно. Организуем консолидацию и импорт."
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
