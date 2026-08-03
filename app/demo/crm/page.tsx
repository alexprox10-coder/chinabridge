import Link from "next/link";

const LEADS = [
  {
    id: "L-2024-001",
    name: "Иван Петров",
    company: "ИП Петров И.В.",
    product: "Поставка мебели из Китая (Loft-стиль)",
    source: "Сайт",
    manager: "Алексей К.",
    status: "NEGOTIATION",
    amount: 485000,
    created: "28.07.2026",
  },
  {
    id: "L-2024-002",
    name: "Компания Альфа",
    company: "ООО Альфа Трейд",
    product: "1688 закупка — автозапчасти (300 SKU)",
    source: "Реклама",
    manager: "Мария С.",
    status: "PROPOSAL_SENT",
    amount: 1200000,
    created: "26.07.2026",
  },
  {
    id: "L-2024-003",
    name: "Дмитрий Захаров",
    company: "ООО ТехноИмпорт",
    product: "Электрические скутеры 1 000 шт.",
    source: "Telegram",
    manager: "Алексей К.",
    status: "ACTIVE",
    amount: 2200000,
    created: "22.07.2026",
  },
  {
    id: "L-2024-004",
    name: "Оксана Белова",
    company: "ИП Белова О.Н.",
    product: "Одежда из Гуанчжоу (200 позиций)",
    source: "Рекомендация",
    manager: "Мария С.",
    status: "NEW",
    amount: 320000,
    created: "01.08.2026",
  },
  {
    id: "L-2024-005",
    name: "Строй Комплект",
    company: "ООО Строй Комплект",
    product: "Строительный инструмент (контейнер)",
    source: "Сайт",
    manager: "Алексей К.",
    status: "COMPLETED",
    amount: 3800000,
    created: "10.07.2026",
  },
];

const STATUS_LABELS: Record<string, string> = {
  NEW: "Новый",
  NEGOTIATION: "Переговоры",
  PROPOSAL_SENT: "Расчёт отправлен",
  ACTIVE: "В работе",
  COMPLETED: "Выполнен",
};

const STATUS_STYLES: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-700 border-blue-200",
  NEGOTIATION: "bg-purple-50 text-purple-700 border-purple-200",
  PROPOSAL_SENT: "bg-orange-50 text-orange-700 border-orange-200",
  ACTIVE: "bg-green-50 text-green-700 border-green-200",
  COMPLETED: "bg-slate-50 text-slate-600 border-slate-200",
};

const PIPELINE = [
  { stage: "Новые", count: 1, amount: "320 000 ₽", color: "bg-blue-500" },
  { stage: "Переговоры", count: 1, amount: "485 000 ₽", color: "bg-purple-500" },
  { stage: "Расчёт отправлен", count: 1, amount: "1 200 000 ₽", color: "bg-orange-500" },
  { stage: "В работе", count: 1, amount: "2 200 000 ₽", color: "bg-green-500" },
  { stage: "Выполнены", count: 1, amount: "3 800 000 ₽", color: "bg-slate-400" },
];

export default function DemoCRM() {
  const totalRevenue = LEADS.filter(l => l.status === "COMPLETED").reduce((s, l) => s + l.amount, 0);
  const inWork = LEADS.filter(l => l.status === "ACTIVE" || l.status === "NEGOTIATION").length;
  const conversion = 20; // %

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">CRM и сделки</h1>
        <p className="text-slate-500 text-sm mt-1">Демо-данные компании ООО Восток Импорт</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Всего лидов", value: LEADS.length, icon: "👥", color: "slate" },
          { label: "В работе", value: inWork, icon: "⚙️", color: "green", accent: true },
          { label: "Выполнено сделок", value: "3 800 000 ₽", icon: "✅", color: "teal" },
          { label: "Конверсия", value: `${conversion}%`, icon: "📈", color: "purple" },
        ].map((s, i) => (
          <div key={i} className={`bg-white border rounded-xl p-4 shadow-sm ${s.accent ? "border-green-200" : "border-slate-200"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">{s.label}</span>
              <span className="text-xl">{s.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${s.accent ? "text-green-600" : "text-slate-900"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Воронка продаж</h2>
        <div className="space-y-3">
          {PIPELINE.map((p, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-36 text-xs text-slate-500 font-medium text-right shrink-0">{p.stage}</div>
              <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden">
                <div
                  className={`h-full rounded-lg flex items-center px-3 ${p.color}`}
                  style={{ width: `${(5 - i) * 20}%` }}
                >
                  <span className="text-white text-xs font-semibold">{p.count} сд.</span>
                </div>
              </div>
              <div className="w-32 text-xs font-semibold text-slate-700 shrink-0">{p.amount}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Managers KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { name: "Алексей К.", leads: 3, revenue: "6 485 000 ₽", conversion: "25%", badge: "Топ менеджер 🏆" },
          { name: "Мария С.", leads: 2, revenue: "1 520 000 ₽", conversion: "15%", badge: "" },
        ].map((m, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 border border-green-200 flex items-center justify-center text-lg">👤</div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{m.name}</p>
                {m.badge && <p className="text-xs text-amber-600 font-medium">{m.badge}</p>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xl font-bold text-slate-900">{m.leads}</p>
                <p className="text-xs text-slate-500">Лидов</p>
              </div>
              <div>
                <p className="text-sm font-bold text-green-600">{m.revenue}</p>
                <p className="text-xs text-slate-500">Выручка</p>
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{m.conversion}</p>
                <p className="text-xs text-slate-500">Конверсия</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Leads table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Все лиды</h2>
          <button className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg">+ Новый лид</button>
        </div>
        <div className="divide-y divide-slate-100">
          {LEADS.map((lead) => (
            <div key={lead.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-slate-800">{lead.name}</p>
                    <span className="text-xs text-slate-400">·</span>
                    <p className="text-xs text-slate-500">{lead.company}</p>
                  </div>
                  <p className="text-xs text-slate-500 mb-1">{lead.product}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>📅 {lead.created}</span>
                    <span>👤 {lead.manager}</span>
                    <span>📣 {lead.source}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLES[lead.status]}`}>
                    {STATUS_LABELS[lead.status]}
                  </span>
                  <span className="text-sm font-bold text-slate-800">{lead.amount.toLocaleString("ru-RU")} ₽</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center py-4">
        <Link href="/platform#demo-form" className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors text-sm">
          Получить такую CRM для своего бизнеса →
        </Link>
      </div>
    </div>
  );
}
