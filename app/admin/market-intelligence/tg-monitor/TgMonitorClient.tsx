"use client";

import { useState } from "react";

const TG_TARGETS = [
  "mpgo_ru", "marketplace_russia", "cargo_china_official", "ozon_seller",
  "cargo_poizon", "china_seller", "chinadelivery", "poizon_shop_ru",
  "kargo_rf", "wildberries_sellers", "ozon_wb_biznes", "poizon_cargo",
];

const VK_TARGETS = [
  "wildberries_sellers", "marketplacewb", "wb_ozon_sellers", "chinaoptom",
  "china_buy", "poizon_buyers_ru", "import_china_ru", "wb_sellers_community",
  "ozon_marketplace_club", "marketplace_sellers",
];

interface LogItem {
  channel?: string;
  group?:   string;
  keyword?: string;
  intent:   "HOT" | "COLD";
  preview:  string;
  link?:    string;
}

interface RunResult {
  ok:         boolean;
  checked:    number;
  period:     string;
  candidates: number;
  hot:        number;
  log:        LogItem[];
  groupErrors?: string[];
  error?:     string;
}

type Tab = "tg" | "vk";

export default function TgMonitorClient() {
  const [tab,     setTab]     = useState<Tab>("tg");
  const [days,    setDays]    = useState(7);
  const [useAI,   setUseAI]   = useState(true);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<RunResult | null>(null);
  const [error,   setError]   = useState("");
  const [lastRun, setLastRun] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const endpoint = tab === "tg" ? "/api/tg-scraper" : "/api/vk-scraper";
      const params = new URLSearchParams({ secret: "chinabridge2026", days: String(days), ai: useAI ? "true" : "false" });
      const res  = await fetch(`${endpoint}?${params}`);
      const data = await res.json() as RunResult;
      if (!data.ok) throw new Error(data.error ?? "Ошибка");
      setResult(data);
      setLastRun(new Date().toLocaleTimeString("ru-RU"));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  }

  const targets = tab === "tg" ? TG_TARGETS : VK_TARGETS;
  const targetLabel = tab === "tg" ? "каналов" : "групп";

  return (
    <div className="space-y-6">

      {/* Source tabs */}
      <div className="flex gap-2">
        {([["tg", "📡 Telegram"], ["vk", "💙 ВКонтакте"]] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => { setTab(t); setResult(null); setError(""); }}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition border ${
              tab === t
                ? "bg-blue-600 border-blue-600 text-white"
                : "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Control panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-wrap items-center gap-4">

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">Период:</span>
            {[1, 3, 7].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border ${
                  days === d
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-slate-700 text-slate-400 hover:border-slate-600"
                }`}>
                {d === 1 ? "Сегодня" : `${d} дня`}
              </button>
            ))}
          </div>

          <button onClick={() => setUseAI(v => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition ${
              useAI
                ? "bg-purple-600/20 border-purple-500/50 text-purple-300"
                : "border-slate-700 text-slate-500"
            }`}>
            <span>{useAI ? "✦" : "○"}</span>
            Claude AI классификация
          </button>

          <button onClick={run} disabled={loading}
            className={`ml-auto px-6 py-2.5 rounded-xl font-semibold text-sm transition flex items-center gap-2 ${
              loading
                ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            }`}>
            {loading
              ? <><span className="animate-spin inline-block">⟳</span> Сканирую {targets.length} {targetLabel}...</>
              : <><span>▶</span> Запустить скан</>
            }
          </button>
        </div>

        {lastRun && !loading && (
          <p className="text-slate-600 text-xs mt-3">Последний запуск: {lastRun}</p>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: `${targetLabel.charAt(0).toUpperCase() + targetLabel.slice(1)} проверено`, value: result.checked, color: "text-white" },
              { label: "Прошли фильтр",  value: result.candidates, color: "text-blue-400" },
              { label: "🔥 HOT лидов",   value: result.hot,        color: "text-red-400" },
            ].map(s => (
              <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-slate-500 text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {result.hot > 0 ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-400 text-sm flex items-center gap-2">
              <span>✓</span> {result.hot} горячих лидов отправлено в @Monitor24_TG_bot
            </div>
          ) : result.candidates === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-slate-500 text-sm">
              За выбранный период не найдено постов с ключевыми словами. Попробуй увеличить период.
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-slate-500 text-sm">
              Кандидаты найдены, но AI классифицировал их как COLD.
            </div>
          )}

          {result.groupErrors && result.groupErrors.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-amber-400 text-xs">
              Не найдены группы: {result.groupErrors.join(", ")}
            </div>
          )}

          {result.log.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800">
                <h3 className="text-white font-semibold text-sm">Все кандидаты ({result.log.length})</h3>
              </div>
              <div className="divide-y divide-slate-800/50">
                {result.log.map((item, i) => (
                  <div key={i} className="px-6 py-4 flex items-start gap-4">
                    <span className={`shrink-0 mt-0.5 px-2 py-0.5 rounded-md text-xs font-bold border ${
                      item.intent === "HOT"
                        ? "bg-red-500/20 text-red-400 border-red-500/30"
                        : "bg-slate-700/40 text-slate-500 border-slate-700"
                    }`}>
                      {item.intent === "HOT" ? "🔥" : "🧊"} {item.intent}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-400 text-xs mb-1">
                        {item.channel ? `@${item.channel}` : item.group}
                        {item.keyword && <span className="ml-2 text-slate-600">· «{item.keyword}»</span>}
                      </p>
                      <p className="text-slate-300 text-sm leading-relaxed">{item.preview}</p>
                      {item.link && (
                        <a href={item.link} target="_blank" rel="noopener"
                          className="text-blue-500 hover:text-blue-400 text-xs mt-1 inline-block">
                          Открыть →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Targets list */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-white font-semibold text-sm mb-4">
          {tab === "tg" ? "Telegram каналы" : "VK группы"} ({targets.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {targets.map(t => (
            <a key={t}
              href={tab === "tg" ? `https://t.me/${t}` : `https://vk.com/${t}`}
              target="_blank" rel="noopener"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-400 hover:text-white transition">
              {tab === "tg" ? `@${t}` : t}
            </a>
          ))}
        </div>
      </div>

    </div>
  );
}
