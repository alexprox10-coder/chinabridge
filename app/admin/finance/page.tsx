import { AdminNav } from "@/components/admin/AdminNav";
import { FinanceNav } from "@/components/admin/finance/FinanceNav";
import { getAllFinanceOrders, getAllPayments, getAllCashFlow } from "@/lib/finance/api";
import { ACCOUNT_LABELS, CURRENCY_SYMBOLS } from "@/lib/finance/types";
import type { FinanceCurrency } from "@/lib/finance/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function KPI({ label, value, sub, color = "text-white" }: {
  label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function Bar({ label, value, max, color = "bg-emerald-500" }: {
  label: string; value: number; max: number; color?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-medium">${value.toLocaleString("ru-RU")}</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function FinanceDashboardPage() {
  const [orders, payments, cashflow] = await Promise.all([
    getAllFinanceOrders(),
    getAllPayments(),
    getAllCashFlow(),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = new Date().toISOString().slice(0, 7);

  const todayOrders = orders.filter((o) => (o.created_at ?? "").startsWith(today));
  const monthOrders = orders.filter((o) => (o.created_at ?? "").startsWith(thisMonth));

  const totalRevenue   = orders.reduce((s, o) => s + (o.client_price ?? 0), 0);
  const totalProfit    = orders.reduce((s, o) => s + (o.gross_profit ?? 0), 0);
  const avgMargin      = orders.length > 0
    ? Math.round(orders.reduce((s, o) => s + (o.margin_percent ?? 0), 0) / orders.length * 10) / 10
    : 0;

  const monthRevenue   = monthOrders.reduce((s, o) => s + (o.client_price ?? 0), 0);
  const monthProfit    = monthOrders.reduce((s, o) => s + (o.gross_profit ?? 0), 0);
  const avgCheck       = monthOrders.length > 0 ? Math.round(monthRevenue / monthOrders.length) : 0;

  const todayRevenue   = todayOrders.reduce((s, o) => s + (o.client_price ?? 0), 0);
  const todayProfit    = todayOrders.reduce((s, o) => s + (o.gross_profit ?? 0), 0);
  const todayMargin    = todayOrders.length > 0
    ? Math.round(todayOrders.reduce((s, o) => s + (o.margin_percent ?? 0), 0) / todayOrders.length * 10) / 10
    : 0;

  const pendingPayments = payments
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + (p.amount ?? 0), 0);

  // Cash flow balances
  const cfBalance: Record<string, number> = {};
  for (const e of cashflow) {
    const acc = e.account ?? "other";
    if (!cfBalance[acc]) cfBalance[acc] = 0;
    cfBalance[acc] += e.type === "income" ? (e.amount ?? 0) : -(e.amount ?? 0);
  }

  // Top clients by profit
  const clientMap: Record<string, number> = {};
  for (const o of orders) {
    const c = o.client_name || o.client_id || "Неизвестно";
    clientMap[c] = (clientMap[c] ?? 0) + (o.gross_profit ?? 0);
  }
  const topClients = Object.entries(clientMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const maxClientProfit = topClients[0]?.[1] ?? 1;

  // Monthly chart (last 6 months)
  const monthlyData: Array<{ month: string; revenue: number; profit: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toISOString().slice(0, 7);
    const mo = orders.filter((o) => (o.created_at ?? "").startsWith(key));
    monthlyData.push({
      month: d.toLocaleDateString("ru-RU", { month: "short", year: "2-digit" }),
      revenue: mo.reduce((s, o) => s + (o.client_price ?? 0), 0),
      profit:  mo.reduce((s, o) => s + (o.gross_profit ?? 0), 0),
    });
  }
  const maxMonthly = Math.max(...monthlyData.map((m) => m.revenue), 1);

  const sym = (cur: FinanceCurrency) => CURRENCY_SYMBOLS[cur] ?? "$";

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">💰 Финансы</h1>
            <p className="text-slate-400 text-sm mt-0.5">ChinaBridge Financial Engine v1.0</p>
          </div>
          <span className="text-slate-500 text-sm">{orders.length} сделок всего</span>
        </div>

        <FinanceNav />

        {/* Today KPIs */}
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Сегодня</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <KPI label="Выручка" value={`$${todayRevenue.toLocaleString()}`} color="text-emerald-400" />
          <KPI label="Прибыль" value={`$${todayProfit.toLocaleString()}`} color={todayProfit >= 0 ? "text-emerald-400" : "text-red-400"} />
          <KPI label="Маржа" value={`${todayMargin}%`} sub={`${todayOrders.length} сделок`} />
          <KPI label="Сделок" value={String(todayOrders.length)} sub="новые сегодня" />
        </div>

        {/* Month KPIs */}
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">За месяц</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <KPI label="Оборот" value={`$${monthRevenue.toLocaleString()}`} color="text-blue-400" />
          <KPI label="Чистая прибыль" value={`$${monthProfit.toLocaleString()}`} color={monthProfit >= 0 ? "text-emerald-400" : "text-red-400"} />
          <KPI label="Средняя маржа" value={`${avgMargin}%`} />
          <KPI label="Средний чек" value={`$${avgCheck.toLocaleString()}`} sub={`${monthOrders.length} сделок`} />
        </div>

        {/* All time */}
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Всего</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <KPI label="Общая выручка" value={`$${totalRevenue.toLocaleString()}`} color="text-white" />
          <KPI label="Общая прибыль" value={`$${totalProfit.toLocaleString()}`} color={totalProfit >= 0 ? "text-emerald-400" : "text-red-400"} />
          <KPI label="Средняя маржа" value={`${avgMargin}%`} />
          <KPI label="Дебиторка" value={`$${pendingPayments.toLocaleString()}`} color="text-amber-400" sub="ожидает оплаты" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Monthly chart */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">📊 Выручка и прибыль по месяцам</h3>
            {monthlyData.every((m) => m.revenue === 0) ? (
              <p className="text-slate-500 text-sm text-center py-8">Нет данных</p>
            ) : (
              <div className="space-y-4">
                {monthlyData.map((m) => (
                  <div key={m.month}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400 w-12">{m.month}</span>
                      <div className="flex gap-4">
                        <span className="text-blue-400">${m.revenue.toLocaleString()}</span>
                        <span className="text-emerald-400">${m.profit.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-0.5">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${maxMonthly > 0 ? Math.round((m.revenue / maxMonthly) * 100) : 0}%` }} />
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${maxMonthly > 0 ? Math.round((m.profit / maxMonthly) * 100) : 0}%` }} />
                    </div>
                  </div>
                ))}
                <div className="flex gap-4 text-xs mt-2">
                  <span className="flex items-center gap-1"><span className="w-3 h-1.5 bg-blue-500 rounded inline-block" /> Выручка</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-1.5 bg-emerald-500 rounded inline-block" /> Прибыль</span>
                </div>
              </div>
            )}
          </div>

          {/* Cash flow */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">💰 Cash Flow</h3>
            {Object.keys(cfBalance).length === 0 ? (
              <p className="text-slate-500 text-sm">Нет данных</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(cfBalance).map(([acc, bal]) => (
                  <div key={acc} className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">{ACCOUNT_LABELS[acc] ?? acc}</span>
                    <span className={`font-semibold text-sm ${bal >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      ${bal.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Итого</span>
                <span className="font-bold text-white">${Object.values(cfBalance).reduce((s, v) => s + v, 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top clients */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">🏆 ТОП-5 клиентов по прибыли</h3>
          {topClients.length === 0 ? (
            <p className="text-slate-500 text-sm">Нет данных</p>
          ) : (
            <div className="space-y-3">
              {topClients.map(([client, profit], i) => (
                <Bar key={client} label={`${i + 1}. ${client}`} value={profit} max={maxClientProfit} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
