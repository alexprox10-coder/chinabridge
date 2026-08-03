import Link from "next/link";

const DOCS = [
  {
    id: "DOC-001",
    name: "Коммерческое предложение — Электроскутеры ES-Pro",
    type: "КП",
    format: "PDF",
    size: "245 KB",
    date: "15.07.2026",
    status: "APPROVED",
    order: "ORD-2024-038",
    icon: "📄",
    color: "blue",
  },
  {
    id: "DOC-002",
    name: "Договор поставки #038 (ООО Восток Импорт)",
    type: "Договор",
    format: "PDF",
    size: "128 KB",
    date: "20.07.2026",
    status: "SIGNED",
    order: "ORD-2024-038",
    icon: "📋",
    color: "green",
  },
  {
    id: "DOC-003",
    name: "Инвойс поставщика — Guangzhou EV Factory",
    type: "Инвойс",
    format: "PDF",
    size: "89 KB",
    date: "01.08.2026",
    status: "RECEIVED",
    order: "ORD-2024-038",
    icon: "💰",
    color: "amber",
  },
  {
    id: "DOC-004",
    name: "Упаковочный лист (Packing List) — 1 000 ед.",
    type: "Упак. лист",
    format: "XLSX",
    size: "45 KB",
    date: "01.08.2026",
    status: "RECEIVED",
    order: "ORD-2024-038",
    icon: "📦",
    color: "teal",
  },
  {
    id: "DOC-005",
    name: "Сертификат соответствия ГОСТ Р (в процессе)",
    type: "Сертификат",
    format: "PDF",
    size: "—",
    date: "10.08.2026 (ожид.)",
    status: "PENDING",
    order: "ORD-2024-038",
    icon: "🏅",
    color: "purple",
  },
  {
    id: "DOC-006",
    name: "ГТД (Грузовая таможенная декларация)",
    type: "ТД",
    format: "PDF",
    size: "—",
    date: "12.09.2026 (ожид.)",
    status: "PENDING",
    order: "ORD-2024-038",
    icon: "🛃",
    color: "orange",
  },
  {
    id: "DOC-007",
    name: "Договор поставки #036 — Строй Комплект",
    type: "Договор",
    format: "PDF",
    size: "132 KB",
    date: "05.07.2026",
    status: "SIGNED",
    order: "ORD-2024-036",
    icon: "📋",
    color: "green",
  },
];

const STATUS_LABEL: Record<string, string> = {
  APPROVED: "Согласован",
  SIGNED: "Подписан",
  RECEIVED: "Получен",
  PENDING: "Ожидается",
};

const STATUS_STYLE: Record<string, string> = {
  APPROVED: "bg-blue-50 text-blue-700 border-blue-200",
  SIGNED: "bg-green-50 text-green-700 border-green-200",
  RECEIVED: "bg-teal-50 text-teal-700 border-teal-200",
  PENDING: "bg-orange-50 text-orange-600 border-orange-200",
};

const TYPE_COLORS: Record<string, string> = {
  blue: "bg-blue-50 border-blue-200 text-blue-700",
  green: "bg-green-50 border-green-200 text-green-700",
  amber: "bg-amber-50 border-amber-200 text-amber-700",
  teal: "bg-teal-50 border-teal-200 text-teal-700",
  purple: "bg-purple-50 border-purple-200 text-purple-700",
  orange: "bg-orange-50 border-orange-200 text-orange-700",
};

const DOC_TYPES = ["Все", "КП", "Договор", "Инвойс", "Упак. лист", "Сертификат", "ТД"];

export default function DemoDocuments() {
  const ready = DOCS.filter(d => d.status !== "PENDING").length;
  const pending = DOCS.filter(d => d.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Документы</h1>
        <p className="text-slate-500 text-sm mt-1">ООО Восток Импорт · все заказы</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Всего документов", value: DOCS.length, icon: "📁" },
          { label: "Получены / готовы", value: ready, icon: "✅", accent: true },
          { label: "Ожидаются", value: pending, icon: "⏳" },
          { label: "Активных заказов", value: 2, icon: "📋" },
        ].map((s, i) => (
          <div key={i} className={`bg-white border rounded-xl p-4 shadow-sm ${s.accent ? "border-green-200" : "border-slate-200"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">{s.label}</span>
              <span className="text-xl">{s.icon}</span>
            </div>
            <p className={`text-3xl font-bold ${s.accent ? "text-green-600" : "text-slate-900"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Document flow */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Документооборот по заказу ORD-2024-038</h2>
        <div className="flex flex-wrap gap-2">
          {["КП", "→", "Договор", "→", "Инвойс", "→", "Упак. лист", "→", "Сертификат", "→", "ГТД"].map((item, i) => (
            item === "→" ? (
              <span key={i} className="text-slate-300 self-center font-bold">→</span>
            ) : (
              <div key={i} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                ["КП", "Договор", "Инвойс", "Упак. лист"].includes(item)
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-orange-50 border-orange-200 text-orange-600"
              }`}>
                {["КП", "Договор", "Инвойс", "Упак. лист"].includes(item) ? "✓ " : "⏳ "}{item}
              </div>
            )
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">Зелёный = получен, оранжевый = ожидается</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {DOC_TYPES.map((t, i) => (
          <button key={i} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            i === 0 ? "bg-green-600 text-white border-green-600" : "bg-white text-slate-600 border-slate-200 hover:border-green-300"
          }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Documents list */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Все документы</h2>
          <button className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg">+ Загрузить</button>
        </div>
        <div className="divide-y divide-slate-100">
          {DOCS.map((doc) => (
            <div key={doc.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xl shrink-0 ${TYPE_COLORS[doc.color]}`}>
                  {doc.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{doc.name}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                    <span>{doc.format}</span>
                    {doc.size !== "—" && <span>{doc.size}</span>}
                    <span>📅 {doc.date}</span>
                    <span className="hidden sm:block">Заказ: {doc.order}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLE[doc.status]}`}>
                    {STATUS_LABEL[doc.status]}
                  </span>
                  {doc.status !== "PENDING" && (
                    <button className="text-xs text-green-600 font-medium hover:text-green-700 hidden md:block">
                      ↓ Скачать
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center py-2">
        <Link href="/platform#demo-form" className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors text-sm">
          Получить модуль документооборота →
        </Link>
      </div>
    </div>
  );
}
