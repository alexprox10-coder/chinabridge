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
  leadScore: number;
  reasonToContact: string;
  personalizedMessage: string;
  messageQualityScore: number;
  responseStatus: string;
  source: string;
  vertical: string;
  createdAt: string;
}

const STAGE_LABELS: Record<string, string> = {
  FOUND: "Найден",
  ENRICHED: "Обогащён",
  PERSONALIZED: "Персонализирован",
  READY_TO_CONTACT: "Готов к отправке",
  APPROVED: "Одобрен",
  CONTACTED: "Отправлено",
  REPLIED: "Ответил",
  QUALIFIED: "Квалифицирован",
  HOT: "Горячий",
  QUOTE: "КП",
  DEAL: "Сделка",
  ERROR: "Ошибка",
};

const STAGE_COLORS: Record<string, string> = {
  FOUND: "bg-gray-100 text-gray-700",
  ENRICHED: "bg-blue-100 text-blue-700",
  PERSONALIZED: "bg-purple-100 text-purple-700",
  READY_TO_CONTACT: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-yellow-200 text-yellow-800",
  CONTACTED: "bg-orange-100 text-orange-700",
  REPLIED: "bg-cyan-100 text-cyan-700",
  QUALIFIED: "bg-teal-100 text-teal-700",
  HOT: "bg-red-100 text-red-700",
  QUOTE: "bg-green-100 text-green-700",
  DEAL: "bg-green-600 text-white",
  ERROR: "bg-red-200 text-red-800",
};

const VERTICALS = [
  { value: "", label: "Все вертикали" },
  { value: "KZ_AUTO", label: "KZ — Авто" },
  { value: "KZ_ELECTRONICS", label: "KZ — Электроника" },
  { value: "RU_AUTO", label: "RU — Авто" },
  { value: "RU_ELECTRONICS", label: "RU — Электроника" },
];

