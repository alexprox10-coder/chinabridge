"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import type { ImportLead, LeadStatus } from "@/lib/import-leads/types";
import type { MILead, MILeadPipeline } from "@/lib/market-intelligence/types";

// ─── Unified model ─────────────────────────────────────────────────────────

type LeadSystem = "import" | "mi";
type Temperature = "HOT" | "WARM" | "COLD";
type UnifiedStatus = "new" | "reviewed" | "contacted" | "approved" | "rejected";

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
  status: UnifiedStatus;
  description: string;
  next_action?: string;
  message?: string;
  created_at: string;
  import_data?: ImportLead;
  mi_data?: MILead;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TEMP_COLORS: Record<Temperature, string> = {
  HOT:  "bg-red-900/40 text-red-300 border-red-700",
  WARM: "bg-amber-900/40 text-amber-300 border-amber-700",
  COLD: "bg-slate-700/40 text-slate-400 border-slate-600",
};

const STATUS_LABELS: Record<UnifiedStatus, string> = {
  new:       "Новый",
  reviewed:  "Просмотрен",
  contacted: "Контактировали",
  approved:  "Одобрен",
  rejected:  "Отклонён",
};

const STATUS_COLORS: Record<UnifiedStatus, string> = {
  new:       "bg-blue-900/40 text-blue-300 border-blue-700",
  reviewed:  "bg-slate-700/40 text-slate-300 border-slate-600",
  contacted: "bg-purple-900/40 text-purple-300 border-purple-700",
  approved:  "bg-green-900/40 text-green-300 border-green-700",
  rejected:  "bg-red-900/20 text-red-400 border-red-900",
};

// MI pipeline → unified status
const MI_TO_UNIFIED: Record<MILeadPipeline, UnifiedStatus> = {
  NEW:         "new",
  REVIEW:      "reviewed",
  CONTACT:     "contacted",
  NEGOTIATION: "contacted",
  CLIENT:      "approved",
  LOST:        "rejected",
};

// Unified action → MI pipeline
const UNIFIED_TO_MI: Record<UnifiedStatus, MILeadPipeline> = {
  new:       "NEW",
  reviewed:  "REVIEW",
  contacted: "CONTACT",
  approved:  "CLIENT",
  rejected:  "LOST",
};

// The 4 action buttons shown for every lead
const ACTION_BUTTONS: UnifiedStatus[] = ["reviewed", "contacted", "approved", "rejected"];

const SOURCE_ICON: Record<string, string> = {
  google: "🔍", telegram: "✈️", vk: "💬", search: "🌐", manual: "✏️",
};

// ─── Normalizers ─────────────────────────────────────────────────────────────

function normalizeImport(l: ImportLead): UnifiedLead {
  const imports = l.imports ?? "likely";
  const temp: Temperature = imports === "yes" ? "HOT" : imports === "likely" ? "WARM" : "COLD";
  const status = (l.status ?? "new") as UnifiedStatus;
  return {
    uid:         `import:${l.lead_id}`,
    system:      "import",
    company:     l.company,
    website:     l.website,
    city:        l.city,
    country:     l.country,
    phone:       l.phone,
    email:       l.email,
    telegram:    l.telegram,
    source:      l.source ?? "search",
    score_pct:   Math.round((l.score ?? 1) * 20),
    temperature: temp,
    status,
    description: l.why ?? "",
    next_action: l.offer,
    message:     l.message,
    created_at:  l.created_at,
    import_data: l,
  };
}

function normalizeMI(l: MILead): UnifiedLead {
  const pipeline = (l.pipeline ?? "NEW") as MILeadPipeline;
  const status: UnifiedStatus = MI_TO_UNIFIED[pipeline] ?? "new";
  return {
    uid:         `mi:${l.leadId}`,
    system:      "mi",
    company:     l.company,
    website:     l.website,
    city:        l.city,
    country:     l.country,
    phone:       l.phone,
    email:       l.email,
    telegram:    l.telegram,
    source:      l.source,
    score_pct:   l.score,
    temperature: l.temperature,
    status,
    description: l.description ?? l.scoreReason ?? "",
    next_action: l.nextAction,
    created_at:  l.createdAt,
    mi_data:     l,
  };
}

