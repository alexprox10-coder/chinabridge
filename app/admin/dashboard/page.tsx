import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDashboardStats, getLeads } from "@/lib/crm/client";
import { STATUS_COLORS, STATUS_LABELS, PRIORITY_EMOJI } from "@/lib/crm/types";
import type { CRMLead, LeadStatus, LeadPriority } from "@/lib/crm/types";
import { AdminNav } from "@/components/admin/AdminNav";
import { CeoReportWidget } from "./CeoReportWidget";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function KpiCard({
  label,
  value,
  sub,
  accent,
  alert,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`bg-slate-900 border rounded-xl p-5 flex flex-col gap-1 ${
        alert ? "border-amber-500/40 bg-amber-950/20" : "border-slate-800"
      }`}
    >
      <p className="text-slate-400 text-xs uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold ${accent ?? "text-white"}`}>{value}</p>
      {sub && <p className="text-slate-500 text-xs">{sub}</p>}
    </div>
  );
}

function TodayCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-800/60 last:border-0">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className={`font-bold text-lg ${color}`}>{value}</span>
    </div>
  );
}

function LeadRow({ lead }: { lead: CRMLead }) {
  const status  = (lead.status ?? "NEW") as LeadStatus;
  const priority = (lead.priority ?? "COLD") as LeadPriority;
  const isStale = Date.now() - new Date(lead.created_at || 0).getTime() > 24 * 3600000;

  return (
    <Link
      href={`/admin/leads/${lead.id}`}
      className={`flex items-center gap-3 p-3 hover:bg-slate-800/50 rounded-lg transition group ${
        isStale && status === "NEW" ? "bg-amber-950/10 border border-amber-500/20" : ""
      }`}
    >
      <span className="text-base">{PRIORITY_EMOJI[priority]}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white group-hover:text-red-400 transition truncate text-sm">
          {lead.name || "—"}
        </p>
        <p className="text-slate-500 text-xs truncate">{lead.product || "—"}</p>
      </div>
      {isStale && status === "NEW" && (
        <span className="text-xs text-amber-400 font-medium">⚠ без ответа</span>
      )}
      <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[status]}`}>
        {STATUS_LABELS[status]}
      </span>
      <span className="text-slate-600 text-xs hidden sm:block">{(lead.created_at ?? "").slice(0, 10)}</span>
    </Link>
  );
}

function FunnelBar({ by_status }: { by_status: Record<string, number> }) {
  const stages = [
    { key: "NEW",          label: "Новые",       color: "bg-blue-500" },
    { key: "CONTACTED",    label: "Связались",   color: "bg-cyan-500" },
    { key: "CALCULATION",  label: "Расчёт",      color: "bg-yellow-500" },
    { key: "OFFER_SENT",   label: "КП",          color: "bg-orange-500" },
    { key: "NEGOTIATION",  label: "Переговоры",  color: "bg-indigo-500" },
    { key: "PAYMENT",      label: "Оплата",      color: "bg-emerald-500" },
    { key: "SUCCESS",      label: "Сделка",      color: "bg-green-500" },
  ];
  const max = Math.max(1, ...stages.map((s) => by_status[s.key] ?? 0));
  return (
    <div className="space-y-2 mt-4">
      {stages.map((s) => {
        const n = by_status[s.key] ?? 0;
        const pct = Math.round((n / max) * 100);
        return (
          <div key={s.key} className="flex items-center gap-3 text-sm">
            <span className="text-slate-400 w-24 text-xs shrink-0">{s.label}</span>
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-white font-medium w-5 text-right text-xs">{n}</span>
          </div>
        );
      })}
    </div>
  );
}

export default async function DashboardPage() {
  const store    = await cookies();
  const isTenant = store.get("cb_tenant_session")?.value;
  const isAdmin  = store.get("cb_admin")?.value;
  const isDone   = store.get("cb_onboarding")?.value;
  if (isTenant && !isAdmin && !isDone) redirect("/onboarding");

  let stats: Awaited<ReturnType<typeof getDashboardStats>> | null = null;
  let leads: CRMLead[] = [];
  try {
    [stats, leads] = await Promise.all([getDashboardStats(), getLeads()]);
  } catch {}
  if (!stats) stats = {
    total: 0, today: 0, today_new: 0, today_unanswered: 0,
    today_calculations: 0, today_proposals: 0, today_paid: 0, today_completed: 0,
    hot: 0, open: 0, closed_success: 0, closed_lost: 0,
    potential_value: 0, total_revenue: 0, conversion: 0,
    unanswered_count: 0, stale3d_count: 0, sleeping_count: 0,
    by_status: {} as Record<string, number>,
  };
  const hotLeads    = leads.filter((l) => l.priority === "HOT");
  const recentLeads = leads.slice(0, 15);
  const conversionColor = stats.conversion >= 20 ? "text-green-400" : stats.conversion >= 10 ? "text-yellow-400" : "text-slate-400";

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Дашборд продаж</h1>
          <Link href="/admin/pipeline" className="text-sm text-red-400 hover:text-red-300 transition flex items-center gap-1">
            Открыть Pipeline →
          </Link>
        </div>

        {/* CEO AI Daily Report */}
        <CeoReportWidget />

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <KpiCard label="Всего лидов" value={stats.total} />
          <KpiCard label="Конверсия" value={`${stats.conversion}%`} accent={conversionColor} sub="в сделку" />
          <KpiCard
            label="Выручка"
            value={stats.total_revenue > 0 ? `$${stats.total_revenue.toLocaleString()}` : "—"}
            accent="text-green-400"
            sub="закрытые сделки"
          />
          <KpiCard
            label="Потенциал"
            value={stats.potential_value > 0 ? `$${stats.potential_value.toLocaleString()}` : "—"}
            sub="открытые лиды"
          />
          <KpiCard
            label="Без ответа"
            value={stats.unanswered_count}
            accent={stats.unanswered_count > 0 ? "text-amber-400" : "text-slate-400"}
            alert={stats.unanswered_count > 0}
            sub=">24ч без ответа"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* Today breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-1 text-sm uppercase tracking-wide">Сегодня</h2>
            <p className="text-slate-500 text-xs mb-4">{new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}</p>
            <TodayCard label="Новых лидов"          value={stats.today_new}          color="text-blue-400" />
            <TodayCard label="Без ответа (>24ч)"   value={stats.today_unanswered}   color={stats.today_unanswered > 0 ? "text-amber-400" : "text-slate-400"} />
            <TodayCard label="Расчётов отправлено"  value={stats.today_calculations} color="text-yellow-400" />
            <TodayCard label="КП отправлено"        value={stats.today_proposals}    color="text-orange-400" />
            <TodayCard label="Оплат"                value={stats.today_paid}         color="text-emerald-400" />
            <TodayCard label="Сделок закрыто"       value={stats.today_completed}    color="text-green-400" />
          </div>

          {/* Funnel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-1 text-sm uppercase tracking-wide">Воронка</h2>
            <p className="text-slate-500 text-xs mb-2">Распределение по статусам</p>
            <FunnelBar by_status={stats.by_status} />
          </div>

          {/* Hot leads */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
              🔥 Горячие лиды
              <span className="ml-auto text-xs text-slate-500">{hotLeads.length}</span>
            </h2>
            {hotLeads.length === 0 ? (
              <p className="text-slate-600 text-sm">Нет горячих лидов</p>
            ) : (
              <div className="space-y-1">
                {hotLeads.slice(0, 6).map((l) => <LeadRow key={l.id} lead={l} />)}
              </div>
            )}
            {hotLeads.length > 6 && (
              <Link href="/admin/leads?priority=HOT" className="mt-3 block text-xs text-red-400 hover:text-red-300">
                Ещё {hotLeads.length - 6} лидов →
              </Link>
            )}
          </div>
        </div>

        {/* Recent leads */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white text-sm uppercase tracking-wide">Последние заявки</h2>
            <Link href="/admin/leads" className="text-sm text-red-400 hover:text-red-300 transition">
              Все лиды →
            </Link>
          </div>
          {recentLeads.length === 0 ? (
            <p className="text-slate-600 text-sm">Заявок пока нет</p>
          ) : (
            <div className="space-y-0.5">
              {recentLeads.map((l) => <LeadRow key={l.id} lead={l} />)}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
