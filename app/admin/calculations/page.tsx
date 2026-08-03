import { AdminNav } from "@/components/admin/AdminNav";
import { getAllCalculations } from "@/lib/client-portal/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TRANSPORT_LABELS: Record<string, string> = {
  truck: "🚛 Авто",
  air: "✈️ Авиа",
  sea: "🚢 Море",
  express: "⚡ Экспресс",
};

function fmtDate(dt: string) {
  try {
    return new Date(dt).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dt.slice(0, 16);
  }
}

export default async function AdminCalculationsPage() {
  const calcs = await getAllCalculations();

  // Stats
  const total = calcs.length;
  const withCost = calcs.filter((c) => c.total_cost > 0).length;
  const byType = calcs.reduce<Record<string, number>>((acc, c) => {
    acc[c.transport_type] = (acc[c.transport_type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Расчёты клиентов</h1>
          <span className="text-slate-400 text-sm">{total} расчётов</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Всего расчётов</p>
            <p className="text-2xl font-bold text-white">{total}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">С ценой</p>
            <p className="text-2xl font-bold text-green-400">{withCost}</p>
          </div>
          {Object.entries(byType).slice(0, 2).map(([type, count]) => (
            <div key={type} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">
                {TRANSPORT_LABELS[type] ?? type}
              </p>
              <p className="text-2xl font-bold text-white">{count}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        {calcs.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
            <p className="text-slate-500">Расчётов ещё нет</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/50 border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-400 whitespace-nowrap">Клиент</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400 whitespace-nowrap">Маршрут</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400 whitespace-nowrap">Товар</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400 whitespace-nowrap">Груз</th>
                    <th className="px-4 py-3 text-center font-medium text-slate-400 whitespace-nowrap">Тип</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-400 whitespace-nowrap">Стоимость</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-400 whitespace-nowrap">Дата</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {calcs.map((c, i) => (
                    <tr key={c.calc_id ?? i} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs">
                        {c.client_id.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                        {c.city_from} → {c.city_to}
                      </td>
                      <td className="px-4 py-3 text-slate-300 max-w-[180px] truncate">
                        {c.product_name || c.product_category}
                        {c.product_name && c.product_category !== c.product_name && (
                          <span className="text-slate-500 ml-1">({c.product_category})</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {c.weight ? `${c.weight} кг` : ""}
                        {c.weight && c.volume ? " / " : ""}
                        {c.volume ? `${c.volume} м³` : ""}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs font-medium text-slate-300">
                          {TRANSPORT_LABELS[c.transport_type] ?? c.transport_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                        {c.total_cost > 0 ? (
                          <span className="text-green-400">${c.total_cost.toLocaleString()} {c.currency}</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 text-xs whitespace-nowrap">
                        {fmtDate(c.created_at)}
                      </td>
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
