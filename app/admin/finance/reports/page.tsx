import { AdminNav } from "@/components/admin/AdminNav";
import { FinanceNav } from "@/components/admin/finance/FinanceNav";
import { getFinanceReport, getAllFinanceOrders } from "@/lib/finance/api";
import type { FinanceReport } from "@/lib/finance/api";
import type { FinanceOrder } from "@/lib/finance/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function Bar({ label, value, max, color = "bg-emerald-500" }: {
  label: string; value: number; max: number; color?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400 truncate max-w-[60%]">{label}</span>
        <span className="text-white font-medium">${value.toLocaleString("ru-RU")}</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const EMPTY_REPORT: FinanceReport = {
  total_revenue: 0, total_cost: 0, total_profit: 0, avg_margin: 0,
  order_count: 0, paid_count: 0, pending_payments: 0,
  by_manager: {}, by_month: {}, top_clients: [], cashflow_balance: {},
};

export default async function FinanceReportsPage() {
  let report: FinanceReport = EMPTY_REPORT;
  let orders: FinanceOrder[] = [];
  try {
    [report, orders] = await Promise.all([getFinanceReport("tenant-chinabridge"), getAllFinanceOrders("tenant-chinabridge")]);
  } catch {}

  // By month (last 12 months)
  const monthlyRevenue: Array<{ month: string; revenue: number; profit: number; margin: number }> = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toISOString().slice(0, 7);
    const mo = orders.filter((o) => (o.created_at ?? "").startsWith(key));
    const rev = mo.reduce((s, o) => s + (o.client_price ?? 0), 0);
    const prf = mo.reduce((s, o) => s + (o.gross_profit ?? 0), 0);
    const mrg = mo.length > 0
      ? Math.round(mo.reduce((s, o) => s + (o.margin_percent ?? 0), 0) / mo.length * 10) / 10
      : 0;
    monthlyRevenue.push({
      month: d.toLocaleDateString("ru-RU", { month: "short", year: "2-digit" }),
      revenue: rev, profit: prf, margin: mrg,
    });
  }
  const maxMonthRev = Math.max(...monthlyRevenue.map((m) => m.revenue), 1);

  // By city/destination from orders
  const cityMap: Record<string, { revenue: number; profit: number }> = {};
  for (const o of orders) {
    const city = (o as any).city_destination || "Другое";
    if (!cityMap[city]) cityMap[city] = { revenue: 0, profit: 0 };
    cityMap[city].revenue += o.client_price ?? 0;
    cityMap[city].profit  += o.gross_profit ?? 0;
  }
  const topCities = Object.entries(cityMap).sort((a, b) => b[1].profit - a[1].profit).slice(0, 8);
  const maxCityProfit = topCities[0]?.[1].profit ?? 1;

  const topManagers = Object.entries(report.by_manager).sort((a, b) => b[1].profit - a[1].profit).slice(0, 8);
  const maxMgrProfit = topManagers[0]?.[1].profit ?? 1;

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">📈 Аналитика</h1>
        </div>
        <FinanceNav />

        {/* Summary row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Выручка", value: `$${report.total_revenue.toLocaleString()}`, color: "text-blue-400" },
            { label: "Прибыль", value: `$${report.total_profit.toLocaleString()}`, color: "text-emerald-400" },
            { label: "Средняя маржа", value: `${report.avg_margin}%`, color: "text-white" },
            { label: "Дебиторка", value: `$${report.pending_payments.toLocaleString()}`, color: "text-amber-400" },
            { label: "Сделок", value: String(report.order_count), color: "text-white" },
          ].map((k) => (
            <div key={k.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">{k.label}</p>
              <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue by month */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">📊 Выручка по месяцам (12 мес.)</h3>
            {monthlyRevenue.every((m) => m.revenue === 0) ? (
              <p className="text-slate-500 text-sm text-center py-8">Нет данных</p>
            ) : (
              <div className="space-y-3">
                {monthlyRevenue.map((m) => (
                  <div key={m.month}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-slate-400 w-14">{m.month}</span>
                      <div className="flex gap-3 text-right">
                        <span className="text-blue-400">${m.revenue.toLocaleString()}</span>
                        <span className="text-emerald-400 w-20 text-right">${m.profit.toLocaleString()}</span>
                        <span className="text-slate-500 w-12 text-right">{m.margin}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500/70 rounded-full" style={{ width: `${Math.round((m.revenue / maxMonthRev) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Profit by month */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">💰 Прибыль по месяцам</h3>
            {monthlyRevenue.every((m) => m.profit === 0) ? (
              <p className="text-slate-500 text-sm text-center py-8">Нет данных</p>
            ) : (
              <div className="space-y-3">
                {monthlyRevenue.map((m) => (
                  <div key={m.month}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-slate-400 w-14">{m.month}</span>
                      <span className={m.profit >= 0 ? "text-emerald-400" : "text-red-400"}>
                        ${m.profit.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${m.profit >= 0 ? "bg-emerald-500" : "bg-red-500"}`}
                        style={{ width: `${Math.round((Math.abs(m.profit) / maxMonthRev) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* By manager */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">👤 Прибыль по менеджерам</h3>
            {topManagers.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">Нет данных</p>
            ) : (
              <div className="space-y-3">
                {topManagers.map(([mgr, v]) => (
                  <div key={mgr}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-slate-400 truncate max-w-[55%]">{mgr}</span>
                      <div className="flex gap-3">
                        <span className="text-slate-500">{v.count} сделок</span>
                        <span className="text-emerald-400">${v.profit.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500/70 rounded-full" style={{ width: `${Math.round((v.profit / maxMgrProfit) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* By city */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">🗺️ Прибыль по городам</h3>
            {topCities.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">Нет данных</p>
            ) : (
              <div className="space-y-3">
                {topCities.map(([city, v]) => (
                  <Bar key={city} label={city} value={v.profit} max={maxCityProfit} color="bg-purple-500/70" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top clients */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">🏆 ТОП-10 клиентов по прибыли</h3>
          {report.top_clients.length === 0 ? (
            <p className="text-slate-500 text-sm">Нет данных</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 text-xs uppercase border-b border-slate-800">
                    <th className="pb-2 text-left">#</th>
                    <th className="pb-2 text-left">Клиент</th>
                    <th className="pb-2 text-right">Выручка</th>
                    <th className="pb-2 text-right">Прибыль</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {report.top_clients.map((c, i) => (
                    <tr key={c.client} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 pr-3 text-slate-500">{i + 1}</td>
                      <td className="py-2 text-white font-medium">{c.client}</td>
                      <td className="py-2 text-right text-slate-300">${c.revenue.toLocaleString()}</td>
                      <td className="py-2 text-right font-semibold text-emerald-400">${c.profit.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
