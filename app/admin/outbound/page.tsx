"use client";
import { useState, useEffect, useCallback } from "react";
import { AdminNav } from "@/components/admin/AdminNav";

type Stage =
  | "FOUND" | "ENRICHED" | "ANALYZED" | "PRODUCTS_FOUND" | "CHINA_MATCHED"
  | "ECONOMICS_READY" | "SCORED" | "PERSONALIZED" | "READY_TO_CONTACT"
  | "APPROVED" | "CONTACTED" | "REPLIED" | "QUALIFIED" | "HOT"
  | "QUOTE" | "DEAL" | "ERROR";

interface OutboundLead {
  outboundId: string;
  companyName: string;
  city: string;
  country: string;
  category: string;
  marketplace: string;
  phone: string;
  email: string;
  website: string;
  stage: Stage;
  opportunityScore: number;
  companyScore: number;
  leadScore: number;
  reasonToContact: string;
  personalizedMessage: string;
  messageQualityScore: number;
  responseStatus: string;
  pitchType: string;
  chinaMatchStatus: string;
  products: unknown[];
  economics: Record<string, unknown>;
  source: string;
  vertical: string;
  createdAt: string;
}

interface KpiData {
  total_leads: number;
  funnel: Record<string, number>;
  positive_reply_rate: number | null;
  qualified_rate: number | null;
  hot_count: number;
  deal_count: number;
  china_matched: number;
  avg_opportunity_score: number;
  avg_message_quality: number;
}

const STAGE_LABELS: Record<string, string> = {
  FOUND: "Найден", ENRICHED: "Обогащён", PRODUCTS_FOUND: "Товары", CHINA_MATCHED: "Китай",
  ECONOMICS_READY: "Экономика", SCORED: "Оценён", PERSONALIZED: "Персонализирован",
  READY_TO_CONTACT: "Готов", APPROVED: "Одобрен", CONTACTED: "Отправлено",
  REPLIED: "Ответил", QUALIFIED: "Квалифицирован", HOT: "Горячий",
  QUOTE: "КП", DEAL: "Сделка", ERROR: "Ошибка",
};

const STAGE_COLORS: Record<string, string> = {
  FOUND: "bg-gray-100 text-gray-700", ENRICHED: "bg-blue-100 text-blue-700",
  PRODUCTS_FOUND: "bg-sky-100 text-sky-700", CHINA_MATCHED: "bg-indigo-100 text-indigo-700",
  ECONOMICS_READY: "bg-violet-100 text-violet-700", SCORED: "bg-purple-100 text-purple-700",
  PERSONALIZED: "bg-purple-100 text-purple-700", READY_TO_CONTACT: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-yellow-200 text-yellow-800", CONTACTED: "bg-orange-100 text-orange-700",
  REPLIED: "bg-cyan-100 text-cyan-700", QUALIFIED: "bg-teal-100 text-teal-700",
  HOT: "bg-red-100 text-red-700", QUOTE: "bg-green-100 text-green-700",
  DEAL: "bg-green-600 text-white", ERROR: "bg-red-200 text-red-800",
};

const CHINA_MATCH_BADGE: Record<string, string> = {
  MATCHED: "bg-green-100 text-green-700", PARTIAL: "bg-yellow-100 text-yellow-700",
  UNKNOWN: "bg-gray-100 text-gray-500",
};

const VERTICALS = [
  { value: "", label: "Все вертикали" },
  { value: "KZ_AUTO", label: "KZ — Авто" },
  { value: "KZ_ELECTRONICS", label: "KZ — Электроника" },
  { value: "RU_AUTO", label: "RU — Авто" },
  { value: "RU_ELECTRONICS", label: "RU — Электроника" },
];

const PIPELINE_STAGES: Stage[] = [
  "FOUND", "SCORED", "PERSONALIZED", "READY_TO_CONTACT", "CONTACTED", "REPLIED", "QUALIFIED", "HOT", "DEAL"
];

