"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Users, Calculator, FileText, BarChart3, Globe,
  CheckCircle2, ArrowRight, Building2, Truck, Package, ChevronDown,
  ShieldCheck, Zap, LayoutDashboard, CreditCard, MessageSquare,
} from "lucide-react";

const GREEN = "#00A86B";
const GOLD = "#C9A84C";

const PROBLEMS = [
  { icon: "📊", text: "Расчёты в Excel — ошибки и потеря времени" },
  { icon: "💬", text: "Учёт сделок в Telegram и блокнотах" },
  { icon: "📞", text: "Клиенты не знают статус своего груза" },
  { icon: "📄", text: "Документы создаются вручную часами" },
  { icon: "❓", text: "Нет прозрачности — партнёры и клиенты недовольны" },
];

const FEATURES = [
  { icon: Users, title: "CRM и сделки", desc: "Лиды, воронка продаж, KPI менеджеров. Вся история клиента в одном месте." },
  { icon: Calculator, title: "AI-Калькулятор", desc: "Расчёт себестоимости, таможни, сертификации за 30 секунд. С автоматическим КП." },
  { icon: LayoutDashboard, title: "Кабинет клиента", desc: "Клиент видит статус груза, документы, фото, счета — без звонков менеджеру." },
  { icon: FileText, title: "Автодокументы", desc: "КП, договор, инвойс, упаковочный лист — генерируются в PDF одной кнопкой." },
  { icon: BarChart3, title: "Финансовый контроль", desc: "Выручка, расходы, прибыль, комиссии. Отчёты в реальном времени." },
  { icon: Globe, title: "Кабинет партнёра", desc: "Китайские партнёры видят заявки на русском и китайском. Заполняют цены и фото прямо в системе." },
];

const AUDIENCE = [
  { icon: Truck, title: "Карго-компании", desc: "Замените Excel и Telegram на профессиональную платформу" },
  { icon: Globe, title: "ВЭД-операторы", desc: "CRM + документы + финансы в одной системе" },
  { icon: Building2, title: "Логистические компании", desc: "Личный кабинет для клиентов и партнёров" },
  { icon: Package, title: "Импортёры", desc: "Прозрачный контроль каждой поставки из Китая" },
];

const SAAS_PLANS = [
  { id: "trial",      name: "Trial",      price: 0,     period: "14 дней",  color: "#8899aa", popular: false, features: ["3 AI-отдела", "CRM", "Калькулятор", "до 3 пользователей", "до 100 лидов"] },
  { id: "starter",    name: "Starter",    price: 9900,  period: "/мес",     color: "#3b82f6", popular: false, features: ["5 AI-отделов", "Полный CRM", "Кабинет клиента", "до 5 пользователей", "до 500 лидов"] },
  { id: "pro",        name: "Pro",        price: 24900, period: "/мес",     color: GREEN,     popular: true,  features: ["7 AI-отделов", "CEO AI Command", "White Label", "до 20 пользователей", "до 5000 лидов"] },
  { id: "enterprise", name: "Enterprise", price: 59900, period: "/мес",     color: GOLD,      popular: false, features: ["Всё включено", "Кастомный домен", "API доступ", "SLA 99.9%", "Безлимит"] },
];

const FAQ = [
  { q: "Нужны ли технические знания?", a: "Нет. Регистрация и настройка занимают 10 минут. Мастер настройки проведёт вас по каждому шагу." },
  { q: "Что происходит после Trial?", a: "После 14 дней система переходит в режим чтения. Вы выбираете тариф и продолжаете работу без потери данных." },
  { q: "Могу я использовать свой домен?", a: "Да, начиная с тарифа Pro. Также доступны поддомены вида company.chinabridge.pro." },
  { q: "Как работает White Label?", a: "Ваш бренд, логотип и цвета — везде. Клиенты видят только вашу компанию." },
  { q: "Есть ли API?", a: "Да, на тарифе Enterprise. Полный REST API для интеграции с вашими системами." },
  { q: "Как перенести существующие данные?", a: "Мастер импорта поддерживает загрузку клиентской базы из Excel/CSV и JSON-бэкап от других систем." },
];

