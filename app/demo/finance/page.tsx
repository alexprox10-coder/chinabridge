import Link from "next/link";

const MONTHS = [
  { month: "Апр", revenue: 1800000, expenses: 1400000 },
  { month: "Май", revenue: 2100000, expenses: 1600000 },
  { month: "Июн", revenue: 1950000, expenses: 1500000 },
  { month: "Июл", revenue: 2500000, expenses: 1850000, current: true },
];

const TRANSACTIONS = [
  { date: "01.08.2026", desc: "Оплата товара — Электроскутеры", amount: -1372500, type: "expense", status: "PAID" },
  { date: "28.07.2026", desc: "Выручка — Заказ ООО ТехноИмпорт", amount: 2200000, type: "income", status: "RECEIVED" },
  { date: "25.07.2026", desc: "Логистика — Guanzhou → Moscow", amount: -201300, type: "expense", status: "PAID" },
  { date: "22.07.2026", desc: "Выручка — Строй Комплект (доп. услуги)", amount: 300000, type: "income", status: "RECEIVED" },
  { date: "20.07.2026", desc: "Таможенные сборы — партия #036", amount: -128100, type: "expense", status: "PAID" },
  { date: "15.07.2026", desc: "Выручка — ИП Петров (предоплата 50%)", amount: 242500, type: "income", status: "RECEIVED" },
];

const CATEGORIES = [
  { label: "Закупка товара", amount: 1372500, pct: 74, color: "bg-blue-500" },
  { label: "Логистика", amount: 201300, pct: 11, color: "bg-green-500" },
  { label: "Таможня", amount: 128100, pct: 7, color: "bg-orange-500" },
  { label: "Сертификация", amount: 73200, pct: 4, color: "bg-purple-500" },
  { label: "Прочие расходы", amount: 74900, pct: 4, color: "bg-slate-400" },
];

export default function DemoFinance() {
  const revenue = 2500000;
  const expenses = 1850000;
  const profit = revenue - expenses;
  const margin = ((profit / revenue) * 100).toFixed(0);

  const maxBar = Math.max(...MONTHS.map(m => m.revenue));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Финансовый модуль</h1>
        <p className="text-slate-500 text-sm mt-1">ООО Восток Импорт · Июль 2026</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Выручка", value: "2 500 000 ₽", icon: "📈", trend: "+19%", accent: false },
          { label: "Расходы", value: "1 850 000 ₽", icon: "📉", trend: "+16%", accent: false },
          { label: "Прибыль", value: `${profit.toLocaleString("ru-RU")} ₽`, icon: "💰", trend: "+32%", accent: true },
          { label: "Маржа", value: `${margin}%`, icon: "📊", trend: "", accent: false },
        ].map((s, i) => (
          <div key={i} className={`bg-white border rounded-xl p-4 shadow-sm ${s.accent ? "border-green-200" : "border-slate-200"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">{s.label}</span>
              <span className="text-lg">{s.icon}</span>
            </div>
            <p className={`text-xl font-bold ${s.accent ? "text-green-600" : "text-slate-900"}`}>{s.value}</p>
            {s.trend && <p className="text-xs text-green-600 mt-1">{s.trend} к прошлому месяцу</p>}
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800 mb-5">Динамика за 4 месяца</h2>
        <div className="flex items-end gap-4 h-44">
          {MONTHS.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex items-end gap-1.5" style={{ height: "120px" }}>
                <div
                  className={`flex-1 rounded-t-lg ${m.current ? "bg-green-500" : "bg-green-200"}`}
                  style={{ height: `${(m.revenue / maxBar) * 100}%` }}
                  title={`Выручка: ${m.revenue.toLocaleString("ru-RU")} ₽`}
                />
                <div
                  className={`flex-1 rounded-t-lg ${m.current ? "bg-slate-400" : "bg-slate-200"}`}
                  style={{ height: `${(m.expenses / maxBar) * 100}%` }}
                  title={`Расходы: ${m.expenses.toLocaleString("ru-RU")} ₽`}
                />
              </div>
              <span className={`text-xs font-medium ${m.current ? "text-green-700" : "text-slate-500"}`}>{m.month}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-5 mt-3">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-green-500" /><span className="text-xs text-slate-500">Выручка</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-slate-400" /><span className="text-xs text-slate-500">Расходы</span></div>
        </div>
      </div>

      {/* Expense categories */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Структура расходов</h2>
        <div className="space-y-3">
          {CATEGORIES.map((c, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-28 text-xs text-slate-500 text-right shrink-0">{c.label}</div>
              <div className="flex-1 h-7 bg-slate-100 rounded-lg overflow-hidden">
                <div className={`h-full rounded-lg flex items-center px-2 ${c.color}`} style={{ width: `${c.pct}%` }}>
                  <span className="text-white text-xs font-semibold">{c.pct}%</span>
                </div>
              </div>
              <div className="w-28 text-xs font-semibold text-slate-700 shrink-0 text-right">{c.amount.toLocaleString("ru-RU")} ₽</div>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Последние транзакции</h2>
          <button className="text-xs text-green-600 font-medium">Экспорт ↓</button>
        </div>
        <div className="divide-y divide-slate-100">
          {TRANSACTIONS.map((t, i) => (
            <div key={i} className="px-6 py-3.5 flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                t.type === "income" ? "bg-green-100 text-green-600" : "bg-red-50 text-red-500"
              }`}>
                {t.type === "income" ? "↑" : "↓"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{t.desc}</p>
                <p className="text-xs text-slate-400">{t.date}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold ${t.type === "income" ? "text-green-600" : "text-red-500"}`}>
                  {t.type === "income" ? "+" : ""}
                  {t.amount.toLocaleString("ru-RU")} ₽
                </p>
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                  t.status === "RECEIVED" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                }`}>
                  {t.status === "RECEIVED" ? "Получено" : "Оплачено"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center py-2">
        <Link href="/platform#demo-form" className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors text-sm">
          Получить финансовый модуль →
        </Link>
      </div>
    </div>
  );
}
