import Link from "next/link";

const SECTIONS = [
  {
    href: "/demo/crm",
    icon: "👥",
    title: "CRM и сделки",
    desc: "Лиды, воронка, KPI менеджеров. Тестовые клиенты готовы.",
    color: "blue",
  },
  {
    href: "/demo/client",
    icon: "📦",
    title: "Кабинет клиента",
    desc: "ООО Восток Импорт · заказ электрических скутеров · все статусы.",
    color: "green",
  },
  {
    href: "/demo/calculator",
    icon: "🧮",
    title: "AI-Калькулятор",
    desc: "1 000 ед. × 15$ = полный расчёт себестоимости импорта.",
    color: "purple",
  },
  {
    href: "/demo/finance",
    icon: "📊",
    title: "Финансовый модуль",
    desc: "Выручка 2,5 млн ₽ · расходы · прибыль · отчёты.",
    color: "amber",
  },
  {
    href: "/demo/documents",
    icon: "📄",
    title: "Документы",
    desc: "КП, договор, инвойс, упаковочный лист — готовые образцы.",
    color: "teal",
  },
  {
    href: "/demo/partner",
    icon: "🤝",
    title: "Кабинет партнёра 🇨🇳",
    desc: "Интерфейс для китайского партнёра на русском и китайском.",
    color: "red",
  },
];

const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-50 border-blue-200 text-blue-700",
  green: "bg-green-50 border-green-200 text-green-700",
  purple: "bg-purple-50 border-purple-200 text-purple-700",
  amber: "bg-amber-50 border-amber-200 text-amber-700",
  teal: "bg-teal-50 border-teal-200 text-teal-700",
  red: "bg-red-50 border-red-200 text-red-700",
};

export default function DemoHome() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              ChinaBridge Platform — Демо
            </h1>
            <p className="text-slate-500 max-w-xl">
              Интерактивная демонстрация готовой платформы управления импортом из Китая.
              Все разделы содержат тестовые данные — вы видите реальную систему в действии.
            </p>
          </div>
          <Link
            href="/platform"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-xl transition-colors shrink-0"
          >
            Получить платформу →
          </Link>
        </div>

        {/* Demo company badge */}
        <div className="mt-6 flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-green-100 border border-green-200 flex items-center justify-center text-lg">
            🏢
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Демо-компания: ООО Восток Импорт</p>
            <p className="text-xs text-slate-500">Тестовый аккаунт · демо-данные · активные заказы</p>
          </div>
          <span className="ml-auto text-xs px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-medium border border-green-200">
            Активен
          </span>
        </div>
      </div>

      {/* Sections grid */}
      <div>
        <h2 className="text-base font-semibold text-slate-700 mb-4">Разделы демо</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group bg-white border border-slate-200 rounded-2xl p-6 hover:border-green-300 hover:shadow-md transition-all"
            >
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl mb-4 ${COLOR_MAP[s.color]}`}>
                {s.icon}
              </div>
              <h3 className="font-semibold text-slate-800 mb-1 group-hover:text-green-700 transition-colors">
                {s.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              <div className="mt-4 text-sm font-medium text-green-600 flex items-center gap-1">
                Смотреть демо <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA block */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 text-white text-center">
        <h2 className="text-xl font-bold mb-2">Понравилась система?</h2>
        <p className="text-green-100 mb-6 text-sm">
          Запустите платформу под вашим брендом за 3 дня. White Label от 99 000 ₽/мес.
        </p>
        <Link
          href="/platform#demo-form"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-green-700 font-semibold rounded-xl hover:bg-green-50 transition-colors"
        >
          Запросить демонстрацию
        </Link>
      </div>
    </div>
  );
}
