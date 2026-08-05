"use client";
import { useState, useCallback } from "react";
import type { CeoReport, DepartmentReport, CeoRecommendation, CeoTask, DeptStatus, Priority } from "@/lib/ai-company/types";

interface Props {
  initialReport: CeoReport | null;
}

const STATUS_CONFIG: Record<DeptStatus, { label: string; dot: string; badge: string }> = {
  GOOD:     { label: "GOOD",     dot: "bg-emerald-400", badge: "bg-emerald-900/40 text-emerald-300 border-emerald-700" },
  WARNING:  { label: "WARNING",  dot: "bg-amber-400",   badge: "bg-amber-900/40 text-amber-300 border-amber-700" },
  CRITICAL: { label: "CRITICAL", dot: "bg-red-400 animate-pulse", badge: "bg-red-900/40 text-red-300 border-red-700" },
  IDLE:     { label: "IDLE",     dot: "bg-slate-500",   badge: "bg-slate-800 text-slate-400 border-slate-600" },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; cls: string; icon: string }> = {
  HIGH:   { label: "ВЫСОКИЙ", cls: "bg-red-900/40 text-red-300 border-red-700",    icon: "⚡" },
  MEDIUM: { label: "СРЕДНИЙ", cls: "bg-amber-900/40 text-amber-300 border-amber-700", icon: "⚠" },
  LOW:    { label: "НИЗКИЙ",  cls: "bg-slate-800 text-slate-400 border-slate-600", icon: "ℹ" },
};

function HealthBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-slate-200 font-bold w-14 text-right">{score}/100</span>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  const display = value === 0 || value === "0" ? <span className="text-slate-500 text-xl font-bold">—</span> : <span className="text-white text-2xl font-bold">{value}</span>;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex flex-col gap-1 min-w-0">
      <div className="text-lg">{icon}</div>
      {display}
      <div className="text-slate-400 text-xs truncate">{label}</div>
    </div>
  );
}

