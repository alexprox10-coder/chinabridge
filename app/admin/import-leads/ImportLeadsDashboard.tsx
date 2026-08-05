"use client";

import { useState, useMemo } from "react";
import type { ImportLead, LeadStatus, LeadScore } from "@/lib/import-leads/types";

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Новый",
  reviewed: "Просмотрен",
  approved: "Одобрен",
  rejected: "Отклонён",
  contacted: "Контактировали",
};

const STATUS_STYLES: Record<LeadStatus, string> = {
  new: "bg-blue-900/40 text-blue-300 border-blue-700",
  reviewed: "bg-slate-700/40 text-slate-300 border-slate-600",
  approved: "bg-green-900/40 text-green-300 border-green-700",
  rejected: "bg-red-900/40 text-red-300 border-red-700",
  contacted: "bg-purple-900/40 text-purple-300 border-purple-700",
};

const IMPORTS_LABELS: Record<string, string> = {
  yes: "Да ✅",
  likely: "Вероятно 🟡",
  no: "Нет 🔴",
};

const SCORE_COLORS: Record<LeadScore, string> = {
  5: "text-emerald-400 font-black",
  4: "text-green-400 font-bold",
  3: "text-amber-400 font-semibold",
  2: "text-slate-400",
  1: "text-red-400",
};

interface Props {
  initialLeads: ImportLead[];
  isTableConfigured: boolean;
}

