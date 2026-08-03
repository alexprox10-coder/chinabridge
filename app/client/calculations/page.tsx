import { getSession } from "@/lib/client-portal/auth";
import { redirect } from "next/navigation";
import { getClientCalculations } from "@/lib/client-portal/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

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
    });
  } catch {
    return dt.slice(0, 10);
  }
}

export default async function CalculationsPage() {
  const session = await getSession();
  if (!session) redirect("/client/login");

  const calcs = await getClientCalculations(session.clientId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">История расчётов</h1>
          <p className="text-slate-500 text-sm mt-0.5">Ранее рассчитанные маршруты доставки</p>
        </div>
        <Link
          href="/client/calculator"
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          + Новый расчёт
        </Link>
      </div>

      {calcs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-4xl mb-3">🧮</p>
          <p className="text-slate-600 font-medium">Расчётов пока нет</p>
          <p className="text-slate-400 text-sm mt-1">Воспользуйтесь калькулятором, чтобы узнать стоимость доставки</p>
          <Link
            href="/client/calculator"
            className="mt-4 inline-block bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
          >
            Открыть калькулятор
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 whitespace-nowrap">Маршрут</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 whitespace-nowrap">Товар</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 whitespace-nowrap">Параметры</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-500 whitespace-nowrap">Тип</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500 whitespace-nowrap">Стоимость</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500 whitespace-nowrap">Дата</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {calcs.map((c, i) => (
                  <tr key={c.calc_id ?? i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                      {c.city_from} → {c.city_to}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-[180px] truncate">
                      {c.product_name || c.product_category}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {c.weight ? `${c.weight} кг` : ""}
                      {c.weight && c.volume ? " / " : ""}
                      {c.volume ? `${c.volume} м³` : ""}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="text-xs font-medium">
                        {TRANSPORT_LABELS[c.transport_type] ?? c.transport_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {c.total_cost > 0 ? `$${c.total_cost.toLocaleString()} ${c.currency}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400 whitespace-nowrap">
                      {fmtDate(c.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