export default function OutboundPage() {
  const [leads, setLeads] = useState<OutboundLead[]>([]);
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterStage, setFilterStage] = useState("");
  const [filterVertical, setFilterVertical] = useState("");
  const [selected, setSelected] = useState<OutboundLead | null>(null);
  const [editedMsg, setEditedMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [enrichLoading, setEnrichLoading] = useState(false);
  const [enrichV2Loading, setEnrichV2Loading] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"leads" | "kpi">("leads");

  const addLog = (msg: string) => setLog((l) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...l.slice(0, 49)]);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (filterStage) params.set("stage", filterStage);
      if (filterVertical) params.set("vertical", filterVertical);
      const res = await fetch(`/api/outbound/leads?${params}`);
      const data = await res.json();
      if (data.ok) {
        setLeads(data.leads ?? []);
        setStageCounts(data.stageCounts ?? {});
        setTotal(data.total ?? 0);
      }
    } finally { setLoading(false); }
  }, [filterStage, filterVertical]);

  const loadKpis = useCallback(async () => {
    const res = await fetch("/api/outbound/stats");
    const data = await res.json();
    if (data.ok) setKpis(data.kpis);
  }, []);

  useEffect(() => { loadLeads(); loadKpis(); }, [loadLeads, loadKpis]);

  async function enrichBatch() {
    setEnrichLoading(true);
    addLog("AI обогащение v1 (10 лидов FOUND → PERSONALIZED)...");
    try {
      const res = await fetch("/api/outbound/enrich", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchSize: 10 }),
      });
      const data = await res.json();
      if (data.ok) {
        addLog(`✅ v1: ${data.processed} лидов обработано`);
        loadLeads(); loadKpis();
      } else addLog(`❌ ${data.error}`);
    } finally { setEnrichLoading(false); }
  }

  async function enrichV2Batch() {
    setEnrichV2Loading(true);
    addLog("🔬 AI Enrich v2 (5 лидов: Products → China → Economics → Score)...");
    try {
      const res = await fetch("/api/outbound/enrich-v2", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchSize: 5, stage: "PERSONALIZED" }),
      });
      const data = await res.json();
      if (data.ok) {
        const summary = data.results?.map((r: { company: string; opportunityScore?: number; chinaMatchConfidence?: number; ok: boolean }) =>
          r.ok ? `${r.company} (score:${r.opportunityScore}, match:${Math.round((r.chinaMatchConfidence ?? 0) * 100)}%)` : `ERR`
        ).join("; ");
        addLog(`✅ v2: ${data.processed} лидов. ${summary}`);
        loadLeads(); loadKpis();
      } else addLog(`❌ ${data.error}`);
    } finally { setEnrichV2Loading(false); }
  }

  async function approve(action: "approve" | "reject" | "edit_approve") {
    if (!selected) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/outbound/approve", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outboundId: selected.outboundId, action, editedMessage: action === "edit_approve" ? editedMsg : undefined }),
      });
      const data = await res.json();
      addLog(data.ok ? `✅ ${selected.companyName} → ${action === "reject" ? "отклонён" : "одобрен → TG"}` : `❌ ${data.error}`);
      if (data.ok) { setSelected(null); loadLeads(); loadKpis(); }
    } finally { setActionLoading(false); }
  }

  async function markContacted(lead: OutboundLead) {
    await fetch("/api/outbound/approve", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outboundId: lead.outboundId, stage: "CONTACTED", channel: "TELEGRAM" }),
    });
    addLog(`📤 ${lead.companyName} → CONTACTED`); loadLeads();
  }

  async function markReply(lead: OutboundLead, responseStatus: string) {
    const res = await fetch("/api/outbound/approve", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outboundId: lead.outboundId, responseStatus }),
    });
    const data = await res.json();
    const emoji: Record<string, string> = { POSITIVE: "✅", NEGATIVE: "❌", QUESTION: "❓", NOT_NOW: "🕐", UNSUBSCRIBE: "🚫" };
    addLog(`${emoji[responseStatus] ?? "·"} ${lead.companyName} → ${responseStatus} → ${data.stage}`);
    loadLeads(); loadKpis();
  }

  async function markQualified(lead: OutboundLead) {
    await fetch("/api/outbound/approve", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outboundId: lead.outboundId, stage: "QUALIFIED" }),
    });
    addLog(`🎯 ${lead.companyName} → QUALIFIED (HOT check)`);
    loadLeads(); loadKpis();
  }

  const econ = selected?.economics as { landed_cost_usd?: number; estimated_margin?: number; price_gap?: number } | undefined;

  return (
    <div id="ob-admin-root" className="min-h-screen" style={{color:"#111827", background:"#F9FAFB"}}>
      <style>{`
        #ob-admin-root { color: #111827 !important; background: #F9FAFB !important; }
        #ob-admin-root * { -webkit-text-fill-color: unset; }
        #ob-admin-root aside, #ob-admin-root aside * { -webkit-text-fill-color: unset; }
        #ob-admin-root table td, #ob-admin-root table th {
          color: #111827 !important;
          -webkit-text-fill-color: #111827 !important;
        }
        #ob-admin-root textarea, #ob-admin-root input, #ob-admin-root select {
          color: #111827 !important;
          -webkit-text-fill-color: #111827 !important;
          background: #ffffff !important;
        }
      `}</style>
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold" style={{color:"#111827"}}>🚀 AI Outbound Engine v1.0</h1>
            <p className="text-sm mt-0.5" style={{color:"#6B7280"}}>
              {total} лидов · Пилот: KZ/RU Auto + Electronics
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={enrichBatch} disabled={enrichLoading}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
              {enrichLoading ? "v1..." : "🤖 Enrich v1"}
            </button>
            <button onClick={enrichV2Batch} disabled={enrichV2Loading}
              className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {enrichV2Loading ? "v2..." : "🔬 Enrich v2 (Products+China)"}
            </button>
            <button onClick={() => { loadLeads(); loadKpis(); }}
              className="px-3 py-2 border rounded-lg text-sm" style={{background:"#fff",color:"#374151"}}>🔄</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 border-b">
          {(["leads", "kpi"] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              style={activeTab === t ? {background:"#fff",color:"#2563EB",border:"1px solid #e5e7eb",borderBottom:"1px solid #fff",marginBottom:"-1px"} : {color:"#6B7280"}}
              className="px-4 py-2 text-sm font-medium rounded-t-lg">
              {t === "leads" ? "📋 Лиды" : "📊 KPI"}
            </button>
          ))}
        </div>

        {activeTab === "kpi" && kpis && (
          <div className="space-y-4 mb-6">
            {/* Funnel KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Всего лидов", value: kpis.total_leads, color: "text-gray-900" },
                { label: "China Match", value: kpis.china_matched, color: "text-indigo-600" },
                { label: "Avg Opp Score", value: kpis.avg_opportunity_score, color: "text-purple-600" },
                { label: "HOT лидов", value: kpis.hot_count, color: "text-red-600" },
              ].map((k) => (
                <div key={k.label} className="bg-white rounded-xl border p-4">
                  <div className={`text-3xl font-bold ${k.color}`}>{k.value}</div>
                  <div className="text-xs mt-1" style={{color:"#6B7280"}}>{k.label}</div>
                </div>
              ))}
            </div>
            {/* Conversion rates */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {kpis.positive_reply_rate !== null && (
                <div className="bg-white rounded-xl border p-4">
                  <div className="text-2xl font-bold text-green-600">{kpis.positive_reply_rate}%</div>
                  <div className="text-xs text-gray-500 mt-1">Positive Reply Rate</div>
                </div>
              )}
              {kpis.qualified_rate !== null && (
                <div className="bg-white rounded-xl border p-4">
                  <div className="text-2xl font-bold text-teal-600">{kpis.qualified_rate}%</div>
                  <div className="text-xs text-gray-500 mt-1">Qualified Rate</div>
                </div>
              )}
              <div className="bg-white rounded-xl border p-4">
                <div className="text-2xl font-bold text-green-700">{kpis.deal_count}</div>
                <div className="text-xs text-gray-500 mt-1">Deals</div>
              </div>
            </div>
            {/* Stage funnel */}
            <div className="bg-white rounded-xl border p-4">
              <h3 className="text-sm font-semibold mb-3" style={{color:"#374151"}}>Воронка по стадиям</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {Object.entries(kpis.funnel).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([stage, count]) => (
                  <div key={stage} className="text-center">
                    <div className="text-xl font-bold text-gray-900">{count}</div>
                    <div className={`text-xs px-1.5 py-0.5 rounded-full mt-0.5 ${STAGE_COLORS[stage] ?? "bg-gray-100"}`}>{STAGE_LABELS[stage] ?? stage}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "leads" && (
          <>
            {/* Pipeline Funnel */}
            <div className="grid grid-cols-5 lg:grid-cols-9 gap-1.5 mb-4">
              {PIPELINE_STAGES.map((s) => (
                <button key={s} onClick={() => setFilterStage(filterStage === s ? "" : s)}
                  className={`p-2.5 rounded-lg border text-center transition-all ${filterStage === s ? "ring-2 ring-blue-500 bg-blue-50" : "bg-white hover:bg-gray-50"}`}>
                  <div className="text-xl font-bold text-gray-900">{stageCounts[s] ?? 0}</div>
                  <div className="text-xs text-gray-500 mt-0.5 leading-tight">{STAGE_LABELS[s] ?? s}</div>
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-3">
              <select value={filterVertical} onChange={(e) => setFilterVertical(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-sm bg-white">
                {VERTICALS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
              <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-sm bg-white">
                <option value="">Все стадии</option>
                {Object.entries(STAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            {/* Leads Table */}
            <div className="bg-white rounded-xl border overflow-hidden mb-4">
              {loading ? (
                <div className="p-8 text-center" style={{color:"#9CA3AF"}}>Загрузка...</div>
              ) : leads.length === 0 ? (
                <div className="p-8 text-center" style={{color:"#9CA3AF"}}>Нет лидов в выбранном фильтре.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead style={{background:"#F3F4F6",borderBottom:"1px solid #E5E7EB"}}>
                    <tr>
                      {["Компания","Категория","Score","Китай","Стадия","Действия"].map(h=>(
                        <th key={h} className="px-4 py-2.5 text-left font-semibold" style={{color:"#374151"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {leads.map((lead) => (
                      <tr key={lead.outboundId} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5">
                          <div className="font-semibold max-w-[200px] truncate" style={{color:"#111827"}}>{lead.companyName}</div>
                          <div className="text-xs mt-0.5" style={{color:"#4B5563"}}>{lead.city}, {lead.country} · {lead.phone || lead.email || "—"}</div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="text-xs font-semibold" style={{color:"#374151"}}>{lead.category}</div>
                          {lead.marketplace !== "NONE" && lead.marketplace && (
                            <div className="text-xs font-medium" style={{color:"#4338CA"}}>{lead.marketplace}</div>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-lg font-bold ${lead.opportunityScore >= 70 ? "text-green-600" : lead.opportunityScore >= 50 ? "text-yellow-600" : "text-gray-500"}`}>
                            {lead.opportunityScore}
                          </span>
                          {lead.messageQualityScore > 0 && (
                            <div className="text-xs" style={{color:"#6B7280"}}>msg: {lead.messageQualityScore}</div>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${CHINA_MATCH_BADGE[lead.chinaMatchStatus] ?? "bg-gray-100 text-gray-400"}`}>
                            {lead.chinaMatchStatus ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${STAGE_COLORS[lead.stage] ?? "bg-gray-100"}`}>
                            {STAGE_LABELS[lead.stage] ?? lead.stage}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex gap-1">
                            {(lead.stage === "PERSONALIZED" || lead.stage === "SCORED") && (
                              <button onClick={() => { setSelected(lead); setEditedMsg(lead.personalizedMessage); }}
                                className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200">
                                👁 Проверить
                              </button>
                            )}
                            {lead.stage === "READY_TO_CONTACT" && (
                              <button onClick={() => markContacted(lead)}
                                className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">📤 Отправлено</button>
                            )}
                            {lead.stage === "CONTACTED" && (
                              <div className="flex gap-1 flex-wrap">
                                <button onClick={() => markReply(lead, "POSITIVE")} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs" title="Положительный">✅</button>
                                <button onClick={() => markReply(lead, "QUESTION")} className="px-2 py-1 bg-sky-100 text-sky-700 rounded text-xs" title="Задал вопрос">❓</button>
                                <button onClick={() => markReply(lead, "NOT_NOW")} className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs" title="Не сейчас">🕐</button>
                                <button onClick={() => markReply(lead, "NEGATIVE")} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs" title="Отказ">❌</button>
                                <button onClick={() => markReply(lead, "UNSUBSCRIBE")} className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs" title="Отписка">🚫</button>
                              </div>
                            )}
                            {lead.stage === "REPLIED" && (
                              <button onClick={() => markQualified(lead)} className="px-2 py-1 bg-teal-100 text-teal-700 rounded text-xs">🎯 Qualified</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* Activity Log */}
        {log.length > 0 && (
          <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs text-green-400 max-h-32 overflow-y-auto">
            {log.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold" style={{color:"#111827"}}>{selected.companyName}</h2>
                <p className="text-sm" style={{color:"#374151"}}>
                  {selected.city}, {selected.country === "KZ" ? "Казахстан" : "Россия"} ·
                  {selected.category} · Score: <b className="text-purple-600">{selected.opportunityScore}</b>
                  {selected.chinaMatchStatus && selected.chinaMatchStatus !== "UNKNOWN" && (
                    <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${CHINA_MATCH_BADGE[selected.chinaMatchStatus]}`}>
                      China: {selected.chinaMatchStatus}
                    </span>
                  )}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>

            {/* Economics summary */}
            {econ && Object.keys(econ).length > 0 && (
              <div className="mb-3 p-3 bg-indigo-50 rounded-lg">
                <p className="text-xs font-semibold text-indigo-700 mb-1">📊 ЭКОНОМИКА (оценочная)</p>
                <div className="text-xs text-indigo-900 grid grid-cols-3 gap-2">
                  {econ.landed_cost_usd && <span>Landed cost: <b>${econ.landed_cost_usd}</b></span>}
                  {econ.estimated_margin && <span>Margin: <b>{Math.round((econ.estimated_margin as number) * 100)}%</b></span>}
                  {econ.price_gap && <span>Price gap: <b>{Math.round((econ.price_gap as number) * 100)}%</b></span>}
                </div>
              </div>
            )}

            <div className="mb-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs font-semibold text-blue-700 mb-1">💡 ПРИЧИНА ОБРАЩЕНИЯ</p>
              <p className="text-sm text-blue-900">{selected.reasonToContact || "—"}</p>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-semibold" style={{color:"#374151"}}>💬 СООБЩЕНИЕ (редактируемое)</p>
                {selected.messageQualityScore > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${selected.messageQualityScore >= 70 ? "bg-green-100 text-green-700" : selected.messageQualityScore >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                    Качество: {selected.messageQualityScore}/100
                  </span>
                )}
              </div>
              {!editedMsg && (
                <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                  ⚠️ Сообщение не сгенерировано. Напишите вручную или запустите Enrich v2 для этого лида.
                </div>
              )}
              <textarea
                value={editedMsg}
                onChange={(e) => setEditedMsg(e.target.value)}
                placeholder="Введите персональное сообщение для отправки..."
                rows={6}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 placeholder-gray-400"
                style={{ color: "#111827", backgroundColor: "#ffffff" }}
              />
              <div className="text-xs text-gray-400 mt-1 text-right">
                {selected.pitchType === "B2B_IMPORT" ? "📦 B2B Import pitch" : "🛒 Seller Outbound pitch"}
              </div>
            </div>

            {/* Contact info */}
            <div className="mb-4 text-xs text-gray-500 flex gap-4">
              {selected.phone && <span>📞 {selected.phone}</span>}
              {selected.email && <span>📧 {selected.email}</span>}
              {selected.website && <a href={selected.website} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">🌐 сайт</a>}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => approve(editedMsg !== selected.personalizedMessage ? "edit_approve" : "approve")}
                disabled={actionLoading || !editedMsg.trim()}
                title={!editedMsg.trim() ? "Сначала напишите сообщение" : ""}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {editedMsg !== selected.personalizedMessage && editedMsg.trim() ? "✏️ Правки → Одобрить" : "✅ Одобрить → TG"}
              </button>
              <button onClick={() => approve("reject")} disabled={actionLoading}
                className="px-4 py-2.5 bg-red-100 text-red-700 rounded-lg font-medium text-sm hover:bg-red-200 disabled:opacity-50">
                ❌ Отклонить
              </button>
            </div>
            {!editedMsg.trim() && (
              <p className="text-xs text-center text-amber-600 mt-2">Заполните сообщение для одобрения</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