export default function ImportLeadsDashboard({ initialLeads, isTableConfigured }: Props) {
  const [leads, setLeads] = useState<ImportLead[]>(initialLeads);
  const [filterStatus, setFilterStatus] = useState<LeadStatus | "all">("all");
  const [filterScore, setFilterScore] = useState<number>(0);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string>("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  const categories = useMemo(() => {
    const set = new Set(leads.map((l) => l.category).filter(Boolean));
    return Array.from(set).sort();
  }, [leads]);

  const cities = useMemo(() => {
    const set = new Set(leads.map((l) => l.city).filter(Boolean));
    return Array.from(set).sort();
  }, [leads]);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (filterStatus !== "all" && l.status !== filterStatus) return false;
      if (filterScore > 0 && l.score < filterScore) return false;
      if (filterCategory && l.category !== filterCategory) return false;
      if (filterCity && l.city !== filterCity) return false;
      if (searchQ && !l.company.toLowerCase().includes(searchQ.toLowerCase()) &&
          !l.website.toLowerCase().includes(searchQ.toLowerCase())) return false;
      return true;
    });
  }, [leads, filterStatus, filterScore, filterCategory, filterCity, searchQ]);

  const stats = useMemo(() => ({
    total: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    highScore: leads.filter((l) => l.score >= 4).length,
    contacted: leads.filter((l) => l.status === "contacted").length,
  }), [leads]);

  async function handleRun() {
    setRunning(true);
    setRunResult("");
    try {
      const res = await fetch("/api/import-leads/run", { method: "POST", body: "{}" });
      const data = await res.json();
      if (data.ok) {
        setRunResult(`✅ Найдено: ${data.result.found} | Проанализировано: ${data.result.analyzed} | Сохранено: ${data.result.saved}`);
        // Refresh leads
        const r2 = await fetch("/api/import-leads/leads");
        const d2 = await r2.json();
        if (d2.ok) setLeads(d2.leads);
      } else {
        setRunResult(`❌ Ошибка: ${data.error}`);
      }
    } catch {
      setRunResult("❌ Не удалось запустить пайплайн");
    } finally {
      setRunning(false);
    }
  }

  async function updateStatus(lead: ImportLead, status: LeadStatus) {
    if (!lead.id) return;
    setUpdating(lead.id);
    try {
      await fetch("/api/import-leads/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id, status }),
      });
      setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, status } : l));
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Поиск клиентов на импорт</h1>
          <p className="text-slate-400 text-sm mt-0.5">AI-агент поиска потенциальных клиентов на импорт из Китая</p>
        </div>
        <button
          onClick={handleRun}
          disabled={running}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold text-sm rounded-xl transition-colors"
        >
          {running ? "⏳ Поиск..." : "🚀 Запустить поиск"}
        </button>
      </div>

      {runResult && (
        <div className="p-4 bg-slate-800 border border-slate-700 rounded-xl text-sm font-medium text-slate-200">
          {runResult}
        </div>
      )}

      {!isTableConfigured && (
        <div className="p-4 bg-amber-900/30 border border-amber-700 rounded-xl text-sm text-amber-300">
          ⚠️ Переменная <code className="font-mono text-amber-200">N8N_IMPORT_LEADS_TABLE_ID</code> не задана — лиды не будут сохраняться в CRM.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Всего лидов", value: stats.total, icon: "👥" },
          { label: "Новых", value: stats.new, icon: "🆕", accent: true },
          { label: "Высокий рейтинг (4-5⭐)", value: stats.highScore, icon: "🏆" },
          { label: "Контактировали", value: stats.contacted, icon: "📞" },
        ].map((s, i) => (
          <div key={i} className={`bg-slate-900 border rounded-xl p-4 ${s.accent ? "border-green-700" : "border-slate-700"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{s.label}</span>
              <span className="text-xl">{s.icon}</span>
            </div>
            <p className={`text-3xl font-bold ${s.accent ? "text-green-400" : "text-white"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Поиск по компании..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="col-span-2 md:col-span-1 text-sm bg-slate-800 border border-slate-600 text-slate-100 placeholder-slate-500 rounded-lg px-3 py-2 outline-none focus:border-green-500"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as LeadStatus | "all")}
            className="text-sm bg-slate-800 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 outline-none focus:border-green-500"
          >
            <option value="all">Все статусы</option>
            {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <select
            value={filterScore}
            onChange={(e) => setFilterScore(Number(e.target.value))}
            className="text-sm bg-slate-800 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 outline-none focus:border-green-500"
          >
            <option value={0}>Все рейтинги</option>
            <option value={5}>⭐⭐⭐⭐⭐ только</option>
            <option value={4}>⭐⭐⭐⭐ и выше</option>
            <option value={3}>⭐⭐⭐ и выше</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-sm bg-slate-800 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 outline-none focus:border-green-500"
          >
            <option value="">Все категории</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="text-sm bg-slate-800 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 outline-none focus:border-green-500"
          >
            <option value="">Все города</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <p className="text-xs text-slate-500 mt-2">Найдено: {filtered.length} из {leads.length}</p>
      </div>

      {/* Leads */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-12 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-semibold text-slate-200 mb-1">
            {leads.length === 0 ? "Лидов пока нет" : "Ничего не найдено"}
          </p>
          <p className="text-sm text-slate-500">
            {leads.length === 0
              ? "Нажмите «Запустить поиск» чтобы начать поиск компаний"
              : "Попробуйте изменить фильтры"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => (
            <div key={lead.lead_id} className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden">
              {/* Lead header */}
              <div
                className="px-6 py-4 cursor-pointer hover:bg-slate-800 transition-colors"
                onClick={() => setExpanded(expanded === lead.lead_id ? null : lead.lead_id)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-bold text-white">{lead.company}</p>
                      <span className={`text-sm ${SCORE_COLORS[lead.score]}`}>{lead.score_stars}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[lead.status]}`}>
                        {STATUS_LABELS[lead.status]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                      <a href={lead.website} target="_blank" rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 hover:underline"
                        onClick={(e) => e.stopPropagation()}>
                        🌐 {lead.website.replace(/^https?:\/\//, "")}
                      </a>
                      {lead.category && <span>📦 {lead.category}</span>}
                      {lead.city && <span>📍 {lead.city}</span>}
                      <span>📊 {IMPORTS_LABELS[lead.imports]}</span>
                      <span>🗓 {new Date(lead.created_at).toLocaleDateString("ru-RU")}</span>
                    </div>
                  </div>
                  <span className="text-slate-500 text-lg">{expanded === lead.lead_id ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Expanded details */}
              {expanded === lead.lead_id && (
                <div className="border-t border-slate-700 px-6 py-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      {lead.phone && <p className="text-sm text-slate-300"><span className="text-slate-500">📞</span> {lead.phone}</p>}
                      {lead.email && <p className="text-sm text-slate-300"><span className="text-slate-500">📧</span> {lead.email}</p>}
                      {lead.telegram && <p className="text-sm text-slate-300"><span className="text-slate-500">✈️</span> {lead.telegram}</p>}
                      <p className="text-sm text-slate-500">Источник: {lead.source} · ID: {lead.company_id}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Почему интересен</p>
                      <p className="text-sm text-slate-300">{lead.why}</p>
                    </div>
                  </div>

                  <div className="bg-green-900/20 border border-green-800 rounded-xl p-4">
                    <p className="text-xs font-semibold text-green-400 uppercase mb-1">Что предложить</p>
                    <p className="text-sm text-green-300">{lead.offer}</p>
                  </div>

                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Готовое сообщение</p>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{lead.message}</p>
                    <button
                      onClick={() => navigator.clipboard.writeText(lead.message)}
                      className="mt-2 text-xs text-green-400 hover:text-green-300 font-medium"
                    >
                      📋 Копировать
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((s) => (
                      <button
                        key={s}
                        disabled={lead.status === s || updating === lead.id}
                        onClick={() => updateStatus(lead, s)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                          lead.status === s
                            ? "bg-green-600 text-white border-green-600"
                            : "bg-slate-800 text-slate-300 border-slate-600 hover:border-green-500 hover:text-green-400 disabled:opacity-40"
                        }`}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