const FORMATS = [
  {
    name: "White Label",
    price: "от 99 000 ₽/мес",
    color: GREEN,
    items: [
      "Ваш бренд и домен",
      "Готовая платформа за 3 дня",
      "Техподдержка включена",
      "Обновления автоматически",
    ],
  },
  {
    name: "Внедрение",
    price: "от 700 000 ₽",
    color: GOLD,
    items: [
      "Полная установка под ключ",
      "Кастомизация под ваш бизнес",
      "Обучение сотрудников",
      "3 месяца поддержки",
    ],
    highlight: true,
  },
  {
    name: "Полная адаптация",
    price: "Индивидуально",
    color: "#8899aa",
    items: [
      "Уникальные доработки",
      "Интеграции с вашими системами",
      "Выделенная команда разработки",
      "SLA и приоритетная поддержка",
    ],
  },
];

export default function PlatformPage() {
  const [form, setForm] = useState({ name: "", company: "", contact: "", clients: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
    trackGA("platformCTAClick");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.contact) return;
    setLoading(true);
    trackGA("platformDemoRequest");
    try {
      await fetch("/api/platform/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } catch {}
    setSent(true);
    setLoading(false);
  }

  function trackGA(event: string) {
    if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).gtag) {
      ((window as unknown as Record<string, unknown>).gtag as (...args: unknown[]) => void)("event", event);
    }
  }

  return (
    <div className="min-h-screen bg-[#0B1F3A] text-white">

      {/* ── Nav ── */}
      <nav className="border-b border-[#243a5e] px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-bold text-xl">China<span style={{ color: GREEN }}>Bridge</span></span>
          <span className="text-xs px-2 py-0.5 rounded-full border font-semibold" style={{ borderColor: `${GOLD}50`, color: GOLD, background: `${GOLD}10` }}>Platform</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/demo" className="text-sm text-[#8899aa] hover:text-white transition-colors">Демо →</Link>
          <Link href="/signup" className="px-4 py-2 text-sm font-semibold rounded-xl border" style={{ borderColor: `${GREEN}40`, color: GREEN }}>Попробовать →</Link>
          <button
            onClick={scrollToForm}
            className="px-4 py-2 text-sm font-semibold rounded-xl text-[#0B1F3A]"
            style={{ background: GREEN }}
          >
            Демо
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="py-24 md:py-36 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full" style={{ background: `radial-gradient(ellipse, ${GREEN}12 0%, transparent 70%)` }} />
        </div>
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold mb-6" style={{ borderColor: `${GREEN}40`, color: GREEN, background: `${GREEN}10` }}>
            <Zap className="w-3 h-3" /> Готовая платформа за 3 дня
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Запустите собственную<br />
            <span style={{ color: GREEN }}>цифровую платформу</span><br />
            импорта из Китая
          </h1>
          <p className="text-[#8899aa] text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            CRM, калькулятор, кабинет клиента, документы и контроль сделок — в одной системе. Под вашим брендом.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-[#0B1F3A] text-lg"
              style={{ background: GREEN }}
            >
              Попробовать бесплатно <ArrowRight className="w-5 h-5" />
            </Link>
            <button
              onClick={scrollToForm}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold border"
              style={{ borderColor: `${GREEN}40`, color: GREEN }}
            >
              Запросить демо →
            </button>
          </div>
          <p className="text-[#8899aa] text-sm mt-4">14 дней бесплатно · Без карты · Запуск за 2 минуты</p>
        </div>
      </section>

      {/* ── Problem ── */}
      <section className="py-20 px-6 border-t border-[#243a5e]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: GOLD }}>Проблема рынка</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Карго-компании теряют клиентов из-за</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {PROBLEMS.map((p, i) => (
              <div key={i} className="card-glass rounded-2xl p-5 flex items-start gap-3">
                <span className="text-2xl">{p.icon}</span>
                <p className="text-[#8899aa] text-sm leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 card-glass rounded-2xl p-6 border-l-4 text-center" style={{ borderColor: GREEN }}>
            <p className="text-lg font-semibold">
              Пока конкуренты теряют клиентов на ручных операциях —{" "}
              <span style={{ color: GREEN }}>вы автоматизируете весь процесс</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6 border-t border-[#243a5e]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: GREEN }}>Что внутри</p>
            <h2 className="text-3xl md:text-4xl font-bold">ChinaBridge Platform</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="card-glass rounded-2xl p-6 flex flex-col gap-3 hover:-translate-y-1 transition-transform duration-200">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${GREEN}15`, border: `1px solid ${GREEN}30` }}>
                  <f.icon className="w-5 h-5" style={{ color: GREEN }} />
                </div>
                <h3 className="font-semibold text-white">{f.title}</h3>
                <p className="text-[#8899aa] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Flow diagram ── */}
      <section className="py-16 px-6 border-t border-[#243a5e]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold">Единая система</h2>
          </div>
          <div className="flex flex-col items-center gap-3">
            {["Клиент", "CRM", "Китайский партнёр", "Финансы", "Документы"].map((step, i, arr) => (
              <div key={step} className="flex flex-col items-center">
                <div className="px-8 py-3 rounded-xl font-semibold text-sm" style={{ background: i === 0 || i === arr.length - 1 ? `${GOLD}20` : `${GREEN}15`, border: `1px solid ${i === 0 || i === arr.length - 1 ? GOLD : GREEN}30`, color: i === 0 || i === arr.length - 1 ? GOLD : GREEN }}>
                  {step}
                </div>
                {i < arr.length - 1 && <ChevronDown className="w-5 h-5 text-[#243a5e] my-1" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Audience ── */}
      <section className="py-20 px-6 border-t border-[#243a5e]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: GOLD }}>Кому подходит</p>
            <h2 className="text-3xl font-bold">Для любого бизнеса в сфере импорта</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {AUDIENCE.map((a, i) => (
              <div key={i} className="card-glass rounded-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: `${GREEN}15`, border: `1px solid ${GREEN}30` }}>
                  <a.icon className="w-6 h-6" style={{ color: GREEN }} />
                </div>
                <h3 className="font-semibold text-white mb-1">{a.title}</h3>
                <p className="text-[#8899aa] text-xs leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why us ── */}
      <section className="py-16 px-6 border-t border-[#243a5e]">
        <div className="max-w-3xl mx-auto card-glass rounded-2xl p-10 text-center" style={{ border: `1px solid ${GOLD}30` }}>
          <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: GOLD }}>Почему мы</p>
          <p className="text-xl md:text-2xl font-semibold leading-relaxed mb-4">
            Мы не просто разработчики.<br />
            <span style={{ color: GREEN }}>Мы создали систему для собственного импорта из Китая</span><br />
            и адаптировали её для других компаний.
          </p>
          <p className="text-[#8899aa]">Каждая функция — решение реальной проблемы, с которой мы столкнулись сами.</p>
        </div>
      </section>

      {/* ── Formats ── */}
      <section className="py-20 px-6 border-t border-[#243a5e]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: GREEN }}>Форматы сотрудничества</p>
            <h2 className="text-3xl font-bold">Выберите подходящий вариант</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FORMATS.map((f, i) => (
              <div
                key={i}
                className={`card-glass rounded-2xl p-7 flex flex-col ${f.highlight ? "ring-2" : ""}`}
                style={f.highlight ? { outline: `2px solid ${GREEN}50` } : {}}
              >
                {f.highlight && (
                  <div className="mb-3">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: `${GREEN}20`, color: GREEN }}>Популярный выбор</span>
                  </div>
                )}
                <h3 className="text-xl font-bold mb-1" style={{ color: f.color }}>{f.name}</h3>
                <p className="text-2xl font-bold text-white mb-6">{f.price}</p>
                <ul className="space-y-2 mb-8 flex-1">
                  {f.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-[#8899aa]">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: f.color }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={scrollToForm}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-colors"
                  style={{ background: f.highlight ? GREEN : "transparent", color: f.highlight ? "#0B1F3A" : f.color, border: f.highlight ? "none" : `1px solid ${f.color}40` }}
                >
                  Узнать подробнее
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SaaS Pricing ── */}
      <section className="py-20 px-6 border-t border-[#243a5e]" id="pricing">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: GREEN }}>Тарифы</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Простые и прозрачные цены</h2>
            <p className="text-[#8899aa]">14 дней бесплатно на любом тарифе · Без скрытых платежей</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SAAS_PLANS.map(plan => (
              <div key={plan.id}
                className={`card-glass rounded-2xl p-6 flex flex-col relative ${plan.popular ? "ring-2" : ""}`}
                style={plan.popular ? { outlineOffset: "2px", outline: `2px solid ${GREEN}60` } : {}}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-xs font-bold px-3 py-1 rounded-full text-[#0B1F3A]" style={{ background: GREEN }}>⭐ Популярный</span>
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="text-lg font-bold mb-1" style={{ color: plan.color }}>{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-white">{plan.price === 0 ? "0₽" : `${plan.price.toLocaleString("ru")}₽`}</span>
                    <span className="text-[#8899aa] text-sm">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[#8899aa]">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: plan.color }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup"
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-center block transition-colors"
                  style={plan.popular ? { background: GREEN, color: "#0B1F3A" } : { border: `1px solid ${plan.color}40`, color: plan.color }}>
                  {plan.id === "trial" ? "Начать бесплатно" : "Попробовать 14 дней"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-6 border-t border-[#243a5e]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: GOLD }}>FAQ</p>
            <h2 className="text-3xl font-bold">Часто задаваемые вопросы</h2>
          </div>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <details key={i} className="card-glass rounded-2xl overflow-hidden group">
                <summary className="px-6 py-4 cursor-pointer flex items-center justify-between text-white font-medium text-sm list-none">
                  {item.q}
                  <span className="text-[#8899aa] group-open:rotate-45 transition-transform duration-200 flex-shrink-0 ml-2">+</span>
                </summary>
                <div className="px-6 pb-4 text-[#8899aa] text-sm leading-relaxed">{item.a}</div>
              </details>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-[#0B1F3A] text-lg"
              style={{ background: GREEN }}>
              Попробовать бесплатно 14 дней <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Lead form ── */}
      <section ref={formRef} className="py-24 px-6 border-t border-[#243a5e]" id="demo-form">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: GREEN }}>Получить демо</p>
            <h2 className="text-3xl font-bold mb-3">Запросить персональную демонстрацию</h2>
            <p className="text-[#8899aa]">Покажем всё вживую — за 30 минут вы увидите полную работу платформы</p>
          </div>

          {sent ? (
            <div className="card-glass rounded-2xl p-10 text-center">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-xl font-bold mb-2">Заявка получена!</h3>
              <p className="text-[#8899aa]">Свяжемся в течение 2 часов для согласования времени демонстрации.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card-glass rounded-2xl p-8 flex flex-col gap-4">
              {[
                { field: "name", label: "Ваше имя *", placeholder: "Иван Петров" },
                { field: "company", label: "Компания", placeholder: "ООО Карго Логистик" },
                { field: "contact", label: "Телефон или Telegram *", placeholder: "+7 900 000 00 00 или @username" },
                { field: "clients", label: "Сколько клиентов в месяц", placeholder: "20–50 клиентов" },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="text-xs font-medium text-[#8899aa] block mb-1.5">{label}</label>
                  <input
                    type="text"
                    value={form[field as keyof typeof form]}
                    onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 bg-[#0B1F3A] border border-[#243a5e] rounded-xl text-sm text-white placeholder:text-[#8899aa] outline-none focus:border-[#00A86B]/60 transition-colors"
                  />
                </div>
              ))}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl font-semibold text-[#0B1F3A] text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: GREEN }}
              >
                {loading ? "Отправляем..." : <>Получить демонстрацию платформы <ArrowRight className="w-4 h-4" /></>}
              </button>
              <p className="text-xs text-[#8899aa] text-center">Нажимая, вы соглашаетесь с обработкой персональных данных</p>
            </form>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#243a5e] py-8 px-6 text-center">
        <p className="text-[#8899aa] text-sm">
          <Link href="https://chinabridge.pro" className="text-white font-semibold">chinabridge.pro</Link>
          {" "}· ChinaBridge Platform · Цифровая система управления импортом из Китая
        </p>
      </footer>
    </div>
  );
}
