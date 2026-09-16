"use client";
import { useState, useEffect, useCallback, useRef } from "react";
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
  rawOpportunityScore: number;
  evidenceScore: number;
  companyScore: number;
  leadScore: number;
  reasonToContact: string;
  personalizedMessage: string;
  messageQualityScore: number;
  responseStatus: string;
  pitchType: string;
  recommendedOffer: string;
  nextBestAction: string;
  chinaMatchStatus: string;
  chinaMatch: Record<string, unknown>;
  products: Array<{ name: string; name_en?: string; price_min_kzt?: number; price_min_rub?: number; weight_kg?: number }>;
  economics: Record<string, unknown>;
  evidenceData: {
    structured?: {
      verified_facts: Array<{ fact: string; source: string; url?: string }>;
      ai_inferences: Array<{ inference: string; confidence: string }>;
      unknown: Array<{ field: string; why: string }>;
    };
    breakdown?: Record<string, number>;
    label?: string;
  };
  leadQuality: string;
  source: string;
  vertical: string;
  createdAt: string;
  // New §6/§19/§22 ТЗ fields
  companyId: string;
  chinaSourceUrl: string;
  chinaUnitPrice: number | null;
  localSellingPrice: number | null;
  dataQualityScore: number;
  countryVerified: boolean;
  companyVerified: boolean;
  productVerified: boolean;
  contactVerified: boolean;
  sourceVerified: boolean;
  messageStatus: string;
  approvalStatus: string;
  outreachStatus: string;
  messageVersion: string;
  quoteId: string;
  dealId: string;
  campaign: string;
  opportunityId: string;
}

interface First100Kpis {
  total_approved: number;
  total_contacted: number;
  approved_today: number;
  daily_limit: number;
  positive_replies: number;
  qualified: number;
  hot: number;
  deals: number;
  reply_rate: number | null;
  progress_pct: number;
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
  avg_evidence_score?: number;
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
  PERSONALIZED: "bg-purple-100 text-purple-700", READY_TO_CONTACT: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-yellow-200 text-yellow-800", CONTACTED: "bg-orange-100 text-orange-700",
  REPLIED: "bg-cyan-100 text-cyan-700", QUALIFIED: "bg-teal-100 text-teal-700",
  HOT: "bg-red-100 text-red-700", QUOTE: "bg-green-100 text-green-700",
  DEAL: "bg-green-600 text-white", ERROR: "bg-red-200 text-red-800",
};

const CHINA_MATCH_BADGE: Record<string, string> = {
  MATCHED: "bg-green-100 text-green-700", PARTIAL: "bg-yellow-100 text-yellow-700",
  UNKNOWN: "bg-gray-100 text-gray-500",
};

const OFFER_LABELS: Record<string, string> = {
  DELIVERY: "📦 Доставка", EXISTING_SUPPLIER_IMPORT: "🔄 Свой поставщик",
  SOURCING: "🔍 Найти поставщика", CONSOLIDATION: "📦 Консолидация",
  WHITE_IMPORT: "✅ Белый импорт", UNIT_ECONOMICS: "📊 Юнит-экономика", OTHER: "💼 Другое",
};

const NBA_LABELS: Record<string, string> = {
  SHOW_ECONOMICS: "Показать расчёт", ASK_SUPPLIER_STATUS: "Спросить про поставщика",
  CALCULATE_DELIVERY: "Рассчитать доставку", OFFER_SOURCING: "Предложить поиск",
  REQUEST_QUANTITY: "Узнать объём", CONTACT_NOW: "Написать сейчас",
  FOLLOW_UP: "Напомнить позже", NO_ACTION: "—",
};

const PIPELINE_STAGES: Stage[] = [
  "FOUND", "SCORED", "PERSONALIZED", "READY_TO_CONTACT", "APPROVED", "CONTACTED", "REPLIED", "QUALIFIED", "HOT", "DEAL"
];

const VERTICALS = [
  { value: "", label: "Все вертикали" },
  { value: "KZ_AUTO", label: "KZ — Авто" },
  { value: "KZ_ELECTRONICS", label: "KZ — Электроника" },
  { value: "RU_AUTO", label: "RU — Авто" },
  { value: "RU_ELECTRONICS", label: "RU — Электроника" },
];

function ScoreBadge({ value, type }: { value: number; type: "opp" | "ev" | "msg" }) {
  const color =
    value >= 80 ? "#16a34a" :
    value >= 60 ? "#ca8a04" :
    value >= 35 ? "#ea580c" : "#dc2626";
  return (
    <span style={{ color, fontWeight: 700, fontSize: 15 }}>{value}</span>
  );
}

function EvidenceLabel({ score }: { score: number }) {
  const [label, bg] =
    score >= 80 ? ["CONFIRMED", "#dcfce7"] :
    score >= 60 ? ["PROBABLE", "#fef9c3"] :
    score >= 35 ? ["INFERRED", "#ffedd5"] :
    ["WEAK", "#fee2e2"];
  return (
    <span style={{ background: bg, color: "#374151", fontSize: 10, padding: "1px 5px", borderRadius: 4, fontWeight: 600 }}>
      {label}
    </span>
  );
}

