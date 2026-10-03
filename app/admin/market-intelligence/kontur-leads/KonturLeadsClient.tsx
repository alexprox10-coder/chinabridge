"use client";

import { useState, useEffect, useCallback } from "react";

interface KLead {
  id: number;
  company_name: string;
  inn: string;
  region: string | null;
  lead_score: number;
  status: string;
  created_at: string;
  phone: string | null;
  email: string | null;
  site_url: string | null;
  director: string | null;
  position: string | null;
  revenue: number | null;
  employees: number | null;
  okvad_full: string | null;
  product_category: string | null;
  supplier_found: string | null;
  msp_category: string | null;
  // AI analysis fields
  what_they_sell: string | null;
  who_are_clients: string | null;
  china_fit: string | null;
  suggested_goods: string | null;
  kp_message: string | null;
  ved_status: string | null;
  ai_priority: string | null;
  priority_reason: string | null;
}

const STAGES: { key: string; label: string; color: string; emoji: string }[] = [
  { key: "new",          label: "Новые",            color: "border-slate-600",   emoji: "📥" },
  { key: "analyzing",    label: "AI Анализ",        color: "border-blue-600",    emoji: "🤖" },
  { key: "sourced",      label: "Поставщик найден", color: "border-violet-600",  emoji: "🏭" },
  { key: "kp_ready",     label: "КП Готово",        color: "border-amber-600",   emoji: "📄" },
  { key: "contacted",    label: "Контакт",          color: "border-cyan-600",    emoji: "📞" },
  { key: "negotiating",  label: "Переговоры",       color: "border-orange-600",  emoji: "🤝" },
  { key: "deal",         label: "Сделка ✓",         color: "border-green-600",   emoji: "💰" },
  { key: "rejected",     label: "Отказ",            color: "border-red-800",     emoji: "❌" },
];

function fmtRevenue(r: number | null) {
  if (!r) return null;
  if (r >= 1_000_000_000) return `${(r / 1_000_000_000).toFixed(1)} млрд`;
  if (r >= 1_000_000) return `${Math.round(r / 1_000_000)} млн`;
  return `${Math.round(r / 1000)} тыс`;
}

function ScoreDot({ score }: { score: number }) {
  const c = score >= 70 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-blue-500";
  return <span className={`inline-block w-2 h-2 rounded-full ${c}`} />;
}

