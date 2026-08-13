"use client";

import { useState } from "react";

const STEPS = [
  {
    n: "01", icon: "🏭", title: "Производство / закупка",
    desc: "Вы заказываете товар у поставщика в Китае через ChinaBridge. Мы проверяем фабрику, контролируем качество, выкупаем.",
  },
  {
    n: "02", icon: "🚢", title: "Доставка из Китая",
    desc: "Карго, авиа или ж/д — выбираем оптимальный маршрут. Таможенное оформление под ключ, все документы включены.",
  },
  {
    n: "03", icon: "📦", title: "Приёмка на склад фулфилмента",
    desc: "Товар поступает на склад в Москве или Алматы. Пересчёт, проверка на брак, фото/видеоотчёт — вы видите каждую единицу.",
  },
  {
    n: "04", icon: "🏷", title: "Упаковка и маркировка",
    desc: "Маркировка по стандартам WB / Ozon / Kaspi / ЯМ, нанесение Честного знака, запайка в БОПП-пакеты, формирование монокоробов.",
  },
  {
    n: "05", icon: "🚛", title: "Доставка на склад маркетплейса",
    desc: "Готовые паллеты отправляем на склад маркетплейса. Для WB — FBO-поставки на Атакент. Все накладные оформляем сами.",
  },
  {
    n: "06", icon: "📊", title: "Товар на полке — вы считаете прибыль",
    desc: "Ваш товар появляется в личном кабинете WB / Ozon / Kaspi. Вы отслеживаете продажи и планируете следующую партию.",
  },
];

const MARKETS = [
  { name: "Wildberries", icon: "🟣", color: "border-purple-600/40 bg-purple-900/10", text: "text-purple-300" },
  { name: "Ozon",        icon: "🔵", color: "border-blue-600/40 bg-blue-900/10",     text: "text-blue-300" },
  { name: "Kaspi",       icon: "🔴", color: "border-red-600/40 bg-red-900/10",       text: "text-red-300" },
  { name: "Яндекс Маркет", icon: "🟡", color: "border-yellow-600/40 bg-yellow-900/10", text: "text-yellow-300" },
];

const SERVICES = [
  { label: "Приёмка и проверка брака",    price: "от 400 ₽/поставка" },
  { label: "Сортировка",                  price: "от 1.6 ₽/ед" },
  { label: "Упаковка в БОПП-пакет",       price: "7.5 ₽/ед" },
  { label: "Маркировка стикером",         price: "8 ₽/ед" },
  { label: "Честный знак",                price: "11 ₽/ед" },
  { label: "Формирование короба для WB",  price: "230 ₽/короб" },
  { label: "Хранение",                    price: "по паллето-местам" },
  { label: "Доставка до склада WB",       price: "от 1 400 ₽/рейс" },
];

const WAREHOUSES = [
  {
    city: "Москва", flag: "🇷🇺",
    desc: "Приём с китайских терминалов, работа с WB / Ozon / Яндекс Маркет. Регулярные рейсы на Атакент.",
    color: "border-slate-600/50",
  },
  {
    city: "Алматы", flag: "🇰🇿",
    desc: "Фулфилмент для казахстанского рынка: Kaspi, Ozon KZ. Прямой приём грузов из Китая.",
    color: "border-[#00A86B]/40",
    badge: "Казахстан",
  },
];

