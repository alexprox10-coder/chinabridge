"use client";

import { useState, useEffect } from "react";

interface Priority {
  n: number; action: string; reason: string; emoji: string;
}
interface Alert {
  type: "warning" | "info" | "success"; text: string;
}
interface Insight {
  label: string; value: string; trend: "up" | "down" | "stable";
}
interface Stats {
  total: number; hot: number; unanswered: number;
  conversion: number; revenue: number; pipeline: number; seoCount: number;
}
interface CeoReport {
  date: string; summary: string;
  priorities: Priority[]; alerts: Alert[]; insights: Insight[];
  stats: Stats; createdAt?: string;
}

const ALERT_STYLE = {
  warning: "bg-amber-900/20 border-amber-700/40 text-amber-300",
  info:    "bg-blue-900/20 border-blue-700/40 text-blue-300",
  success: "bg-green-900/20 border-green-700/40 text-green-300",
};

const TREND_ICON = { up: "↑", down: "↓", stable: "→" };
const TREND_COLOR = { up: "text-green-400", down: "text-red-400", stable: "text-slate-400" };

export function CeoReportWidget() {
  const [report,     setReport]     = useState<CeoReport | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [generating, setGenerating] = useState(false);
  const [collapsed,  setCollapsed]  = useState(false);

  useEffect(() => {
    fetch("/api/admin/ceo-report")
      .then(r => r.json())
      .then(d => { if (d.ok && d.report) setReport(d.report); })
      .finally(() => setLoading(false));
  }, []);

  async function generate() {
    setGenerating(true);
    try {
      const r = await fetch("/api/admin/ceo-report", { method: "POST" });
      const d = await r.json();
      if (d.ok && d.report) setReport(d.report);
    } catch {}
    setGenerating(false);
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayLabel = new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });
  const isToday = report?.date === today;

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 animate-pulse">
        <div className="h-4 bg-slate-800 rounded w-48 mb-3" />
        <div className="h-3 bg-slate-800 rounded w-full mb-2" />
        <div className="h-3 bg-slate-800 rounded w-3/4" />
      </div>
    );
  }

  if (!report || !isToday) {
    return (
      <div className="bg-gradient-to-r from-slate-900 to-slate-900/80 border border-slate-800 rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🧠</span>
              <h2 className="text-white font-bold">CEO AI Брифинг</h2>
              <span className="text-xs text-slate-600 ml-1">{todayLabel}</span>
            </div>
            <p className="text-slate-500 text-sm">AI-отчёт на сегодня ещё не сформирован</p>
          </div>
          <button onClick={generate} disabled={generating}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#00A86B] hover:bg-[#008f59] disabled:opacity-50 text-white rounded-xl text-sm font-bold transition shrink-0">
            {generating
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Генерирую...</>
              : <><span>⚡</span>Сформировать брифинг</>
            }
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-700/50 rounded-2xl mb-6 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <span className="text-xl">🧠</span>
          <div>
            <h2 className="text-white font-bold text-sm">CEO AI Брифинг</h2>
            <p className="text-slate-500 text-xs">{todayLabel}</p>
          </div>
          <span className="text-xs px-2 py-0.5 bg-green-900/30 border border-green-700/40 text-green-400 rounded-full">сегодня</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={generate} disabled={generating}
            className="text-xs text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-600 px-3 py-1.5 rounded-lg transition">
            {generating ? "⏳ Обновляю..." : "↻ Обновить"}
          </button>
          <button onClick={() => setCollapsed(c => !c)}
            className="text-xs text-slate-600 hover:text-slate-400 border border-slate-800 px-3 py-1.5 rounded-lg transition">
            {collapsed ? "Развернуть" : "Свернуть"}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-5 space-y-5">

          {/* Summary */}
          {report.summary && (
            <p className="text-slate-300 text-sm leading-relaxed border-l-2 border-[#00A86B] pl-3">
              {report.summary}
            </p>
          )}

          {/* Alerts */}
          {report.alerts?.length > 0 && (
            <div className="flex flex-col gap-2">
              {report.alerts.map((a, i) => (
                <div key={i} className={`text-xs px-3 py-2 rounded-lg border ${ALERT_STYLE[a.type] ?? ALERT_STYLE.info}`}>
                  {a.type === "warning" ? "⚠️ " : a.type === "success" ? "✅ " : "ℹ️ "}{a.text}
                </div>
              ))}
            </div>
          )}

          {/* Priorities */}
          {report.priorities?.length > 0 && (
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-widest mb-3 font-semibold">Приоритеты на сегодня</p>
              <div className="space-y-3">
                {report.priorities.map((p) => (
                  <div key={p.n} className="flex gap-3 items-start">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 text-slate-400 text-xs font-bold shrink-0 mt-0.5">
                      {p.n}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">
                        {p.emoji} {p.action}
                      </p>
                      <p className="text-slate-500 text-xs mt-0.5">{p.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats + Insights row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { l: "Лидов",       v: report.stats?.total ?? "—",                           c: "text-white" },
              { l: "HOT",         v: report.stats?.hot ?? "—",                             c: "text-red-400" },
              { l: "Без ответа",  v: report.stats?.unanswered ?? 0,                        c: (report.stats?.unanswered ?? 0) > 0 ? "text-amber-400" : "text-slate-500" },
              { l: "Конверсия",   v: `${report.stats?.conversion ?? 0}%`,                  c: "text-blue-400" },
              { l: "Выручка",     v: report.stats?.revenue ? `$${report.stats.revenue}` : "—", c: "text-green-400" },
              { l: "Pipeline",    v: report.stats?.pipeline ? `$${report.stats.pipeline}` : "—", c: "text-purple-400" },
              { l: "SEO ключей",  v: report.stats?.seoCount ?? "—",                       c: "text-cyan-400" },
            ].map(s => (
              <div key={s.l} className="bg-slate-800/50 rounded-xl p-3 text-center">
                <p className={`text-lg font-black ${s.c}`}>{s.v}</p>
                <p className="text-slate-600 text-xs mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>

          {/* AI Insights */}
          {report.insights?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {report.insights.map((ins, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                  <span className={`text-xs font-bold ${TREND_COLOR[ins.trend]}`}>{TREND_ICON[ins.trend]}</span>
                  <span className="text-slate-400 text-xs">{ins.label}:</span>
                  <span className="text-white text-xs font-medium">{ins.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
