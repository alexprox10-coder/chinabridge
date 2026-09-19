"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { AdminNav } from "@/components/admin/AdminNav";

type Priority = "LOW" | "MEDIUM" | "HIGH" | "HOT";
type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

interface EvidenceItem { field: string; value: unknown; source: string; type: string; }

interface IntakeLead {
  id: string;
  source: string; source_type: string; source_url: string;
  tg_username: string; tg_chat: string;
  intent: string; intent_subtype: string;
  lead_score: number; evidence_score: number; final_score: number; confidence: number;
  priority: Priority; stream: number | null;
  country: string; city: string; destination: string;
  product: string; product_category: string; business_type: string;
  supplier_exists: boolean;
  weight_kg: number | null; volume_m3: number | null; packages: number | null; urgency: string;
  recommended_offer: string;
  qualification_reason: string;
  key_signals: string[] | string;
  evidence_data: EvidenceItem[] | string;
  ai_reply_draft: string;
  product_hint: string; geography_hint: string;
  approval_status: ApprovalStatus;
  crm_lead_id: string;
  processing_status: string;
  created_at: string;
  raw_text_preview: string;
  normalized_text_preview: string;
}

interface KPI {
  total: string | number; hot: string | number; high: string | number; medium: string | number;
  noise: string | number; pending_approval: string | number;
  stream1: string | number; stream4: string | number;
  existing_supplier: string | number; crm_created: string | number;
  avg_score: string | number; last_24h: string | number;
}

interface StatsData {
  kpi: KPI;
  byIntent: Array<{ intent: string; cnt: string | number; avg_score: string | number }>;
  byCountry: Array<{ country: string; cnt: string | number }>;
  leads: IntakeLead[];
  trend: Array<{ day: string; qualified: string | number; hot: string | number; high: string | number }>;
  funnel: Array<{ event: string; cnt: string | number }>;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  HOT: "bg-red-500 text-white", HIGH: "bg-amber-500 text-black",
  MEDIUM: "bg-[#229ED9] text-white", LOW: "bg-[#1e3a5f] text-[#8899aa]",
};
const INTENT_LABELS: Record<string, string> = {
  DELIVERY: "Доставка", EXISTING_SUPPLIER: "Свой поставщик",
  SUPPLIER_SEARCH: "Поиск поставщика", WHOLESALE: "Опт",
  B2B_IMPORT: "B2B импорт", PRICE_CHECK: "Запрос цены",
  GENERAL_QUESTION: "Вопрос", NOISE: "Шум", UNKNOWN: "Неизвестно",
};
const APPROVAL_STYLES: Record<ApprovalStatus, string> = {
  PENDING: "text-amber-400", APPROVED: "text-[#00A86B]", REJECTED: "text-red-400",
};
const URGENCY_COLORS: Record<string, string> = {
  HIGH: "text-red-400", MEDIUM: "text-amber-400", LOW: "text-[#8899aa]",
};

const n = (v: unknown) => Number(v ?? 0);
const parseArr = <T,>(v: T[] | string): T[] => {
  if (Array.isArray(v)) return v;
  try { return JSON.parse(v as string) as T[]; } catch { return []; }
};

