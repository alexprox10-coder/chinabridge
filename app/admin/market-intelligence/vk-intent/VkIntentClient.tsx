"use client";

import { useState, useEffect, useCallback } from "react";

type Tier = "HOT" | "WARM" | "COLD";

interface VkLead {
  id: number;
  post_id: string;
  query: string;
  text: string;
  author_name: string;
  author_link: string;
  posted_at: string;
  tier: Tier;
  score: number;
  intent: string;
  product: string;
  location: string;
  contact: string;
  urgency: string;
  confidence: number;
  created_at: string;
}

interface Stats {
  total: string | number;
  hot: string | number;
  warm: string | number;
  avg_score: string | number;
  last_run: string | null;
}

const TIER_STYLE: Record<Tier, string> = {
  HOT:  "bg-red-900/50 text-red-300 border border-red-700",
  WARM: "bg-amber-900/50 text-amber-300 border border-amber-700",
  COLD: "bg-slate-700/50 text-slate-400 border border-slate-600",
};

const TIER_ICON: Record<Tier, string> = { HOT: "🔥", WARM: "🟡", COLD: "🧊" };

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-500" : "bg-slate-600";
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold text-white w-6 text-right">{score}</span>
    </div>
  );
}

export default function VkIntentClient() {
  const [leads,     setLeads]     = useState<VkLead[]>([]);
  const [stats,     setStats]     = useState<Stats | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [running,   setRunning]   = useState(false);
  const [runResult, setRunResult] = useState("");
  const [tierFilter,    setTierFilter]    = useState<string>("");
  const [postsPerQuery, setPostsPerQuery] = useState(20);
  const [queriesCount,  setQueriesCount]  = useState(4);
  const [expanded,  setExpanded]  = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const tier = tierFilter ? `&tier=${tierFilter}` : "";
    const [leadsRes, statsRes] = await Promise.all([
      fetch(`/api/vk-intent/leads?limit=100${tier}`).then(r => r.json()).catch(() => []),
      fetch("/api/vk-intent/leads?stats=1").then(r => r.json()).catch(() => null),
    ]);
    setLeads(Array.isArray(leadsRes) ? leadsRes : []);
    setStats(statsRes);
    setLoading(false);
  }, [tierFilter]);

  useEffect(() => { load(); }, [load]);

  async function runScraper() {
    setRunning(true);
    setRunResult("");
    try {
      const res  = await fetch("/api/vk-intent/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postsPerQuery, queriesCount }),
      });
      const data = await res.json();
      if (data.ok) {
        setRunResult(`✅ Спарсено: ${data.scraped} | Классифицировано: ${data.classified} | HOT: ${data.hot} | WARM: ${data.warm} | Сохранено: ${data.saved}${data.errors?.length ? ` | Ошибок: ${data.errors.length}` : ""}`);
        await load();
      } else {
        setRunResult(`⚠️ Ошибка: ${data.error ?? "неизвестно"}`);
      }
    } catch (err) {
      setRunResult(`⚠️ ${String(err)}`);
    }
    setRunning(false);
  }

  const fmtDate = (s: string) => s ? new Date(s).toLocaleDateString("ru", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className="space-y-6">

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Всего лидов",  value: stats?.total  ?? "—" },
          { label: "HOT",          value: stats?.hot     ?? "—", color: "text-red-400" },
          { label: "WARM",         value: stats?.warm    ?? "—", color: "text-amber-400" },
          { label: "Avg Score",    value: stats?.avg_score ? `${stats.avg_score}` : "—" },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold ${s.color ?? "text-white"}`}>{s.value}</div>
            <div className="text-slate-500 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={runScraper}
          disabled={running}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition"
        >
          {running ? (
            <><span className="animate-spin">⏳</span> Идёт скрейпинг… (до 5 мин)</>
          ) : (
            <>📡 Запустить VK Intent Scraper</>
          )}
        </button>

        <div className="flex gap-2 ml-auto">
          {(["", "HOT", "WARM", "COLD"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                tierFilter === t
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500"
              }`}
            >
              {t || "Все"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Limits ── */}
      <div className="flex flex-wrap gap-6 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
        <div className="flex flex-col gap-1 min-w-[200px]">
          <label className="text-xs text-slate-400">
            Постов на запрос: <span className="text-white font-bold">{postsPerQuery}</span>
            <span className="text-slate-600 ml-1">(итого до {postsPerQuery * queriesCount})</span>
          </label>
          <input type="range" min={5} max={100} step={5} value={postsPerQuery}
            onChange={e => setPostsPerQuery(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-slate-600"><span>5</span><span>100</span></div>
        </div>
        <div className="flex flex-col gap-1 min-w-[200px]">
          <label className="text-xs text-slate-400">
            Запросов за сессию: <span className="text-white font-bold">{queriesCount}</span>
            <span className="text-slate-600 ml-1">из 14</span>
          </label>
          <input type="range" min={1} max={14} step={1} value={queriesCount}
            onChange={e => setQueriesCount(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-slate-600"><span>1</span><span>14</span></div>
        </div>
        <div className="flex items-center text-xs text-slate-500 self-end pb-1">
          ~{postsPerQuery * queriesCount} постов → Claude Haiku ~${((postsPerQuery * queriesCount) * 0.001).toFixed(2)} за классификацию
        </div>
      </div>

      {runResult && (
        <div className={`text-sm px-4 py-3 rounded-xl border ${
          runResult.startsWith("✅")
            ? "bg-green-900/20 border-green-700 text-green-300"
            : "bg-amber-900/20 border-amber-700 text-amber-300"
        }`}>
          {runResult}
        </div>
      )}

      {stats?.last_run && (
        <p className="text-xs text-slate-600">Последний запуск: {fmtDate(stats.last_run)}</p>
      )}

      {/* ── Table ── */}
      {loading ? (
        <div className="text-slate-500 text-sm py-12 text-center animate-pulse">Загрузка…</div>
      ) : leads.length === 0 ? (
        <div className="text-slate-600 text-sm py-12 text-center">
          Лидов пока нет. Нажмите «Запустить VK Intent Scraper» или дождитесь крона в 11:00 UTC.
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map(lead => (
            <div key={lead.id}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition"
            >
              <div
                className="flex flex-wrap items-center gap-3 px-4 py-3 cursor-pointer"
                onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}
              >
                {/* Tier */}
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${TIER_STYLE[lead.tier as Tier]}`}>
                  {TIER_ICON[lead.tier as Tier]} {lead.tier}
                </span>

                {/* Score */}
                <ScoreBar score={lead.score} />

                {/* Author */}
                <span className="text-white text-sm font-medium truncate max-w-[160px]">
                  {lead.author_name || "Аноним"}
                </span>

                {/* Intent */}
                <span className="text-slate-400 text-xs truncate flex-1">{lead.intent}</span>

                {/* Location */}
                {lead.location && (
                  <span className="text-slate-500 text-xs">📍 {lead.location}</span>
                )}

                {/* Date */}
                <span className="text-slate-600 text-xs whitespace-nowrap">{fmtDate(lead.posted_at)}</span>

                {/* VK link */}
                {lead.author_link && (
                  <a
                    href={lead.author_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-blue-400 hover:text-blue-300 text-xs whitespace-nowrap"
                  >
                    ВКонтакте →
                  </a>
                )}

                <span className="text-slate-600 text-xs">{expanded === lead.id ? "▲" : "▼"}</span>
              </div>

              {expanded === lead.id && (
                <div className="border-t border-slate-800 px-4 py-4 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    {[
                      { label: "Запрос",   value: lead.query },
                      { label: "Товар",    value: lead.product || "—" },
                      { label: "Контакт",  value: lead.contact || "—" },
                      { label: "Срочность", value: lead.urgency || "—" },
                      { label: "Уверенность", value: lead.confidence ? `${Math.round(lead.confidence * 100)}%` : "—" },
                      { label: "Найден в базе", value: fmtDate(lead.created_at) },
                    ].map(f => (
                      <div key={f.label}>
                        <div className="text-slate-500 text-xs mb-0.5">{f.label}</div>
                        <div className="text-white text-xs font-medium">{f.value}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs mb-1">Текст поста</div>
                    <p className="text-slate-300 text-xs leading-relaxed bg-slate-800/60 rounded-lg p-3 max-h-32 overflow-y-auto">
                      {lead.text || "—"}
                    </p>
                  </div>
                  {lead.contact && (
                    <div className="flex gap-2">
                      {lead.contact.startsWith("@") && (
                        <a
                          href={`https://t.me/${lead.contact.replace("@", "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-blue-600/20 border border-blue-600/40 text-blue-300 rounded-lg text-xs hover:bg-blue-600/30 transition"
                        >
                          Написать в Telegram →
                        </a>
                      )}
                    </div>
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