export default function OutboundPage() {
  const [leads, setLeads] = useState<OutboundLead[]>([]);
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterStage, setFilterStage] = useState("");
  const [filterVertical, setFilterVertical] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterMinScore, setFilterMinScore] = useState(0);
  const [filterMinEvidence, setFilterMinEvidence] = useState(0);
  const [filterChinaMatch, setFilterChinaMatch] = useState(false);
  const [selected, setSelected] = useState<OutboundLead | null>(null);
  const [editedMsg, setEditedMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [enrichLoading, setEnrichLoading] = useState(false);
  const [enrichV2Loading, setEnrichV2Loading] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"leads" | "kpi" | "companies">("leads");
  const [sortBy, setSortBy] = useState<"combined" | "opportunity" | "evidence" | "newest">("combined");
  const [first100, setFirst100] = useState<First100Kpis | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  // §29-31: New lead modal
  const [showNewLead, setShowNewLead] = useState(false);
  const [newLead, setNewLead] = useState({ companyName: "", city: "", country: "KZ", category: "", marketplace: "", phone: "", email: "", website: "", vertical: "", campaign: "OUTBOUND_V1" });
  const [newLeadLoading, setNewLeadLoading] = useState(false);
  // §5: Companies tab
  const [companies, setCompanies] = useState<Array<{ company_id: string; company_name: string; country: string; opportunity_count: number; last_updated: string }>>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.setProperty("color", "#111827", "important");
    el.style.setProperty("-webkit-text-fill-color", "#111827", "important");
    el.style.setProperty("background-color", "#ffffff", "important");
  }, [selected, editedMsg]);

  const addLog = (msg: string) => setLog((l) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...l.slice(0, 49)]);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (filterStage) params.set("stage", filterStage);
      if (filterVertical) params.set("vertical", filterVertical);
      if (filterCountry) params.set("country", filterCountry);
      const res = await fetch(`/api/outbound/leads?${params}`);
      const data = await res.json();
      if (data.ok) {
        let rows: OutboundLead[] = data.leads ?? [];
        if (filterMinScore > 0) rows = rows.filter(l => l.opportunityScore >= filterMinScore);
        if (filterMinEvidence > 0) rows = rows.filter(l => l.evidenceScore >= filterMinEvidence);
        if (filterChinaMatch) rows = rows.filter(l => l.chinaMatchStatus === "MATCHED");
        // Sort
        if (sortBy === "combined") rows.sort((a, b) => (b.opportunityScore * b.evidenceScore) - (a.opportunityScore * a.evidenceScore));
        else if (sortBy === "opportunity") rows.sort((a, b) => b.opportunityScore - a.opportunityScore);
        else if (sortBy === "evidence") rows.sort((a, b) => b.evidenceScore - a.evidenceScore);
        setLeads(rows);
        setStageCounts(data.stageCounts ?? {});
        setTotal(data.total ?? 0);
      }
    } finally { setLoading(false); }
  }, [filterStage, filterVertical, filterCountry, filterMinScore, filterMinEvidence, filterChinaMatch, sortBy]);

  const loadKpis = useCallback(async () => {
    const res = await fetch("/api/outbound/stats");
    const data = await res.json();
    if (data.ok) {
      setKpis(data.kpis);
      if (data.first_100) setFirst100(data.first_100);
    }
  }, []);

  useEffect(() => { loadLeads(); loadKpis(); }, [loadLeads, loadKpis]);

  async function enrichV2Batch() {
    setEnrichV2Loading(true);
    addLog("🔬 Enrich v2 (5 лидов: Products → China → Economics → Score → Evidence)...");
    try {
      const res = await fetch("/api/outbound/enrich-v2", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchSize: 5, stage: "PERSONALIZED" }),
      });
      const data = await res.json();
      if (data.ok) {
        const summary = data.results?.map((r: { company: string; opportunityScore?: number; evidenceScore?: number; ok: boolean }) =>
          r.ok ? `${r.company} (opp:${r.opportunityScore} ev:${r.evidenceScore ?? "?"})` : `ERR`
        ).join("; ");
        addLog(`✅ v2: ${data.processed} лидов. ${summary}`);
        loadLeads(); loadKpis();
      } else addLog(`❌ ${data.error}`);
    } finally { setEnrichV2Loading(false); }
  }

  async function enrichBatch() {
    setEnrichLoading(true);
    addLog("AI обогащение v1 (10 лидов FOUND → PERSONALIZED)...");
    try {
      const res = await fetch("/api/outbound/enrich", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchSize: 10 }),
      });
      const data = await res.json();
      if (data.ok) { addLog(`✅ v1: ${data.processed} лидов`); loadLeads(); loadKpis(); }
      else addLog(`❌ ${data.error}`);
    } finally { setEnrichLoading(false); }
  }

  // APPROVE only → stage APPROVED
  async function approveLead(action: "approve" | "reject" | "edit_approve") {
    if (!selected) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/outbound/approve", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outboundId: selected.outboundId, action, editedMessage: action === "edit_approve" ? editedMsg : undefined }),
      });
      const data = await res.json();
      addLog(data.ok ? `✅ ${selected.companyName} → ${action === "reject" ? "отклонён" : "одобрен → APPROVED"}` : `❌ ${data.error}`);
      if (data.ok) { setSelected(null); loadLeads(); loadKpis(); }
    } finally { setActionLoading(false); }
  }

  // SEND → stage CONTACTED
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
    addLog(`🎯 ${lead.companyName} → QUALIFIED`); loadLeads(); loadKpis();
  }

  async function recalculateLead(outboundId: string, companyName: string) {
    setRecalculating(true);
    addLog(`🔄 Пересчёт: ${companyName}...`);
    try {
      const res = await fetch("/api/outbound/enrich-v2", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outboundId }),
      });
      const data = await res.json();
      if (data.ok && data.results?.[0]) {
        const r = data.results[0];
        addLog(`✅ Пересчитан: opp ${r.opportunityScore} (raw ${r.rawOpportunityScore}) ev ${r.evidenceScore} factor ${r.evidenceFactor}`);
        loadLeads(); loadKpis();
        setSelected(null);
      } else {
        addLog(`❌ Ошибка пересчёта: ${data.error ?? "unknown"}`);
      }
    } finally { setRecalculating(false); }
  }

  // §5: Load companies
  const loadCompanies = useCallback(async () => {
    setCompaniesLoading(true);
    try {
      const res = await fetch("/api/outbound/create");
      const data = await res.json();
      if (data.ok) setCompanies(data.companies ?? []);
    } finally { setCompaniesLoading(false); }
  }, []);

  // §29-31: Create new lead
  async function createNewLead() {
    if (!newLead.companyName || !newLead.country || !newLead.category) return;
    setNewLeadLoading(true);
    try {
      const res = await fetch("/api/outbound/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLead),
      });
      const data = await res.json();
      if (data.ok) {
        addLog(`✅ Лид создан: ${newLead.companyName} → ${data.outboundId}`);
        setShowNewLead(false);
        setNewLead({ companyName: "", city: "", country: "KZ", category: "", marketplace: "", phone: "", email: "", website: "", vertical: "", campaign: "OUTBOUND_V1" });
        loadLeads(); loadKpis();
      } else {
        addLog(`❌ Ошибка: ${data.error}`);
      }
    } finally { setNewLeadLoading(false); }
  }

  const econ = selected?.economics as {
    landed_cost_usd?: number; estimated_margin?: number; price_gap?: number;
    calculation_valid?: boolean;
  } | undefined;
  const cm = selected?.chinaMatch as {
    product_name?: string; price_min_cny?: number; price_max_cny?: number;
    match_confidence?: number; supplier_url?: string;
  } | undefined;

  const MIN_EVIDENCE_TO_APPROVE = 40;
  const canApprove = editedMsg.trim().length > 0 && (selected?.evidenceScore ?? 0) >= MIN_EVIDENCE_TO_APPROVE;

  return (
    <div className="min-h-screen" style={{ color: "#111827", background: "#F3F4F6" }}>
      <style>{`
        * { -webkit-text-fill-color: unset; }
        textarea, input, select { color: #111827 !important; -webkit-text-fill-color: #111827 !important; background: #fff !important; }
        td, th, td *, th * { -webkit-text-fill-color: unset !important; }
      `}</style>
      <AdminNav />
      <div className="max-w-screen-xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#111827" }}>AI Outbound Engine v1.1</h1>
            <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
              {total} лидов · Пилот: KZ/RU Auto + Electronics
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowNewLead(true)}
              className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
              ➕ Новый лид
            </button>
            <button onClick={enrichBatch} disabled={enrichLoading}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
              {enrichLoading ? "v1..." : "🤖 Enrich v1"}
            </button>
            <button onClick={enrichV2Batch} disabled={enrichV2Loading}
              className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {enrichV2Loading ? "Обрабатываю..." : "🔬 Enrich v2 (5 лидов)"}
            </button>
            <button onClick={() => { loadLeads(); loadKpis(); }}
              className="px-3 py-2 border rounded-lg text-sm bg-white" style={{ color: "#374151" }}>🔄</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 border-b border-gray-200">
          {(["leads", "kpi", "companies"] as const).map((t) => (
            <button key={t} onClick={() => {
              setActiveTab(t);
              if (t === "companies" && companies.length === 0) loadCompanies();
            }}
              className="px-4 py-2 text-sm font-medium rounded-t-lg"
              style={activeTab === t
                ? { background: "#fff", color: "#2563EB", border: "1px solid #e5e7eb", borderBottom: "1px solid #fff", marginBottom: -1 }
                : { color: "#6B7280" }}>
              {t === "leads" ? "📋 Лиды" : t === "kpi" ? "📊 KPI" : "🏢 Компании"}
            </button>
          ))}
        </div>

        {/* KPI TAB */}
        {activeTab === "kpi" && kpis && (
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Всего лидов", value: kpis.total_leads, color: "#111827" },
                { label: "China Match", value: kpis.china_matched, color: "#4338CA" },
                { label: "Avg Opp Score", value: kpis.avg_opportunity_score, color: "#7C3AED" },
                { label: "HOT лидов 🔥", value: kpis.hot_count, color: "#DC2626" },
              ].map((k) => (
                <div key={k.label} className="bg-white rounded-xl border p-4">
                  <div className="text-3xl font-bold" style={{ color: k.color }}>{k.value}</div>
                  <div className="text-xs mt-1" style={{ color: "#6B7280" }}>{k.label}</div>
                </div>
              ))}
            </div>

            {/* Funnel */}
            <div className="bg-white rounded-xl border p-4">
              <h3 className="text-sm font-semibold mb-3" style={{ color: "#374151" }}>Воронка по стадиям</h3>
              <div className="overflow-x-auto">
                <div className="flex gap-2 min-w-max">
                  {PIPELINE_STAGES.map((s, i) => {
                    const count = kpis.funnel[s] ?? 0;
                    const prev = i > 0 ? (kpis.funnel[PIPELINE_STAGES[i - 1]] ?? 0) : null;
                    const conv = prev && prev > 0 ? Math.round(count / prev * 100) : null;
                    return (
                      <div key={s} className="text-center" style={{ minWidth: 80 }}>
                        <div className="text-2xl font-bold" style={{ color: "#111827" }}>{count}</div>
                        <div className={`text-xs px-1.5 py-0.5 rounded-full mt-0.5 ${STAGE_COLORS[s] ?? "bg-gray-100"}`}>
                          {STAGE_LABELS[s] ?? s}
                        </div>
                        {conv !== null && (
                          <div className="text-xs mt-1" style={{ color: "#9CA3AF" }}>↓ {conv}%</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quality metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {kpis.positive_reply_rate !== null && (
                <div className="bg-white rounded-xl border p-4">
                  <div className="text-2xl font-bold" style={{ color: "#16a34a" }}>{kpis.positive_reply_rate}%</div>
                  <div className="text-xs mt-1" style={{ color: "#6B7280" }}>Positive Reply Rate</div>
                </div>
              )}
              {kpis.qualified_rate !== null && (
                <div className="bg-white rounded-xl border p-4">
                  <div className="text-2xl font-bold" style={{ color: "#0d9488" }}>{kpis.qualified_rate}%</div>
                  <div className="text-xs mt-1" style={{ color: "#6B7280" }}>Qualified Rate</div>
                </div>
              )}
              <div className="bg-white rounded-xl border p-4">
                <div className="text-2xl font-bold" style={{ color: "#16a34a" }}>{kpis.deal_count}</div>
                <div className="text-xs mt-1" style={{ color: "#6B7280" }}>Deals</div>
              </div>
            </div>

            {/* First-100 KPI Panel */}
            {first100 && (
              <div className="bg-white rounded-xl border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold" style={{ color: "#374151" }}>🎯 Первые 100 контактов</h3>
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-bold" style={{ color: "#4338CA" }}>{first100.total_approved}/100</div>
                    <div className="w-24 h-2 rounded-full" style={{ background: "#E5E7EB" }}>
                      <div className="h-2 rounded-full" style={{ background: "#4338CA", width: `${Math.min(first100.progress_pct, 100)}%` }} />
                    </div>
                    <div className="text-xs" style={{ color: "#6B7280" }}>{first100.progress_pct}%</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    { label: "Сегодня", value: `${first100.approved_today}/${first100.daily_limit}`, color: first100.approved_today >= first100.daily_limit ? "#DC2626" : "#16a34a" },
                    { label: "Отправлено", value: first100.total_contacted, color: "#374151" },
                    { label: "Положит.", value: first100.positive_replies, color: "#16a34a" },
                    { label: "Reply rate", value: first100.reply_rate !== null ? `${first100.reply_rate}%` : "—", color: "#0d9488" },
                    { label: "Qualified", value: first100.qualified, color: "#4338CA" },
                    { label: "HOT 🔥", value: first100.hot, color: "#DC2626" },
                  ].map((k) => (
                    <div key={k.label} className="text-center p-2 rounded-lg" style={{ background: "#F9FAFB" }}>
                      <div className="text-xl font-bold" style={{ color: k.color }}>{k.value}</div>
                      <div className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{k.label}</div>
                    </div>
                  ))}
                </div>
                {first100.approved_today >= first100.daily_limit && (
                  <div className="mt-3 p-2 rounded-lg text-xs text-center" style={{ background: "#FEF2F2", color: "#991B1B" }}>
                    🚫 Дневной лимит исчерпан ({first100.daily_limit}/день). Продолжение завтра.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* LEADS TAB */}
        {activeTab === "leads" && (
          <>
            {/* Pipeline funnel row */}
            <div className="grid grid-cols-5 lg:grid-cols-10 gap-1.5 mb-4">
              {PIPELINE_STAGES.map((s) => (
                <button key={s} onClick={() => setFilterStage(filterStage === s ? "" : s)}
                  className="p-2 rounded-lg border text-center transition-all"
                  style={{
                    background: filterStage === s ? "#EEF2FF" : "#fff",
                    borderColor: filterStage === s ? "#6366F1" : "#E5E7EB",
                    boxShadow: filterStage === s ? "0 0 0 2px #6366F1" : "none",
                  }}>
                  <div className="text-lg font-bold" style={{ color: "#111827" }}>{stageCounts[s] ?? 0}</div>
                  <div className="text-xs leading-tight" style={{ color: "#6B7280" }}>{STAGE_LABELS[s] ?? s}</div>
                </button>
              ))}
            </div>

            {/* Quick filters */}
            <div className="flex gap-2 flex-wrap mb-3">
              {[
                { label: "🔥 HOT", action: () => setFilterStage("HOT") },
                { label: "⭐ Score 80+", action: () => setFilterMinScore(filterMinScore === 80 ? 0 : 80) },
                { label: "✅ Evidence 80+", action: () => setFilterMinEvidence(filterMinEvidence === 80 ? 0 : 80) },
                { label: "🇰🇿 KZ", action: () => setFilterCountry(filterCountry === "KZ" ? "" : "KZ") },
                { label: "🇷🇺 RU", action: () => setFilterCountry(filterCountry === "RU" ? "" : "RU") },
                { label: "🇨🇳 China Match", action: () => setFilterChinaMatch(!filterChinaMatch) },
              ].map((f) => (
                <button key={f.label} onClick={f.action}
                  className="px-3 py-1.5 text-xs rounded-full border font-medium transition-all"
                  style={{ background: "#fff", color: "#374151", borderColor: "#D1D5DB" }}>
                  {f.label}
                </button>
              ))}
              <span style={{ borderLeft: "1px solid #E5E7EB", margin: "0 4px" }} />
              {/* Filters */}
              <select value={filterVertical} onChange={(e) => setFilterVertical(e.target.value)}
                className="px-2 py-1 border rounded text-xs" style={{ color: "#374151" }}>
                {VERTICALS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-2 py-1 border rounded text-xs" style={{ color: "#374151" }}>
                <option value="combined">Сорт: Opp × Evidence</option>
                <option value="opportunity">Сорт: Opportunity</option>
                <option value="evidence">Сорт: Evidence</option>
                <option value="newest">Сорт: Новые</option>
              </select>
              {(filterStage || filterCountry || filterMinScore > 0 || filterMinEvidence > 0 || filterChinaMatch) && (
                <button onClick={() => { setFilterStage(""); setFilterCountry(""); setFilterMinScore(0); setFilterMinEvidence(0); setFilterChinaMatch(false); }}
                  className="px-2 py-1 text-xs rounded border" style={{ color: "#DC2626", borderColor: "#FCA5A5" }}>
                  × Сбросить
                </button>
              )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border overflow-hidden mb-4" style={{ overflowX: "auto" }}>
              {loading ? (
                <div className="p-8 text-center" style={{ color: "#9CA3AF" }}>Загрузка...</div>
              ) : leads.length === 0 ? (
                <div className="p-8 text-center" style={{ color: "#9CA3AF" }}>Нет лидов в выбранном фильтре.</div>
              ) : (
                <table className="w-full text-sm" style={{ minWidth: 900 }}>
                  <thead style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                    <tr>
                      {["Компания", "Страна / Категория", "Marketplace", "Opp", "Evidence", "Китай", "Оффер", "Стадия", "Действия"].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold" style={{ color: "#374151" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {leads.map((lead) => (
                      <tr key={lead.outboundId} className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => { setSelected(lead); setEditedMsg(lead.personalizedMessage); }}>
                        <td className="px-3 py-2.5">
                          <div className="font-semibold max-w-[180px] truncate" style={{ color: "#111827" }}>{lead.companyName}</div>
                          <div className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{lead.city || "—"} · {lead.phone || lead.email || "нет контакта"}</div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="text-xs font-semibold" style={{ color: "#111827" }}>
                            {lead.country === "KZ" ? "🇰🇿" : "🇷🇺"} {lead.country}
                          </div>
                          <div className="text-xs" style={{ color: "#4B5563" }}>{lead.category || "—"}</div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-xs font-medium" style={{ color: lead.marketplace && lead.marketplace !== "NONE" ? "#4338CA" : "#9CA3AF" }}>
                            {lead.marketplace && lead.marketplace !== "NONE" ? lead.marketplace : "—"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <ScoreBadge value={lead.opportunityScore} type="opp" />
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <ScoreBadge value={lead.evidenceScore} type="ev" />
                          <div className="mt-0.5"><EvidenceLabel score={lead.evidenceScore} /></div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${CHINA_MATCH_BADGE[lead.chinaMatchStatus] ?? "bg-gray-100 text-gray-400"}`}>
                            {lead.chinaMatchStatus === "MATCHED" ? "✓" : lead.chinaMatchStatus === "PARTIAL" ? "~" : "—"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-xs" style={{ color: "#374151" }}>
                            {lead.recommendedOffer ? OFFER_LABELS[lead.recommendedOffer]?.split(" ")[0] : "—"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[lead.stage] ?? "bg-gray-100"}`}>
                            {STAGE_LABELS[lead.stage] ?? lead.stage}
                          </span>
                        </td>
                        <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1 flex-wrap">
                            {(lead.stage === "PERSONALIZED" || lead.stage === "SCORED") && (
                              <button onClick={() => { setSelected(lead); setEditedMsg(lead.personalizedMessage); }}
                                className="px-2 py-1 rounded text-xs font-medium"
                                style={{ background: "#EDE9FE", color: "#6D28D9" }}>
                                👁 Одобрить
                              </button>
                            )}
                            {lead.stage === "APPROVED" && (
                              <button onClick={() => markContacted(lead)}
                                className="px-2 py-1 rounded text-xs font-medium"
                                style={{ background: "#FEF3C7", color: "#92400E" }}>
                                📤 Отправить
                              </button>
                            )}
                            {lead.stage === "READY_TO_CONTACT" && (
                              <button onClick={() => markContacted(lead)}
                                className="px-2 py-1 rounded text-xs font-medium"
                                style={{ background: "#FFEDD5", color: "#9A3412" }}>
                                📤 Отправить
                              </button>
                            )}
                            {lead.stage === "CONTACTED" && (
                              <div className="flex gap-1">
                                <button onClick={() => markReply(lead, "POSITIVE")} className="px-1.5 py-0.5 rounded text-xs" style={{ background: "#DCFCE7", color: "#15803D" }}>✅</button>
                                <button onClick={() => markReply(lead, "QUESTION")} className="px-1.5 py-0.5 rounded text-xs" style={{ background: "#E0F2FE", color: "#0369A1" }}>❓</button>
                                <button onClick={() => markReply(lead, "NOT_NOW")} className="px-1.5 py-0.5 rounded text-xs" style={{ background: "#FEF9C3", color: "#854D0E" }}>🕐</button>
                                <button onClick={() => markReply(lead, "NEGATIVE")} className="px-1.5 py-0.5 rounded text-xs" style={{ background: "#FEE2E2", color: "#991B1B" }}>❌</button>
                                <button onClick={() => markReply(lead, "UNSUBSCRIBE")} className="px-1.5 py-0.5 rounded text-xs" style={{ background: "#F3F4F6", color: "#6B7280" }}>🚫</button>
                              </div>
                            )}
                            {lead.stage === "REPLIED" && (
                              <button onClick={() => markQualified(lead)} className="px-2 py-1 rounded text-xs font-medium"
                                style={{ background: "#CCFBF1", color: "#0F766E" }}>🎯 Qualify</button>
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

      {/* APPROVAL MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[92vh] overflow-y-auto"
            style={{ color: "#111827" }}>

            {/* Modal header */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold" style={{ color: "#111827" }}>{selected.companyName}</h2>
                  <div className="flex gap-2 mt-1 flex-wrap items-center">
                    <span className="text-sm" style={{ color: "#4B5563" }}>
                      {selected.country === "KZ" ? "🇰🇿" : "🇷🇺"} {selected.city}, {selected.country}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: "#374151" }}>
                      {selected.category}
                    </span>
                    {selected.marketplace && selected.marketplace !== "NONE" && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#EEF2FF", color: "#4338CA" }}>
                        {selected.marketplace}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ color: "#9CA3AF", fontSize: 24, lineHeight: 1 }}>×</button>
              </div>

              {/* Score row */}
              <div className="flex gap-4 mt-3">
                <div className="text-center">
                  <div className="text-xs" style={{ color: "#6B7280" }}>Opportunity</div>
                  <div className="text-2xl font-bold" style={{ color: selected.opportunityScore >= 70 ? "#16a34a" : selected.opportunityScore >= 50 ? "#ca8a04" : "#dc2626" }}>
                    {selected.opportunityScore}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs" style={{ color: "#6B7280" }}>Evidence</div>
                  <div className="text-2xl font-bold" style={{ color: selected.evidenceScore >= 70 ? "#16a34a" : selected.evidenceScore >= 50 ? "#ca8a04" : "#dc2626" }}>
                    {selected.evidenceScore}
                  </div>
                  <EvidenceLabel score={selected.evidenceScore} />
                </div>
                {selected.messageQualityScore > 0 && (
                  <div className="text-center">
                    <div className="text-xs" style={{ color: "#6B7280" }}>Message Quality</div>
                    <div className="text-2xl font-bold" style={{ color: selected.messageQualityScore >= 70 ? "#16a34a" : "#ca8a04" }}>
                      {selected.messageQualityScore}
                    </div>
                  </div>
                )}
                {selected.dataQualityScore > 0 && (
                  <div className="text-center">
                    <div className="text-xs" style={{ color: "#6B7280" }}>Data Quality</div>
                    <div className="text-2xl font-bold" style={{ color: selected.dataQualityScore >= 70 ? "#16a34a" : selected.dataQualityScore >= 50 ? "#ca8a04" : "#dc2626" }}>
                      {selected.dataQualityScore}
                    </div>
                  </div>
                )}
                {selected.rawOpportunityScore > 0 && selected.rawOpportunityScore !== selected.opportunityScore && (
                  <div className="text-center">
                    <div className="text-xs" style={{ color: "#6B7280" }}>Raw Opp</div>
                    <div className="text-lg font-semibold" style={{ color: "#9CA3AF" }}>{selected.rawOpportunityScore}</div>
                    <div className="text-xs" style={{ color: "#9CA3AF" }}>×factor</div>
                  </div>
                )}
              </div>

              {/* Data Quality flags */}
              {(selected.countryVerified || selected.companyVerified || selected.productVerified || selected.contactVerified || selected.sourceVerified) && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {[
                    { key: "countryVerified", label: "🌍 Страна", val: selected.countryVerified },
                    { key: "companyVerified", label: "🏢 Компания", val: selected.companyVerified },
                    { key: "productVerified", label: "📦 Товар", val: selected.productVerified },
                    { key: "contactVerified", label: "📞 Контакт", val: selected.contactVerified },
                    { key: "sourceVerified", label: "🔗 Источник", val: selected.sourceVerified },
                  ].map((f) => (
                    <span key={f.key} className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: f.val ? "#DCFCE7" : "#FEE2E2", color: f.val ? "#15803D" : "#991B1B" }}>
                      {f.val ? "✓" : "✗"} {f.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 space-y-4">

              {/* REASON TO CONTACT */}
              <div className="p-3 rounded-lg" style={{ background: "#EFF6FF" }}>
                <div className="text-xs font-semibold mb-1" style={{ color: "#1D4ED8" }}>💡 ПРИЧИНА ОБРАЩЕНИЯ</div>
                <p className="text-sm" style={{ color: "#1E40AF" }}>{selected.reasonToContact || "—"}</p>
              </div>

              {/* STRUCTURED EVIDENCE (§3 ТЗ) */}
              {selected.evidenceData?.structured ? (
                <div className="space-y-2">
                  {/* Verified Facts */}
                  {selected.evidenceData.structured.verified_facts.length > 0 && (
                    <div className="p-3 rounded-lg border" style={{ background: "#F0FDF4", borderColor: "#BBF7D0" }}>
                      <div className="text-xs font-semibold mb-2" style={{ color: "#15803D" }}>✅ VERIFIED FACTS</div>
                      <div className="space-y-1">
                        {selected.evidenceData.structured.verified_facts.map((f, i) => (
                          <div key={i} className="text-xs flex items-start gap-1.5">
                            <span style={{ color: "#16a34a", flexShrink: 0 }}>●</span>
                            <span style={{ color: "#111827" }}>
                              {f.fact}
                              {f.url && (
                                <a href={f.url} target="_blank" rel="noreferrer" className="ml-1" style={{ color: "#2563EB" }}>↗</a>
                              )}
                              <span className="ml-1" style={{ color: "#9CA3AF" }}>({f.source})</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* AI Inferences */}
                  {selected.evidenceData.structured.ai_inferences.length > 0 && (
                    <div className="p-3 rounded-lg border" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
                      <div className="text-xs font-semibold mb-2" style={{ color: "#92400E" }}>🤖 AI INFERENCE</div>
                      <div className="space-y-1">
                        {selected.evidenceData.structured.ai_inferences.map((inf, i) => (
                          <div key={i} className="text-xs flex items-start gap-1.5">
                            <span style={{ color: "#f59e0b", flexShrink: 0 }}>~</span>
                            <span style={{ color: "#78350F" }}>
                              {inf.inference}
                              <span className="ml-1 px-1 rounded text-xs" style={{
                                background: inf.confidence === "high" ? "#FEF9C3" : inf.confidence === "medium" ? "#FFEDD5" : "#FEE2E2",
                                color: inf.confidence === "high" ? "#854D0E" : inf.confidence === "medium" ? "#9A3412" : "#991B1B",
                              }}>{inf.confidence}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Unknowns */}
                  {selected.evidenceData.structured.unknown.length > 0 && (
                    <div className="p-3 rounded-lg border" style={{ background: "#FEF2F2", borderColor: "#FECACA" }}>
                      <div className="text-xs font-semibold mb-2" style={{ color: "#991B1B" }}>❓ UNKNOWN</div>
                      <div className="space-y-1">
                        {selected.evidenceData.structured.unknown.map((u, i) => (
                          <div key={i} className="text-xs" style={{ color: "#7F1D1D" }}>
                            <span className="font-semibold">{u.field}:</span> {u.why}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Source links */}
                  <div className="flex gap-2 flex-wrap">
                    {selected.chinaSourceUrl && (
                      <a href={selected.chinaSourceUrl} target="_blank" rel="noreferrer"
                        className="text-xs px-2 py-1 rounded border"
                        style={{ color: "#2563EB", borderColor: "#BFDBFE", background: "#EFF6FF" }}>
                        🇨🇳 Открыть China Source →
                      </a>
                    )}
                    {cm?.supplier_url && String(cm.supplier_url) !== selected.chinaSourceUrl && (
                      <a href={String(cm.supplier_url)} target="_blank" rel="noreferrer"
                        className="text-xs px-2 py-1 rounded border"
                        style={{ color: "#4338CA", borderColor: "#C7D2FE", background: "#EEF2FF" }}>
                        🔗 Supplier URL →
                      </a>
                    )}
                  </div>
                </div>
              ) : (cm || econ) && (
                <div className="p-3 rounded-lg border" style={{ background: "#F0FDF4", borderColor: "#BBF7D0" }}>
                  <div className="text-xs font-semibold mb-2" style={{ color: "#15803D" }}>🔍 ДОКАЗАТЕЛЬСТВА</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {cm?.product_name && (
                      <div><span style={{ color: "#6B7280" }}>China товар: </span><span className="font-semibold">{String(cm.product_name)}</span></div>
                    )}
                    {cm?.price_min_cny && (
                      <div><span style={{ color: "#6B7280" }}>China цена: </span><span className="font-semibold">{String(cm.price_min_cny)}–{String(cm.price_max_cny)} CNY</span></div>
                    )}
                    {econ?.landed_cost_usd && (
                      <div><span style={{ color: "#6B7280" }}>Landed cost: </span><span className="font-semibold">${String(econ.landed_cost_usd)}</span></div>
                    )}
                    {econ?.price_gap && (
                      <div><span style={{ color: "#6B7280" }}>Price gap: </span><span className="font-semibold">~{Math.round(Number(econ.price_gap) * 100)}%</span></div>
                    )}
                  </div>
                  {cm?.supplier_url && (
                    <a href={String(cm.supplier_url)} target="_blank" rel="noreferrer" className="inline-block mt-2 text-xs" style={{ color: "#2563EB" }}>🔗 Открыть источник →</a>
                  )}
                </div>
              )}

              {/* RECOMMENDED OFFER + NBA */}
              {(selected.recommendedOffer || selected.nextBestAction) && (
                <div className="flex gap-3">
                  {selected.recommendedOffer && (
                    <div className="flex-1 p-3 rounded-lg border" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
                      <div className="text-xs font-semibold mb-1" style={{ color: "#92400E" }}>ОФФЕР</div>
                      <div className="text-sm font-medium" style={{ color: "#78350F" }}>
                        {OFFER_LABELS[selected.recommendedOffer] ?? selected.recommendedOffer}
                      </div>
                    </div>
                  )}
                  {selected.nextBestAction && (
                    <div className="flex-1 p-3 rounded-lg border" style={{ background: "#F0FDF4", borderColor: "#BBF7D0" }}>
                      <div className="text-xs font-semibold mb-1" style={{ color: "#166534" }}>СЛЕДУЮЩИЙ ШАГ</div>
                      <div className="text-sm font-medium" style={{ color: "#14532D" }}>
                        {NBA_LABELS[selected.nextBestAction] ?? selected.nextBestAction}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MESSAGE */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold" style={{ color: "#374151" }}>💬 СООБЩЕНИЕ (редактируемое)</span>
                  {selected.messageQualityScore > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium`}
                      style={{
                        background: selected.messageQualityScore >= 70 ? "#DCFCE7" : selected.messageQualityScore >= 50 ? "#FEF9C3" : "#FEE2E2",
                        color: selected.messageQualityScore >= 70 ? "#166534" : selected.messageQualityScore >= 50 ? "#854D0E" : "#991B1B",
                      }}>
                      Качество: {selected.messageQualityScore}/100
                    </span>
                  )}
                </div>
                {!editedMsg && (
                  <div className="mb-2 p-2 rounded-lg text-xs" style={{ background: "#FFFBEB", color: "#92400E", border: "1px solid #FDE68A" }}>
                    ⚠️ Сообщение не сгенерировано. Запустите Enrich v2 или напишите вручную.
                  </div>
                )}
                {selected.evidenceScore < MIN_EVIDENCE_TO_APPROVE && (
                  <div className="mb-2 p-2 rounded-lg text-xs" style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" }}>
                    🚫 Evidence Score {selected.evidenceScore} &lt; {MIN_EVIDENCE_TO_APPROVE} — нельзя одобрить без доказательств. Запустите Enrich v2.
                  </div>
                )}
                <textarea
                  ref={textareaRef}
                  value={editedMsg}
                  onChange={(e) => setEditedMsg(e.target.value)}
                  placeholder="Введите персональное сообщение..."
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none"
                  style={{ color: "#111827", backgroundColor: "#ffffff", WebkitTextFillColor: "#111827" }}
                />
                <div className="text-xs mt-1 text-right" style={{ color: "#9CA3AF" }}>
                  {selected.pitchType === "B2B_IMPORT" ? "📦 B2B Import" : selected.pitchType === "DELIVERY" ? "🚚 Delivery" : selected.pitchType === "SOURCING" ? "🔍 Sourcing" : "🛒 Seller Outbound"}
                </div>
              </div>

              {/* Contacts */}
              <div className="flex gap-4 text-xs flex-wrap" style={{ color: "#6B7280" }}>
                {selected.phone && <span>📞 {selected.phone}</span>}
                {selected.email && <span>📧 {selected.email}</span>}
                {selected.website && <a href={selected.website} target="_blank" rel="noreferrer" style={{ color: "#2563EB" }}>🌐 сайт</a>}
              </div>

              {/* Actions — SEPARATED: Approve vs Send */}
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="text-xs font-semibold mb-2" style={{ color: "#6B7280" }}>
                  Одобрение → APPROVED → затем нажмите «Отправить» в таблице
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approveLead(editedMsg !== selected.personalizedMessage && editedMsg.trim() ? "edit_approve" : "approve")}
                    disabled={actionLoading || !canApprove}
                    title={!editedMsg.trim() ? "Напишите сообщение" : !canApprove ? `Evidence слишком низкий (${selected.evidenceScore}/${MIN_EVIDENCE_TO_APPROVE})` : ""}
                    className="flex-1 py-2.5 rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: canApprove ? "#16a34a" : "#9CA3AF", color: "#fff" }}>
                    {editedMsg !== selected.personalizedMessage && editedMsg.trim() ? "✏️ Правки → Одобрить" : "✅ Одобрить → APPROVED"}
                  </button>
                  <button onClick={() => approveLead("reject")} disabled={actionLoading}
                    className="px-4 py-2.5 rounded-lg font-medium text-sm"
                    style={{ background: "#FEF2F2", color: "#991B1B" }}>
                    Отклонить
                  </button>
                  <button onClick={() => setSelected(null)}
                    className="px-4 py-2.5 rounded-lg font-medium text-sm"
                    style={{ background: "#F3F4F6", color: "#374151" }}>
                    Закрыть
                  </button>
                </div>
                {/* Secondary actions: Recalculate + Open Sources */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => recalculateLead(selected.outboundId, selected.companyName)}
                    disabled={recalculating}
                    className="px-3 py-2 rounded-lg text-xs font-medium"
                    style={{ background: "#EEF2FF", color: "#4338CA" }}>
                    {recalculating ? "⏳ Пересчёт..." : "🔄 Recalculate"}
                  </button>
                  {selected.chinaSourceUrl && (
                    <a href={selected.chinaSourceUrl} target="_blank" rel="noreferrer"
                      className="px-3 py-2 rounded-lg text-xs font-medium"
                      style={{ background: "#F0FDF4", color: "#15803D" }}>
                      🇨🇳 Open Sources
                    </a>
                  )}
                  {selected.stage === "REPLIED" && (
                    <a href={`/admin/sales/chat?lead=${selected.outboundId}`}
                      className="px-3 py-2 rounded-lg text-xs font-medium"
                      style={{ background: "#F0F9FF", color: "#0369A1" }}>
                      🤝 AI Consultant →
                    </a>
                  )}
                  {selected.companyId && (
                    <span className="px-3 py-2 rounded-lg text-xs" style={{ background: "#F9FAFB", color: "#9CA3AF" }}>
                      ID: {selected.companyId}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* §5: Companies tab */}
      {activeTab === "companies" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: "#111827" }}>🏢 Компании ({companies.length})</h2>
            <div className="flex gap-2">
              <button onClick={loadCompanies} disabled={companiesLoading}
                className="px-3 py-1.5 border rounded-lg text-sm bg-white" style={{ color: "#374151" }}>
                {companiesLoading ? "⏳" : "🔄 Обновить"}
              </button>
              <button onClick={() => setShowNewLead(true)}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                ➕ Новая компания
              </button>
            </div>
          </div>
          {companiesLoading ? (
            <div className="text-center py-8" style={{ color: "#9CA3AF" }}>Загрузка...</div>
          ) : (
            <div className="space-y-2">
              {companies.map((c) => (
                <div key={c.company_id} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm" style={{ color: "#111827" }}>{c.company_name}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                      {c.country} · {c.opportunity_count} opportunity{c.opportunity_count !== 1 ? "" : ""} · ID: {c.company_id}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "#EEF2FF", color: "#4338CA" }}>
                      {c.opportunity_count} oppurt.
                    </span>
                    <button
                      onClick={() => {
                        setNewLead(prev => ({ ...prev, companyName: c.company_name, country: c.country }));
                        setShowNewLead(true);
                      }}
                      className="px-2 py-0.5 rounded-lg text-xs font-medium"
                      style={{ background: "#F0FDF4", color: "#15803D" }}>
                      + Opportunity
                    </button>
                  </div>
                </div>
              ))}
              {companies.length === 0 && !companiesLoading && (
                <div className="text-center py-8" style={{ color: "#9CA3AF" }}>Компании не найдены. Нажмите «Обновить».</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* §29-31: New Lead Modal */}
      {showNewLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold" style={{ color: "#111827" }}>➕ Новый лид / Opportunity</h2>
              <button onClick={() => setShowNewLead(false)} style={{ color: "#9CA3AF" }}>✕</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "#374151" }}>Компания *</label>
                  <input value={newLead.companyName} onChange={e => setNewLead(p => ({ ...p, companyName: e.target.value }))}
                    placeholder="Название компании"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "#374151" }}>Категория *</label>
                  <input value={newLead.category} onChange={e => setNewLead(p => ({ ...p, category: e.target.value }))}
                    placeholder="electronics, textile..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "#374151" }}>Страна *</label>
                  <select value={newLead.country} onChange={e => setNewLead(p => ({ ...p, country: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="KZ">Казахстан (KZ)</option>
                    <option value="RU">Россия (RU)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "#374151" }}>Город</label>
                  <input value={newLead.city} onChange={e => setNewLead(p => ({ ...p, city: e.target.value }))}
                    placeholder="Алматы, Москва..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "#374151" }}>Маркетплейс</label>
                  <select value={newLead.marketplace} onChange={e => setNewLead(p => ({ ...p, marketplace: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Не маркетплейс</option>
                    <option value="KASPI">Kaspi</option>
                    <option value="WB">Wildberries</option>
                    <option value="OZON">Ozon</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "#374151" }}>Сайт</label>
                  <input value={newLead.website} onChange={e => setNewLead(p => ({ ...p, website: e.target.value }))}
                    placeholder="example.kz"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "#374151" }}>Телефон</label>
                  <input value={newLead.phone} onChange={e => setNewLead(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+7..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "#374151" }}>Email</label>
                  <input value={newLead.email} onChange={e => setNewLead(p => ({ ...p, email: e.target.value }))}
                    placeholder="email@..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "#374151" }}>Кампания</label>
                <input value={newLead.campaign} onChange={e => setNewLead(p => ({ ...p, campaign: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={createNewLead}
                disabled={newLeadLoading || !newLead.companyName || !newLead.category}
                className="flex-1 py-2.5 rounded-lg font-medium text-sm text-white disabled:opacity-50"
                style={{ background: "#16a34a" }}>
                {newLeadLoading ? "Создаю..." : "✅ Создать лид → FOUND"}
              </button>
              <button onClick={() => setShowNewLead(false)}
                className="px-4 py-2.5 rounded-lg font-medium text-sm"
                style={{ background: "#F3F4F6", color: "#374151" }}>
                Отмена
              </button>
            </div>
            <p className="text-xs mt-2" style={{ color: "#9CA3AF" }}>
              После создания запустите Enrich v2 для обогащения данными
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