// ─── ScoreBar ─────────────────────────────────────────────────────────────────

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

// ─── Main component ───────────────────────────────────────────────────────────

export default function UnifiedLeadsDashboard() {
  const [allLeads,    setAllLeads]    = useState<UnifiedLead[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [running,     setRunning]     = useState(false);
  const [runResult,   setRunResult]   = useState("");
  const [expanded,    setExpanded]    = useState<string | null>(null);
  const [updating,    setUpdating]    = useState<string | null>(null);
  const [toast,       setToast]       = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const [filterTemp,   setFilterTemp]   = useState<Temperature | "all">("all");
  const [filterSource, setFilterSource] = useState<"all" | "import" | "mi">("all");
  const [filterStatus, setFilterStatus] = useState<UnifiedStatus | "all">("all");
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
      const importLeads = (r1.leads ?? []).map(normalizeImport);
      const miLeads     = (Array.isArray(r2) ? r2 : []).map(normalizeMI);

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

  // ─── Unified action handler ─────────────────────────────────────────────────

  async function handleAction(lead: UnifiedLead, action: UnifiedStatus) {
    if (updating) return;
    setUpdating(lead.uid);

    const isCRM = action === "approved";

    try {
      if (lead.system === "import" && lead.import_data) {
        const res = await fetch("/api/import-leads/leads", {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId: lead.import_data.lead_id, status: action as LeadStatus, lead: lead.import_data }),
        });
        const data = await res.json().catch(() => ({ ok: false }));
        if (!data.ok) { showToast(`Ошибка: ${data.error ?? "unknown"}`, "err"); return; }
        if (isCRM) showToast(data.crmLeadId ? "✅ Одобрен и добавлен в CRM" : "✅ Одобрен", "ok");
        else showToast(`Статус: ${STATUS_LABELS[action]}`, "ok");

      } else if (lead.system === "mi" && lead.mi_data?.id) {
        const pipeline = UNIFIED_TO_MI[action];
        const res = await fetch("/api/market-intelligence/leads", {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: lead.mi_data.id, pipeline, lead: isCRM ? lead.mi_data : undefined }),
        });
        const data = await res.json().catch(() => ({ ok: false }));
        if (isCRM) showToast(data.crmLeadId ? "✅ Одобрен и добавлен в CRM" : "✅ Одобрен", "ok");
        else showToast(`Статус: ${STATUS_LABELS[action]}`, "ok");
      }

      setAllLeads(prev => prev.map(l => l.uid === lead.uid ? { ...l, status: action } : l));
    } finally { setUpdating(null); }
  }

  // ─── Filters ─────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => allLeads.filter(l => {
    if (filterTemp !== "all" && l.temperature !== filterTemp) return false;
    if (filterSource !== "all" && l.system !== filterSource) return false;
    if (filterStatus !== "all" && l.status !== filterStatus) return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      if (!l.company.toLowerCase().includes(q) && !(l.website ?? "").toLowerCase().includes(q)) return false;
    }
    return true;
  }), [allLeads, filterTemp, filterSource, filterStatus, searchQ]);

  const stats = useMemo(() => ({
    total:        allLeads.length,
    hot:          allLeads.filter(l => l.temperature === "HOT").length,
    warm:         allLeads.filter(l => l.temperature === "WARM").length,
    import_count: allLeads.filter(l => l.system === "import").length,
    mi_count:     allLeads.filter(l => l.system === "mi").length,
    in_crm:       allLeads.filter(l => l.status === "approved").length,
  }), [allLeads]);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-xl border ${
          toast.type === "ok" ? "bg-green-900/90 border-green-700 text-green-200" : "bg-red-900/90 border-red-700 text-red-200"
        }`}>{toast.msg}</div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">🎯 Поиск лидов</h2>
          <p className="text-slate-400 text-sm mt-0.5">AI-поиск через Google, Telegram, VK + анализ импортёров</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/admin/export/approved-leads?format=csv" target="_blank"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-sm rounded-xl transition-colors border border-slate-600">
            📥 Экспорт контактов
          </a>
          <button onClick={runSearch} disabled={running}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold text-sm rounded-xl transition-colors">
            {running ? "⏳ Идёт поиск..." : "🚀 Запустить поиск"}
          </button>
        </div>
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
          { key: "all" as const,    label: "Все источники" },
          { key: "import" as const, label: "🌐 Импорт" },
          { key: "mi" as const,     label: "🔍 Lead Finder" },
        ]).map(s => (
          <button key={s.key} onClick={() => setFilterSource(s.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              filterSource === s.key ? "bg-slate-700 border-slate-500 text-white" : "border-slate-800 text-slate-500 hover:border-slate-600"
            }`}>
            {s.label}
          </button>
        ))}

        <div className="w-px h-5 bg-slate-700 mx-1" />

        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as UnifiedStatus | "all")}
          className="bg-slate-900 border border-slate-800 text-slate-400 text-xs rounded-lg px-2 py-1.5 focus:outline-none">
          <option value="all">Все статусы</option>
          {(Object.entries(STATUS_LABELS) as [UnifiedStatus, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <span className="ml-auto text-slate-500 text-xs">Найдено: {filtered.length} из {allLeads.length}</span>
      </div>

      {/* Lead cards */}
      {loading ? (
        <div className="text-center py-16 text-slate-600">Загрузка...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
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

              {/* Header row */}
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
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[lead.status]}`}>
                        {STATUS_LABELS[lead.status]}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700">
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

              {/* Expanded panel */}
              {expanded === lead.uid && (
                <div className="border-t border-slate-800 p-4 space-y-4 bg-slate-900/60">

                  {/* Contacts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {lead.website && (
                      <div>
                        <p className="text-slate-500 mb-1">Сайт</p>
                        <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-blue-400 hover:underline truncate block">{lead.website}</a>
                      </div>
                    )}
                    {lead.phone && (
                      <div><p className="text-slate-500 mb-1">Телефон</p>
                        <a href={`tel:${lead.phone}`} className="text-white hover:text-green-400">{lead.phone}</a></div>
                    )}
                    {lead.email && <div><p className="text-slate-500 mb-1">Email</p><p className="text-white">{lead.email}</p></div>}
                    {lead.telegram && (
                      <div>
                        <p className="text-slate-500 mb-1">Telegram</p>
                        <a href={`https://t.me/${lead.telegram.replace("@","")}`} target="_blank" rel="noopener noreferrer"
                          className="text-purple-400 hover:underline">{lead.telegram}</a>
                      </div>
                    )}
                  </div>

                  {/* Why */}
                  {lead.description && (
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Почему интересны</p>
                      <p className="text-slate-300 text-xs leading-relaxed">{lead.description}</p>
                    </div>
                  )}

                  {/* Next action */}
                  {lead.next_action && (
                    <div className="px-3 py-2 bg-slate-800/60 rounded-lg border border-slate-700">
                      <p className="text-slate-500 text-xs mb-1">Что предложить / Следующий шаг</p>
                      <p className="text-green-300 text-xs">{lead.next_action}</p>
                    </div>
                  )}

                  {/* Message */}
                  {lead.message && (
                    <div className="px-3 py-2 bg-slate-800/60 rounded-lg border border-slate-700">
                      <p className="text-slate-500 text-xs mb-1">Готовое сообщение</p>
                      <p className="text-slate-300 text-xs leading-relaxed">{lead.message}</p>
                    </div>
                  )}

                  {/* ─── Action buttons — same for BOTH systems ─── */}
                  <div>
                    <p className="text-slate-500 text-xs mb-2">Действия:</p>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {ACTION_BUTTONS.map(action => (
                        <button key={action}
                          disabled={updating === lead.uid || lead.status === action}
                          onClick={() => handleAction(lead, action)}
                          className={`px-3 py-1.5 rounded-lg text-xs border transition disabled:opacity-40 ${
                            lead.status === action
                              ? STATUS_COLORS[action]
                              : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                          }`}>
                          {STATUS_LABELS[action]}
                        </button>
                      ))}
                      <span className="text-slate-600 text-xs ml-1">«Одобрить» → добавить в CRM</span>
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