function DeptCard({ dept }: { dept: DepartmentReport }) {
  const [open, setOpen] = useState(false);
  const sc = STATUS_CONFIG[dept.status];
  const connectedAgents = dept.agents.filter(a => a.connected).length;

  return (
    <div className={`bg-slate-900 border rounded-xl p-4 flex flex-col gap-3 transition-all ${dept.status === "IDLE" ? "border-slate-800 opacity-70" : "border-slate-700 hover:border-slate-500"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl flex-shrink-0">{dept.icon}</span>
          <div className="min-w-0">
            <div className="text-slate-100 font-semibold text-sm truncate">{dept.nameRu}</div>
            <div className="text-slate-500 text-xs truncate">{dept.director}</div>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium flex-shrink-0 ${sc.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
          {sc.label}
        </div>
      </div>

      <div className="space-y-1.5">
        {dept.kpis.slice(0, 3).map((kpi, i) => (
          <div key={i} className="flex justify-between items-center text-xs">
            <span className="text-slate-400 truncate pr-2">{kpi.label}</span>
            <span className={`font-medium flex-shrink-0 ${dept.status === "IDLE" ? "text-slate-500" : "text-slate-200"}`}>{kpi.value}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          {connectedAgents}/{dept.agents.length} агентов
        </div>
        <div className="flex items-center gap-2">
          {dept.id === "sales" && (
            <a href="/admin/ai-company/sales" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
              Открыть →
            </a>
          )}
          {dept.id === "marketing" && (
            <a href="/admin/ai-company/marketing" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
              Открыть →
            </a>
          )}
          {dept.id === "content" && (
            <a href="/admin/ai-company/content" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
              Открыть →
            </a>
          )}
          {dept.id === "analytics" && (
            <a href="/admin/ai-company/analytics" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
              Открыть →
            </a>
          )}
          {dept.id === "operations" && (
            <a href="/admin/ai-company/operations" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
              Открыть →
            </a>
          )}
          {dept.id === "finance" && (
            <a href="/admin/ai-company/finance" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
              Открыть →
            </a>
          )}
          {dept.id === "strategy" && (
            <a href="/admin/ai-company/strategy" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
              Открыть →
            </a>
          )}
          {dept.status !== "IDLE" && (
            <button
              onClick={() => setOpen(!open)}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              {open ? "Свернуть ↑" : "Детали →"}
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-800 pt-3 space-y-3">
          {dept.problems.length > 0 && (
            <div>
              <div className="text-xs font-medium text-red-400 mb-1">Проблемы:</div>
              {dept.problems.map((p, i) => (
                <div key={i} className="text-xs text-slate-400 pl-2 border-l border-red-800">— {p}</div>
              ))}
            </div>
          )}
          {dept.recommendations.length > 0 && (
            <div>
              <div className="text-xs font-medium text-emerald-400 mb-1">Рекомендации:</div>
              {dept.recommendations.map((r, i) => (
                <div key={i} className="text-xs text-slate-400 pl-2 border-l border-emerald-800">— {r}</div>
              ))}
            </div>
          )}
          <div>
            <div className="text-xs font-medium text-slate-400 mb-1">Агенты:</div>
            <div className="space-y-1">
              {dept.agents.map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.connected ? "bg-emerald-400" : "bg-slate-600"}`} />
                  <span className={a.connected ? "text-slate-300" : "text-slate-500"}>{a.name}</span>
                  {!a.connected && <span className="text-slate-600">· не подключён</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RecCard({ rec }: { rec: CeoRecommendation }) {
  const pc = PRIORITY_CONFIG[rec.priority];
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded border text-xs font-bold ${pc.cls}`}>
          {pc.icon} {pc.label}
        </span>
        <span className="text-slate-400 text-xs">{rec.owner}</span>
      </div>
      <div className="text-slate-100 font-semibold text-sm">{rec.problem}</div>
      <div className="text-slate-400 text-xs leading-relaxed">{rec.analysis}</div>
      <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
        <div className="text-xs text-emerald-400 font-medium mb-0.5">Действие:</div>
        <div className="text-slate-200 text-sm">{rec.action}</div>
      </div>
    </div>
  );
}

function TaskRow({ task }: { task: CeoTask }) {
  const pc = PRIORITY_CONFIG[task.priority];
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-800 last:border-0">
      <span className={`mt-0.5 px-2 py-0.5 rounded border text-xs font-bold flex-shrink-0 ${pc.cls}`}>
        {task.priority}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-slate-100 text-sm font-medium">{task.title}</div>
        <div className="text-slate-400 text-xs mt-0.5">{task.description}</div>
      </div>
      <div className="flex-shrink-0 text-right">
        <div className="text-slate-300 text-xs font-medium">{task.deadline}</div>
        <div className="text-slate-500 text-xs">{task.department}</div>
      </div>
    </div>
  );
}

export default function AiOsDashboard({ initialReport }: Props) {
  const [report, setReport] = useState<CeoReport | null>(initialReport);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<string | null>(
    initialReport?.generatedAt ?? null
  );

  const generateReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-company/report");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Ошибка генерации");
      setReport(data.report);
      setLastGenerated(data.report.generatedAt);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const sc = report ? STATUS_CONFIG[report.companyHealth] : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🤖 ChinaBridge AI Company OS
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            AI-powered управление компанией · Этап 1 MVP
            {lastGenerated && (
              <span className="ml-3 text-slate-600">
                · обновлено {new Date(lastGenerated).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={generateReport}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:text-blue-400 text-white rounded-lg text-sm font-medium transition-colors flex-shrink-0"
        >
          {loading ? (
            <>
              <span className="animate-spin">⟳</span> Анализирую...
            </>
          ) : (
            <>🤖 Сгенерировать отчёт</>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm">
          Ошибка: {error}
        </div>
      )}

      {/* Company Health */}
      {report && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Здоровье компании</div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${sc!.dot}`} />
                <span className="text-white font-bold text-lg">{sc!.label}</span>
              </div>
            </div>
            <div className="text-slate-300 text-sm max-w-lg text-right leading-relaxed hidden md:block">
              {report.summary}
            </div>
          </div>
          <HealthBar score={report.healthScore} />
          <div className="text-slate-300 text-sm mt-3 leading-relaxed md:hidden">{report.summary}</div>
        </div>
      )}

      {/* Company Metrics */}
      {report && (
        <div>
          <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Ключевые метрики</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <MetricCard icon="💰" label="Выручка (₽)" value={report.metrics.revenue > 0 ? report.metrics.revenue.toLocaleString("ru") : 0} />
            <MetricCard icon="📈" label="Прибыль (₽)" value={report.metrics.profit > 0 ? report.metrics.profit.toLocaleString("ru") : 0} />
            <MetricCard icon="🎯" label="Лидов в базе" value={report.metrics.leads} />
            <MetricCard icon="📊" label="Конверсия" value={report.metrics.conversion > 0 ? `${report.metrics.conversion}%` : 0} />
            <MetricCard icon="👤" label="Трафик / мес" value={report.metrics.traffic > 0 ? report.metrics.traffic.toLocaleString("ru") : 0} />
            <MetricCard icon="🤝" label="Клиентов" value={report.metrics.customers} />
            <MetricCard icon="💼" label="Активных сделок" value={report.metrics.activeDeals} />
          </div>
        </div>
      )}

      {/* Departments */}
      {report && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">AI Отделы</div>
            <div className="text-slate-500 text-xs">
              {report.departments.filter(d => d.status !== "IDLE").length} / {report.departments.length} подключено
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {report.departments.map(dept => (
              <DeptCard key={dept.id} dept={dept} />
            ))}
          </div>
        </div>
      )}

      {/* CEO Command Center Banner */}
      <div className="bg-gradient-to-r from-blue-900/30 via-purple-900/20 to-slate-900/30 border border-blue-700/50 rounded-xl p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="text-4xl">👑</div>
          <div>
            <div className="text-white font-bold text-base">CEO AI Command Center</div>
            <div className="text-slate-400 text-sm mt-0.5">Единый управленческий контур · Решения · Задачи · KPI · Брифинг</div>
          </div>
        </div>
        <a href="/admin/ai-company/ceo"
          className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
          Открыть →
        </a>
      </div>

      {/* CEO Recommendations */}
      {report && report.recommendations.length > 0 && (
        <div>
          <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">
            🤖 CEO AI — Рекомендации
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {report.recommendations.map(rec => (
              <RecCard key={rec.id} rec={rec} />
            ))}
          </div>
        </div>
      )}

      {/* CEO Tasks */}
      {report && report.tasks.length > 0 && (
        <div>
          <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">
            📋 CEO AI — Задачи
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-xl px-4">
            {report.tasks.map(task => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!report && !loading && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-6xl mb-4">🤖</div>
          <div className="text-slate-300 text-lg font-medium mb-2">AI Company OS готова к запуску</div>
          <div className="text-slate-500 text-sm mb-6 max-w-sm">
            Нажмите «Сгенерировать отчёт» — CEO AI соберёт данные со всех подключённых отделов и даст рекомендации
          </div>
          <button
            onClick={generateReport}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            🚀 Запустить анализ
          </button>
        </div>
      )}

      {loading && !report && (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="text-4xl animate-spin mb-4">⟳</div>
          <div className="text-slate-400 text-sm">CEO AI анализирует компанию...</div>
        </div>
      )}
    </div>
  );
}
