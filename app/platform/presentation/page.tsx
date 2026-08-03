import PrintButton from "./PrintButton";

export const metadata = {
  title: "ChinaBridge Platform — Презентация для партнёров",
  description: "Готовая платформа управления импортом из Китая. White Label от 99 000 ₽/мес.",
};

const PROBLEMS = [
  { num: "01", text: "Лиды теряются в мессенджерах — нет единой CRM для импортного бизнеса" },
  { num: "02", text: "Клиент не видит статус своего груза и постоянно звонит менеджеру" },
  { num: "03", text: "Документы хранятся хаотично — договора, инвойсы, ГТД разбросаны по папкам" },
  { num: "04", text: "Нет прозрачной аналитики: непонятно, сколько стоит привлечение клиента" },
  { num: "05", text: "Китайские партнёры не понимают статус заказа — нужен двуязычный интерфейс" },
];

const FEATURES = [
  { icon: "👥", title: "CRM для импорта", desc: "Лиды, воронка, KPI менеджеров. Заточено под специфику ВЭД-бизнеса." },
  { icon: "📦", title: "Кабинет клиента", desc: "Клиент видит статус груза в реальном времени. 7 этапов импорта." },
  { icon: "🧮", title: "Калькулятор себестоимости", desc: "Автоматический расчёт: товар + логистика + таможня + комиссии." },
  { icon: "📊", title: "Финансовый модуль", desc: "Выручка, расходы, прибыль по каждой поставке. Экспорт в Excel." },
  { icon: "📄", title: "Документооборот", desc: "КП, договора, инвойсы, ГТД в одном месте. Уведомления о готовности." },
  { icon: "🇨🇳", title: "Кабинет партнёра", desc: "Интерфейс на русском и китайском для поставщиков из Китая." },
];

const AUDIENCE = [
  { icon: "🚢", title: "Карго-компании", desc: "Управление потоком клиентов и грузов в одной системе" },
  { icon: "📋", title: "ВЭД-операторы", desc: "CRM + документооборот + клиентский кабинет под одним брендом" },
  { icon: "🏭", title: "Логистические компании", desc: "Белый лейбл: ваш бренд, ваши клиенты, наша платформа" },
  { icon: "🏢", title: "Торговые дома", desc: "Прозрачный сервис для корпоративных клиентов-импортёров" },
];

const FORMATS = [
  {
    title: "White Label",
    price: "от 99 000 ₽/мес",
    desc: "Платформа под вашим брендом. Запуск за 3 дня. Техподдержка включена.",
    items: ["Ваш логотип и домен", "CRM + кабинет клиента", "Калькулятор и финансы", "Документооборот", "Кабинет партнёра 🇨🇳", "Техподдержка 24/7"],
    accent: false,
  },
  {
    title: "Внедрение",
    price: "от 700 000 ₽",
    desc: "Доработка под ваши процессы. Интеграции с 1С, AmoCRM, Telegram-ботом.",
    items: ["Всё из White Label", "Кастомные интеграции", "Обучение команды", "Персональный менеджер", "SLA 99.9%", "Аналитика и BI-отчёты"],
    accent: true,
  },
  {
    title: "Полная адаптация",
    price: "Индивидуально",
    desc: "Платформа с нуля под ваш бизнес. Уникальный функционал и дизайн.",
    items: ["Всё из Внедрения", "Уникальный дизайн-систем", "Собственные алгоритмы", "Выделенная команда", "Исходный код", "Стратегическое сопровождение"],
    accent: false,
  },
];

const WHY = [
  { icon: "⚡", title: "Запуск за 3 дня", desc: "Готовая платформа — не разработка с нуля. Настройка + ваш бренд." },
  { icon: "🔒", title: "Белый импорт", desc: "Все сделки легальны. Документы, сертификаты, ГТД в порядке." },
  { icon: "🌐", title: "Двуязычный", desc: "RU + CN интерфейс. Ваши китайские поставщики работают в системе." },
  { icon: "📈", title: "Масштабируется", desc: "SaaS-архитектура: 10 или 10 000 клиентов — одна платформа." },
];

