"use client";
import { useState, useCallback, useEffect } from "react";
import type {
  CeoApiReport, CeoTask, CeoDecision, CeoNotification,
  KpiTarget, HistoryEntry, InboxMessage, Priority, NotifLevel,
} from "@/lib/ai-company/ceo/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "exec",      label: "Сводка",          icon: "📊" },
  { id: "decisions", label: "Решения",         icon: "📝" },
  { id: "tasks",     label: "Задачи",          icon: "✅" },
  { id: "depts",     label: "Отделы",          icon: "🏢" },
  { id: "notifs",    label: "Уведомления",     icon: "🔔" },
  { id: "kpi",       label: "KPI",             icon: "📈" },
  { id: "history",   label: "История",         icon: "📚" },
  { id: "ceo-ai",    label: "CEO AI",          icon: "🤖" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const DEPT_LINKS: Record<string, string> = {
  sales:      "/admin/ai-company/sales",
  marketing:  "/admin/ai-company/marketing",
  content:    "/admin/ai-company/content",
  analytics:  "/admin/ai-company/analytics",
  operations: "/admin/ai-company/operations",
  finance:    "/admin/ai-company/finance",
  strategy:   "/admin/ai-company/strategy",
};

const STATUS_CFG = {
  GOOD:     { dot: "bg-emerald-400", badge: "bg-emerald-900/40 text-emerald-300 border-emerald-700" },
  WARNING:  { dot: "bg-amber-400 animate-pulse", badge: "bg-amber-900/40 text-amber-300 border-amber-700" },
  CRITICAL: { dot: "bg-red-400 animate-pulse",   badge: "bg-red-900/40 text-red-300 border-red-700" },
  IDLE:     { dot: "bg-slate-500",               badge: "bg-slate-800 text-slate-400 border-slate-600" },
};

const PRIORITY_CFG: Record<Priority, { cls: string; label: string }> = {
  HIGH:   { cls: "bg-red-900/40 text-red-300 border-red-700",       label: "HIGH" },
  MEDIUM: { cls: "bg-amber-900/40 text-amber-300 border-amber-700", label: "MED" },
  LOW:    { cls: "bg-slate-800 text-slate-400 border-slate-600",    label: "LOW" },
};

const NOTIF_CFG: Record<NotifLevel, { cls: string }> = {
  CRITICAL: { cls: "border-l-red-500 bg-red-900/10" },
  WARNING:  { cls: "border-l-amber-500 bg-amber-900/10" },
  INFO:     { cls: "border-l-blue-500 bg-blue-900/10" },
};

const now = () => new Date().toISOString();
const fmtDate = (iso: string) => {
  try { return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }); }
  catch { return "—"; }
};
const fmtTime = (iso: string) => {
  try { return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }); }
  catch { return "—"; }
};

// ─── Tiny shared components ────────────────────────────────────────────────────

function Badge({ cls, children }: { cls: string; children: React.ReactNode }) {
  return <span className={`px-2 py-0.5 rounded border text-xs font-bold ${cls}`}>{children}</span>;
}

function Pill({ label }: { label: string }) {
  return <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full">{label}</span>;
}

// ─── Status bar (always visible) ──────────────────────────────────────────────

function StatusBar({ report, tasks, decisions }: { report: CeoApiReport; tasks: CeoTask[]; decisions: CeoDecision[] }) {
  const sc   = STATUS_CFG[report.companyStatus];
  const open = tasks.filter(t => t.status !== "DONE").length;
  const newD = decisions.filter(d => d.status === "NEW").length;
  const m    = report.metrics;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-5 py-3 flex flex-wrap items-center gap-x-5 gap-y-2">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
        <span className="text-white font-bold text-sm">{report.healthScore}/100</span>
        <Badge cls={sc.badge}>{report.companyStatus}</Badge>
      </div>
      {[
        ["Выручка", m.revenue],
        ["MRR",     m.mrr],
        ["Лиды",    String(m.leads)],
        ["Сделки",  String(m.activeDeals)],
        ["Отделов", `${m.deptsOnline}/${report.depts.length}`],
        ["Задач",   String(open)],
      ].map(([l, v]) => (
        <div key={l} className="text-xs">
          <span className="text-slate-500">{l}: </span>
          <span className="text-slate-200 font-medium">{v || "—"}</span>
        </div>
      ))}
      {m.criticalCount > 0 && (
        <span className="bg-red-900/40 border border-red-700 text-red-300 text-xs font-bold px-2 py-0.5 rounded">
          🚨 {m.criticalCount} критических
        </span>
      )}
      {newD > 0 && (
        <span className="bg-blue-900/40 border border-blue-700 text-blue-300 text-xs px-2 py-0.5 rounded">
          📝 {newD} решений ждут
        </span>
      )}
      <span className="text-slate-600 text-xs ml-auto">{fmtTime(report.generatedAt)}</span>
    </div>
  );
}