export default function FulfilmentClient() {
  const [form, setForm]       = useState({ name: "", phone: "", product: "", market: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true); setError("");
    try {
      const res = await fetch("/api/fulfilment-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (d.ok) setSent(true);
      else setError("Ошибка отправки. Позвоните нам напрямую.");
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
    }
    setSending(false);
  }

  return (
    <main className="bg-slate-950 min-h-screen">

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00A86B]/8 via-transparent to-slate-950 pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00A86B]/10 border border-[#00A86B]/30 text-[#00A86B] text-sm font-medium mb-6">
            <span>📦</span> Фулфилмент для маркетплейсов
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-6">
            От фабрики в Китае —<br />
            <span className="text-[#00A86B]">до полки WB, Ozon и Kaspi</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10">
            Полная цепочка под ключ: закупка → доставка → склад → упаковка → маркировка → маркетплейс.
            Вы ничего не делаете руками — только считаете прибыль.
          </p>

          {/* Маркетплейсы */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {MARKETS.map(m => (
              <span key={m.name} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium ${m.color} ${m.text}`}>
                {m.icon} {m.name}
              </span>
            ))}
          </div>

          <a href="#form"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#00A86B] hover:bg-[#008f59] text-white rounded-2xl text-base font-bold transition shadow-lg shadow-[#00A86B]/20">
            Рассчитать стоимость →
          </a>
        </div>
      </section>

      {/* ══ СКЛАДЫ ════════════════════════════════════════════════════════════ */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-slate-500 text-xs uppercase tracking-widest mb-6 font-semibold">
            Склады фулфилмента
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {WAREHOUSES.map(w => (
              <div key={w.city} className={`bg-slate-900 border rounded-2xl p-6 ${w.color}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{w.flag}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-bold text-lg">{w.city}</h3>
                      {w.badge && (
                        <span className="text-xs px-2 py-0.5 bg-[#00A86B]/20 border border-[#00A86B]/40 text-[#00A86B] rounded-full">
                          {w.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ЦЕПОЧКА ШАГОВ ═════════════════════════════════════════════════════ */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-white text-center mb-3">
            Как работает цепочка
          </h2>
          <p className="text-slate-500 text-center text-sm mb-12">
            6 шагов от заказа в Китае до продажи на маркетплейсе
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {STEPS.map((s, i) => (
              <div key={s.n} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-4 right-4 text-slate-800 text-4xl font-black leading-none select-none">
                  {s.n}
                </div>
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="text-white font-bold text-sm mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-slate-700 text-lg z-10">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ УСЛУГИ И ЦЕНЫ ═════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 bg-slate-900/40">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-white text-center mb-3">
            Услуги и цены
          </h2>
          <p className="text-slate-500 text-center text-sm mb-10">
            Прозрачный прайс — платите только за то, что реально выполнено
          </p>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {SERVICES.map((s, i) => (
              <div key={s.label}
                className={`flex items-center justify-between px-6 py-4 ${i < SERVICES.length - 1 ? "border-b border-slate-800" : ""}`}>
                <span className="text-slate-300 text-sm">{s.label}</span>
                <span className="text-[#00A86B] font-bold text-sm">{s.price}</span>
              </div>
            ))}
          </div>
          <p className="text-slate-600 text-xs text-center mt-4">
            * Итоговая стоимость зависит от объёма, категории товара и маркетплейса. Точный расчёт — по заявке.
          </p>
        </div>
      </section>

      {/* ══ WHY CHINABRIDGE ═══════════════════════════════════════════════════ */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-black text-white text-center mb-10">
            Почему ChinaBridge + фулфилмент
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: "🔗", title: "Единое окно", desc: "От поставщика в Китае до маркетплейса — один менеджер, один договор, один контакт." },
              { icon: "🤖", title: "AI-подбор поставщика", desc: "Находим фабрику, проверяем, выкупаем. Не нужно самостоятельно работать с 1688 или Alibaba." },
              { icon: "📍", title: "Склад в Алматы", desc: "Для казахстанских продавцов — Kaspi и Ozon KZ без посредников через Россию." },
              { icon: "📋", title: "Документы под ключ", desc: "Таможня, сертификаты, Честный знак, накладные для маркетплейса — всё включено." },
              { icon: "📸", title: "Фото/видеоотчёт", desc: "Видите каждую партию до отправки: пересчёт, проверка брака, упаковка." },
              { icon: "💸", title: "Экономия 20–40%", desc: "Прямой импорт с фабрики вместо перекупщиков. Реальная маржа на маркетплейсе." },
            ].map(b => (
              <div key={b.title} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="text-2xl mb-3">{b.icon}</div>
                <h3 className="text-white font-semibold text-sm mb-2">{b.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ФОРМА ═════════════════════════════════════════════════════════════ */}
      <section id="form" className="py-20 px-4 bg-gradient-to-b from-slate-900/0 to-slate-900/60">
        <div className="max-w-xl mx-auto">
          <div className="bg-slate-900 border border-slate-700/50 rounded-3xl p-8">
            <h2 className="text-2xl font-black text-white text-center mb-2">
              Рассчитать фулфилмент
            </h2>
            <p className="text-slate-500 text-sm text-center mb-8">
              Оставьте заявку — менеджер свяжется в течение 2 часов и пришлёт расчёт
            </p>

            {sent ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✅</div>
                <p className="text-white font-bold text-lg mb-2">Заявка принята!</p>
                <p className="text-slate-400 text-sm">Менеджер свяжется с вами в течение 2 часов</p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="text-slate-400 text-xs mb-1.5 block">Ваше имя</label>
                  <input
                    required value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Иван Иванов"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-[#00A86B] transition"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1.5 block">Телефон / Telegram</label>
                  <input
                    required value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+7 (999) 000-00-00"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-[#00A86B] transition"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1.5 block">Товар / категория</label>
                  <input
                    value={form.product}
                    onChange={e => setForm(f => ({ ...f, product: e.target.value }))}
                    placeholder="Электроника, мебель, одежда..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-[#00A86B] transition"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1.5 block">Маркетплейс</label>
                  <select
                    value={form.market}
                    onChange={e => setForm(f => ({ ...f, market: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00A86B] transition">
                    <option value="">Выберите маркетплейс</option>
                    <option>Wildberries</option>
                    <option>Ozon</option>
                    <option>Kaspi</option>
                    <option>Яндекс Маркет</option>
                    <option>Несколько</option>
                  </select>
                </div>
                {error && (
                  <p className="text-red-400 text-xs text-center">{error}</p>
                )}
                <button type="submit" disabled={sending}
                  className="w-full py-4 bg-[#00A86B] hover:bg-[#008f59] disabled:opacity-50 text-white rounded-xl text-sm font-bold transition">
                  {sending ? "Отправляем..." : "Получить расчёт →"}
                </button>
                <p className="text-slate-600 text-xs text-center">
                  Нажимая кнопку, вы соглашаетесь с{" "}
                  <a href="/privacy" className="underline hover:text-slate-400">политикой конфиденциальности</a>
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

    </main>
  );
}