export default function PlatformPresentation() {
  return (
    <div className="min-h-screen bg-white print:bg-white">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .page-break { page-break-after: always; }
          body { font-size: 11pt; }
        }
        @page { margin: 1.5cm; size: A4; }
      `}</style>

      {/* Print button */}
      <div className="no-print bg-slate-800 text-white py-3 px-6 flex items-center justify-between">
        <span className="text-sm font-medium">📊 Презентация ChinaBridge Platform</span>
        <div className="flex gap-3">
          <a href="/demo" className="px-4 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg">
            Смотреть демо
          </a>
          <PrintButton />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-12 space-y-0">

        {/* SLIDE 1 — COVER */}
        <div className="page-break min-h-screen flex flex-col justify-center py-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full mb-8">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-700 text-sm font-semibold">Коммерческое предложение · 2026</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 mb-4 leading-tight">
              China<span className="text-green-600">Bridge</span> Platform
            </h1>
            <p className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto">
              Готовая платформа управления импортом из Китая.<br />
              White Label под вашим брендом — за 3 дня.
            </p>
            <div className="grid grid-cols-3 gap-6 max-w-xl mx-auto">
              {[
                { v: "3 дня", l: "запуск" },
                { v: "99 000 ₽", l: "от / месяц" },
                { v: "6 модулей", l: "в платформе" },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <p className="text-3xl font-black text-green-600">{s.v}</p>
                  <p className="text-sm text-slate-500">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SLIDE 2 — PROBLEM */}
        <div className="page-break py-16">
          <div className="mb-10">
            <span className="text-xs font-bold text-green-600 uppercase tracking-widest">Проблема</span>
            <h2 className="text-3xl font-black text-slate-900 mt-2">Ваши клиенты теряются в хаосе</h2>
            <p className="text-slate-500 mt-2">Типичные боли карго и ВЭД-компаний, которые работают без платформы</p>
          </div>
          <div className="space-y-4">
            {PROBLEMS.map((p, i) => (
              <div key={i} className="flex items-start gap-4 p-5 bg-red-50 border border-red-100 rounded-2xl">
                <span className="text-red-300 font-black text-2xl leading-none shrink-0">{p.num}</span>
                <p className="text-slate-700 font-medium">{p.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SLIDE 3 — SOLUTION */}
        <div className="page-break py-16">
          <div className="mb-10">
            <span className="text-xs font-bold text-green-600 uppercase tracking-widest">Решение</span>
            <h2 className="text-3xl font-black text-slate-900 mt-2">6 модулей. Одна платформа.</h2>
            <p className="text-slate-500 mt-2">Всё необходимое для управления импортным бизнесом из Китая</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex gap-4 p-5 border border-slate-200 rounded-2xl">
                <span className="text-3xl shrink-0">{f.icon}</span>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">{f.title}</h3>
                  <p className="text-sm text-slate-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SLIDE 4 — CALCULATOR DEMO */}
        <div className="page-break py-16">
          <div className="mb-10">
            <span className="text-xs font-bold text-green-600 uppercase tracking-widest">Калькулятор</span>
            <h2 className="text-3xl font-black text-slate-900 mt-2">Пример расчёта для клиента</h2>
            <p className="text-slate-500 mt-2">1 000 шт. электрических скутеров × $15 = полная себестоимость</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-slate-700 mb-4">Структура расходов</h3>
                <div className="space-y-3">
                  {[
                    { l: "Стоимость товара (1 000 × $15)", v: "$15 000", pct: 76 },
                    { l: "Авиалогистика", v: "$2 200", pct: 11 },
                    { l: "Сертификация", v: "$800", pct: 4 },
                    { l: "Таможня (7%)", v: "$1 400", pct: 7 },
                    { l: "Комиссия (2%)", v: "$400", pct: 2 },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                      <span className="text-sm text-slate-600 flex-1">{r.l}</span>
                      <span className="text-sm font-semibold text-slate-800">{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-center justify-center bg-green-600 rounded-xl text-white p-6 text-center">
                <p className="text-green-200 text-sm mb-2">Полная стоимость партии</p>
                <p className="text-4xl font-black mb-1">$19 800</p>
                <p className="text-green-200 text-sm mb-4">≈ 1 811 700 ₽</p>
                <div className="border-t border-green-500 pt-4 w-full">
                  <p className="text-green-200 text-xs">Себестоимость единицы</p>
                  <p className="text-2xl font-black">$19.80</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SLIDE 5 — CLIENT CABINET */}
        <div className="page-break py-16">
          <div className="mb-10">
            <span className="text-xs font-bold text-green-600 uppercase tracking-widest">Кабинет клиента</span>
            <h2 className="text-3xl font-black text-slate-900 mt-2">Клиент видит всё в реальном времени</h2>
            <p className="text-slate-500 mt-2">7 этапов импорта с датами и уведомлениями</p>
          </div>
          <div className="space-y-2">
            {[
              { n: "01", l: "Поиск и проверка поставщика", d: "✓ Выполнен", done: true },
              { n: "02", l: "Проверка товара (инспекция)", d: "✓ Выполнен", done: true },
              { n: "03", l: "Безопасная оплата поставщику", d: "✓ Выполнен", done: true },
              { n: "04", l: "Сертификация", d: "⏳ В процессе", done: false, active: true },
              { n: "05", l: "Логистика из Китая", d: "01.09.2026", done: false },
              { n: "06", l: "Таможенное оформление", d: "12.09.2026", done: false },
              { n: "07", l: "Доставка до склада", d: "20.09.2026", done: false },
            ].map(s => (
              <div key={s.n} className={`flex items-center gap-4 p-3 rounded-xl border ${s.done ? "bg-green-50 border-green-200" : s.active ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${s.done ? "bg-green-500 text-white" : s.active ? "bg-amber-400 text-white" : "bg-slate-200 text-slate-400"}`}>
                  {s.done ? "✓" : s.n}
                </div>
                <span className={`text-sm font-medium flex-1 ${s.done ? "text-green-700" : s.active ? "text-amber-700" : "text-slate-500"}`}>{s.l}</span>
                <span className={`text-xs font-medium ${s.done ? "text-green-600" : s.active ? "text-amber-600" : "text-slate-400"}`}>{s.d}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SLIDE 6 — AUDIENCE */}
        <div className="page-break py-16">
          <div className="mb-10">
            <span className="text-xs font-bold text-green-600 uppercase tracking-widest">Для кого</span>
            <h2 className="text-3xl font-black text-slate-900 mt-2">Кому подходит платформа</h2>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {AUDIENCE.map((a, i) => (
              <div key={i} className="p-6 border border-slate-200 rounded-2xl">
                <span className="text-4xl block mb-3">{a.icon}</span>
                <h3 className="font-bold text-slate-800 text-lg mb-2">{a.title}</h3>
                <p className="text-slate-500 text-sm">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SLIDE 7 — WHY US */}
        <div className="page-break py-16">
          <div className="mb-10">
            <span className="text-xs font-bold text-green-600 uppercase tracking-widest">Преимущества</span>
            <h2 className="text-3xl font-black text-slate-900 mt-2">Почему ChinaBridge Platform</h2>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {WHY.map((w, i) => (
              <div key={i} className="flex gap-4 p-6 bg-slate-50 rounded-2xl">
                <span className="text-4xl shrink-0">{w.icon}</span>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">{w.title}</h3>
                  <p className="text-sm text-slate-500">{w.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SLIDE 8 — FORMATS */}
        <div className="page-break py-16">
          <div className="mb-10">
            <span className="text-xs font-bold text-green-600 uppercase tracking-widest">Форматы работы</span>
            <h2 className="text-3xl font-black text-slate-900 mt-2">Выберите подходящий вариант</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {FORMATS.map((f, i) => (
              <div key={i} className={`p-6 rounded-2xl border ${f.accent ? "bg-green-600 border-green-600 text-white" : "border-slate-200 bg-white"}`}>
                <h3 className={`font-black text-lg mb-1 ${f.accent ? "text-white" : "text-slate-800"}`}>{f.title}</h3>
                <p className={`text-xl font-bold mb-3 ${f.accent ? "text-green-200" : "text-green-600"}`}>{f.price}</p>
                <p className={`text-xs mb-4 ${f.accent ? "text-green-100" : "text-slate-500"}`}>{f.desc}</p>
                <ul className="space-y-1.5">
                  {f.items.map((item, j) => (
                    <li key={j} className={`flex items-start gap-2 text-xs ${f.accent ? "text-green-100" : "text-slate-600"}`}>
                      <span className={f.accent ? "text-green-300" : "text-green-500"}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* SLIDE 9 — CTA */}
        <div className="py-20 text-center">
          <div className="mb-8">
            <span className="text-xs font-bold text-green-600 uppercase tracking-widest">Следующий шаг</span>
            <h2 className="text-4xl font-black text-slate-900 mt-3 mb-4">Запустите платформу<br />за 3 дня</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              Покажем демо на вашем примере. Ответим на вопросы. Настроим пилот бесплатно.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center no-print">
            <a href="/platform#demo-form" className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition-colors">
              Запросить демонстрацию →
            </a>
            <a href="/demo" className="inline-flex items-center gap-2 px-8 py-4 border-2 border-slate-200 text-slate-700 font-bold rounded-2xl hover:border-green-300 transition-colors">
              Смотреть демо онлайн
            </a>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-6 max-w-md mx-auto">
            {[
              { l: "chinabridge.pro", v: "Сайт" },
              { l: "@ChinaBridgeLID_bot", v: "Telegram" },
              { l: "alexprox10@gmail.com", v: "Email" },
            ].map((c, i) => (
              <div key={i} className="text-center">
                <p className="text-xs text-slate-400 mb-1">{c.v}</p>
                <p className="text-xs font-semibold text-slate-700">{c.l}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
