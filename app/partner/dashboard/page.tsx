"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/partner-portal/i18n";
import type { PartnerTask, TaskStatus } from "@/lib/partner-portal/types";
import { ru } from "@/lib/partner-portal/translations";

const STATUS_COLORS: Record<TaskStatus, string> = {
  NEW:           "bg-blue-100 text-blue-700",
  IN_PROGRESS:   "bg-yellow-100 text-yellow-700",
  WAITING_REPLY: "bg-orange-100 text-orange-700",
  COMPLETED:     "bg-green-100 text-green-700",
};

export default function PartnerDashboard() {
  const { t } = useI18n();
  const [tasks, setTasks] = useState<PartnerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const deletedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/partner/tasks")
      .then((r) => r.json())
      .then((data) => {
        const all: PartnerTask[] = Array.isArray(data) ? data : [];
        setTasks(all.filter(t => !deletedIds.current.has(t.task_id)));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleDelete(e: React.MouseEvent, task: PartnerTask) {
    e.preventDefault();
    e.stopPropagation();
    if (deleting) return;
    setDeleting(task.task_id);
    try {
      const res = await fetch(`/api/partner/tasks/${task.task_id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({ ok: false }));
      if (data.ok) {
        deletedIds.current.add(task.task_id);
        setTasks(prev => prev.filter(t => t.task_id !== task.task_id));
      }
    } finally {
      setDeleting(null);
    }
  }

  const counts = {
    NEW:           tasks.filter((t) => t.status === "NEW").length,
    IN_PROGRESS:   tasks.filter((t) => t.status === "IN_PROGRESS").length,
    WAITING_REPLY: tasks.filter((t) => t.status === "WAITING_REPLY").length,
    COMPLETED:     tasks.filter((t) => t.status === "COMPLETED").length,
  };

  const stats = [
    { key: "new_tasks" as keyof typeof ru,      status: "NEW",           color: "bg-blue-50 border-blue-200",   num: "text-blue-700" },
    { key: "in_progress" as keyof typeof ru,    status: "IN_PROGRESS",   color: "bg-yellow-50 border-yellow-200", num: "text-yellow-700" },
    { key: "waiting_reply" as keyof typeof ru,  status: "WAITING_REPLY", color: "bg-orange-50 border-orange-200", num: "text-orange-700" },
    { key: "completed" as keyof typeof ru,      status: "COMPLETED",     color: "bg-green-50 border-green-200",  num: "text-green-700" },
  ] as const;

  if (loading) return <p className="text-slate-400 text-sm">{t("loading")}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{t("dashboard")}</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ key, status, color, num }) => (
          <div key={status} className={`border rounded-2xl p-4 ${color}`}>
            <p className="text-xs text-slate-500 mb-1">{t(key)}</p>
            <p className={`text-3xl font-bold ${num}`}>{counts[status as TaskStatus]}</p>
          </div>
        ))}
      </div>

      {/* Recent tasks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">{t("recent_tasks")}</h2>
          <Link href="/partner/tasks" className="text-sm text-blue-600 hover:underline">{t("all_tasks")}</Link>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
            <p className="text-slate-400 text-sm">{t("no_tasks")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.task_id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition">
                <Link href={`/partner/tasks/${task.task_id}`} className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-400">{task.task_id}</span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {t(`task_type_${task.type}` as keyof typeof ru)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 truncate">{task.product_display}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {task.quantity} {t("pcs")} · {task.deadline_hours}{t("hours")}
                  </p>
                </Link>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[task.status]}`}>
                    {t(`status_${task.status}` as keyof typeof ru)}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, task)}
                    disabled={deleting === task.task_id}
                    title="Удалить"
                    className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-40">
                    {deleting === task.task_id ? "⏳" : "🗑"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
