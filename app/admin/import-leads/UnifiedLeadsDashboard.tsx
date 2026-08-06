"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import type { ImportLead, LeadStatus } from "@/lib/import-leads/types";
import type { MILead, MILeadPipeline } from "@/lib/market-intelligence/types";
import { MI_PIPELINE_LABELS } from "@/lib/market-intelligence/types";

// ─── Unified model ─────────────────────────────────────────────────────────

type LeadSystem = "import" | "mi";
type Temperature = "HOT" | "WARM" | "COLD";

interface UnifiedLead {
  uid: string;
  system: LeadSystem;
  company: string;
  website?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  telegram?: string;
  source: string;
  score_pct: number;
  temperature: Temperature;
  status_key: string;
  status_label: string;
  status_color: string;
  description: string;
  next_action?: string;
  created_at: string;
  import_data?: ImportLead;
  mi_data?: MILead;
}

const TEMP_COLORS: Record<Temperature, string> = {
  HOT:  "bg-red-900/40 text-red-300 border-red-700",
  WARM: "bg-amber-900/40 text-amber-300 border-amber-700",
  COLD: "bg-slate-700/40 text-slate-400 border-slate-600",
};

const IMPORT_STATUS_COLORS: Record<string, string> = {
  new:       "bg-blue-900/40 text-blue-300 border-blue-700",
  reviewed:  "bg-slate-700/40 text-slate-300 border-slate-600",
  approved:  "bg-green-900/40 text-green-300 border-green-700",
  rejected:  "bg-red-900/20 text-red-400 border-red-900",
  contacted: "bg-purple-900/40 text-purple-300 border-purple-700",
};
const IMPORT_STATUS_LABELS: Record<string, string> = {
  new: "Новый", reviewed: "Просмотрен", approved: "Одобрен",
  rejected: "Отклонён", contacted: "Контактировали",
};

const MI_PIPE_COLORS: Record<string, string> = {
  NEW:         "bg-blue-900/40 text-blue-300 border-blue-700",
  REVIEW:      "bg-slate-700/40 text-slate-300 border-slate-600",
  CONTACT:     "bg-purple-900/40 text-purple-300 border-purple-700",
  NEGOTIATION: "bg-amber-900/40 text-amber-300 border-amber-700",
  CLIENT:      "bg-green-900/40 text-green-300 border-green-700",
  LOST:        "bg-red-900/20 text-red-400 border-red-900",
};

// ─── Normalizers ────────────────────────────────────────────────────────────

function normalizeImport(l: ImportLead): UnifiedLead {
  const imports = l.imports ?? "likely";
  const temp: Temperature = imports === "yes" ? "HOT" : imports === "likely" ? "WARM" : "COLD";
  const score_pct = Math.round((l.score ?? 1) * 20);
  const status = l.status ?? "new";
  return {
    uid: `import:${l.lead_id}`,
    system: "import",
    company: l.company,
    website: l.website,
    city: l.city,
    country: l.country,
    phone: l.phone,
    email: l.email,
    telegram: l.telegram,
    source: l.source ?? "search",
    score_pct,
    temperature: temp,
    status_key: status,
    status_label: IMPORT_STATUS_LABELS[status] ?? status,
    status_color: IMPORT_STATUS_COLORS[status] ?? IMPORT_STATUS_COLORS.new,
    description: l.why ?? l.offer ?? "",
    next_action: l.offer,
    created_at: l.created_at,
    import_data: l,
  };
}

function normalizeMI(l: MILead): UnifiedLead {
  const pipeline = l.pipeline ?? "NEW";
  return {
    uid: `mi:${l.leadId}`,
    system: "mi",
    company: l.company,
    website: l.website,
    city: l.city,
    country: l.country,
    phone: l.phone,
    email: l.email,
    telegram: l.telegram,
    source: l.source,
    score_pct: l.score,
    temperature: l.temperature,
    status_key: pipeline,
    status_label: MI_PIPELINE_LABELS[pipeline as MILeadPipeline] ?? pipeline,
    status_color: MI_PIPE_COLORS[pipeline] ?? MI_PIPE_COLORS.NEW,
    description: l.description ?? l.scoreReason ?? "",
    next_action: l.nextAction,
    created_at: l.createdAt,
    mi_data: l,
  };
}

// ─── ScoreBar ────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : score >= 40 ? "bg-orange-500" : "bg-slate-600";
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold text-white w-6 text-right">{score}</span>
    </div>
  );
}

