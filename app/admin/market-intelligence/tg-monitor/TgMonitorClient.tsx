"use client";

import { useState } from "react";

const TARGETS = [
  "marketp_wildberries", "mpgo_logistics", "kargo0717", "alibiz5_cargo",
  "cargovik", "dobropost_chat", "sellerswb", "wb_ozon_mp",
  "china_tovar", "logistic_china", "marketplace_chat_ru", "ozon_sellers_chat",
];

interface LogItem {
  channel: string;
  intent:  "HOT" | "WARM" | "COLD";
  preview: string;
}

interface RunResult {
  ok:         boolean;
  checked:    number;
  period:     string;
  candidates: number;
  hot:        number;
  warm:       number;
  log:        LogItem[];
}

const INTENT_COLOR: Record<string, string> = {
  HOT:  "bg-red-500/20 text-red-400 border-red-500/30",
  WARM: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  COLD: "bg-slate-700/40 text-slate-500 border-slate-700",
};

const INTENT_EMOJI: Record<string, string> = { HOT: "🔥", WARM: "♨️", COLD: "🧊" };

export default function TgMonitorClient() {
  const [days,    setDays]    = useState(1);
  const [useAI,   setUseAI]   = useState(true);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<RunResult | null>(null);
  const [error,   setError]   = useState("");
  const [lastRun, setLastRun] = useState<string | null>(null);

  async function runScraper() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const params = new URLSearchParams({
        secret: "chinabridge2026",
        days:   String(days),
        ai:     useAI ? "true" : "false",
      });
      const res = await fetch(`/api/tg-scraper?${params}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Ошибка");
      setResult(data);
      setLastRun(new Date().toLocaleTimeString("ru-RU"));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">

      {/* Control panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-wrap items-center gap-4">

          {/* Days selector */}
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

          {/* AI toggle */}
          <button onClick={() => setUseAI(v => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition ${
              useAI
                ? "bg-purple-600/20 border-purple-500/50 text-purple-300"
                : "border-slate-700 text-slate-500"
            }`}>
            <span>{useAI ? "✦" : "○"}</span>
            Claude AI классификация
          </button>

          {/* Run button */}
          <button onClick={runScraper} disabled={loading}
            className={`ml-auto px-6 py-2.5 rounded-xl font-semibold text-sm transition flex items-center gap-2 ${
              loading
                ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            }`}>
            {loading
              ? <><span className="animate-spin">⟳</span> Сканирую {TARGETS.length} каналов...</>
              : <><span>▶</span> Запустить скан</>
            }
          </button>
        </div>

        {lastRun && !loading && (
          <p className="text-slate-600 text-xs mt-3">Последний запуск: {lastRun}</p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Каналов проверено", value: result.checked, color: "text-white" },
              { label: "Кандидатов",        value: result.candidates, color: "text-blue-400" },
              { label: "HOT лидов",         value: result.hot,  color: "text-red-400" },
              { label: "WARM лидов",        value: result.warm, color: "text-amber-400" },
            ].map(s => (
              <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-slate-500 text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Notify banner */}
          {(result.hot + result.warm) > 0 ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-400 text-sm flex items-center gap-2">
              <span>✓</span>
              {result.hot + result.warm} лидов отправлено в @Monitor24_TG_bot
            </div>
          ) : result.candidates === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-slate-500 text-sm">
              За выбранный период в каналах не найдено сообщений с ключевыми словами. Попробуй увеличить период.
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-slate-500 text-sm">
              Кандидаты найдены, но AI классифицировал их как COLD (нет явного намерения купить).
            </div>
          )}

          {/* Log table */}
          {result.log.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800">
                <h3 className="text-white font-semibold text-sm">Все кандидаты ({result.log.length})</h3>
              </div>
              <div className="divide-y divide-slate-800/50">
                {result.log.map((item, i) => (
                  <div key={i} className="px-6 py-4 flex items-start gap-4">
                    <span className={`shrink-0 mt-0.5 px-2 py-0.5 rounded-md text-xs font-bold border ${INTENT_COLOR[item.intent]}`}>
                      {INTENT_EMOJI[item.intent]} {item.intent}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-400 text-xs mb-1">@{item.channel}</p>
                      <p className="text-slate-300 text-sm leading-relaxed">{item.preview}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Channels list */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-white font-semibold text-sm mb-4">Мониторируемые каналы ({TARGETS.length})</h3>
        <div className="flex flex-wrap gap-2">
          {TARGETS.map(t => (
            <a key={t} href={`https://t.me/${t}`} target="_blank" rel="noopener"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-400 hover:text-white transition">
              @{t}
            </a>
          ))}
        </div>
      </div>

    </div>
  );
}