function LeadCard({ lead, onStatusChange, onAnalyze, analyzing }: {
  lead: KLead;
  onStatusChange: (id: number, status: string) => void;
  onAnalyze: (id: number) => void;
  analyzing: boolean;
}) {
  const [open, setOpen] = useState(false);
  const revenue = fmtRevenue(lead.revenue);

  const priorityColor = lead.ai_priority === "HIGH" ? "border-green-500 bg-green-950/20" :
    lead.ai_priority === "LOW" ? "border-slate-700 bg-slate-900/20" : "border-slate-600 bg-slate-800";

  const hasAnalysis = !!(lead.what_they_sell || lead.kp_message);

  return (
    <div className={`border rounded-lg p-3 mb-2 cursor-pointer hover:border-slate-400 transition-colors ${hasAnalysis ? priorityColor : "border-slate-700 bg-slate-800"}`}>
      <div onClick={() => setOpen(!open)}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-white text-xs font-semibold leading-tight">{lead.company_name}</p>
          <div className="flex items-center gap-1 flex-shrink-0">
            {lead.ai_priority === "HIGH" && <span className="text-[9px] text-green-400 bg-green-900/40 rounded px-1">🔥 HIGH</span>}
            {lead.ai_priority === "LOW" && <span className="text-[9px] text-slate-500 bg-slate-700 rounded px-1">LOW</span>}
            <ScoreDot score={lead.lead_score} />
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mb-1">
          {lead.region && <span className="text-[10px] text-slate-400 bg-slate-700 rounded px-1">{lead.region}</span>}
          {revenue && <span className="text-[10px] text-green-400 bg-green-900/30 rounded px-1">{revenue} ₽</span>}
          {lead.employees && <span className="text-[10px] text-slate-400 bg-slate-700 rounded px-1">{lead.employees} чел</span>}
        </div>
        {lead.product_category && (
          <p className="text-[10px] text-violet-300 bg-violet-900/20 rounded px-1.5 py-0.5 mb-1 inline-block">{lead.product_category}</p>
        )}
        {lead.what_they_sell && (
          <p className="text-[10px] text-slate-300 leading-tight mb-1">{lead.what_they_sell}</p>
        )}
        {lead.supplier_found && (
          <p className="text-[10px] text-amber-300 bg-amber-900/20 rounded px-1.5 py-0.5 mb-1 inline-block">🏭 {lead.supplier_found}</p>
        )}
      </div>

      {open && (
        <div className="mt-2 pt-2 border-t border-slate-700 space-y-2">

          {/* Contacts */}
          <div className="space-y-0.5">
            {lead.director && <p className="text-[10px] text-slate-300">👤 {lead.director} ({lead.position || "руководитель"})</p>}
            {lead.phone && <p className="text-[10px] text-cyan-400">📞 {lead.phone}</p>}
            {lead.email && <p className="text-[10px] text-cyan-400 break-all">✉️ {lead.email}</p>}
            {lead.site_url && (
              <a href={lead.site_url} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-blue-400 hover:underline block truncate">🌐 {lead.site_url}</a>
            )}
            <p className="text-[10px] text-slate-600">ИНН: {lead.inn}</p>
          </div>

          {/* AI Analysis block */}
          {hasAnalysis && (
            <div className="space-y-1.5 pt-1 border-t border-slate-700/50">
              <p className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold">AI Аналитика</p>

              {lead.ved_status && (
                <div className={`rounded px-2 py-1 ${lead.ved_status.toLowerCase().includes('уже') || lead.ved_status.toLowerCase().includes('работает') ? 'bg-green-950/40 border border-green-800/40' : 'bg-slate-800/40 border border-slate-700/40'}`}>
                  <p className="text-[9px] text-slate-500 uppercase">🌐 ВЭД / Китай-связь</p>
                  <p className="text-[10px] text-slate-200">{lead.ved_status}</p>
                </div>
              )}
              {lead.who_are_clients && (
                <div>
                  <p className="text-[9px] text-slate-500 uppercase">Клиенты</p>
                  <p className="text-[10px] text-slate-300">{lead.who_are_clients}</p>
                </div>
              )}
              {lead.china_fit && (
                <div>
                  <p className="text-[9px] text-slate-500 uppercase">Боль / Зачем им Китай</p>
                  <p className="text-[10px] text-slate-300">{lead.china_fit}</p>
                </div>
              )}
              {lead.suggested_goods && (
                <div>
                  <p className="text-[9px] text-slate-500 uppercase">Товары из Китая</p>
                  <p className="text-[10px] text-amber-300">{lead.suggested_goods}</p>
                </div>
              )}
              {lead.priority_reason && (
                <div>
                  <p className="text-[9px] text-slate-500 uppercase">Почему этот приоритет</p>
                  <p className="text-[10px] text-slate-400">{lead.priority_reason}</p>
                </div>
              )}
              {lead.kp_message && (
                <div className="bg-blue-950/40 border border-blue-800/50 rounded p-2">
                  <p className="text-[9px] text-blue-400 uppercase font-semibold mb-1">📨 КП — WhatsApp/Telegram</p>
                  <p className="text-[10px] text-blue-200 leading-relaxed">{lead.kp_message}</p>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-700/50">
            <button
              onClick={() => onAnalyze(lead.id)}
              disabled={analyzing}
              className="text-[10px] bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white rounded px-2 py-0.5"
            >
              {analyzing ? "⏳" : hasAnalysis ? "🔄 Переанализ" : "🤖 AI Анализ"}
            </button>
            {STAGES.filter(s => s.key !== lead.status && s.key !== "analyzing").map(s => (
              <button
                key={s.key}
                onClick={() => onStatusChange(lead.id, s.key)}
                className="text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-300 rounded px-2 py-0.5"
              >
                → {s.emoji} {s.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function KonturLeadsClient() {
  const [leads, setLeads] = useState<KLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzeAll, setAnalyzeAll] = useState(false);
  const [importing, setImporting] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [view, setView] = useState<"pipeline" | "table">("pipeline");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/kontur-leads");
      const d = await r.json();
      setLeads(Array.isArray(d.leads) ? d.leads : []);
    } catch { setLeads([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id: number, status: string) => {
    await fetch("/api/admin/kontur-leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  };

  const handleAnalyze = async (id: number) => {
    setAnalyzingId(id);
    try {
      const r = await fetch("/api/admin/kontur-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const d = await r.json();
      if (d.ok && d.analysis) {
        const a = d.analysis;
        setLeads(prev => prev.map(l =>
          l.id === id ? {
            ...l,
            product_category: a.product_category ?? l.product_category,
            what_they_sell: a.what_they_sell ?? l.what_they_sell,
            who_are_clients: a.who_are_clients ?? l.who_are_clients,
            china_fit: a.china_fit ?? l.china_fit,
            suggested_goods: a.suggested_goods ?? l.suggested_goods,
            kp_message: a.kp_message ?? l.kp_message,
            ved_status: a.ved_status ?? l.ved_status,
            ai_priority: a.priority ?? l.ai_priority,
            priority_reason: a.priority_reason ?? l.priority_reason,
            status: (l.status === "new" || l.status === "analyzing") ? "kp_ready" : l.status,
          } : l
        ));
        if (d.aiError) setMsg(`⚠️ Анализ ${id}: ${d.aiError}`);
      } else if (!d.ok) {
        setMsg(`❌ Ошибка анализа ${id}: ${d.error || "неизвестно"}`);
      }
    } finally { setAnalyzingId(null); }
  };

  const handleImport = async () => {
    setImporting(true);
    setMsg("Импортирую 50 компаний из Kontur.JSON...");
    try {
      const r = await fetch("/api/admin/kontur-leads/import", { method: "POST" });
      const d = await r.json();
      if (d.ok) {
        setMsg(`✅ Импорт завершён: вставлено ${d.inserted}, обновлено ${d.updated}, пропущено ${d.skipped}`);
        await load();
      } else {
        setMsg(`❌ Ошибка: ${d.error}`);
      }
    } catch (e) {
      setMsg(`❌ Ошибка сети: ${e}`);
    }
    setImporting(false);
  };

  const handleAnalyzeAll = async () => {
    setAnalyzeAll(true);
    setMsg("Запускаю AI анализ всех новых лидов (поочерёдно)...");
    const newLeads = leads.filter(l => !l.kp_message && l.status !== "rejected" && l.status !== "deal");
    for (const lead of newLeads) {
      setMsg(`Анализирую: ${lead.company_name}...`);
      await handleAnalyze(lead.id);
      await new Promise(r => setTimeout(r, 300));
    }
    setMsg(`Готово! Проанализировано ${newLeads.length} компаний`);
    setAnalyzeAll(false);
  };

  const handleBatchAnalyze = async () => {
    setAnalyzeAll(true);
    setMsg("⚡ Пакетный анализ x10 через OpenRouter...");
    try {
      const r = await fetch("/api/admin/kontur-leads", { method: "PUT" });
      const d = await r.json();
      if (d.ok) {
        const errors = d.results?.filter((x: {ok: boolean}) => !x.ok) ?? [];
        const ok = d.results?.filter((x: {ok: boolean}) => x.ok) ?? [];
        setMsg(`✅ Пакет готов: ${ok.length} проанализировано${errors.length ? `, ${errors.length} ошибок` : ""}`);
        await load();
      } else {
        setMsg(`❌ Ошибка: ${d.error}`);
      }
    } catch (e) {
      setMsg(`❌ Сеть: ${e}`);
    }
    setAnalyzeAll(false);
  };

  const byStage = Object.fromEntries(STAGES.map(s => [s.key, leads.filter(l => l.status === s.key)]));

  const totalRevenue = leads.reduce((s, l) => s + (l.revenue || 0), 0);
  const topLeads = [...leads].sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 5);

  return (
    <div className="text-white p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">🏢 Контур.Поиск — Воронка лидов</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {leads.length} компаний · Совокупная выручка: <span className="text-green-400 font-semibold">{fmtRevenue(totalRevenue)} ₽</span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setView(v => v === "pipeline" ? "table" : "pipeline")}
            className="text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-4 py-2">
            {view === "pipeline" ? "📋 Таблица" : "🗂 Воронка"}
          </button>
          <button onClick={handleBatchAnalyze} disabled={analyzeAll}
            className="text-sm bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg px-4 py-2">
            {analyzeAll ? "⏳ Пакет..." : "⚡ Пакет x10 (OR)"}
          </button>
          <button onClick={handleAnalyzeAll} disabled={analyzeAll}
            className="text-sm bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg px-4 py-2">
            {analyzeAll ? "⏳ Анализирую..." : "🤖 Анализ всех"}
          </button>
          {leads.length === 0 && (
            <button onClick={handleImport} disabled={importing}
              className="text-sm bg-violet-700 hover:bg-violet-600 disabled:opacity-50 text-white rounded-lg px-4 py-2">
              {importing ? "⏳ Импорт..." : "📥 Импорт Kontur JSON"}
            </button>
          )}
          <button onClick={load} className="text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-4 py-2">
            🔄 Обновить
          </button>
        </div>
      </div>

      {msg && <div className="mb-4 bg-blue-900/30 border border-blue-700 rounded-lg px-4 py-2 text-sm text-blue-300">{msg}</div>}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Новых",         val: byStage["new"]?.length ?? 0,         color: "text-slate-400" },
          { label: "С анализом",    val: leads.filter(l => l.product_category).length, color: "text-blue-400" },
          { label: "Контакт / КП",  val: (byStage["kp_ready"]?.length ?? 0) + (byStage["contacted"]?.length ?? 0), color: "text-amber-400" },
          { label: "Сделки",        val: byStage["deal"]?.length ?? 0,         color: "text-green-400" },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {loading && <p className="text-slate-400 text-center py-12">Загрузка...</p>}

      {!loading && view === "pipeline" && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map(stage => {
            const stageLeads = byStage[stage.key] || [];
            return (
              <div key={stage.key} className="flex-shrink-0 w-64">
                <div className={`flex items-center justify-between mb-2 pb-2 border-b ${stage.color}`}>
                  <span className="text-xs font-semibold text-slate-300">{stage.emoji} {stage.label}</span>
                  <span className="text-xs font-bold text-slate-400 bg-slate-800 rounded-full px-2 py-0.5">{stageLeads.length}</span>
                </div>
                <div className="space-y-0">
                  {stageLeads.map(lead => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onStatusChange={handleStatusChange}
                      onAnalyze={handleAnalyze}
                      analyzing={analyzingId === lead.id}
                    />
                  ))}
                  {stageLeads.length === 0 && (
                    <p className="text-xs text-slate-600 text-center py-4">Пусто</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && view === "table" && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left py-2 pr-3">Компания</th>
                <th className="text-left py-2 pr-3">Регион</th>
                <th className="text-right py-2 pr-3">Выручка</th>
                <th className="text-left py-2 pr-3">Категория</th>
                <th className="text-left py-2 pr-3">Директор</th>
                <th className="text-left py-2 pr-3">Контакт</th>
                <th className="text-left py-2 pr-3">Статус</th>
                <th className="text-center py-2">Счёт</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => {
                const stage = STAGES.find(s => s.key === lead.status);
                return (
                  <tr key={lead.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-1.5 pr-3">
                      <p className="text-white font-medium leading-tight">{lead.company_name}</p>
                      <p className="text-slate-500">ИНН {lead.inn}</p>
                    </td>
                    <td className="py-1.5 pr-3 text-slate-400">{lead.region}</td>
                    <td className="py-1.5 pr-3 text-right text-green-400 font-medium">{fmtRevenue(lead.revenue) ?? "—"}</td>
                    <td className="py-1.5 pr-3">
                      {lead.product_category
                        ? <span className="text-violet-300">{lead.product_category}</span>
                        : lead.site_url
                        ? <button onClick={() => handleAnalyze(lead.id)}
                            disabled={analyzingId === lead.id}
                            className="text-blue-400 hover:underline disabled:opacity-50">
                            {analyzingId === lead.id ? "..." : "🤖 анализ"}
                          </button>
                        : <span className="text-slate-600">нет сайта</span>}
                    </td>
                    <td className="py-1.5 pr-3 text-slate-300">{lead.director ?? "—"}</td>
                    <td className="py-1.5 pr-3">
                      {lead.phone && <p className="text-cyan-400">{lead.phone}</p>}
                      {lead.email && <p className="text-cyan-400 text-[10px] truncate max-w-[140px]">{lead.email}</p>}
                    </td>
                    <td className="py-1.5 pr-3">
                      <select
                        value={lead.status}
                        onChange={e => handleStatusChange(lead.id, e.target.value)}
                        className="bg-slate-700 border border-slate-600 rounded text-xs text-white px-1 py-0.5"
                      >
                        {STAGES.map(s => <option key={s.key} value={s.key}>{s.emoji} {s.label}</option>)}
                      </select>
                    </td>
                    <td className="py-1.5 text-center">
                      <span className={`font-bold ${lead.lead_score >= 70 ? "text-green-400" : lead.lead_score >= 50 ? "text-yellow-400" : "text-blue-400"}`}>
                        {lead.lead_score}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Top leads by revenue */}
      {!loading && (
        <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">🏆 Топ-5 по выручке</h2>
          <div className="space-y-2">
            {topLeads.map((l, i) => (
              <div key={l.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-4">{i + 1}.</span>
                  <div>
                    <p className="text-xs text-white">{l.company_name}</p>
                    {l.product_category && <p className="text-[10px] text-violet-400">{l.product_category}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-green-400 font-medium">{fmtRevenue(l.revenue)}</p>
                  {l.phone && <p className="text-[10px] text-cyan-400">{l.phone}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
