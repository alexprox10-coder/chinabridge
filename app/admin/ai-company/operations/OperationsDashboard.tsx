"use client";

import { useState, useCallback } from "react";
import type {
  OperationsDirectorReport, Deal, Partner, CargoItem,
  DocumentRecord, ClientRecord, RiskAlert, DealStatus, RiskLevel,
} from "@/lib/ai-company/operations/types";

// ── Helpers ────────────────────────────────────────────────────────────────

const DEAL_STATUS_LABEL: Record<DealStatus, string> = {
  NEW: "Новая", PURCHASE: "Закупка", CHINA_WAREHOUSE: "Склад КНР",
  SHIPPING: "В пути", CUSTOMS: "Таможня", DELIVERED: "Доставлено",
};
const DEAL_STATUS_COLOR: Record<DealStatus, string> = {
  NEW: "text-slate-400 bg-slate-800",
  PURCHASE: "text-amber-400 bg-amber-900/30",
  CHINA_WAREHOUSE: "text-blue-400 bg-blue-900/30",
  SHIPPING: "text-emerald-400 bg-emerald-900/30",
  CUSTOMS: "text-orange-400 bg-orange-900/30",
  DELIVERED: "text-violet-400 bg-violet-900/30",
};
const DOC_TYPE_LABEL: Record<string, string> = {
  INVOICE: "Инвойс", PACKING_LIST: "Упаковочный лист",
  CONTRACT: "Договор", CERTIFICATE: "Сертификат", CUSTOMS_DECL: "Таможенная декларация",
};
const DOC_STATUS_COLOR: Record<string, string> = {
  READY: "text-emerald-400", MISSING: "text-red-400",
  PENDING: "text-amber-400", EXPIRED: "text-red-500",
};
const DOC_STATUS_LABEL: Record<string, string> = {
  READY: "Готов", MISSING: "Отсутствует", PENDING: "Ожидает", EXPIRED: "Просрочен",
};

function riskColor(r: RiskLevel) {
  return r === "HIGH" ? "text-red-400" : r === "MEDIUM" ? "text-amber-400" : "text-emerald-400";
}
function riskBg(r: RiskLevel) {
  return r === "HIGH"
    ? "bg-red-500/10 border-red-500/30"
    : r === "MEDIUM"
    ? "bg-amber-500/10 border-amber-500/30"
    : "bg-emerald-500/10 border-emerald-500/30";
}
function statusColor(s: string) {
  return s === "GOOD" ? "text-emerald-400" : s === "WARNING" ? "text-amber-400" : "text-red-400";
}
function statusBg(s: string) {
  return s === "GOOD"
    ? "bg-emerald-500/10 border-emerald-500/30"
    : s === "WARNING"
    ? "bg-amber-500/10 border-amber-500/30"
    : "bg-red-500/10 border-red-500/30";
}
function statusLabel(s: string) {
  return s === "GOOD" ? "ХОРОШО" : s === "WARNING" ? "ВНИМАНИЕ" : "КРИТИЧНО";
}

// ── Tab 1: Overview ────────────────────────────────────────────────────────

