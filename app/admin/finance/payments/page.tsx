import { AdminNav } from "@/components/admin/AdminNav";
import { FinanceNav } from "@/components/admin/finance/FinanceNav";
import { getAllPayments } from "@/lib/finance/api";
import { CURRENCY_SYMBOLS, PAYMENT_TYPE_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/finance/types";
import type { FinanceCurrency } from "@/lib/finance/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function fmtDate(dt: string) {
  try { return new Date(dt).toLocaleDateString("ru-RU"); } catch { return dt.slice(0, 10); }
}

const STATUS_STYLE: Record<string, string> = {
  paid:      "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  pending:   "bg-amber-500/10 text-amber-400 border-amber-500/30",
  cancelled: "bg-slate-700/50 text-slate-500 border-slate-600",
};

export default async function FinancePaymentsPage() {
  const payments = await getAllPayments();
  const sym = (cur: string) => CURRENCY_SYMBOLS[cur as FinanceCurrency] ?? "$";

  const totalPaid    = payments.filter((p) => p.status === "paid").reduce((s, p) => s + (p.amount ?? 0), 0);
  const totalPending = payments.filter((p) => p.status === "pending").reduce((s, p) => s + (p.amount ?? 0), 0);

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">💳 Платежи клиентов</h1>
          <span className="text-slate-400 text-sm">{payments.length} записей</span>
        </div>
        <FinanceNav />

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Оплачено</p>
            <p className="text-2xl font-bold text-emerald-400">${totalPaid.toLocaleString()}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Дебиторка</p>
            <p className="text-2xl font-bold text-amber-400">${totalPending.toLocaleString()}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Всего платежей</p>
            <p className="text-2xl font-bold text-white">{payments.length}</p>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
            <p className="text-slate-500">Нет платежей</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/50 border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Клиент</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Тип</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-400">Сумма</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Метод</th>
                    <th className="px-4 py-3 text-center font-medium text-slate-400">Статус</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Комментарий</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-400">Дата</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {payments.map((p, i) => (
                    <tr key={p.id ?? i} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-white font-medium">{p.client_name || "—"}</td>
                      <td className="px-4 py-3 text-slate-300">{PAYMENT_TYPE_LABELS[p.type] ?? p.type}</td>
                      <td className="px-4 py-3 text-right font-semibold text-white">
                        {sym(p.currency)}{(p.amount ?? 0).toLocaleString()} {p.currency}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{p.payment_method || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLE[p.status] ?? "bg-slate-800 text-slate-400 border-slate-700"}`}>
                          {PAYMENT_STATUS_LABELS[p.status] ?? p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate">{p.comment || "—"}</td>
                      <td className="px-4 py-3 text-right text-slate-500 text-xs">{fmtDate(p.payment_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
