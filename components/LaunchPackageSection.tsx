"use client";
import Link from "next/link";
import { trackGAEvent } from "@/lib/analytics/ga";

const STEPS = [
  { icon: "🔍", title: "Поставщик", desc: "Находим 3–5 проверенных фабрик по вашему товару. Переговоры и лучшая цена — наша задача." },
  { icon: "🏭", title: "Инспекция", desc: "Представитель в Китае проверяет качество до отправки. Фото, видео, акт проверки." },
  { icon: "🚢", title: "Доставка", desc: "Еженедельные рейсы Китай → Москва / СПб / Казахстан. 10–18 дней, застраховано." },
  { icon: "🏛️", title: "Таможня", desc: "Полное таможенное оформление. Все документы для WB, Ozon, Kaspi — под ключ." },
  { icon: "📦", title: "FBW / FBO", desc: "Маркировка, упаковка по требованиям МП и отгрузка на склад маркетплейса." },
  { icon: "📊", title: "AI-анализ", desc: "Рассчитываем маржу до закупки. Не берём товар, который не проходит по экономике." },
];

const PACKAGES = [
  {
    name: "Старт",
    tag: null,
    price: "от 15 000 ₽",
    priceNote: "за партию",
    desc: "Первая закупка с нуля. Помогаем выбрать товар и проверить нишу.",
    items: [
      "AI-анализ маржи (до 5 товаров)",
      "Поиск поставщика в Китае",
      "Доставка и таможня под ключ",
      "Отгрузка на склад FBW/FBO",
      "Сопровождение менеджера",
    ],
    cta: "Начать с нуля",
    href: "/free",
    highlight: false,
  },
  {
    name: "Масштаб",
    tag: "Популярный",
    price: "от 25 000 ₽",
    priceNote: "за партию",
    desc: "Для тех, кто уже продаёт и хочет расширить ассортимент или найти замену поставщику.",
    items: [
      "AI-анализ маржи (без лимита)",
      "Проверка фабрики + инспекция",
      "Приоритетная обработка груза",
      "Пересчёт экономики при изменении цены",
      "Личный менеджер на весь цикл",
      "Консультация по рекламе на МП",
    ],
    cta: "Запустить партию",
    href: "/free",
    highlight: true,
  },
  {
    name: "Партнёр",
    tag: null,
    price: "Индивидуально",
    priceNote: "от 3 партий/мес",
    desc: "Регулярные закупки, выделенная команда, приоритетные тарифы.",
    items: [
      "Выделенный менеджер в Китае",
      "Фиксированная ставка по тарифу",
      "Склад консолидации в Китае",
      "Финансовая отчётность по партиям",
      "SLA 24 ч на запросы",
    ],
    cta: "Обсудить условия",
    href: "/free",
    highlight: false,
  },
];

export default function LaunchPackageSection() {
  return (
    <section id="launch-package" className="py-24 bg-[#060f1e] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[#00A86B]/4 blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-[#00A86B] text-xs font-semibold uppercase tracking-widest mb-3">Запуск на маркетплейс</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
            Ваш товар на WB и Ozon —<br className="hidden sm:block"/>
            <span className="bg-gradient-to-r from-[#00A86B] to-[#00d48a] bg-clip-text text-transparent"> от поставщика до полки</span>
          </h2>
          <p className="text-[#8899aa] max-w-xl mx-auto text-sm leading-relaxed">
            Не продаём доставку. Доставляем результат: товар на складе маркетплейса с готовыми документами и рассчитанной маржой.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-20">
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative group">
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-[#00A86B]/30 to-transparent z-10 -translate-y-1/2" style={{ width: "calc(100% - 2rem)" }} />
              )}
              <div className="card-glass rounded-2xl p-4 h-full flex flex-col gap-2 hover:border-[#00A86B]/40 transition-colors border border-[#243a5e]">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{step.icon}</span>
                  <span className="text-[10px] font-bold text-[#00A86B] uppercase tracking-wider">0{i + 1}</span>
                </div>
                <p className="text-white text-sm font-semibold">{step.title}</p>
                <p className="text-[#8899aa] text-[11px] leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Packages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PACKAGES.map((pkg) => (
            <div key={pkg.name}
              className={`relative rounded-2xl p-6 flex flex-col gap-5 border transition-all ${
                pkg.highlight
                  ? "border-[#00A86B]/60 bg-gradient-to-b from-[#00A86B]/10 to-[#0B1F3A]/80 shadow-[0_0_40px_rgba(0,168,107,0.15)]"
                  : "border-[#243a5e] bg-[#0B1F3A]/60 hover:border-[#243a5e]/80"
              }`}
            >
              {pkg.tag && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00A86B] text-white text-[11px] font-bold px-4 py-1 rounded-full whitespace-nowrap">
                  {pkg.tag}
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-[#8899aa] uppercase tracking-widest mb-1">{pkg.name}</p>
                <p className="text-2xl font-bold text-white">{pkg.price}</p>
                <p className="text-xs text-[#8899aa]">{pkg.priceNote}</p>
              </div>

              <p className="text-sm text-[#8899aa] leading-relaxed">{pkg.desc}</p>

              <ul className="flex flex-col gap-2 flex-1">
                {pkg.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <span className="text-[#00A86B] mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-[#ccd9e0]">{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={pkg.href}
                onClick={() => trackGAEvent("package_cta_click", { package: pkg.name })}
                className={`w-full py-3 rounded-xl font-semibold text-sm text-center transition-all ${
                  pkg.highlight
                    ? "bg-[#00A86B] hover:bg-[#008f59] text-white"
                    : "border border-[#243a5e] hover:border-[#00A86B]/50 text-white hover:bg-white/5"
                }`}
              >
                {pkg.cta} →
              </Link>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-14 rounded-2xl border border-[#243a5e] bg-[#0B1F3A]/40 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-white font-bold text-lg mb-1">Не знаете, какой товар брать?</p>
            <p className="text-[#8899aa] text-sm">Вставьте ссылку с 1688 — AI-калькулятор покажет маржу, ROI и риски за 15 секунд</p>
          </div>
          <Link
            href="/ai-calculator"
            onClick={() => trackGAEvent("package_calc_click")}
            className="shrink-0 flex items-center gap-2 px-6 py-3 bg-[#00A86B] hover:bg-[#008f59] text-white font-semibold rounded-xl transition-all text-sm whitespace-nowrap"
          >
            🤖 Рассчитать маржу бесплатно
          </Link>
        </div>
      </div>
    </section>
  );
}
