"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { MILead, MILeadPipeline } from "@/lib/market-intelligence/types";
import { MI_LEAD_TYPE_LABELS, MI_PIPELINE_LABELS } from "@/lib/market-intelligence/types";

type Tab = "all" | "google" | "telegram" | "vk";

const TEMP_COLORS = {
  HOT:  "bg-red-900/40 text-red-300 border-red-700",
  WARM: "bg-amber-900/40 text-amber-300 border-amber-700",
  COLD: "bg-slate-700/40 text-slate-400 border-slate-600",
};

const PIPE_COLORS: Record<MILeadPipeline, string> = {
  NEW:         "bg-blue-900/40 text-blue-300 border-blue-700",
  REVIEW:      "bg-slate-700/40 text-slate-300 border-slate-600",
  CONTACT:     "bg-purple-900/40 text-purple-300 border-purple-700",
  NEGOTIATION: "bg-amber-900/40 text-amber-300 border-amber-700",
  CLIENT:      "bg-green-900/40 text-green-300 border-green-700",
  LOST:        "bg-red-900/20 text-red-400 border-red-900",
};

const SOURCE_ICON: Record<string, string> = {
  google: "🔍", telegram: "✈️", vk: "💬", manual: "✏️",
};

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-green-500" : score >= 45 ? "bg-yellow-500" : "bg-slate-600";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold text-white w-6 text-right">{score}</span>
    </div>
  );
}

