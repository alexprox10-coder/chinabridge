"use client";
import { useEffect, useState, useCallback, useRef } from "react";

type Priority = "LOW" | "MEDIUM" | "HIGH" | "HOT";
type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

interface IntakeLead {
  id: string;
  source: string;
  tg_username: string;
  tg_chat: string;
  intent: string;
  lead_score: number;
  evidence_score: number;
  final_score: number;
  priority: Priority;
  stream: number | null;
  qualification_reason: string;
  key_signals: string[] | string;
  ai_reply_draft: string;
  product_hint: string;
  geography_hint: string;
  approval_status: ApprovalStatus;
  created_at: string;
  raw_text_preview: string;
}

interface KPI {
  total: string | number;
  hot: string | number;
  high: string | number;
  medium: string | number;
  noise: string | number;
  pending_approval: string | number;
  stream1: string | number;
  stream4: string | number;
  avg_score: string | number;
  last_24h: string | number;
}

interface StatsData {
  kpi: KPI;
  byIntent: Array<{ intent: string; cnt: string | number }>;
  leads: IntakeLead[];
  trend: Array<{ day: string; qualified: string | number; hot: string | number }>;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  HOT:    "bg-red-500 text-white",
  HIGH:   "bg-amber-500 text-black",
  MEDIUM: "bg-[#229ED9] text-white",
  LOW:    "bg-[#1e3a5f] text-[#8899aa]",
};

const INTENT_LABELS: Record<string, string> = {
  DELIVERY:          "Доставка",
  EXISTING_SUPPLIER: "Свой поставщик",
  SUPPLIER_SEARCH:   "Поиск поставщика",
  WHOLESALE:         "Опт",
  B2B_IMPORT:        "B2B импорт",
  PRICE_CHECK:       "Запрос цены",
  GENERAL_QUESTION:  "Вопрос",
  NOISE:             "Шум",
  UNKNOWN:           "Неизвестно",
};

const APPROVAL_STYLES: Record<ApprovalStatus, string> = {
  PENDING:  "text-amber-400",
  APPROVED: "text-[#00A86B]",
  REJECTED: "text-red-400",
};

function n(v: string | number | null | undefined): number {
  return Number(v ?? 0);
}

function parseSignals(signals: string[] | string): string[] {
  if (Array.isArray(signals)) return signals;
  try { return JSON.parse(signals as string); } catch { return []; }
}

