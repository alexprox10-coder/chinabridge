import { AdminNav } from "@/components/admin/AdminNav";
import { FinanceNav } from "@/components/admin/finance/FinanceNav";
import { getAllFinanceOrders } from "@/lib/finance/api";
import { CURRENCY_SYMBOLS } from "@/lib/finance/types";
import type { FinanceCurrency, FinanceOrder } from "@/lib/finance/types";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function fmtDate(dt: string) {
  try { return new Date(dt).toLocaleDateString("ru-RU"); } catch { return dt.slice(0, 10); }
}

export default async function FinanceOrdersPage() {
  let orders: FinanceOrder[] = [];
  try { orders = await getAllFinanceOrders(); } catch {}
  const sym = (cur: FinanceCurrency) => CURRENCY_SYMBOLS[cur] ?? "$";

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">📋 Финансовые сделки</h1>
          <span className="text-slate-400 text-sm">{orders.length} записей</span>
        </div>
        <FinanceNav />

        {orders.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
            <p className="text-slate-500">Нет финансовых записей</p>
            <p className="text-slate-600 text-sm mt-1">Откройте заявку и заполните вкладку «Финансы»</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/50 border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Клиент</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Менеджер</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-400">Себест.</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-400">Цена</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-400">Прибыль</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-400">Маржа</th>
                    <th className="px-4 py-3 text-center font-medium text-slate-400">Статус</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-400">Дата</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {orders.map((o, i) => {
                    const s = sym(o.currency as FinanceCurrency);
                    return (
                      <tr key={o.id ?? i} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3">
                          {o.lead_id ? (
                            <Link href={`/admin/leads/${o.lead_id}`} className="text-white hover:text-emerald-400 font-medium transition">
                              {o.client_name || "—"}
                            </Link>
                          ) : (
                            <span className="text-white font-medium">{o.client_name || "—"}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400">{o.manager || "—"}</td>
                        <td className="px-4 py-3 text-right text-slate-300">{s}{(o.total_cost ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-white font-medium">{s}{(o.client_price ?? 0).toLocaleString()}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${(o.gross_profit ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {s}{(o.gross_profit ?? 0).toLocaleString()}
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${(o.margin_percent ?? 0) >= 15 ? "text-emerald-400" : (o.margin_percent ?? 0) >= 5 ? "text-amber-400" : "text-red-400"}`}>
                          {(o.margin_percent ?? 0).toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                            o.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : o.status === "closed" ? "bg-slate-700/50 text-slate-400 border-slate-600"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          }`}>
                            {o.status === "active" ? "Активна" : o.status === "closed" ? "Закрыта" : o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500 text-xs">{fmtDate(o.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