export default function LeadFinderClient() {
  const [tab,        setTab]        = useState<Tab>("all");
  const [leads,      setLeads]      = useState<MILead[]>([]);
  const [stats,      setStats]      = useState({ total:0, hot:0, warm:0, cold:0, google:0, telegram:0, vk:0, clients:0, avg_score:0 });
  const [loading,    setLoading]    = useState(true);
  const [running,    setRunning]    = useState(false);
  const [runResult,  setRunResult]  = useState("");
  const [filterTemp, setFilterTemp] = useState("");
  const [expanded,   setExpanded]   = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const source = tab === "all" ? "" : `&source=${tab}`;
      const temp   = filterTemp ? `&temperature=${filterTemp}` : "";
      const [lr, sr] = await Promise.all([
        fetch(`/api/market-intelligence/leads?${source}${temp}`).then(r => r.json()),
        fetch("/api/market-intelligence/leads?stats=1").then(r => r.json()),
      ]);
      setLeads(Array.isArray(lr) ? lr : []);
      setStats(sr);
    } catch { setLeads([]); }
    setLoading(false);
  }, [tab, filterTemp]);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  async function runSearch() {
    setRunning(true); setRunResult("");
    try {
      const sources = tab === "all" ? ["google", "telegram", "vk"] : [tab];
      const res = await fetch("/api/market-intelligence/leads", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sources, limit: 5 }),
      });
      const data = await res.json();
      setRunResult(`✅ Найдено: Google ${data.google ?? 0} | Telegram ${data.telegram ?? 0} | VK ${data.vk ?? 0} | HOT: ${data.hot ?? 0}`);
      await loadLeads();
    } catch { setRunResult("⚠️ Ошибка поиска"); }
    setRunning(false);
  }

  async function movePipeline(id: number, pipeline: MILeadPipeline) {
    await fetch("/api/market-intelligence/leads", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, pipeline }),
    });
    setLeads(prev => prev.map(l => l.id === id ? { ...l, pipeline } : l));
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/market-intelligence" className="text-slate-500 text-sm hover:text-slate-300 flex items-center gap-1 mb-1">
            ← Market Intelligence
          </Link>
          <h1 className="text-2xl font-bold text-white">🎯 Lead Finder AI</h1>
          <p className="text-slate-500 text-sm mt-0.5">Автоматический поиск клиентов через Google, Telegram, VK</p>
        </div>
        <button onClick={runSearch} disabled={running}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition flex items-center gap-2">
          {running ? "⏳ Ищем..." : "🚀 Запустить поиск"}
        </button>
      </div>

      {runResult && (
        <div className="mb-4 px-4 py-2.5 bg-blue-900/20 border border-blue-700/40 rounded-xl text-blue-300 text-sm">
          {runResult}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Всего",    value: stats.total,     color: "text-white" },
          { label: "HOT",      value: stats.hot,       color: "text-red-400" },
          { label: "WARM",     value: stats.warm,      color: "text-amber-400" },
          { label: "Google",   value: stats.google,    color: "text-blue-400" },
          { label: "Telegram", value: stats.telegram,  color: "text-purple-400" },
          { label: "VK",       value: stats.vk,        color: "text-indigo-400" },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-slate-500 text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs + filters */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {(["all","google","telegram","vk"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border ${tab === t ? "bg-blue-600 border-blue-600 text-white" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}>
            {SOURCE_ICON[t] ?? "📋"} {t === "all" ? "Все" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          {["", "HOT","WARM","COLD"].map(t => (
            <button key={t} onClick={() => setFilterTemp(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${filterTemp === t ? "bg-slate-700 border-slate-500 text-white" : "border-slate-800 text-slate-500 hover:border-slate-600"}`}>
              {t || "Все темп."}
            </button>
          ))}
        </div>
      </div>

      {/* Lead cards */}
      {loading ? (
        <div className="text-center py-16 text-slate-600">Загрузка...</div>
      ) : leads.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-slate-500">Лидов нет. Запустите поиск →</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map(lead => (
            <div key={lead.leadId}
              className={`bg-slate-900 border rounded-xl overflow-hidden transition ${lead.temperature === "HOT" ? "border-red-700/50" : "border-slate-800"}`}>
              <div
                className="p-4 cursor-pointer hover:bg-slate-800/50 transition"
                onClick={() => setExpanded(expanded === lead.leadId ? null : lead.leadId)}>
                <div className="flex items-start gap-4">
                  <div className="text-xl">{SOURCE_ICON[lead.source] ?? "📋"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold text-sm">{lead.company}</span>
                      {lead.city && <span className="text-slate-500 text-xs">📍 {lead.city}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${TEMP_COLORS[lead.temperature]}`}>
                        {lead.temperature}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${PIPE_COLORS[lead.pipeline]}`}>
                        {MI_PIPELINE_LABELS[lead.pipeline]}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mt-1 truncate">{lead.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-slate-600 text-xs">{MI_LEAD_TYPE_LABELS[lead.type]}</span>
                      {lead.telegram && <span className="text-purple-400 text-xs">{lead.telegram}</span>}
                    </div>
                  </div>
                  <div className="w-24 shrink-0">
                    <ScoreBar score={lead.score} />
                    <p className="text-slate-600 text-[10px] text-center mt-1">AI Score</p>
                  </div>
                </div>
              </div>

              {expanded === lead.leadId && (
                <div className="border-t border-slate-800 p-4 bg-slate-900/60">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Источник</p>
                      <a href={lead.sourceUrl} target="_blank" rel="noopener noreferrer"
                        className="text-blue-400 text-xs hover:underline truncate block">{lead.sourceUrl || "—"}</a>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Следующий шаг</p>
                      <p className="text-white text-xs">{lead.nextAction || "—"}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-slate-500 text-xs mb-1">Причина оценки</p>
                      <p className="text-slate-300 text-xs">{lead.scoreReason || "—"}</p>
                    </div>
                  </div>

                  {/* Pipeline controls */}
                  <div>
                    <p className="text-slate-500 text-xs mb-2">Pipeline:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.keys(MI_PIPELINE_LABELS) as MILeadPipeline[]).map(p => (
                        <button key={p} onClick={() => lead.id && movePipeline(lead.id, p)}
                          className={`px-2.5 py-1 rounded-lg text-xs border transition ${lead.pipeline === p ? PIPE_COLORS[p] : "border-slate-700 text-slate-500 hover:border-slate-500"}`}>
                          {MI_PIPELINE_LABELS[p]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