export default function OutboundPage() {
  const [leads, setLeads] = useState<OutboundLead[]>([]);
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterStage, setFilterStage] = useState("");
  const [filterVertical, setFilterVertical] = useState("");
  const [selected, setSelected] = useState<OutboundLead | null>(null);
  const [editedMsg, setEditedMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [enrichLoading, setEnrichLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);

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
    } finally {
      setLoading(false);
    }
  }, [filterStage, filterVertical]);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  async function importLeads() {
    setImportLoading(true);
    addLog("Импортирую лиды из DataTable...");
    try {
      const res = await fetch("/api/outbound/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 100, vertical: filterVertical || "KZ_AUTO", country: "KZ" }),
      });
      const data = await res.json();
      addLog(data.ok ? `✅ Импортировано: ${data.imported}, пропущено дублей: ${data.skipped}` : `❌ ${data.error}`);
      if (data.ok) loadLeads();
    } finally {
      setImportLoading(false);
    }
  }

  async function enrichBatch() {
    setEnrichLoading(true);
    addLog("AI обогащение (10 лидов)...");
    try {
      const res = await fetch("/api/outbound/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchSize: 10 }),
      });
      const data = await res.json();
      if (data.ok) {
        addLog(`✅ Обработано: ${data.processed}. Результаты: ${data.results?.map((r: {company: string; opportunityScore?: number; ok: boolean}) => r.ok ? `${r.company} (${r.opportunityScore})` : `ERR`).join(", ")}`);
        loadLeads();
      } else {
        addLog(`❌ ${data.error}`);
      }
    } finally {
      setEnrichLoading(false);
    }
  }

  async function approve(action: "approve" | "reject" | "edit_approve") {
    if (!selected) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/outbound/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outboundId: selected.outboundId,
          action,
          editedMessage: action === "edit_approve" ? editedMsg : undefined,
        }),
      });
      const data = await res.json();
      addLog(data.ok ? `✅ ${selected.companyName} → ${action === "reject" ? "отклонён" : "одобрен (уведомление в TG)"}` : `❌ ${data.error}`);
      if (data.ok) {
        setSelected(null);
        loadLeads();
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function markContacted(lead: OutboundLead) {
    await fetch("/api/outbound/approve", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outboundId: lead.outboundId, stage: "CONTACTED", channel: "TELEGRAM" }),
    });
    addLog(`📤 ${lead.companyName} → CONTACTED`);
    loadLeads();
  }

  async function markReplied(lead: OutboundLead, positive: boolean) {
    await fetch("/api/outbound/approve", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outboundId: lead.outboundId,
        stage: positive ? "REPLIED" : "CONTACTED",
        responseStatus: positive ? "POSITIVE" : "NEGATIVE",
      }),
    });
    addLog(`${positive ? "✅" : "❌"} ${lead.companyName} → ${positive ? "POSITIVE reply" : "NEGATIVE"}`);
    loadLeads();
  }

  const pipelineStages: Stage[] = ["FOUND", "PERSONALIZED", "READY_TO_CONTACT", "CONTACTED", "REPLIED", "QUALIFIED", "HOT", "DEAL"];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🚀 AI Outbound Engine</h1>
            <p className="text-sm text-gray-500 mt-1">
              Всего лидов: <b>{total}</b> | Пилот v1.0 — KZ/RU Auto + Electronics
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={importLeads}
              disabled={importLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {importLoading ? "Импортирую..." : "📥 Импорт из DataTable"}
            </button>
            <button
              onClick={enrichBatch}
              disabled={enrichLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
            >
              {enrichLoading ? "AI работает..." : "🤖 AI Enrichment (10)"}
            </button>
            <button onClick={loadLeads} className="px-3 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50">
              🔄
            </button>
          </div>
        </div>

        {/* Pipeline Funnel */}
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 mb-6">
          {pipelineStages.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStage(filterStage === s ? "" : s)}
              className={`p-3 rounded-lg border text-center transition-all ${
                filterStage === s ? "ring-2 ring-blue-500 bg-blue-50" : "bg-white hover:bg-gray-50"
              }`}
            >
              <div className="text-2xl font-bold text-gray-900">{stageCounts[s] ?? 0}</div>
              <div className="text-xs text-gray-500 mt-0.5">{STAGE_LABELS[s] ?? s}</div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <select
            value={filterVertical}
            onChange={(e) => setFilterVertical(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            {VERTICALS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="">Все стадии</option>
            {Object.entries(STAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-xl border overflow-hidden mb-6">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Загрузка...</div>
          ) : leads.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              Нет лидов. Нажмите «Импорт из DataTable» чтобы загрузить 989 лидов из Алматы.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Компания</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Город / Категория</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Score</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Стадия</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead) => (
                  <tr key={lead.outboundId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{lead.companyName}</div>
                      <div className="text-xs text-gray-400">{lead.phone || lead.email || "—"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{lead.city}, {lead.country}</div>
                      <div className="text-xs text-gray-400">{lead.category} {lead.marketplace !== "NONE" && lead.marketplace ? `· ${lead.marketplace}` : ""}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-lg font-bold ${lead.opportunityScore >= 70 ? "text-green-600" : lead.opportunityScore >= 50 ? "text-yellow-600" : "text-gray-400"}`}>
                        {lead.opportunityScore}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STAGE_COLORS[lead.stage] ?? "bg-gray-100"}`}>
                        {STAGE_LABELS[lead.stage] ?? lead.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {lead.stage === "PERSONALIZED" && (
                          <button
                            onClick={() => { setSelected(lead); setEditedMsg(lead.personalizedMessage); }}
                            className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200"
                          >
                            👁 Проверить
                          </button>
                        )}
                        {lead.stage === "READY_TO_CONTACT" && (
                          <button
                            onClick={() => markContacted(lead)}
                            className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200"
                          >
                            📤 Отправлено
                          </button>
                        )}
                        {lead.stage === "CONTACTED" && (
                          <>
                            <button onClick={() => markReplied(lead, true)} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">✅ Ответил</button>
                            <button onClick={() => markReplied(lead, false)} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">❌ Нет</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Activity Log */}
        {log.length > 0 && (
          <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs text-green-400 max-h-40 overflow-y-auto">
            {log.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">{selected.companyName}</h2>
                <p className="text-sm text-gray-500">{selected.city}, {selected.country} · {selected.category} · Score: {selected.opportunityScore}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs font-semibold text-blue-700 mb-1">ПРИЧИНА ОБРАЩЕНИЯ</p>
              <p className="text-sm text-blue-900">{selected.reasonToContact || "—"}</p>
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">СООБЩЕНИЕ (редактируемое)</p>
              <textarea
                value={editedMsg}
                onChange={(e) => setEditedMsg(e.target.value)}
                rows={5}
                className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-300 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">Качество сообщения: {selected.messageQualityScore}/100</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => approve("approve")}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50"
              >
                ✅ Одобрить и уведомить в TG
              </button>
              <button
                onClick={() => approve("edit_approve")}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 disabled:opacity-50"
              >
                ✏️ Сохранить правки и одобрить
              </button>
              <button
                onClick={() => approve("reject")}
                disabled={actionLoading}
                className="px-4 py-2.5 bg-red-100 text-red-700 rounded-lg font-medium text-sm hover:bg-red-200 disabled:opacity-50"
              >
                ❌ Отклонить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