// ─── Tab: Executive Dashboard ─────────────────────────────────────────────────

function ExecTab({ report, tasks }: { report: CeoApiReport; tasks: CeoTask[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {report.depts.map(dept => {
        const sc = STATUS_CFG[dept.status];
        const deptTasks = tasks.filter(t => t.deptId === dept.id && t.status !== "DONE");
        return (
          <div key={dept.id} className={`bg-slate-900 border rounded-xl p-4 flex flex-col gap-3 ${dept.status === "IDLE" ? "border-slate-800 opacity-60" : "border-slate-700 hover:border-slate-500"}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{dept.icon}</span>
                <div>
                  <div className="text-slate-100 font-semibold text-sm">{dept.nameRu}</div>
                  <div className="text-slate-500 text-xs">{dept.director}</div>
                </div>
              </div>
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${sc.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                {dept.status}
              </div>
            </div>

            <div className="space-y-1">
              {dept.kpis.slice(0, 3).map((k, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-slate-400 truncate pr-2">{k.label}</span>
                  <span className="text-slate-200 font-medium flex-shrink-0">{k.value}</span>
                </div>
              ))}
            </div>

            {dept.problems[0] && (
              <div className="text-xs text-red-400/80 pl-2 border-l border-red-800 truncate">— {dept.problems[0]}</div>
            )}

            {dept.recommendations[0] && (
              <div className="text-xs text-emerald-400/80 pl-2 border-l border-emerald-800 line-clamp-2">+ {dept.recommendations[0]}</div>
            )}

            <div className="flex items-center justify-between border-t border-slate-800 pt-2">
              <span className="text-xs text-slate-500">{deptTasks.length} задач</span>
              {DEPT_LINKS[dept.id] && (
                <a href={DEPT_LINKS[dept.id]} className="text-xs text-emerald-400 hover:text-emerald-300">Открыть →</a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab: Decision Center ─────────────────────────────────────────────────────

function DecisionsTab({
  decisions, onApprove, onReject, onMarkDone,
}: {
  decisions: CeoDecision[];
  onApprove: (id: string) => void;
  onReject:  (id: string) => void;
  onMarkDone:(id: string) => void;
}) {
  const [filter, setFilter] = useState<"ALL" | "NEW" | "APPROVED" | "DONE" | "REJECTED">("ALL");

  const filtered = decisions.filter(d => filter === "ALL" || d.status === filter);
  const statusCls: Record<string, string> = {
    NEW:         "bg-blue-900/40 text-blue-300 border-blue-700",
    APPROVED:    "bg-emerald-900/40 text-emerald-300 border-emerald-700",
    IN_PROGRESS: "bg-amber-900/40 text-amber-300 border-amber-700",
    DONE:        "bg-slate-800 text-slate-400 border-slate-600",
    REJECTED:    "bg-red-900/40 text-red-300 border-red-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["ALL","NEW","APPROVED","IN_PROGRESS","DONE","REJECTED"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f as typeof filter)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filter === f ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"}`}>
            {f} ({decisions.filter(d => f === "ALL" || d.status === f).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-500">Нет решений с фильтром «{filter}»</div>
      )}

      <div className="space-y-3">
        {filtered.map(dec => (
          <div key={dec.id} className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Pill label={dec.source} />
                  <Badge cls={PRIORITY_CFG[dec.priority].cls}>{PRIORITY_CFG[dec.priority].label}</Badge>
                  <Badge cls={statusCls[dec.status] ?? ""}>{dec.status}</Badge>
                </div>
                <div className="text-slate-100 font-semibold text-sm">{dec.title}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800/60 rounded p-2">
                <div className="text-slate-500 mb-0.5">Причина</div>
                <div className="text-slate-300">{dec.reason}</div>
              </div>
              <div className="bg-slate-800/60 rounded p-2">
                <div className="text-slate-500 mb-0.5">Ожидаемый эффект</div>
                <div className="text-slate-300">{dec.expectedEffect}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              {dec.status === "NEW" && (
                <>
                  <button onClick={() => onApprove(dec.id)}
                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-xs rounded font-medium transition-colors">
                    ✓ Одобрить
                  </button>
                  <button onClick={() => onReject(dec.id)}
                    className="px-3 py-1 bg-red-900/50 hover:bg-red-800 text-red-300 text-xs rounded font-medium transition-colors">
                    ✗ Отклонить
                  </button>
                </>
              )}
              {(dec.status === "APPROVED" || dec.status === "IN_PROGRESS") && (
                <button onClick={() => onMarkDone(dec.id)}
                  className="px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white text-xs rounded font-medium transition-colors">
                  ✓ Выполнено
                </button>
              )}
              <span className="text-slate-600 text-xs ml-auto">{fmtDate(dec.updatedAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Task Manager ────────────────────────────────────────────────────────

function TasksTab({
  tasks, depts, onStatusChange, onCreateOpen,
}: {
  tasks: CeoTask[];
  depts: CeoApiReport["depts"];
  onStatusChange: (id: string, status: CeoTask["status"]) => void;
  onCreateOpen:   () => void;
}) {
  const [filter, setFilter] = useState<"ALL" | CeoTask["status"]>("ALL");

  const filtered = tasks.filter(t => filter === "ALL" || t.status === filter);
  const statusCls: Record<string, string> = {
    PENDING:     "bg-slate-800 text-slate-400 border-slate-600",
    IN_PROGRESS: "bg-amber-900/40 text-amber-300 border-amber-700",
    DONE:        "bg-emerald-900/40 text-emerald-300 border-emerald-700",
    BLOCKED:     "bg-red-900/40 text-red-300 border-red-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["ALL","PENDING","IN_PROGRESS","DONE","BLOCKED"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded text-xs font-medium ${filter === f ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"}`}>
            {f} ({tasks.filter(t => f === "ALL" || t.status === f).length})
          </button>
        ))}
        <button onClick={onCreateOpen}
          className="ml-auto px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs rounded font-medium transition-colors">
          + Создать задачу
        </button>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-500">Нет задач</div>
      )}

      <div className="space-y-2">
        {filtered.map(task => (
          <div key={task.id} className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex items-start gap-3">
            <Badge cls={PRIORITY_CFG[task.priority].cls}>{PRIORITY_CFG[task.priority].label}</Badge>
            <div className="flex-1 min-w-0">
              <div className="text-slate-100 font-medium text-sm truncate">{task.title}</div>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                <span>{task.deptName}</span>
                <span>·</span>
                <span>{task.assignee}</span>
                {task.deadline && <><span>·</span><span>до {fmtDate(task.deadline)}</span></>}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge cls={statusCls[task.status] ?? ""}>{task.status}</Badge>
              {task.status === "PENDING" && (
                <button onClick={() => onStatusChange(task.id, "IN_PROGRESS")}
                  className="text-xs text-blue-400 hover:text-blue-300">▶</button>
              )}
              {task.status === "IN_PROGRESS" && (
                <button onClick={() => onStatusChange(task.id, "DONE")}
                  className="text-xs text-emerald-400 hover:text-emerald-300">✓</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Departments ─────────────────────────────────────────────────────────

function DeptsTab({ report, tasks }: { report: CeoApiReport; tasks: CeoTask[] }) {
  return (
    <div className="space-y-4">
      {report.depts.map(dept => {
        const sc        = STATUS_CFG[dept.status];
        const deptTasks = tasks.filter(t => t.deptId === dept.id);
        const open      = deptTasks.filter(t => t.status !== "DONE").length;
        const done      = deptTasks.filter(t => t.status === "DONE").length;
        const connectedAgents = dept.agents.filter(a => a.connected).length;
        const eff = dept.agents.length > 0
          ? Math.round((connectedAgents / dept.agents.length) * 100) : 0;

        return (
          <div key={dept.id} className="bg-slate-900 border border-slate-700 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{dept.icon}</span>
                <div>
                  <div className="text-white font-bold">{dept.nameRu}</div>
                  <div className="text-slate-400 text-xs">{dept.director}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge cls={sc.badge}>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${sc.dot}`} />
                  {dept.status}
                </Badge>
                {DEPT_LINKS[dept.id] && (
                  <a href={DEPT_LINKS[dept.id]} className="text-xs text-emerald-400 hover:text-emerald-300">Открыть →</a>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: "Открытых задач", val: open },
                { label: "Выполнено",      val: done },
                { label: "AI-агентов",     val: `${connectedAgents}/${dept.agents.length}` },
                { label: "Эффективность",  val: `${eff}%` },
              ].map(({ label, val }) => (
                <div key={label} className="bg-slate-800 rounded-lg p-2 text-center">
                  <div className="text-slate-200 font-bold">{val}</div>
                  <div className="text-slate-500 text-xs">{label}</div>
                </div>
              ))}
            </div>

            {dept.kpis.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {dept.kpis.map((k, i) => (
                  <div key={i} className="flex justify-between bg-slate-800/50 rounded px-2 py-1">
                    <span className="text-slate-400 truncate pr-1">{k.label}</span>
                    <span className="text-slate-200 font-medium flex-shrink-0">{k.value}</span>
                  </div>
                ))}
              </div>
            )}

            {dept.problems[0] && (
              <div className="mt-3 text-xs text-red-400 pl-2 border-l border-red-800">— {dept.problems[0]}</div>
            )}
            <div className="mt-1 text-xs text-slate-500">Обновлено: {fmtDate(dept.lastUpdated)}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab: Notifications ───────────────────────────────────────────────────────

function NotifsTab({
  notifications, onMarkRead,
}: {
  notifications: CeoNotification[];
  onMarkRead: (id: string) => void;
}) {
  const [filter, setFilter] = useState<"ALL" | NotifLevel>("ALL");

  const filtered = notifications.filter(n => filter === "ALL" || n.level === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {(["ALL", "CRITICAL", "WARNING", "INFO"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded text-xs font-medium ${filter === f ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"}`}>
            {f} ({notifications.filter(n => f === "ALL" || n.level === f).length})
          </button>
        ))}
        <button onClick={() => notifications.forEach(n => onMarkRead(n.id))}
          className="ml-auto text-xs text-slate-400 hover:text-slate-200">
          Прочитать все
        </button>
      </div>

      <div className="space-y-2">
        {filtered.map(notif => (
          <div key={notif.id}
            className={`border-l-4 ${NOTIF_CFG[notif.level].cls} rounded-r-xl p-4 flex items-start gap-3 ${notif.read ? "opacity-50" : ""}`}>
            <div className="flex-1 min-w-0">
              <div className="text-slate-100 font-semibold text-sm">{notif.title}</div>
              <div className="text-slate-400 text-xs mt-0.5">{notif.body}</div>
              <div className="text-slate-600 text-xs mt-1">{notif.source} · {fmtDate(notif.createdAt)} {fmtTime(notif.createdAt)}</div>
            </div>
            {!notif.read && (
              <button onClick={() => onMarkRead(notif.id)} className="text-xs text-slate-500 hover:text-slate-300 flex-shrink-0">✓</button>
            )}
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-12 text-slate-500">Нет уведомлений</div>}
      </div>
    </div>
  );
}

// ─── Tab: KPI Control ─────────────────────────────────────────────────────────

function KpiTab({ kpis }: { kpis: KpiTarget[] }) {
  const trendIcon = { up: "↑", down: "↓", stable: "→" };
  const trendCls  = { up: "text-emerald-400", down: "text-red-400", stable: "text-slate-400" };

  return (
    <div className="space-y-3">
      <div className="text-slate-400 text-sm">{kpis.length} KPI-показателей по всем отделам</div>
      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left text-slate-500 text-xs px-4 py-3 font-medium">Отдел</th>
              <th className="text-left text-slate-500 text-xs px-4 py-3 font-medium">Метрика</th>
              <th className="text-right text-slate-500 text-xs px-4 py-3 font-medium">Текущее</th>
              <th className="text-right text-slate-500 text-xs px-4 py-3 font-medium">Цель</th>
              <th className="text-center text-slate-500 text-xs px-4 py-3 font-medium">Тренд</th>
            </tr>
          </thead>
          <tbody>
            {kpis.map((k, i) => (
              <tr key={i} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{k.icon}</span>
                    <span className="text-slate-300 text-xs font-medium">{k.deptName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">{k.metric}</td>
                <td className="px-4 py-3 text-right text-slate-100 font-medium text-xs">{k.current}</td>
                <td className="px-4 py-3 text-right text-slate-500 text-xs">{k.target}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-sm ${trendCls[k.trend]}`}>{trendIcon[k.trend]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: History ─────────────────────────────────────────────────────────────

function HistoryTab({ history }: { history: HistoryEntry[] }) {
  const statusCls: Record<string, string> = {
    DONE:        "bg-emerald-900/40 text-emerald-300 border-emerald-700",
    IN_PROGRESS: "bg-amber-900/40 text-amber-300 border-amber-700",
    REJECTED:    "bg-red-900/40 text-red-300 border-red-700",
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">📚</div>
        <div className="text-slate-400 text-sm">История решений пока пуста.</div>
        <div className="text-slate-600 text-xs mt-1">Одобряйте и выполняйте решения — они появятся здесь.</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-slate-400 text-sm">{history.length} записей в истории решений</div>
      {[...history].reverse().map(h => (
        <div key={h.id} className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex items-start gap-4">
          <div className="text-slate-500 text-xs font-mono w-10 flex-shrink-0 mt-0.5">{fmtDate(h.date)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-slate-100 font-semibold text-sm truncate">{h.title}</div>
              {h.deptName && <Pill label={h.deptName} />}
            </div>
            <div className="text-slate-400 text-xs">{h.description}</div>
            {h.impact && <div className="text-emerald-400 text-xs mt-1">+ {h.impact}</div>}
          </div>
          <Badge cls={statusCls[h.status] ?? ""}>{h.status}</Badge>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: CEO AI ──────────────────────────────────────────────────────────────

function CeoAiTab({
  report, inbox, onReply, onRefresh, loading,
}: {
  report: CeoApiReport;
  inbox: InboxMessage[];
  onReply: (id: string, reply: string) => void;
  onRefresh: () => void;
  loading: boolean;
}) {
  const ai = report.aiReport;
  const [replyId,  setReplyId]  = useState<string | null>(null);
  const [replyTxt, setReplyTxt] = useState("");

  const submitReply = (id: string) => {
    if (!replyTxt.trim()) return;
    onReply(id, replyTxt.trim());
    setReplyTxt("");
    setReplyId(null);
  };

  return (
    <div className="space-y-6">
      {/* Morning Briefing */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/20 border border-blue-700/50 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-blue-400 text-xs uppercase tracking-wider mb-1">🤖 CEO AI · Ежедневный брифинг</div>
            <div className="text-slate-300 text-sm leading-relaxed">{ai.morningBriefing}</div>
          </div>
          <button onClick={onRefresh} disabled={loading}
            className="flex-shrink-0 px-3 py-1.5 bg-blue-700 hover:bg-blue-600 disabled:bg-blue-900 text-white text-xs rounded transition-colors">
            {loading ? <span className="animate-spin inline-block">⟳</span> : "🔄"}
          </button>
        </div>

        {/* Highlights */}
        {ai.highlights.length > 0 && (
          <div className="mb-3">
            <div className="text-emerald-400 text-xs font-medium mb-1">✅ Хорошие новости</div>
            {ai.highlights.map((h, i) => <div key={i} className="text-slate-300 text-xs py-0.5">· {h}</div>)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Problems */}
        <div className="bg-slate-900 border border-red-800/40 rounded-xl p-4">
          <div className="text-red-400 text-xs font-medium uppercase tracking-wider mb-3">⚠️ Главные проблемы</div>
          {ai.problems.map((p, i) => (
            <div key={i} className="text-slate-300 text-sm py-1.5 border-b border-slate-800 last:border-0 pl-2 border-l-2 border-l-red-700">{i + 1}. {p}</div>
          ))}
        </div>

        {/* Opportunities */}
        <div className="bg-slate-900 border border-emerald-800/40 rounded-xl p-4">
          <div className="text-emerald-400 text-xs font-medium uppercase tracking-wider mb-3">🚀 Главные возможности</div>
          {ai.opportunities.map((o, i) => (
            <div key={i} className="text-slate-300 text-sm py-1.5 border-b border-slate-800 last:border-0 pl-2 border-l-2 border-l-emerald-700">{i + 1}. {o}</div>
          ))}
        </div>
      </div>

      {/* Today's Actions */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
        <div className="text-slate-300 font-semibold text-sm mb-4">📋 Сегодня рекомендую CEO:</div>
        <div className="space-y-3">
          {ai.todayActions.map((a, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">{i + 1}</span>
              <div className="text-slate-200 text-sm leading-relaxed">{a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Inbox */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
        <div className="text-slate-300 font-semibold text-sm mb-4">📨 AI Inbox — сообщения от отделов</div>
        {inbox.length === 0 && <div className="text-slate-500 text-sm">Нет новых сообщений</div>}
        <div className="space-y-4">
          {inbox.map(msg => (
            <div key={msg.id} className="border border-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-400 text-xs font-medium">{msg.from}</span>
                <span className="text-slate-600 text-xs">{fmtDate(msg.timestamp)} {fmtTime(msg.timestamp)}</span>
              </div>
              <div className="text-slate-300 text-sm mb-2">{msg.content}</div>
              {msg.reply ? (
                <div className="bg-emerald-900/20 border border-emerald-800/40 rounded p-2 text-xs">
                  <span className="text-emerald-400">CEO: </span>
                  <span className="text-slate-200">{msg.reply}</span>
                </div>
              ) : (
                replyId === msg.id ? (
                  <div className="flex gap-2 mt-2">
                    <input value={replyTxt} onChange={e => setReplyTxt(e.target.value)}
                      className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      placeholder="Ответ CEO..." onKeyDown={e => e.key === "Enter" && submitReply(msg.id)} />
                    <button onClick={() => submitReply(msg.id)} className="px-3 py-1 bg-blue-600 text-white text-xs rounded">Отправить</button>
                    <button onClick={() => { setReplyId(null); setReplyTxt(""); }} className="px-2 py-1 text-slate-400 text-xs">✕</button>
                  </div>
                ) : (
                  <button onClick={() => setReplyId(msg.id)} className="text-xs text-blue-400 hover:text-blue-300 mt-1">↩ Ответить</button>
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Create Task Modal ─────────────────────────────────────────────────────────

function CreateModal({
  depts, onClose, onCreate,
}: {
  depts: CeoApiReport["depts"];
  onClose: () => void;
  onCreate: (f: { title: string; deptId: string; priority: Priority; deadline: string; description: string }) => void;
}) {
  const [f, setF] = useState({ title: "", deptId: "sales", priority: "MEDIUM" as Priority, deadline: "", description: "" });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <div className="text-white font-bold">➕ Создать задачу</div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-xl">✕</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-slate-400 text-xs block mb-1">Название *</label>
            <input value={f.title} onChange={e => setF({ ...f, title: e.target.value })}
              className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              placeholder="Создать контент о калькуляторе..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs block mb-1">Отдел</label>
              <select value={f.deptId} onChange={e => setF({ ...f, deptId: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none">
                {depts.filter(d => d.status !== "IDLE").map(d => (
                  <option key={d.id} value={d.id}>{d.nameRu}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Приоритет</label>
              <select value={f.priority} onChange={e => setF({ ...f, priority: e.target.value as Priority })}
                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none">
                {(["HIGH","MEDIUM","LOW"] as Priority[]).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-xs block mb-1">Дедлайн</label>
            <input type="date" value={f.deadline} onChange={e => setF({ ...f, deadline: e.target.value })}
              className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none" />
          </div>
          <div>
            <label className="text-slate-400 text-xs block mb-1">Описание</label>
            <textarea value={f.description} onChange={e => setF({ ...f, description: e.target.value })}
              rows={3}
              className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none resize-none"
              placeholder="Дополнительные детали задачи..." />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button
            onClick={() => { if (f.title.trim()) onCreate(f); }}
            disabled={!f.title.trim()}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:text-blue-400 text-white text-sm rounded font-medium transition-colors">
            Создать задачу
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-slate-400 text-sm rounded hover:text-slate-200">Отмена</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

function buildInbox(report: CeoApiReport): InboxMessage[] {
  const msgs: InboxMessage[] = [];
  const ts = (h: number) => new Date(Date.now() - h * 3600000).toISOString();

  const add = (deptId: string, from: string, content: string, hoursAgo: number) => {
    const dept = report.depts.find(d => d.id === deptId);
    const text = dept ? content.replace("{rec}", dept.recommendations[0] ?? "").replace("{prob}", dept.problems[0] ?? "") : content;
    if (text && text !== content || (dept && content.includes("{rec}") && dept.recommendations[0])) {
      msgs.push({ id: `inbox-${deptId}`, from, fromDeptId: deptId, content: text, timestamp: ts(hoursAgo) });
    } else if (!content.includes("{rec}") && !content.includes("{prob}")) {
      msgs.push({ id: `inbox-${deptId}`, from, fromDeptId: deptId, content: text, timestamp: ts(hoursAgo) });
    }
  };

  const mkt = report.depts.find(d => d.id === "marketing");
  if (mkt?.recommendations[0]) add("marketing", "Marketing AI", `CEO, предлагаю: ${mkt.recommendations[0]}. Требуется ваше одобрение.`, 2);

  const fin = report.depts.find(d => d.id === "finance");
  if (fin?.kpis[0]) add("finance", "Finance AI", `Финансовый отчёт: ${fin.kpis[0].label} ${fin.kpis[0].value}. ${fin.recommendations[0] ?? ""}`, 4);

  const sal = report.depts.find(d => d.id === "sales");
  if (sal?.problems[0]) add("sales", "Sales AI", sal.problems[0], 6);

  const ops = report.depts.find(d => d.id === "operations");
  if (ops) {
    const msg = ops.problems[0] ?? ops.recommendations[0];
    if (msg) add("operations", "Operations AI", msg, 8);
  }

  return msgs;
}

export default function CeoDashboard() {
  const [tab,        setTab]        = useState<TabId>("exec");
  const [report,     setReport]     = useState<CeoApiReport | null>(null);
  const [tasks,      setTasks]      = useState<CeoTask[]>([]);
  const [decisions,  setDecisions]  = useState<CeoDecision[]>([]);
  const [notifs,     setNotifs]     = useState<CeoNotification[]>([]);
  const [kpis,       setKpis]       = useState<KpiTarget[]>([]);
  const [history,    setHistory]    = useState<HistoryEntry[]>([]);
  const [inbox,      setInbox]      = useState<InboxMessage[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-company/ceo/report");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Ошибка");
      const r: CeoApiReport = data.report;
      setReport(r);
      setNotifs(r.notifications);
      setKpis(r.kpis);
      // Seed decisions from localStorage or report
      const savedDec  = tryParse<CeoDecision[]>("ceo_decisions");
      const savedTask = tryParse<CeoTask[]>("ceo_tasks");
      const savedHist = tryParse<HistoryEntry[]>("ceo_history");
      setDecisions(savedDec  ?? r.decisions);
      setTasks(savedTask     ?? generateTasksFromDecisions(r.decisions, r));
      setHistory(savedHist   ?? []);
      setInbox(buildInbox(r));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  // Persist to localStorage
  useEffect(() => { if (decisions.length) localStorage.setItem("ceo_decisions", JSON.stringify(decisions)); }, [decisions]);
  useEffect(() => { if (tasks.length)     localStorage.setItem("ceo_tasks",     JSON.stringify(tasks));     }, [tasks]);
  useEffect(() => { localStorage.setItem("ceo_history", JSON.stringify(history)); }, [history]);

  // ─ Handlers ─

  const approveDecision = useCallback((id: string) => {
    const dec = decisions.find(d => d.id === id);
    setDecisions(prev => prev.map(d => d.id === id ? { ...d, status: "APPROVED", updatedAt: now() } : d));
    if (dec && report) {
      const dept = report.depts.find(d => d.id === dec.deptId);
      const newTask: CeoTask = {
        id: `task-${id}-${Date.now()}`,
        title: dec.title.length > 72 ? dec.title.slice(0, 69) + "…" : dec.title,
        description: dec.title,
        deptId: dec.deptId,
        deptName: dec.source,
        assignee: dept?.director ?? "AI Director",
        priority: dec.priority,
        status: "PENDING",
        createdAt: now(),
        deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
        decisionId: id,
      };
      setTasks(prev => [...prev, newTask]);
    }
  }, [decisions, report]);

  const rejectDecision = useCallback((id: string) => {
    const dec = decisions.find(d => d.id === id);
    if (dec) {
      setHistory(prev => [...prev, {
        id: `hist-rej-${id}`,
        date: now(),
        title: dec.title,
        description: `Отклонено CEO`,
        deptId: dec.deptId,
        deptName: dec.source,
        status: "REJECTED",
      }]);
    }
    setDecisions(prev => prev.map(d => d.id === id ? { ...d, status: "REJECTED", updatedAt: now() } : d));
  }, [decisions]);

  const markDecisionDone = useCallback((id: string) => {
    const dec = decisions.find(d => d.id === id);
    if (dec) {
      setHistory(prev => [...prev, {
        id: `hist-done-${id}`,
        date: now(),
        title: dec.title,
        description: dec.reason,
        deptId: dec.deptId,
        deptName: dec.source,
        status: "DONE",
      }]);
    }
    setDecisions(prev => prev.map(d => d.id === id ? { ...d, status: "DONE", updatedAt: now() } : d));
  }, [decisions]);

  const changeTaskStatus = useCallback((id: string, status: CeoTask["status"]) => {
    const task = tasks.find(t => t.id === id);
    if (status === "DONE" && task) {
      setHistory(prev => [...prev, {
        id: `hist-task-${id}`,
        date: now(),
        title: task.title,
        description: task.description,
        deptId: task.deptId,
        deptName: task.deptName,
        status: "DONE",
      }]);
      if (task.decisionId) {
        setDecisions(prev => prev.map(d => d.id === task.decisionId ? { ...d, status: "DONE", updatedAt: now() } : d));
      }
    }
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status, completedAt: status === "DONE" ? now() : undefined } : t));
  }, [tasks]);

  const createTask = useCallback((f: { title: string; deptId: string; priority: Priority; deadline: string; description: string }) => {
    const dept = report?.depts.find(d => d.id === f.deptId);
    setTasks(prev => [...prev, {
      id: `task-manual-${Date.now()}`,
      title: f.title,
      description: f.description || f.title,
      deptId: f.deptId,
      deptName: dept?.nameRu ?? f.deptId,
      assignee: dept?.director ?? "AI Director",
      priority: f.priority,
      status: "PENDING",
      createdAt: now(),
      deadline: f.deadline ? new Date(f.deadline).toISOString() : undefined,
    }]);
    setCreateOpen(false);
  }, [report]);

  const markNotifRead = useCallback((id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const replyInbox = useCallback((id: string, reply: string) => {
    setInbox(prev => prev.map(m => m.id === id ? { ...m, reply } : m));
  }, []);

  const newDecisionCount = decisions.filter(d => d.status === "NEW").length;
  const unreadCount      = notifs.filter(n => !n.read).length;

  // ─ Render ─

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <a href="/admin/ai-company" className="hover:text-slate-200">AI Company OS</a>
            <span>›</span>
            <span className="text-slate-200">CEO Command Center</span>
          </div>
          <h1 className="text-2xl font-bold text-white">👑 CEO AI Command Center</h1>
          <p className="text-slate-400 text-sm mt-1">Генеральный директор AI · Единый управленческий контур</p>
        </div>
        <button onClick={fetchReport} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white rounded-lg text-sm font-medium transition-colors flex-shrink-0">
          {loading ? <><span className="animate-spin">⟳</span> Загрузка...</> : "🔄 Обновить данные"}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm">Ошибка: {error}</div>
      )}

      {/* Status bar */}
      {report && <StatusBar report={report} tasks={tasks} decisions={decisions} />}

      {/* Tabs */}
      <div className="flex gap-0.5 flex-wrap border-b border-slate-800">
        {TABS.map(t => {
          const badge = t.id === "decisions" && newDecisionCount > 0 ? newDecisionCount
            : t.id === "notifs" && unreadCount > 0 ? unreadCount : 0;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-1.5 px-3 py-2 text-sm rounded-t transition-colors ${tab === t.id ? "bg-slate-800 text-white border-b-2 border-blue-500" : "text-slate-400 hover:text-slate-200"}`}>
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
              {badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {loading && !report && (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="text-5xl animate-spin mb-4">⟳</div>
          <div className="text-slate-400 text-sm">CEO AI собирает данные со всех отделов...</div>
          <div className="text-slate-600 text-xs mt-1">Sales · Marketing · Content · Analytics · Operations · Finance · Strategy</div>
        </div>
      )}

      {/* Tab content */}
      {report && (
        <div>
          {tab === "exec"      && <ExecTab      report={report} tasks={tasks} />}
          {tab === "decisions" && <DecisionsTab decisions={decisions} onApprove={approveDecision} onReject={rejectDecision} onMarkDone={markDecisionDone} />}
          {tab === "tasks"     && <TasksTab     tasks={tasks} depts={report.depts} onStatusChange={changeTaskStatus} onCreateOpen={() => setCreateOpen(true)} />}
          {tab === "depts"     && <DeptsTab     report={report} tasks={tasks} />}
          {tab === "notifs"    && <NotifsTab    notifications={notifs} onMarkRead={markNotifRead} />}
          {tab === "kpi"       && <KpiTab       kpis={kpis} />}
          {tab === "history"   && <HistoryTab   history={history} />}
          {tab === "ceo-ai"    && <CeoAiTab     report={report} inbox={inbox} onReply={replyInbox} onRefresh={fetchReport} loading={loading} />}
        </div>
      )}

      {/* Create Task Modal */}
      {createOpen && report && (
        <CreateModal depts={report.depts} onClose={() => setCreateOpen(false)} onCreate={createTask} />
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tryParse<T>(key: string): T | null {
  try { return JSON.parse(localStorage.getItem(key) ?? "null"); }
  catch { return null; }
}

function generateTasksFromDecisions(decisions: CeoDecision[], report: CeoApiReport): CeoTask[] {
  return decisions.slice(0, 7).map(dec => {
    const dept = report.depts.find(d => d.id === dec.deptId);
    return {
      id: `task-init-${dec.id}`,
      title: dec.title.length > 72 ? dec.title.slice(0, 69) + "…" : dec.title,
      description: dec.title,
      deptId: dec.deptId,
      deptName: dec.source,
      assignee: dept?.director ?? "AI Director",
      priority: dec.priority,
      status: "PENDING",
      createdAt: dec.createdAt,
      deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
      decisionId: dec.id,
    } as CeoTask;
  });
}