export default function IntakeDashboard() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(7);
  const [filterStream, setFilterStream] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterApproval, setFilterApproval] = useState("");
  const [filterIntent, setFilterIntent] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [crmLoadingId, setCrmLoadingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ days: String(days) });
      if (filterStream) params.set("stream", filterStream);
      if (filterPriority) params.set("priority", filterPriority);
      if (filterApproval) params.set("approval", filterApproval);
      if (filterIntent) params.set("intent", filterIntent);
      const r = await fetch(`/api/outbound/intake-stats?${params}`);
      const d = await r.json();
      if (d.ok) setData(d);
      else setError(d.error ?? "error");
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  }, [days, filterStream, filterPriority, filterApproval, filterIntent]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function approve(id: string, status: ApprovalStatus) {
    setApprovingId(id);
    try {
      await fetch("/api/outbound/intake-stats", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, approval_status: status }),
      });
      setData(prev => prev ? {
        ...prev,
        leads: prev.leads.map(l => l.id === id ? { ...l, approval_status: status } : l),
      } : prev);
    } finally { setApprovingId(null); }
  }

  async function createCrmLead(lead: IntakeLead) {
    if (lead.crm_lead_id) return;
    setCrmLoadingId(lead.id);
    try {
      const r = await fetch("/api/outbound/intake-crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: lead.id }),
      });
      const d = await r.json();
      if (d.ok) {
        setData(prev => prev ? {
          ...prev,
          leads: prev.leads.map(l => l.id === lead.id ? { ...l, crm_lead_id: d.crm_lead_id, approval_status: "APPROVED" } : l),
        } : prev);
      }
    } finally { setCrmLoadingId(null); }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true); setImportResult("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("source", "xlsx_import");
      const r = await fetch("/api/outbound/import", { method: "POST", body: fd });
      const d = await r.json();
      if (d.ok) {
        setImportResult(`✓ ${d.results.saved} сохранено · ${d.results.duplicates} дублей · ${d.results.noise} шум`);
        await fetchData();
      } else { setImportResult(`✗ ${d.error}`); }
    } catch (err) { setImportResult(`✗ ${err}`); }
    finally { setImporting(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  const kpi = data?.kpi;

  return (
    <div className="min-h-screen bg-[#060f1e] text-white p-6">
      <AdminNav />
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Intake Pipeline — Parser Club</h1>
            <p className="text-[#8899aa] text-sm mt-1">AI-квалификация · final_score = MIN(lead, 30 + 0.7×evidence)</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <label className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#1e3a5f] ${importing ? "opacity-50" : "hover:border-[#229ED9]"}`}>
              {importing ? "Импорт..." : "📤 XLSX/CSV"}
              <input ref={fileRef} type="file" accept=".xlsx,.csv,.txt" className="hidden" onChange={handleImport} disabled={importing} />
            </label>
            {importResult && <span className="text-xs text-[#8899aa]">{importResult}</span>}
            {[7, 14, 30].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${days === d ? "bg-[#229ED9] text-white" : "bg-[#0b1a2e] text-[#8899aa] border border-[#1e3a5f]"}`}>
                {d}д
              </button>
            ))}
            <button onClick={fetchData} className="px-3 py-1.5 rounded-lg text-xs border border-[#1e3a5f] text-[#8899aa] hover:text-white">↻</button>
          </div>
        </div>

        {loading && <p className="text-[#8899aa]">Загрузка...</p>}
        {error && <p className="text-red-400">Ошибка: {error}</p>}

        {data && (
          <>
            {/* KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6">
              {[
                { label: "Всего", value: n(kpi?.total), color: "text-white" },
                { label: "🔥 HOT", value: n(kpi?.hot), color: "text-red-400" },
                { label: "⚡ HIGH", value: n(kpi?.high), color: "text-amber-400" },
                { label: "📬 Ожидают", value: n(kpi?.pending_approval), color: "text-[#229ED9]" },
                { label: "🏭 CRM создано", value: n(kpi?.crm_created), color: "text-[#00A86B]" },
                { label: "Avg score", value: n(kpi?.avg_score).toFixed(1), color: "text-[#8899aa]" },
              ].map(tile => (
                <div key={tile.label} className="bg-[#0b1a2e] border border-[#1e3a5f] rounded-xl p-3 text-center">
                  <p className="text-[10px] text-[#5a7899]">{tile.label}</p>
                  <p className={`text-xl font-bold ${tile.color}`}>{tile.value}</p>
                </div>
              ))}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {/* Intent breakdown */}
              <div className="bg-[#0b1a2e] border border-[#1e3a5f] rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-[#8899aa] mb-3">По intent</h2>
                <div className="space-y-1.5">
                  {data.byIntent.slice(0, 7).map(row => (
                    <div key={row.intent} className="flex justify-between items-center">
                      <button className="text-xs text-[#8899aa] hover:text-white text-left"
                        onClick={() => setFilterIntent(filterIntent === row.intent ? "" : row.intent)}>
                        {INTENT_LABELS[row.intent] ?? row.intent}
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#445566]">avg {n(row.avg_score)}</span>
                        <span className="text-sm font-bold text-white">{n(row.cnt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Streams */}
              <div className="bg-[#0b1a2e] border border-[#1e3a5f] rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-[#8899aa] mb-3">Потоки и страны</h2>
                <div className="space-y-1.5">
                  {[
                    { label: "Stream 1 (China→KZ)", value: n(kpi?.stream1), dot: "bg-[#00A86B]" },
                    { label: "Stream 4 (Поставщик)", value: n(kpi?.stream4), dot: "bg-[#229ED9]" },
                    { label: "Свой поставщик", value: n(kpi?.existing_supplier), dot: "bg-amber-500" },
                    { label: "24ч", value: n(kpi?.last_24h), dot: "bg-[#1e3a5f]" },
                  ].map(r => (
                    <div key={r.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${r.dot}`} />
                        <span className="text-xs text-[#8899aa]">{r.label}</span>
                      </div>
                      <span className="text-sm font-bold text-white">{r.value}</span>
                    </div>
                  ))}
                  <div className="border-t border-[#1e3a5f] pt-2 mt-2 space-y-1">
                    {data.byCountry.slice(0, 3).map(c => (
                      <div key={c.country} className="flex justify-between">
                        <span className="text-[10px] text-[#5a7899]">{c.country}</span>
                        <span className="text-[10px] text-white">{n(c.cnt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* §32 Funnel */}
              <div className="bg-[#0b1a2e] border border-[#1e3a5f] rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-[#8899aa] mb-3">Воронка событий</h2>
                <div className="space-y-1.5">
                  {data.funnel.slice(0, 8).map(f => (
                    <div key={f.event} className="flex justify-between items-center">
                      <span className="text-[10px] text-[#5a7899] font-mono">{f.event.replace("lead_", "")}</span>
                      <span className="text-xs font-bold text-white">{n(f.cnt)}</span>
                    </div>
                  ))}
                  {data.funnel.length === 0 && <p className="text-[10px] text-[#445566]">Событий пока нет</p>}
                </div>
              </div>
            </div>

            {/* Trend */}
            {data.trend.length > 0 && (
              <div className="bg-[#0b1a2e] border border-[#1e3a5f] rounded-2xl p-5 mb-6">
                <h2 className="text-sm font-semibold text-[#8899aa] mb-4">Тренд ({days}д)</h2>
                <div className="flex items-end gap-1 h-14">
                  {data.trend.map((d, i) => {
                    const maxQ = Math.max(...data.trend.map(t => n(t.qualified)), 1);
                    const h = Math.round((n(d.qualified) / maxQ) * 48);
                    return (
                      <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
                        <span className="text-[8px] text-white">{n(d.qualified) > 0 ? d.qualified : ""}</span>
                        <div className="w-full bg-[#00A86B] rounded-sm" style={{ height: `${Math.max(h, 2)}px` }} />
                        <span className="text-[8px] text-[#5a7899]">
                          {new Date(d.day).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xs text-[#5a7899]">Фильтр:</span>
              {[{ val: "", label: "Все потоки" }, { val: "1", label: "Stream 1" }, { val: "4", label: "Stream 4" }].map(f => (
                <button key={f.val} onClick={() => setFilterStream(f.val)}
                  className={`px-2.5 py-1 rounded text-xs ${filterStream === f.val ? "bg-[#229ED9] text-white" : "bg-[#0b1a2e] text-[#8899aa] border border-[#1e3a5f]"}`}>
                  {f.label}
                </button>
              ))}
              <span className="text-[#1e3a5f]">|</span>
              {(["", "HOT", "HIGH", "MEDIUM"] as const).map(pr => (
                <button key={pr} onClick={() => setFilterPriority(pr)}
                  className={`px-2.5 py-1 rounded text-xs ${filterPriority === pr ? "bg-[#229ED9] text-white" : "bg-[#0b1a2e] text-[#8899aa] border border-[#1e3a5f]"}`}>
                  {pr || "Все"}
                </button>
              ))}
              <span className="text-[#1e3a5f]">|</span>
              {[{ val: "", label: "Все статусы" }, { val: "PENDING", label: "Ожидают" }, { val: "APPROVED", label: "Одобрены" }].map(f => (
                <button key={f.val} onClick={() => setFilterApproval(f.val)}
                  className={`px-2.5 py-1 rounded text-xs ${filterApproval === f.val ? "bg-[#229ED9] text-white" : "bg-[#0b1a2e] text-[#8899aa] border border-[#1e3a5f]"}`}>
                  {f.label}
                </button>
              ))}
              {filterIntent && (
                <button onClick={() => setFilterIntent("")}
                  className="px-2.5 py-1 rounded text-xs bg-amber-900 text-amber-300 border border-amber-700">
                  ✕ {INTENT_LABELS[filterIntent] ?? filterIntent}
                </button>
              )}
              <span className="text-xs text-[#5a7899] ml-auto">{data.leads.length} лидов</span>
            </div>

            {/* Lead Cards */}
            <div className="space-y-3">
              {data.leads.length === 0 && (
                <div className="bg-[#0b1a2e] border border-[#1e3a5f] rounded-2xl p-8 text-center">
                  <p className="text-[#5a7899] text-sm">Лиды не найдены по выбранным фильтрам</p>
                </div>
              )}

              {data.leads.map(lead => {
                const isExpanded = expandedId === lead.id;
                const signals = parseArr<string>(lead.key_signals);
                const evidence = parseArr<EvidenceItem>(lead.evidence_data);
                const hasCrm = !!lead.crm_lead_id;

                return (
                  <div key={lead.id} className={`bg-[#0b1a2e] border rounded-2xl overflow-hidden ${
                    lead.priority === "HOT" ? "border-red-500/50" :
                    lead.priority === "HIGH" ? "border-amber-500/40" : "border-[#1e3a5f]"
                  }`}>
                    <button className="w-full text-left p-4 flex items-start gap-3"
                      onClick={() => setExpandedId(isExpanded ? null : lead.id)}>

                      {/* Score circle */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        lead.final_score >= 70 ? "bg-red-500" :
                        lead.final_score >= 60 ? "bg-amber-500 text-black" :
                        lead.final_score >= 40 ? "bg-[#229ED9]" : "bg-[#1e3a5f] text-[#8899aa]"
                      }`}>{lead.final_score}</div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${PRIORITY_COLORS[lead.priority]}`}>
                            {lead.priority}
                          </span>
                          <span className="text-xs text-[#8899aa] bg-[#0d2040] px-1.5 py-0.5 rounded">
                            {INTENT_LABELS[lead.intent] ?? lead.intent}
                          </span>
                          {lead.stream && <span className="text-[10px] text-[#5a7899]">S{lead.stream}</span>}
                          {lead.supplier_exists && <span className="text-[10px] text-[#00A86B]">✅ Поставщик есть</span>}
                          {lead.weight_kg && <span className="text-[10px] text-[#229ED9]">⚖️ {lead.weight_kg}кг</span>}
                          {lead.urgency && <span className={`text-[10px] ${URGENCY_COLORS[lead.urgency] ?? "text-[#8899aa]"}`}>⏰{lead.urgency}</span>}
                          <span className={`text-[10px] font-semibold ml-auto ${APPROVAL_STYLES[lead.approval_status]}`}>
                            {lead.approval_status}{hasCrm ? " · CRM✓" : ""}
                          </span>
                        </div>
                        <p className="text-xs text-[#aabbcc] line-clamp-2">{lead.raw_text_preview}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {lead.tg_username && <span className="text-[10px] text-[#5a7899]">@{lead.tg_username}</span>}
                          {lead.country && <span className="text-[10px] text-[#5a7899]">🌍 {lead.country}{lead.city ? "·" + lead.city : ""}</span>}
                          {lead.product_hint && <span className="text-[10px] text-[#00A86B]">📦 {lead.product_hint}</span>}
                          <span className="text-[10px] text-[#445566] ml-auto">
                            {new Date(lead.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-[#1e3a5f] pt-4 space-y-4">

                        {/* Raw text */}
                        <div>
                          <p className="text-[10px] text-[#5a7899] mb-1">Исходный текст</p>
                          <p className="text-xs text-[#aabbcc] bg-[#060f1e] rounded-lg p-3 whitespace-pre-wrap">
                            {lead.raw_text_preview}
                          </p>
                        </div>

                        {/* §29 Lead card fields */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { label: "Lead Score", value: lead.lead_score, color: "text-amber-400" },
                            { label: "Evidence", value: lead.evidence_score, color: "text-[#229ED9]" },
                            { label: "Final Score", value: lead.final_score, color: "text-[#00A86B]" },
                            { label: "Confidence", value: lead.confidence + "%", color: "text-[#8899aa]" },
                          ].map(s => (
                            <div key={s.label} className="bg-[#060f1e] rounded-lg p-2.5 text-center">
                              <p className="text-[9px] text-[#5a7899]">{s.label}</p>
                              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Cargo + geo details */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {[
                            { label: "Страна", value: lead.country },
                            { label: "Город", value: lead.city },
                            { label: "Назначение", value: lead.destination },
                            { label: "Товар", value: lead.product || lead.product_hint },
                            { label: "Категория", value: lead.product_category },
                            { label: "Тип бизнеса", value: lead.business_type },
                            { label: "Вес", value: lead.weight_kg ? lead.weight_kg + " кг" : null },
                            { label: "Объём", value: lead.volume_m3 ? lead.volume_m3 + " м³" : null },
                            { label: "Мест", value: lead.packages },
                            { label: "Срочность", value: lead.urgency },
                            { label: "Оффер", value: lead.recommended_offer },
                            { label: "Поставщик", value: lead.supplier_exists ? "✅ Есть" : "❌ Нет" },
                          ].filter(f => f.value).map(f => (
                            <div key={f.label} className="bg-[#060f1e] rounded p-2">
                              <p className="text-[9px] text-[#5a7899]">{f.label}</p>
                              <p className="text-xs text-white font-medium truncate">{String(f.value)}</p>
                            </div>
                          ))}
                        </div>

                        {/* Qualification reason + signals */}
                        {lead.qualification_reason && (
                          <div>
                            <p className="text-[10px] text-[#5a7899] mb-1">Обоснование AI</p>
                            <p className="text-xs text-[#8899aa]">{lead.qualification_reason}</p>
                          </div>
                        )}
                        {signals.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {signals.map((sig, i) => (
                              <span key={i} className="text-[10px] bg-[#0d2040] text-[#8899aa] px-2 py-0.5 rounded-full">{sig}</span>
                            ))}
                          </div>
                        )}

                        {/* Evidence items */}
                        {evidence.length > 0 && (
                          <div>
                            <p className="text-[10px] text-[#5a7899] mb-2">Evidence ({evidence.length} факт{evidence.length > 1 ? "а" : ""})</p>
                            <div className="space-y-1">
                              {evidence.map((e, i) => (
                                <div key={i} className="flex items-center gap-2 text-[10px]">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${e.type === "VERIFIED_FACT" ? "bg-[#00A86B]/20 text-[#00A86B]" : "bg-amber-900/20 text-amber-400"}`}>
                                    {e.type === "VERIFIED_FACT" ? "FACT" : "INFER"}
                                  </span>
                                  <span className="text-[#5a7899]">{e.field}:</span>
                                  <span className="text-white">{String(e.value ?? "—")}</span>
                                  <span className="text-[#445566] ml-auto">[{e.source}]</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* AI Reply Draft */}
                        {lead.ai_reply_draft && (
                          <div>
                            <p className="text-[10px] text-[#5a7899] mb-1">
                              ✍️ Черновик ответа <span className="text-amber-400">(НЕ отправляется автоматически)</span>
                            </p>
                            <div className="bg-[#060f1e] rounded-lg p-3 border border-[#1e3a5f]">
                              <p className="text-xs text-[#aabbcc] whitespace-pre-wrap">{lead.ai_reply_draft}</p>
                            </div>
                          </div>
                        )}

                        {/* Source info */}
                        {(lead.source_url || lead.tg_chat) && (
                          <div className="text-[10px] text-[#445566] flex flex-wrap gap-3">
                            {lead.tg_chat && <span>Чат: {lead.tg_chat}</span>}
                            {lead.source_url && (
                              <a href={lead.source_url} target="_blank" rel="noopener noreferrer" className="text-[#229ED9] hover:underline">
                                Источник ↗
                              </a>
                            )}
                          </div>
                        )}

                        {/* §18 Action buttons */}
                        <div className="flex items-center gap-3 pt-2 flex-wrap border-t border-[#1e3a5f]">
                          {/* Approve/Reject */}
                          {lead.approval_status === "PENDING" && (
                            <>
                              <button disabled={approvingId === lead.id}
                                onClick={() => approve(lead.id, "APPROVED")}
                                className="px-4 py-2 bg-[#00A86B] hover:bg-[#00c47e] disabled:opacity-50 text-white text-xs font-bold rounded-lg">
                                ✓ Одобрить
                              </button>
                              <button disabled={approvingId === lead.id}
                                onClick={() => approve(lead.id, "REJECTED")}
                                className="px-4 py-2 bg-[#1e3a5f] hover:bg-red-900 disabled:opacity-50 text-[#8899aa] text-xs font-bold rounded-lg">
                                ✗ Отклонить
                              </button>
                            </>
                          )}

                          {/* §18 CRM handoff button */}
                          {!hasCrm && lead.approval_status !== "REJECTED" && (
                            <button
                              disabled={crmLoadingId === lead.id}
                              onClick={() => createCrmLead(lead)}
                              className="px-4 py-2 bg-[#229ED9] hover:bg-[#1a7fad] disabled:opacity-50 text-white text-xs font-bold rounded-lg">
                              {crmLoadingId === lead.id ? "Создаю..." : "🏭 Создать CRM Lead"}
                            </button>
                          )}
                          {hasCrm && (
                            <span className="text-[10px] text-[#00A86B] font-semibold">
                              ✓ CRM Lead создан — ID: {lead.crm_lead_id}
                            </span>
                          )}

                          {lead.approval_status !== "PENDING" && !hasCrm && (
                            <button onClick={() => approve(lead.id, "PENDING")}
                              className="text-[10px] text-[#5a7899] hover:text-white ml-auto">
                              Сбросить статус
                            </button>
                          )}

                          <span className="text-[10px] text-[#445566] ml-auto">
                            ⚠️ V1: первые 100 лидов — ручное одобрение
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
