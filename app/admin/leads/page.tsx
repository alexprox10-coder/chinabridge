import Link from "next/link";
import { getLeads } from "@/lib/crm/client";
import { STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS, PRIORITY_EMOJI } from "@/lib/crm/types";
import type { LeadStatus, LeadPriority } from "@/lib/crm/types";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ALL_STATUSES = Object.keys(STATUS_LABELS) as LeadStatus[];

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string }>;
}) {
  const sp = await searchParams;
  let leads: Awaited<ReturnType<typeof getLeads>> = [];
  try { leads = await getLeads({ status: sp.status, priority: sp.priority, tenantId: "tenant-chinabridge" }); } catch {}

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
          <Link
            href="/admin/leads"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border ${
              !sp.status && !sp.priority
                ? "bg-red-600 border-red-600 text-white"
                : "border-slate-700 text-slate-400 hover:border-slate-500"
            }`}
          >
            Все
          </Link>
          {["HOT", "WARM", "COLD"].map((p) => (
            <Link
              key={p}
              href={`/admin/leads?priority=${p}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border ${
                sp.priority === p
                  ? "bg-red-600 border-red-600 text-white"
                  : "border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              {PRIORITY_EMOJI[p as LeadPriority]} {p}
            </Link>
          ))}
          {ALL_STATUSES.map((s) => (
            <Link
              key={s}
              href={`/admin/leads?status=${s}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border ${
                sp.status === s
                  ? "bg-red-600 border-red-600 text-white"
                  : "border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              {STATUS_LABELS[s]}
            </Link>
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
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-600">
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
