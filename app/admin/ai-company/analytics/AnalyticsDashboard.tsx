"use client";

import { useState, useCallback } from "react";
import type { AnalyticsDirectorReport, BIInsight, DepartmentScore, AnalyticsRecommendation } from "@/lib/ai-company/analytics/types";

// ── Helpers ────────────────────────────────────────────────────────────────

function statusColor(s: string) {
  return s === "GOOD" ? "text-emerald-400" : s === "WARNING" ? "text-amber-400" : "text-red-400";
}
function statusBg(s: string) {
  return s === "GOOD" ? "bg-emerald-500/10 border-emerald-500/30" : s === "WARNING" ? "bg-amber-500/10 border-amber-500/30" : "bg-red-500/10 border-red-500/30";
}
function statusLabel(s: string) {
  return s === "GOOD" ? "ХОРОШО" : s === "WARNING" ? "ВНИМАНИЕ" : "КРИТИЧНО";
}
function insightIcon(type: string) {
  return type === "problem" ? "🔴" : type === "opportunity" ? "🟢" : "📈";
}
function priorityBadge(p: string) {
  const base = "text-xs px-2 py-0.5 rounded-full font-medium";
  return p === "HIGH"
    ? `${base} bg-red-500/20 text-red-400`
    : p === "MEDIUM"
    ? `${base} bg-amber-500/20 text-amber-400`
    : `${base} bg-slate-500/20 text-slate-400`;
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 90 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span className="font-medium text-white">{score}/100</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────────

function OverviewTab({ report }: { report: AnalyticsDirectorReport }) {
  const { health } = report;
  return (
    <div className="space-y-6">
      {/* Company Health Card */}
      <div className={`rounded-xl border p-6 ${statusBg(health.status)}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-slate-400 mb-1">Company Health Score</p>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-bold text-white">{health.score}</span>
              <span className="text-lg text-slate-400">/100</span>
              <span className={`text-sm font-semibold ${statusColor(health.status)}`}>
                {statusLabel(health.status)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 mb-1">Тренд</p>
            <span className="text-2xl">{health.trend === "up" ? "↑" : health.trend === "down" ? "↓" : "→"}</span>
          </div>
        </div>
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full rounded-full transition-all ${health.score >= 90 ? "bg-emerald-500" : health.score >= 60 ? "bg-amber-500" : "bg-red-500"}`}
            style={{ width: `${health.score}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {health.positives.slice(0, 2).map((p, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-emerald-300">
              <span>✓</span><span>{p}</span>
            </div>
          ))}
          {health.problems.slice(0, 2).map((p, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-red-300">
              <span>✗</span><span>{p}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Department scores */}
      <div className="grid grid-cols-2 gap-4">
        {health.departments.map((d: DepartmentScore) => (
          <div key={d.id} className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white">{d.name}</p>
              <span className={`text-xs font-semibold ${statusColor(d.status)}`}>{statusLabel(d.status)}</span>
            </div>
            <ScoreBar score={d.score} label={d.keyMetric} />
            <p className="text-xs text-slate-500">Вес: {d.weight}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sales Tab ──────────────────────────────────────────────────────────────

function SalesTab({ report }: { report: AnalyticsDirectorReport }) {
  const { sales } = report;
  const metrics = [
    { label: "Всего лидов",      value: sales.totalLeads,  color: "text-white" },
    { label: "HOT",              value: sales.hotLeads,     color: "text-red-400" },
    { label: "WARM",             value: sales.warmLeads,    color: "text-amber-400" },
    { label: "COLD",             value: sales.coldLeads,    color: "text-slate-400" },
    { label: "Обработано",       value: sales.deals,        color: "text-emerald-400" },
    { label: "Конверсия",        value: `${sales.conversion}%`, color: sales.conversion >= 10 ? "text-emerald-400" : "text-amber-400" },
    { label: "Без активности",   value: sales.staleLeads,   color: sales.staleLeads > 2 ? "text-red-400" : "text-slate-400" },
    { label: "CRM записей",      value: sales.crmTotal,     color: "text-slate-300" },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Sales Analytics</h3>
          <ScoreBar score={sales.score} label="" />
        </div>
        <div className="grid grid-cols-4 gap-3">
          {metrics.map(m => (
            <div key={m.label} className="bg-slate-800 rounded-lg p-3 text-center">
              <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
              <p className="text-xs text-slate-500 mt-1">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {sales.staleLeads > 0 && (
        <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-400 mb-2">⚠ Лиды без обработки</p>
          <p className="text-sm text-slate-300">
            {sales.staleLeads} лидов ждут контакта более 7 дней. Каждый день снижает вероятность сделки на 15%.
          </p>
        </div>
      )}

      {sales.problems.length > 0 && (
        <div className="space-y-2">
          {sales.problems.map((p, i) => (
            <div key={i} className="flex items-start gap-2 bg-slate-900 border border-slate-700 rounded-lg p-3">
              <span className="text-red-400 text-sm">✗</span>
              <span className="text-sm text-slate-300">{p}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Marketing Tab ──────────────────────────────────────────────────────────

function MarketingTab({ report }: { report: AnalyticsDirectorReport }) {
  const { marketing } = report;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Визиты / мес",    value: marketing.visitors.toLocaleString("ru"), sub: "посетителей" },
          { label: "Лиды",            value: marketing.leads, sub: "из маркетинга" },
          { label: "CPL средний",     value: `${marketing.cpl.toLocaleString("ru")}₽`, sub: marketing.cpl <= 2000 ? "✓ в норме" : "⚠ выше нормы" },
        ].map(m => (
          <div key={m.label} className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{m.value}</p>
            <p className="text-xs text-slate-400 mt-1">{m.label}</p>
            <p className="text-xs text-slate-600 mt-0.5">{m.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Источники трафика</h3>
        <div className="space-y-2">
          {marketing.trafficSources.map(s => (
            <div key={s.name} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
              <span className="text-sm text-slate-300">{s.label}</span>
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-400">{s.leads} лидов</span>
                {s.cpl > 0 && <span className="text-xs text-slate-500">{s.cpl}₽/лид</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {marketing.problems.length > 0 && (
        <div className="space-y-2">
          {marketing.problems.map((p, i) => (
            <div key={i} className="flex items-start gap-2 bg-slate-900 border border-slate-700 rounded-lg p-3">
              <span className="text-amber-400 text-sm">!</span>
              <span className="text-sm text-slate-300">{p}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Content Tab ────────────────────────────────────────────────────────────

function ContentTab({ report }: { report: AnalyticsDirectorReport }) {
  const { content } = report;
  const stats = [
    { label: "Статьи",    value: content.articles,      icon: "📝" },
    { label: "Telegram",  value: content.telegramPosts,  icon: "✈️" },
    { label: "YouTube",   value: content.youtubeVideos,  icon: "🎬" },
    { label: "Shorts",    value: content.shorts,          icon: "⚡" },
  ];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-white">{content.totalViews.toLocaleString("ru")}</p>
          <p className="text-xs text-slate-400 mt-1">Просмотров всего</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-white">{content.totalMaterials}</p>
          <p className="text-xs text-slate-400 mt-1">Материалов создано</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-center">
            <p className="text-lg mb-1">{s.icon}</p>
            <p className="text-xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {content.problems.length > 0 && (
        <div className="space-y-2">
          {content.problems.map((p, i) => (
            <div key={i} className="flex items-start gap-2 bg-slate-900 border border-slate-700 rounded-lg p-3">
              <span className="text-amber-400 text-sm">!</span>
              <span className="text-sm text-slate-300">{p}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Finance Tab ────────────────────────────────────────────────────────────

function FinanceTab({ report }: { report: AnalyticsDirectorReport }) {
  const { finance } = report;
  if (!finance.connected) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <span className="text-5xl">💰</span>
        <p className="text-lg font-semibold text-white">Finance Module не подключён</p>
        <p className="text-sm text-slate-400 text-center max-w-sm">
          Начните вести таблицу finance_orders в n8n: каждая закрытая сделка = одна запись.
          После заполнения данные появятся здесь автоматически.
        </p>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mt-4 w-full max-w-sm">
          <p className="text-xs text-slate-500 font-mono mb-2">n8n Table IDs:</p>
          <p className="text-xs text-slate-400 font-mono">ORDERS:   7GcFnGcjaEm0lKWI</p>
          <p className="text-xs text-slate-400 font-mono">EXPENSES: W2s2SbQIwPvRE5OW</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Выручка",    value: `${finance.revenue.toLocaleString("ru")}₽`,    color: "text-emerald-400" },
          { label: "Расходы",    value: `${finance.expenses.toLocaleString("ru")}₽`,   color: "text-red-400" },
          { label: "Прибыль",    value: `${finance.netProfit.toLocaleString("ru")}₽`,  color: finance.netProfit >= 0 ? "text-emerald-400" : "text-red-400" },
        ].map(m => (
          <div key={m.label} className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
            <p className="text-xs text-slate-400 mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{finance.margin}%</p>
          <p className="text-xs text-slate-400 mt-1">Маржинальность</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{finance.ordersCount}</p>
          <p className="text-xs text-slate-400 mt-1">Заказов</p>
        </div>
      </div>

      {finance.byChannel.length > 0 && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">По каналам</h3>
          {finance.byChannel.map(c => (
            <div key={c.channel} className="flex justify-between py-2 border-b border-slate-800 last:border-0">
              <span className="text-sm text-slate-300">{c.channel}</span>
              <div className="flex items-center gap-4">
                <span className="text-sm text-white">{c.revenue.toLocaleString("ru")}₽</span>
                <span className="text-xs text-slate-500">{c.margin}% маржа</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── BI Intelligence Tab ────────────────────────────────────────────────────

function BITab({ report }: { report: AnalyticsDirectorReport }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { insights } = report;

  return (
    <div className="space-y-3">
      {insights.map((ins: BIInsight) => (
        <div
          key={ins.id}
          className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden"
        >
          <button
            onClick={() => setExpanded(expanded === ins.id ? null : ins.id)}
            className="w-full p-4 text-left"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="text-lg">{insightIcon(ins.type)}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{ins.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{ins.department}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={priorityBadge(ins.priority)}>{ins.priority}</span>
                <span className="text-slate-500 text-xs">{expanded === ins.id ? "▲" : "▼"}</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-mono">{ins.dataPoint}</p>
          </button>

          {expanded === ins.id && (
            <div className="px-4 pb-4 space-y-2 border-t border-slate-800 pt-3">
              <p className="text-sm text-slate-300">{ins.description}</p>
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Рекомендация</p>
                <p className="text-sm text-emerald-300">{ins.recommendation}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Recommendations Tab ────────────────────────────────────────────────────

function RecsTab({ report }: { report: AnalyticsDirectorReport }) {
  return (
    <div className="space-y-4">
      {report.recommendations.map((r: AnalyticsRecommendation) => (
        <div key={r.id} className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">{r.problem}</p>
              <p className="text-xs text-slate-400 mt-0.5">{r.department} · {r.deadline}</p>
            </div>
            <span className={priorityBadge(r.priority)}>{r.priority}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800 rounded-lg p-2.5">
              <p className="text-xs text-slate-500 mb-1">Причина</p>
              <p className="text-xs text-slate-300">{r.cause}</p>
            </div>
            <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-lg p-2.5">
              <p className="text-xs text-emerald-500 mb-1">Решение</p>
              <p className="text-xs text-emerald-300">{r.solution}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Director Tab ───────────────────────────────────────────────────────────

function DirectorTab({
  report,
  onGenerate,
  generating,
}: {
  report: AnalyticsDirectorReport;
  onGenerate: () => void;
  generating: boolean;
}) {
  return (
    <div className="space-y-5">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <p className="text-sm font-semibold text-white">Analytics Director AI</p>
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

      {report.todayActions.length > 0 && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
          <p className="text-sm font-semibold text-white mb-3">Действия на сегодня</p>
          <div className="space-y-2">
            {report.todayActions.map((a, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-violet-400 font-bold text-sm shrink-0">{i + 1}.</span>
                <p className="text-sm text-slate-300">{a}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {report.bestDepartment && (
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4">
            <p className="text-xs text-emerald-500 mb-1">Лучший отдел</p>
            <p className="text-sm font-semibold text-emerald-300">{report.bestDepartment}</p>
          </div>
        )}
        {report.problemDepartment && (
          <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-4">
            <p className="text-xs text-red-500 mb-1">Требует внимания</p>
            <p className="text-sm font-semibold text-red-300">{report.problemDepartment}</p>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-600 text-center">
        Обновлено: {new Date(report.generatedAt).toLocaleString("ru-RU")}
      </p>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",    label: "Обзор",      icon: "🏢" },
  { id: "sales",       label: "Продажи",    icon: "💼" },
  { id: "marketing",   label: "Маркетинг",  icon: "📣" },
  { id: "content",     label: "Контент",    icon: "🎬" },
  { id: "finance",     label: "Финансы",    icon: "💰" },
  { id: "bi",          label: "BI Insights", icon: "🔍" },
  { id: "director",    label: "AI Director", icon: "📊" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AnalyticsDashboard({
  initialReport,
}: {
  initialReport: AnalyticsDirectorReport | null;
}) {
  const [tab, setTab]     = useState<TabId>("overview");
  const [report, setReport] = useState<AnalyticsDirectorReport | null>(initialReport);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-company/analytics/report");
      const json = await res.json();
      if (json.ok) setReport(json.report);
      else setError(json.error ?? "Ошибка генерации");
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setGenerating(false);
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <a href="/admin/ai-company" className="hover:text-white transition-colors">🤖 AI OS</a>
        <span>›</span>
        <span className="text-white">📊 Аналитика</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Analytics Department AI</h1>
          <p className="text-sm text-slate-400 mt-0.5">Company Health · BI Intelligence · Аналитика всех отделов</p>
        </div>
        {report && (
          <div className={`px-3 py-1.5 rounded-lg border text-sm font-semibold ${statusBg(report.health.status)} ${statusColor(report.health.status)}`}>
            Score: {report.health.score}/100
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
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* No data */}
      {!report && !generating && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <span className="text-5xl">📊</span>
          <p className="text-white font-semibold">Данные загружаются</p>
          <button
            onClick={generate}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm transition-colors"
          >
            Загрузить аналитику
          </button>
        </div>
      )}

      {/* Tab content */}
      {report && (
        <div>
          {tab === "overview"  && <OverviewTab   report={report} />}
          {tab === "sales"     && <SalesTab      report={report} />}
          {tab === "marketing" && <MarketingTab  report={report} />}
          {tab === "content"   && <ContentTab    report={report} />}
          {tab === "finance"   && <FinanceTab    report={report} />}
          {tab === "bi"        && <BITab         report={report} />}
          {tab === "director"  && (
            <DirectorTab
              report={report}
              onGenerate={generate}
              generating={generating}
            />
          )}
        </div>
      )}
    </div>
  );
}