export default function IntakeDashboard() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(7);
  const [filterStream, setFilterStream] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<string>("");
  const [filterApproval, setFilterApproval] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ days: String(days) });
      if (filterStream) params.set("stream", filterStream);
      if (filterPriority) params.set("priority", filterPriority);
      if (filterApproval) params.set("approval", filterApproval);
      const r = await fetch(`/api/outbound/intake-stats?${params}`);
      const d = await r.json();
      if (d.ok) setData(d);
      else setError(d.error ?? "error");
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  }, [days, filterStream, filterPriority, filterApproval]);

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
        leads: prev.leads.map(l => l.id === id ? { ...l, approval_status: status as ApprovalStatus } : l),
      } : prev);
    } finally { setApprovingId(null); }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("source", "xlsx_import");
      const r = await fetch("/api/outbound/import", { method: "POST", body: fd });
      const d = await r.json();
      if (d.ok) {
        setImportResult(`✓ Импорт: ${d.results.saved} сохранено, ${d.results.duplicates} дублей, ${d.results.noise} шум`);
        await fetchData();
      } else {
        setImportResult(`✗ Ошибка: ${d.error}`);
      }
    } catch (err) {
      setImportResult(`✗ ${err}`);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const kpi = data?.kpi;

  return (
    <div className="min-h-screen bg-[#060f1e] text-white p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Intake Pipeline — Лиды из Parser Club</h1>
            <p className="text-[#8899aa] text-sm mt-1">
              AI-квалификация · Formula: MIN(lead_score, 30 + 0.7 × evidence_score)
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* File import */}
            <label className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#1e3a5f] ${importing ? "opacity-50" : "hover:border-[#229ED9]"}`}>
              {importing ? "Импорт..." : "📤 Импорт XLSX/CSV"}
              <input ref={fileRef} type="file" accept=".xlsx,.csv,.txt" className="hidden" onChange={handleImport} disabled={importing} />
            </label>
            {importResult && (
              <span className="text-xs text-[#8899aa]">{importResult}</span>
            )}
            {/* Days filter */}
            {[7, 14, 30].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${days === d ? "bg-[#229ED9] text-white" : "bg-[#0b1a2e] text-[#8899aa] border border-[#1e3a5f]"}`}>
                {d}д
              </button>
            ))}
            <button onClick={fetchData} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0b1a2e] border border-[#1e3a5f] text-[#8899aa] hover:text-white">
              ↻
            </button>
          </div>
        </div>

        {loading && <p className="text-[#8899aa]">Загрузка...</p>}
        {error && <p className="text-red-400">Ошибка: {error}</p>}

        {data && (
          <>
            {/* KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              {[
                { label: "Всего", value: n(kpi?.total), color: "text-white" },
                { label: "🔥 HOT", value: n(kpi?.hot), color: "text-red-400" },
                { label: "⚡ HIGH", value: n(kpi?.high), color: "text-amber-400" },
                { label: "📬 Ожидают", value: n(kpi?.pending_approval), color: "text-[#229ED9]" },
                { label: "Avg score", value: n(kpi?.avg_score).toFixed(1), color: "text-[#00A86B]" },
              ].map(tile => (
                <div key={tile.label} className="bg-[#0b1a2e] border border-[#1e3a5f] rounded-xl p-4 text-center">
                  <p className="text-[10px] text-[#5a7899]">{tile.label}</p>
                  <p className={`text-2xl font-bold ${tile.color}`}>{tile.value}</p>
                </div>
              ))}
            </div>

            {/* Stream + Intent breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-[#0b1a2e] border border-[#1e3a5f] rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-[#8899aa] mb-3">По потокам</h2>
                <div className="space-y-2">
                  {[
                    { label: "Stream 1 — China→KZ", value: n(kpi?.stream1), color: "bg-[#00A86B]" },
                    { label: "Stream 4 — Свой поставщик", value: n(kpi?.stream4), color: "bg-[#229ED9]" },
                    { label: "Последние 24ч", value: n(kpi?.last_24h), color: "bg-amber-500" },
                    { label: "Шум отфильтрован", value: n(kpi?.noise), color: "bg-[#1e3a5f]" },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${row.color}`} />
                        <span className="text-xs text-[#8899aa]">{row.label}</span>
                      </div>
                      <span className="text-sm font-bold text-white">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#0b1a2e] border border-[#1e3a5f] rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-[#8899aa] mb-3">По intent</h2>
                <div className="space-y-2">
                  {data.byIntent.slice(0, 6).map(row => (
                    <div key={row.intent} className="flex items-center justify-between">
                      <span className="text-xs text-[#8899aa]">{INTENT_LABELS[row.intent] ?? row.intent}</span>
                      <span className="text-sm font-bold text-white">{n(row.cnt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Trend sparkline */}
            {data.trend.length > 0 && (
              <div className="bg-[#0b1a2e] border border-[#1e3a5f] rounded-2xl p-5 mb-6">
                <h2 className="text-sm font-semibold text-[#8899aa] mb-4">Тренд по дням</h2>
                <div className="flex items-end gap-1 h-16">
                  {data.trend.map((d, i) => {
                    const maxQ = Math.max(...data.trend.map(t => n(t.qualified)), 1);
                    const h = Math.round((n(d.qualified) / maxQ) * 56);
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
              {(["", "HOT", "HIGH", "MEDIUM", "LOW"] as const).map(p => (
                <button key={p} onClick={() => setFilterPriority(p)}
                  className={`px-2.5 py-1 rounded text-xs ${filterPriority === p ? "bg-[#229ED9] text-white" : "bg-[#0b1a2e] text-[#8899aa] border border-[#1e3a5f]"}`}>
                  {p || "Все"}
                </button>
              ))}
              <span className="text-[#1e3a5f]">|</span>
              {[{ val: "", label: "Все" }, { val: "PENDING", label: "Ожидают" }, { val: "APPROVED", label: "Одобрены" }, { val: "REJECTED", label: "Отклонены" }].map(f => (
                <button key={f.val} onClick={() => setFilterApproval(f.val)}
                  className={`px-2.5 py-1 rounded text-xs ${filterApproval === f.val ? "bg-[#229ED9] text-white" : "bg-[#0b1a2e] text-[#8899aa] border border-[#1e3a5f]"}`}>
                  {f.label}
                </button>
              ))}
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
                const signals = parseSignals(lead.key_signals);
                return (
                  <div key={lead.id} className={`bg-[#0b1a2e] border rounded-2xl overflow-hidden transition-all ${
                    lead.priority === "HOT" ? "border-red-500/40" :
                    lead.priority === "HIGH" ? "border-amber-500/40" : "border-[#1e3a5f]"
                  }`}>
                    {/* Card Header */}
                    <button
                      className="w-full text-left p-4 flex items-start gap-3"
                      onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                    >
                      {/* Score circle */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        lead.final_score >= 70 ? "bg-red-500" :
                        lead.final_score >= 60 ? "bg-amber-500 text-black" :
                        lead.final_score >= 40 ? "bg-[#229ED9]" : "bg-[#1e3a5f] text-[#8899aa]"
                      }`}>
                        {lead.final_score}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${PRIORITY_COLORS[lead.priority]}`}>
                            {lead.priority}
                          </span>
                          <span className="text-xs text-[#8899aa] bg-[#0d2040] px-1.5 py-0.5 rounded">
                            {INTENT_LABELS[lead.intent] ?? lead.intent}
                          </span>
                          {lead.stream && (
                            <span className="text-[10px] text-[#5a7899]">Stream {lead.stream}</span>
                          )}
                          <span className={`text-[10px] font-semibold ml-auto ${APPROVAL_STYLES[lead.approval_status]}`}>
                            {lead.approval_status}
                          </span>
                        </div>

                        <p className="text-xs text-[#aabbcc] line-clamp-2">{lead.raw_text_preview}</p>

                        <div className="flex items-center gap-3 mt-1">
                          {lead.tg_username && (
                            <span className="text-[10px] text-[#5a7899]">@{lead.tg_username}</span>
                          )}
                          {lead.product_hint && (
                            <span className="text-[10px] text-[#00A86B]">📦 {lead.product_hint}</span>
                          )}
                          {lead.geography_hint && (
                            <span className="text-[10px] text-[#229ED9]">📍 {lead.geography_hint}</span>
                          )}
                          <span className="text-[10px] text-[#445566] ml-auto">
                            {new Date(lead.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Expanded */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-[#1e3a5f] pt-4 space-y-4">
                        {/* Full text */}
                        <div>
                          <p className="text-[10px] text-[#5a7899] mb-1">Исходный текст</p>
                          <p className="text-xs text-[#aabbcc] bg-[#060f1e] rounded-lg p-3 whitespace-pre-wrap">
                            {lead.raw_text_preview}
                          </p>
                        </div>

                        {/* Score breakdown */}
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: "Lead Score (AI)", value: lead.lead_score, color: "text-amber-400" },
                            { label: "Evidence Score", value: lead.evidence_score, color: "text-[#229ED9]" },
                            { label: "Final Score", value: lead.final_score, color: "text-[#00A86B]" },
                          ].map(s => (
                            <div key={s.label} className="bg-[#060f1e] rounded-lg p-3 text-center">
                              <p className="text-[9px] text-[#5a7899]">{s.label}</p>
                              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Qualification reason + signals */}
                        {lead.qualification_reason && (
                          <div>
                            <p className="text-[10px] text-[#5a7899] mb-1">Обоснование</p>
                            <p className="text-xs text-[#8899aa]">{lead.qualification_reason}</p>
                          </div>
                        )}
                        {signals.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {signals.map((sig, i) => (
                              <span key={i} className="text-[10px] bg-[#0d2040] text-[#8899aa] px-2 py-0.5 rounded-full">
                                {sig}
                              </span>
                            ))}
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

                        {/* Approval buttons */}
                        {lead.approval_status === "PENDING" && (
                          <div className="flex items-center gap-3 pt-2">
                            <button
                              disabled={approvingId === lead.id}
                              onClick={() => approve(lead.id, "APPROVED")}
                              className="px-4 py-2 bg-[#00A86B] hover:bg-[#00c47e] disabled:opacity-50 text-white text-xs font-bold rounded-lg"
                            >
                              ✓ Одобрить
                            </button>
                            <button
                              disabled={approvingId === lead.id}
                              onClick={() => approve(lead.id, "REJECTED")}
                              className="px-4 py-2 bg-[#1e3a5f] hover:bg-red-900 disabled:opacity-50 text-[#8899aa] text-xs font-bold rounded-lg"
                            >
                              ✗ Отклонить
                            </button>
                            <span className="text-[10px] text-[#445566]">
                              ⚠️ V1: первые 100 лидов требуют одобрения
                            </span>
                          </div>
                        )}
                        {lead.approval_status !== "PENDING" && (
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold ${APPROVAL_STYLES[lead.approval_status]}`}>
                              {lead.approval_status === "APPROVED" ? "✓ Одобрено" : "✗ Отклонено"}
                            </span>
                            <button
                              onClick={() => approve(lead.id, "PENDING")}
                              className="text-[10px] text-[#5a7899] hover:text-white ml-auto"
                            >
                              Сбросить
                            </button>
                          </div>
                        )}
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