const SOURCE_ICON: Record<string, string> = {
  google: "🔍", telegram: "✈️", vk: "💬", search: "🌐", manual: "✏️",
};

// ─── Main component ──────────────────────────────────────────────────────────

export default function UnifiedLeadsDashboard() {
  const [allLeads,    setAllLeads]    = useState<UnifiedLead[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [running,     setRunning]     = useState(false);
  const [runResult,   setRunResult]   = useState("");
  const [expanded,    setExpanded]    = useState<string | null>(null);
  const [updating,    setUpdating]    = useState<string | null>(null);
  const [toast,       setToast]       = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  // Filters
  const [filterTemp,   setFilterTemp]   = useState<Temperature | "all">("all");
  const [filterSource, setFilterSource] = useState<"all" | "import" | "mi">("all");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQ,      setSearchQ]      = useState("");

  function showToast(msg: string, type: "ok" | "err") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  }

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch("/api/import-leads/leads").then(r => r.json()).catch(() => ({ ok: false, leads: [] })),
        fetch("/api/market-intelligence/leads").then(r => r.json()).catch(() => []),
      ]);
      const importLeads: UnifiedLead[] = (r1.leads ?? []).map(normalizeImport);
      const miLeads: UnifiedLead[] = (Array.isArray(r2) ? r2 : []).map(normalizeMI);

      // Deduplicate by company name (prefer import version if same company)
      const seen = new Set<string>();
      const combined: UnifiedLead[] = [];
      for (const l of [...importLeads, ...miLeads]) {
        const key = l.company.toLowerCase().trim();
        if (!seen.has(key)) { seen.add(key); combined.push(l); }
      }
      combined.sort((a, b) => b.score_pct - a.score_pct);
      setAllLeads(combined);
    } catch { setAllLeads([]); }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function runSearch() {
    setRunning(true); setRunResult("");
    try {
      const [r1, r2] = await Promise.all([
        fetch("/api/import-leads/run", { method: "POST", body: "{}" }).then(r => r.json()).catch(() => ({})),
        fetch("/api/market-intelligence/leads", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sources: ["google", "telegram", "vk"], limit: 5 }),
        }).then(r => r.json()).catch(() => ({})),
      ]);
      const saved1 = r1.result?.saved ?? 0;
      const found2 = (r2.google ?? 0) + (r2.telegram ?? 0) + (r2.vk ?? 0);
      setRunResult(`✅ Импорт-поиск: +${saved1} | Lead Finder: +${found2} (Google ${r2.google ?? 0}, Telegram ${r2.telegram ?? 0}, VK ${r2.vk ?? 0})`);
      await loadAll();
    } catch { setRunResult("⚠️ Ошибка поиска"); }
    setRunning(false);
  }

  // ─── Status update for import leads ────────────────────────────────────────

  async function updateImportStatus(lead: UnifiedLead, status: LeadStatus) {
    if (!lead.import_data) return;
    setUpdating(lead.uid);
    try {
      const res = await fetch("/api/import-leads/leads", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.import_data.lead_id, status, lead: lead.import_data }),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (!data.ok) { showToast(`Ошибка: ${data.error ?? "unknown"}`, "err"); return; }
      setAllLeads(prev => prev.map(l => l.uid === lead.uid
        ? { ...l, status_key: status, status_label: IMPORT_STATUS_LABELS[status] ?? status, status_color: IMPORT_STATUS_COLORS[status] }
        : l
      ));
      if (status === "approved") {
        showToast(data.crmLeadId ? "✅ Одобрен и добавлен в CRM → /admin/leads" : "✅ Одобрен", "ok");
      } else {
        showToast(`Статус: ${IMPORT_STATUS_LABELS[status]}`, "ok");
      }
    } finally { setUpdating(null); }
  }

  // ─── Pipeline update for MI leads ──────────────────────────────────────────

  async function updateMIPipeline(lead: UnifiedLead, pipeline: MILeadPipeline) {
    if (!lead.mi_data?.id) return;
    setUpdating(lead.uid);
    try {
      const res = await fetch("/api/market-intelligence/leads", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.mi_data.id, pipeline, lead: pipeline === "CONTACT" ? lead.mi_data : undefined }),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      setAllLeads(prev => prev.map(l => l.uid === lead.uid
        ? { ...l, status_key: pipeline, status_label: MI_PIPELINE_LABELS[pipeline], status_color: MI_PIPE_COLORS[pipeline] }
        : l
      ));
      if (pipeline === "CONTACT") {
        showToast(data.crmLeadId ? "✅ Добавлен в CRM → /admin/leads" : "⚠️ Статус обновлён, перенос не удался", data.crmLeadId ? "ok" : "err");
      } else {
        showToast(`Статус: ${MI_PIPELINE_LABELS[pipeline]}`, "ok");
      }
    } finally { setUpdating(null); }
  }

  // ─── Filters ────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => allLeads.filter(l => {
    if (filterTemp !== "all" && l.temperature !== filterTemp) return false;
    if (filterSource !== "all" && l.system !== filterSource) return false;
    if (filterStatus && l.status_key !== filterStatus) return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      if (!l.company.toLowerCase().includes(q) && !(l.website ?? "").toLowerCase().includes(q)) return false;
    }
    return true;
  }), [allLeads, filterTemp, filterSource, filterStatus, searchQ]);

  const stats = useMemo(() => ({
    total: allLeads.length,
    hot:   allLeads.filter(l => l.temperature === "HOT").length,
    warm:  allLeads.filter(l => l.temperature === "WARM").length,
    import_count: allLeads.filter(l => l.system === "import").length,
    mi_count:     allLeads.filter(l => l.system === "mi").length,
    in_crm: allLeads.filter(l =>
      (l.system === "import" && l.status_key === "approved") ||
      (l.system === "mi" && ["CONTACT","NEGOTIATION","CLIENT"].includes(l.status_key))
    ).length,
  }), [allLeads]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-xl border ${
          toast.type === "ok" ? "bg-green-900/90 border-green-700 text-green-200" : "bg-red-900/90 border-red-700 text-red-200"
        }`}>{toast.msg}</div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">🎯 Поиск клиентов</h1>
          <p className="text-slate-400 text-sm mt-0.5">AI-поиск через Google, Telegram, VK + анализ импортёров</p>
        </div>
        <button onClick={runSearch} disabled={running}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold text-sm rounded-xl transition-colors">
          {running ? "⏳ Идёт поиск..." : "🚀 Запустить поиск"}
        </button>
      </div>

      {runResult && (
        <div className="px-4 py-3 bg-blue-900/20 border border-blue-700/40 rounded-xl text-blue-300 text-sm">{runResult}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: "Всего",        value: stats.total,        color: "text-white" },
          { label: "🔥 HOT",       value: stats.hot,          color: "text-red-400" },
          { label: "🟡 WARM",      value: stats.warm,         color: "text-amber-400" },
          { label: "Импорт-поиск", value: stats.import_count, color: "text-emerald-400" },
          { label: "Lead Finder",  value: stats.mi_count,     color: "text-blue-400" },
          { label: "→ В CRM",      value: stats.in_crm,       color: "text-purple-400" },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
          placeholder="Поиск по компании..."
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 w-48" />

        {(["all","HOT","WARM","COLD"] as const).map(t => (
          <button key={t} onClick={() => setFilterTemp(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              filterTemp === t ? "bg-slate-700 border-slate-500 text-white" : "border-slate-800 text-slate-500 hover:border-slate-600"
            }`}>
            {t === "all" ? "Все темп." : t}
          </button>
        ))}

        <div className="w-px h-5 bg-slate-700 mx-1" />

        {([
          { key: "all",    label: "Все источники" },
          { key: "import", label: "🌐 Импорт-поиск" },
          { key: "mi",     label: "🔍 Lead Finder" },
        ] as const).map(s => (
          <button key={s.key} onClick={() => setFilterSource(s.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              filterSource === s.key ? "bg-slate-700 border-slate-500 text-white" : "border-slate-800 text-slate-500 hover:border-slate-600"
            }`}>
            {s.label}
          </button>
        ))}

        <span className="ml-auto text-slate-500 text-xs">Найдено: {filtered.length} из {allLeads.length}</span>
      </div>

      {/* Leads list */}
      {loading ? (
        <div className="text-center py-16 text-slate-600">Загрузка...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-slate-500">Лидов нет. Нажмите «Запустить поиск»</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(lead => (
            <div key={lead.uid}
              className={`bg-slate-900 border rounded-xl overflow-hidden transition ${
                lead.temperature === "HOT" ? "border-red-700/40" : "border-slate-800"
              }`}>
              {/* Card header */}
              <div className="p-4 cursor-pointer hover:bg-slate-800/40 transition"
                onClick={() => setExpanded(expanded === lead.uid ? null : lead.uid)}>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-lg">{SOURCE_ICON[lead.source] ?? "📋"}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white text-sm">{lead.company}</span>
                      {lead.city && <span className="text-slate-500 text-xs">📍 {lead.city}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${TEMP_COLORS[lead.temperature]}`}>
                        {lead.temperature}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${lead.status_color}`}>
                        {lead.status_label}
                      </span>
                      {/* Source badge */}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        {lead.system === "import" ? "Импорт-поиск" : "Lead Finder"}
                      </span>
                    </div>
                    {lead.description && (
                      <p className="text-slate-400 text-xs mt-1 line-clamp-1">{lead.description}</p>
                    )}
                  </div>

                  <ScoreBar score={lead.score_pct} />
                </div>
              </div>

              {/* Expanded */}
              {expanded === lead.uid && (
                <div className="border-t border-slate-800 p-4 space-y-4 bg-slate-900/60">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {lead.website && (
                      <div>
                        <p className="text-slate-500 mb-1">Сайт</p>
                        <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-blue-400 hover:underline truncate block">{lead.website}</a>
                      </div>
                    )}
                    {lead.phone && <div><p className="text-slate-500 mb-1">Телефон</p><p className="text-white">{lead.phone}</p></div>}
                    {lead.email && <div><p className="text-slate-500 mb-1">Email</p><p className="text-white">{lead.email}</p></div>}
                    {lead.telegram && (
                      <div>
                        <p className="text-slate-500 mb-1">Telegram</p>
                        <a href={`https://t.me/${lead.telegram.replace("@","")}`} target="_blank" rel="noopener noreferrer"
                          className="text-purple-400 hover:underline">{lead.telegram}</a>
                      </div>
                    )}
                  </div>

                  {lead.description && (
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Почему интересны</p>
                      <p className="text-slate-300 text-xs leading-relaxed">{lead.description}</p>
                    </div>
                  )}

                  {lead.next_action && (
                    <div className="px-3 py-2 bg-slate-800/60 rounded-lg border border-slate-700">
                      <p className="text-slate-500 text-xs mb-1">Что предложить / Следующий шаг</p>
                      <p className="text-green-300 text-xs">{lead.next_action}</p>
                    </div>
                  )}

                  {/* Message for import leads */}
                  {lead.system === "import" && lead.import_data?.message && (
                    <div className="px-3 py-2 bg-slate-800/60 rounded-lg border border-slate-700">
                      <p className="text-slate-500 text-xs mb-1">Готовое сообщение</p>
                      <p className="text-slate-300 text-xs leading-relaxed">{lead.import_data.message}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div>
                    <p className="text-slate-500 text-xs mb-2">Действия:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {lead.system === "import" && (
                        <>
                          {(["reviewed","contacted","approved","rejected"] as LeadStatus[]).map(s => (
                            <button key={s}
                              disabled={updating === lead.uid || lead.status_key === s}
                              onClick={() => updateImportStatus(lead, s)}
                              className={`px-3 py-1.5 rounded-lg text-xs border transition disabled:opacity-40 ${
                                lead.status_key === s
                                  ? IMPORT_STATUS_COLORS[s]
                                  : "border-slate-700 text-slate-400 hover:border-slate-500"
                              }`}>
                              {IMPORT_STATUS_LABELS[s]}
                            </button>
                          ))}
                          <span className="text-slate-600 text-xs self-center ml-1">
                            «Одобрить» → добавить в CRM
                          </span>
                        </>
                      )}
                      {lead.system === "mi" && (
                        <>
                          {(Object.keys(MI_PIPELINE_LABELS) as MILeadPipeline[]).map(p => (
                            <button key={p}
                              disabled={updating === lead.uid || lead.status_key === p}
                              onClick={() => updateMIPipeline(lead, p)}
                              className={`px-3 py-1.5 rounded-lg text-xs border transition disabled:opacity-40 ${
                                lead.status_key === p
                                  ? MI_PIPE_COLORS[p]
                                  : "border-slate-700 text-slate-400 hover:border-slate-500"
                              }`}>
                              {MI_PIPELINE_LABELS[p]}
                            </button>
                          ))}
                          <span className="text-slate-600 text-xs self-center ml-1">
                            «Контакт» → добавить в CRM
                          </span>
                        </>
                      )}
                    </div>
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
