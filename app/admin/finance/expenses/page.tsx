import { AdminNav } from "@/components/admin/AdminNav";
import { FinanceNav } from "@/components/admin/finance/FinanceNav";
import { getAllExpenses } from "@/lib/finance/api";
import { CURRENCY_SYMBOLS } from "@/lib/finance/types";
import type { FinanceCurrency } from "@/lib/finance/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function fmtDate(dt: string) {
  try { return new Date(dt).toLocaleDateString("ru-RU"); } catch { return dt.slice(0, 10); }
}

export default async function FinanceExpensesPage() {
  const expenses = await getAllExpenses();
  const sym = (cur: string) => CURRENCY_SYMBOLS[cur as FinanceCurrency] ?? "$";

  const totalByCategory: Record<string, number> = {};
  for (const e of expenses) {
    const cat = e.category || "Прочее";
    totalByCategory[cat] = (totalByCategory[cat] ?? 0) + (e.amount ?? 0);
  }
  const total = expenses.reduce((s, e) => s + (e.amount ?? 0), 0);
  const maxCat = Math.max(...Object.values(totalByCategory), 1);

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">💸 Расходы</h1>
          <span className="text-slate-400 text-sm">{expenses.length} записей</span>
        </div>
        <FinanceNav />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Category breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">По категориям</h3>
            {Object.keys(totalByCategory).length === 0 ? (
              <p className="text-slate-500 text-sm">Нет данных</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(totalByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, amt]) => (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{cat}</span>
                      <span className="text-white">${amt.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500/60 rounded-full" style={{ width: `${Math.round((amt / maxCat) * 100)}%` }} />
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-800 flex justify-between text-sm">
                  <span className="text-slate-400">Итого</span>
                  <span className="font-bold text-red-400">${total.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Expenses table */}
          <div className="lg:col-span-2">
            {expenses.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center h-full flex items-center justify-center">
                <p className="text-slate-500">Нет расходов</p>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800/50 border-b border-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-slate-400">Категория</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-400">Сумма</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-400">Описание</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-400">Дата</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {expenses.map((e, i) => (
                        <tr key={e.id ?? i} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 text-slate-300">{e.category || "—"}</td>
                          <td className="px-4 py-3 text-right font-semibold text-red-400">
                            −{sym(e.currency)}{(e.amount ?? 0).toLocaleString()} {e.currency}
                          </td>
                          <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{e.description || "—"}</td>
                          <td className="px-4 py-3 text-right text-slate-500 text-xs">{fmtDate(e.expense_date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
