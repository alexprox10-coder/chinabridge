"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/partner-portal/i18n";
import type { PartnerTask, TaskStatus } from "@/lib/partner-portal/types";
import { ru } from "@/lib/partner-portal/translations";

const STATUS_COLORS: Record<TaskStatus, string> = {
  NEW:           "bg-blue-100 text-blue-700 border-blue-200",
  IN_PROGRESS:   "bg-yellow-100 text-yellow-700 border-yellow-200",
  WAITING_REPLY: "bg-orange-100 text-orange-700 border-orange-200",
  COMPLETED:     "bg-green-100 text-green-700 border-green-200",
};

const FILTERS: Array<{ key: keyof typeof ru; value: TaskStatus | "ALL" }> = [
  { key: "all_tasks",     value: "ALL" },
  { key: "new_tasks",     value: "NEW" },
  { key: "in_progress",   value: "IN_PROGRESS" },
  { key: "waiting_reply", value: "WAITING_REPLY" },
  { key: "completed",     value: "COMPLETED" },
];

export default function PartnerTasksPage() {
  const { t } = useI18n();
  const [tasks, setTasks] = useState<PartnerTask[]>([]);
  const [filter, setFilter] = useState<TaskStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/partner/tasks")
      .then((r) => r.json())
      .then((data) => { setTasks(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const visible = filter === "ALL" ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">{t("tasks")}</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(({ key, value }) => (
          <button key={value} onClick={() => setFilter(value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              filter === value
                ? "bg-blue-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:border-blue-300"
            }`}>
            {t(key)}
            {value !== "ALL" && (
              <span className="ml-1.5 text-xs opacity-75">
                {tasks.filter((t) => t.status === value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">{t("loading")}</p>
      ) : visible.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <p className="text-slate-400">{t("no_tasks")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((task) => (
            <Link key={task.task_id} href={`/partner/tasks/${task.task_id}`}
              className="block bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-sm transition">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                      {task.task_id}
                    </span>
                    <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                      {t(`task_type_${task.type}` as keyof typeof ru)}
                    </span>
                  </div>
                  <p className="text-base font-semibold text-slate-800 mb-2">{task.product_display}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                    <span>{t("quantity")}: <strong className="text-slate-700">{task.quantity} {t("pcs")}</strong></span>
                    <span>{t("deadline")}: <strong className="text-slate-700">{task.deadline_hours}{t("hours")}</strong></span>
                  </div>
                </div>
                <span className={`text-xs px-3 py-1.5 rounded-full font-medium border flex-shrink-0 ${STATUS_COLORS[task.status]}`}>
                  {t(`status_${task.status}` as keyof typeof ru)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
