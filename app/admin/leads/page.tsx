"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS, PRIORITY_EMOJI } from "@/lib/crm/types";
import type { CRMLead, LeadStatus, LeadPriority } from "@/lib/crm/types";

const ALL_STATUSES = Object.keys(STATUS_LABELS) as LeadStatus[];

export default function LeadsPage() {
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");

  const loadLeads = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter)   params.set("status", statusFilter);
    if (priorityFilter) params.set("priority", priorityFilter);
    const res = await fetch(`/api/admin/leads?${params}`);
    if (res.ok) setLeads(await res.json());
    setLoading(false);
  }, [statusFilter, priorityFilter]);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  async function handleDelete(e: React.MouseEvent, lead: CRMLead) {
    e.preventDefault();
    e.stopPropagation();
    if (deleting) return;
    if (!confirm(`Удалить лид "${lead.name || lead.product || lead.id}"?`)) return;
    setDeleting(lead.id);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, { method: "DELETE" });
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== lead.id));
      } else {
        alert("Не удалось удалить лид");
      }
    } finally {
      setDeleting(null);
    }
  }

  const setFilter = (type: "status" | "priority", value: string) => {
    if (type === "status")   { setStatusFilter(v => v === value ? "" : value); setPriorityFilter(""); }
    if (type === "priority") { setPriorityFilter(v => v === value ? "" : value); setStatusFilter(""); }
  };
  const clearFilters = () => { setStatusFilter(""); setPriorityFilter(""); };

  if (loading) return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-slate-500">Загрузка...</p>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Все заявки</h1>
          <span className="text-slate-500 text-sm">{leads.length} лидов</span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={clearFilters}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border ${
              !statusFilter && !priorityFilter
                ? "bg-red-600 border-red-600 text-white"
                : "border-slate-700 text-slate-400 hover:border-slate-500"
            }`}
          >
            Все
          </button>
          {(["HOT", "WARM", "COLD"] as LeadPriority[]).map((p) => (
            <button
              key={p}
              onClick={() => setFilter("priority", p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border ${
                priorityFilter === p
                  ? "bg-red-600 border-red-600 text-white"
                  : "border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              {PRIORITY_EMOJI[p]} {p}
            </button>
          ))}
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter("status", s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border ${
                statusFilter === s
                  ? "bg-red-600 border-red-600 text-white"
                  : "border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-left">
                <th className="px-4 py-3 font-medium">Клиент</th>
                <th className="px-4 py-3 font-medium">Товар</th>
                <th className="px-4 py-3 font-medium">Маршрут</th>
                <th className="px-4 py-3 font-medium">Приоритет</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Менеджер</th>
                <th className="px-4 py-3 font-medium">Дата</th>
                <th className="px-4 py-3 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-600">
                    Заявок нет
                  </td>
                </tr>
              )}
              {leads.map((lead) => {
                const status = (lead.status ?? "NEW") as LeadStatus;
                const priority = (lead.priority ?? "COLD") as LeadPriority;
                return (
                  <tr
                    key={lead.id}
                    className="border-b border-slate-800/50 hover:bg-slate-800/40 transition"
                  >
                    <td className="px-4 py-3">
                      <Link href={`/admin/leads/${lead.id}`} className="hover:text-red-400 transition">
                        <p className="font-medium text-white">{lead.name || "—"}</p>
                        <p className="text-slate-500 text-xs">{lead.phone || ""}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-300 max-w-[180px] truncate">{lead.product || "—"}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {[lead.city_destination, lead.country_destination].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[priority]}`}>
                        {PRIORITY_EMOJI[priority]} {priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[status]}`}>
                        {STATUS_LABELS[status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{lead.manager || "—"}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{(lead.created_at ?? "").slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => handleDelete(e, lead)}
                        disabled={deleting === lead.id}
                        title="Удалить лид"
                        className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-900/20 transition disabled:opacity-40"
                      >
                        {deleting === lead.id ? "⏳" : "🗑"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