function OverviewTab({ report }: { report: OperationsDirectorReport }) {
  const { kpis, health } = report;
  const cards = [
    { label: "Активные сделки",   value: kpis.activeDeals,      icon: "💼" },
    { label: "Активные грузы",    value: kpis.activeCargo,       icon: "📦" },
    { label: "В закупке",         value: kpis.inPurchase,        icon: "🛒" },
    { label: "В логистике",       value: kpis.inLogistics,       icon: "🚚" },
    { label: "На таможне",        value: kpis.inCustoms,         icon: "🏛️" },
    { label: "Доставлено",        value: kpis.delivered,         icon: "✅" },
    { label: "Проблемы",          value: kpis.problems,          icon: "⚠️" },
    { label: "Ср. срок (дни)",    value: kpis.avgDeliveryDays,   icon: "📅" },
  ];

  return (
    <div className="space-y-5">
      {/* Health */}
      <div className={`rounded-xl border p-5 ${statusBg(health.status)}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-slate-400 mb-1">Operations Health Score</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">{health.score}</span>
              <span className="text-slate-400">/100</span>
              <span className={`text-sm font-semibold ml-1 ${statusColor(health.status)}`}>
                {statusLabel(health.status)}
              </span>
            </div>
          </div>
        </div>
        <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full rounded-full ${health.score >= 80 ? "bg-emerald-500" : health.score >= 55 ? "bg-amber-500" : "bg-red-500"}`}
            style={{ width: `${health.score}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {health.positives.map((p, i) => (
            <p key={i} className="text-xs text-emerald-300 flex gap-1.5"><span>✓</span>{p}</p>
          ))}
          {health.risks.map((r, i) => (
            <p key={i} className="text-xs text-red-300 flex gap-1.5"><span>✗</span>{r}</p>
          ))}
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-4 gap-3">
        {cards.map(c => (
          <div key={c.label} className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center">
            <p className="text-xl mb-1">{c.icon}</p>
            <p className={`text-2xl font-bold ${c.label === "Проблемы" && c.value > 0 ? "text-red-400" : "text-white"}`}>
              {c.value}
            </p>
            <p className="text-xs text-slate-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Deals pipeline */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Все сделки</h3>
        <div className="space-y-2">
          {report.deals.map((d: Deal) => (
            <div key={d.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-14">{d.id}</span>
                <span className="text-sm text-slate-200">{d.product}</span>
                <span className="text-xs text-slate-500">{d.clientName}</span>
              </div>
              <div className="flex items-center gap-3">
                {d.eta > 0 && <span className="text-xs text-slate-400">ETA {d.eta}д</span>}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DEAL_STATUS_COLOR[d.status]}`}>
                  {DEAL_STATUS_LABEL[d.status]}
                </span>
                {d.riskLevel === "HIGH" && <span className="text-xs text-red-400">⚠</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab 2: China Partner AI ────────────────────────────────────────────────

function PartnerTab({ report }: { report: OperationsDirectorReport }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const partnerStatus: Record<string, string> = {
    ACTIVE: "text-emerald-400", AT_RISK: "text-red-400", INACTIVE: "text-slate-500",
  };
  const partnerStatusLabel: Record<string, string> = {
    ACTIVE: "ACTIVE", AT_RISK: "AT RISK", INACTIVE: "INACTIVE",
  };

  return (
    <div className="space-y-3">
      {report.partners.map((p: Partner) => (
        <div key={p.id} className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === p.id ? null : p.id)}
            className="w-full p-4 text-left"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{p.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{p.city}, Китай</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold ${partnerStatus[p.status]}`}>
                  {partnerStatusLabel[p.status]}
                </span>
                <span className="text-slate-500 text-xs">{expanded === p.id ? "▲" : "▼"}</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 mt-3">
              {[
                { label: "Заказов", value: p.ordersCount },
                { label: "Ср. срок", value: `${p.avgDeliveryDays}д` },
                { label: "Рейтинг", value: `${p.rating}/100` },
                { label: "Ответ", value: p.responseTime },
              ].map(m => (
                <div key={m.label} className="text-center">
                  <p className="text-sm font-semibold text-white">{m.value}</p>
                  <p className="text-xs text-slate-500">{m.label}</p>
                </div>
              ))}
            </div>
          </button>

          {expanded === p.id && (
            <div className="px-4 pb-4 space-y-2 border-t border-slate-800 pt-3">
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">AI-анализ</p>
                <p className="text-sm text-slate-300">{p.aiAnalysis}</p>
              </div>
              <div className={`rounded-lg p-3 border ${p.status === "AT_RISK" ? "bg-red-950/30 border-red-500/20" : "bg-emerald-950/20 border-emerald-500/20"}`}>
                <p className="text-xs text-emerald-500 mb-1">Рекомендация</p>
                <p className="text-sm text-emerald-300">{p.recommendation}</p>
              </div>
              <p className="text-xs text-slate-600">Последний контакт: {p.lastContactDays} дн. назад</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Tab 3: Logistics AI ────────────────────────────────────────────────────

function LogisticsTab({ report }: { report: OperationsDirectorReport }) {
  return (
    <div className="space-y-3">
      {report.cargos.map((c: CargoItem) => (
        <div key={c.id} className={`rounded-xl border p-4 ${c.riskLevel === "HIGH" ? "bg-red-950/20 border-red-500/30" : "bg-slate-900 border-slate-700"}`}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">#{c.id}</span>
                <span className="text-sm font-semibold text-white">{c.product}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{c.clientName}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DEAL_STATUS_COLOR[c.status]}`}>
              {DEAL_STATUS_LABEL[c.status]}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Вес", value: `${c.weight} кг` },
              { label: "ETA", value: c.eta > 0 ? `${c.eta} дней` : "Доставлено" },
              { label: "Стоимость", value: `${c.value.toLocaleString("ru")}₽` },
              { label: "Перевозчик", value: c.carrier },
            ].map(m => (
              <div key={m.label}>
                <p className="text-xs text-slate-500">{m.label}</p>
                <p className="text-sm text-slate-200 font-medium">{m.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center gap-2">
            <span className="text-xs text-slate-500">Маршрут:</span>
            <span className="text-xs text-slate-300">{c.route}</span>
            {c.riskLevel === "HIGH" && (
              <span className="ml-auto text-xs text-red-400 font-medium">⚠ Высокий риск</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tab 4: Documents AI ────────────────────────────────────────────────────

function DocumentsTab({ report }: { report: OperationsDirectorReport }) {
  const grouped: Record<string, DocumentRecord[]> = {};
  for (const d of report.documents) {
    grouped[d.dealId] = grouped[d.dealId] ?? [];
    grouped[d.dealId].push(d);
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([dealId, docs]) => {
        const hasIssues = docs.some(d => d.status !== "READY");
        const clientName = docs[0]?.clientName ?? "";
        const product    = docs[0]?.product ?? "";
        return (
          <div key={dealId} className={`rounded-xl border p-4 ${hasIssues ? "bg-red-950/10 border-red-500/20" : "bg-slate-900 border-slate-700"}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-white">{dealId}</p>
                <p className="text-xs text-slate-400">{clientName} · {product}</p>
              </div>
              {hasIssues ? (
                <span className="text-xs text-red-400 font-medium">⚠ Проблемы</span>
              ) : (
                <span className="text-xs text-emerald-400 font-medium">✓ Всё готово</span>
              )}
            </div>
            <div className="space-y-2">
              {docs.map(doc => (
                <div key={doc.id} className="flex items-start justify-between gap-3 py-1.5 border-b border-slate-800 last:border-0">
                  <div>
                    <p className="text-sm text-slate-300">{DOC_TYPE_LABEL[doc.type] ?? doc.type}</p>
                    {doc.action && (
                      <p className="text-xs text-amber-300 mt-0.5">{doc.action}</p>
                    )}
                  </div>
                  <span className={`text-xs font-medium shrink-0 ${DOC_STATUS_COLOR[doc.status]}`}>
                    {DOC_STATUS_LABEL[doc.status]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Tab 5: Client Success AI ───────────────────────────────────────────────

function ClientTab({ report }: { report: OperationsDirectorReport }) {
  const clientStatusLabel: Record<string, string> = {
    ACTIVE: "ACTIVE", AT_RISK: "AT RISK", CHURNED: "CHURNED",
  };
  const clientStatusColor: Record<string, string> = {
    ACTIVE: "text-emerald-400", AT_RISK: "text-red-400", CHURNED: "text-slate-500",
  };

  return (
    <div className="space-y-3">
      {report.clients.map((c: ClientRecord) => (
        <div
          key={c.id}
          className={`rounded-xl border p-4 ${c.status === "AT_RISK" ? "bg-red-950/20 border-red-500/30" : "bg-slate-900 border-slate-700"}`}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-sm font-semibold text-white">{c.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Повторных заказов: {c.repeatOrders} · Активных: {c.activeDeals}
              </p>
            </div>
            <span className={`text-xs font-bold ${clientStatusColor[c.status]}`}>
              {clientStatusLabel[c.status]}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center">
              <p className={`text-lg font-bold ${c.lastContactDays >= 10 ? "text-red-400" : "text-white"}`}>
                {c.lastContactDays}д
              </p>
              <p className="text-xs text-slate-500">Без контакта</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white">{c.satisfaction}%</p>
              <p className="text-xs text-slate-500">Удовлетворённость</p>
            </div>
            <div className="text-center">
              <p className={`text-lg font-bold ${c.riskLevel === "HIGH" ? "text-red-400" : "text-white"}`}>
                {c.riskLevel}
              </p>
              <p className="text-xs text-slate-500">Риск</p>
            </div>
          </div>

          <div className={`rounded-lg p-2.5 ${c.status === "AT_RISK" ? "bg-red-950/30 border border-red-500/20" : "bg-slate-800"}`}>
            <p className="text-xs text-slate-500 mb-1">Рекомендация</p>
            <p className="text-sm text-slate-300">{c.recommendation}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tab 6: Risk Monitor AI ─────────────────────────────────────────────────

function RiskTab({ report }: { report: OperationsDirectorReport }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const riskTypeIcon: Record<string, string> = {
    SUPPLIER_DELAY: "⏱️", CUSTOMS_HOLD: "🏛️", MISSING_DOCS: "📄",
    CLIENT_UNHAPPY: "👤", SHIPPING_COST: "📈", PAYMENT_OVERDUE: "💰",
  };

  if (report.risks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <span className="text-4xl">✅</span>
        <p className="text-white font-semibold">Критических рисков нет</p>
        <p className="text-sm text-slate-400">Все операции идут по графику</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {report.risks.map((r: RiskAlert) => (
        <div key={r.id} className={`rounded-xl border overflow-hidden ${riskBg(r.priority)}`}>
          <button
            onClick={() => setExpanded(expanded === r.id ? null : r.id)}
            className="w-full p-4 text-left"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0">{riskTypeIcon[r.type] ?? "⚠️"}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{r.title}</p>
                  {r.dealId && <p className="text-xs text-slate-400 mt-0.5">Сделка #{r.dealId}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <p className={`text-xs font-bold ${riskColor(r.priority)}`}>{r.priority}</p>
                  <p className="text-xs text-slate-500">{r.probability}% вер.</p>
                </div>
                <span className="text-slate-500 text-xs">{expanded === r.id ? "▲" : "▼"}</span>
              </div>
            </div>
          </button>

          {expanded === r.id && (
            <div className="px-4 pb-4 space-y-2 border-t border-white/10 pt-3">
              <p className="text-sm text-slate-300">{r.description}</p>
              <div className="bg-slate-900/60 rounded-lg p-3">
                <p className="text-xs text-emerald-500 mb-1">Решение</p>
                <p className="text-sm text-emerald-300">{r.solution}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Tab 7: Director AI ─────────────────────────────────────────────────────

function DirectorTab({
  report, onGenerate, generating,
}: {
  report: OperationsDirectorReport;
  onGenerate: () => void;
  generating: boolean;
}) {
  return (
    <div className="space-y-5">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚙️</span>
            <p className="text-sm font-semibold text-white">Operations Director AI</p>
          </div>
          <button
            onClick={onGenerate}
            disabled={generating}
            className="text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50"
          >
            {generating ? "Генерация..." : "Обновить отчёт"}
          </button>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{report.summary}</p>
      </div>

      {report.topAction && (
        <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4">
          <p className="text-xs text-amber-500 mb-1">Главное действие прямо сейчас</p>
          <p className="text-sm text-amber-300 font-medium">{report.topAction}</p>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <p className="text-sm font-semibold text-white mb-3">Рекомендации</p>
        <div className="space-y-3">
          {report.recommendations.map((rec, i) => (
            <div key={rec.id} className="flex gap-3">
              <span className={`text-sm font-bold shrink-0 ${riskColor(rec.priority)}`}>{i + 1}.</span>
              <div>
                <p className="text-sm text-slate-300">{rec.text}</p>
                <p className="text-xs text-slate-500 mt-0.5">{rec.department} · {rec.deadline}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CEO summary block */}
      <div className="bg-slate-900 border border-violet-500/20 rounded-xl p-4">
        <p className="text-xs text-violet-400 mb-2">📊 CEO Summary</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-500 text-xs">Активных сделок</p>
            <p className="text-white font-semibold">{report.kpis.activeDeals}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Проблем</p>
            <p className={`font-semibold ${report.kpis.problems > 0 ? "text-red-400" : "text-emerald-400"}`}>
              {report.kpis.problems}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Риск уровень</p>
            <p className={`font-semibold ${riskColor(report.risks[0]?.priority ?? "LOW")}`}>
              {report.risks.filter(r => r.priority === "HIGH").length > 0 ? "HIGH" : "LOW"}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Health Score</p>
            <p className={`font-semibold ${statusColor(report.health.status)}`}>{report.health.score}/100</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-600 text-center">
        Обновлено: {new Date(report.generatedAt).toLocaleString("ru-RU")}
      </p>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",  label: "Обзор",           icon: "📊" },
  { id: "partners",  label: "China Partner AI", icon: "🇨🇳" },
  { id: "logistics", label: "Logistics AI",     icon: "🚚" },
  { id: "documents", label: "Documents AI",     icon: "📄" },
  { id: "clients",   label: "Client Success",   icon: "👥" },
  { id: "risks",     label: "Risk Monitor",     icon: "⚠️" },
  { id: "director",  label: "AI Director",      icon: "🤖" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function OperationsDashboard({
  initialReport,
}: {
  initialReport: OperationsDirectorReport | null;
}) {
  const [tab, setTab]       = useState<TabId>("overview");
  const [report, setReport] = useState<OperationsDirectorReport | null>(initialReport);
  const [generating, setGenerating] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const generate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      const res  = await fetch("/api/ai-company/operations/report");
      const json = await res.json();
      if (json.ok) setReport(json.report);
      else setError(json.error ?? "Ошибка генерации");
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setGenerating(false);
    }
  }, []);

  const highRisks = report?.risks.filter(r => r.priority === "HIGH").length ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <a href="/admin/ai-company" className="hover:text-white transition-colors">🤖 AI OS</a>
        <span>›</span>
        <span className="text-white">⚙️ Операции</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Operations Department AI</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Сделки · Логистика · Таможня · Документы · Партнёры
          </p>
        </div>
        {report && (
          <div className="flex items-center gap-3">
            {highRisks > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 font-medium border border-red-500/30">
                ⚠ {highRisks} риска
              </span>
            )}
            <div className={`px-3 py-1.5 rounded-lg border text-sm font-semibold ${statusBg(report.health.status)} ${statusColor(report.health.status)}`}>
              {report.health.score}/100
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-violet-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
            }`}
          >
            {t.icon} {t.label}
            {t.id === "risks" && highRisks > 0 && (
              <span className="ml-1.5 text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5">
                {highRisks}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {!report && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <span className="text-5xl">⚙️</span>
          <p className="text-white font-semibold">Загрузка операционных данных...</p>
          <button
            onClick={generate}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm"
          >
            Загрузить данные
          </button>
        </div>
      )}

      {report && (
        <>
          {tab === "overview"  && <OverviewTab   report={report} />}
          {tab === "partners"  && <PartnerTab    report={report} />}
          {tab === "logistics" && <LogisticsTab  report={report} />}
          {tab === "documents" && <DocumentsTab  report={report} />}
          {tab === "clients"   && <ClientTab     report={report} />}
          {tab === "risks"     && <RiskTab       report={report} />}
          {tab === "director"  && (
            <DirectorTab report={report} onGenerate={generate} generating={generating} />
          )}
        </>
      )}
    </div>
  );
}
