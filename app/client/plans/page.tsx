"use client";

import Link from "next/link";
import { useState } from "react";

const PLANS = [
  {
    id: "guest",
    name: "Гость",
    badge: null,
    price: "3 расчёта",
    period: "бесплатно",
    description: "Без регистрации — сразу считайте",
    features: [
      "3 расчёта AI-калькулятора маржи",
      "Маржа, ROI и прибыль/шт",
      "Все маркетплейсы: WB, Ozon, Kaspi, ЯМ",
      "P&L таблица с тарифами маркетплейса",
      "3 сценария: осторожный / базовый / оптимистичный",
      "Калькулятор доставки — бесплатно",
      "Поиск товаров — бесплатно",
    ],
    limits: ["Лимит 3 расчёта (AI-калькулятор маржи)", "Без истории расчётов"],
    cta: { label: "Открыть калькулятор", href: "/ai-calculator", external: false, pay: false },
    current: false,
    highlight: false,
    color: "slate",
  },
  {
    id: "subscriber",
    name: "Подписчик",
    badge: null,
    price: "1 990 ₽",
    period: "в месяц",
    description: "Безлимитные расчёты маржи",
    features: [
      "Безлимитные расчёты AI-калькулятора",
      "Всё из тарифа Гость",
      "AI-анализ ссылок с 1688 / Alibaba",
      "История расчётов в кабинете",
      "Сохранение результатов",
      "Калькулятор доставки — бесплатно",
      "Поиск товаров — бесплатно",
    ],
    limits: [],
    cta: { label: "Подключить за 1 990 ₽/мес", href: "", external: false, pay: true },
    current: false,
    highlight: false,
    color: "green",
  },
  {
    id: "client",
    name: "Клиент ChinaBridge",
    badge: "Рекомендуем",
    price: "Безлимит",
    period: "при работе с нами",
    description: "Полный доступ + реальная закупка",
    features: [
      "Безлимитные расчёты — бесплатно",
      "Всё из тарифа Подписчик",
      "Реальные ставки карго (от $2.5/кг)",
      "Менеджер проверит расчёт и найдёт товар",
      "Полный цикл: закупка → доставка → таможня",
      "Приоритетная поддержка 24/7",
    ],
    limits: [],
    cta: { label: "Написать менеджеру", href: "https://t.me/ChinaBridgeLID_bot", external: true, pay: false },
    current: false,
    highlight: true,
    color: "green",
  },
];

const VS_COMPETITORS = [
  {
    feature: "Цена",
    competitors: "4 000 – 40 000 ₽/мес",
    chinabridge: "Бесплатно / 490 ₽/мес",
    win: true,
  },
  {
    feature: "Реальные ставки доставки из Китая",
    competitors: "Абстрактные %",
    chinabridge: "Реальные ставки карго ChinaBridge",
    win: true,
  },
  {
    feature: "AI-парсинг с 1688 / Alibaba",
    competitors: "Нет",
    chinabridge: "Есть",
    win: true,
  },
  {
    feature: "Связка расчёт → закупка",
    competitors: "Нет (только аналитика)",
    chinabridge: "Менеджер по результату расчёта",
    win: true,
  },
  {
    feature: "Аналитика чужих продаж / конкурентов",
    competitors: "Да (MPStats, Moneyplace и др.)",
    chinabridge: "Нет",
    win: false,
  },
];

export default function PlansPage() {
  const [paying, setPaying] = useState(false);

  async function handleSubscribe() {
    setPaying(true);
    try {
      const res = await fetch("/api/payments/calculator-subscribe", { method: "POST" });
      const data = await res.json();
      if (data.ok && data.paymentLink) {
        window.location.href = data.paymentLink;
      } else {
        alert("Не удалось создать ссылку на оплату. Попробуйте ещё раз.");
        setPaying(false);
      }
    } catch {
      alert("Ошибка. Попробуйте ещё раз.");
      setPaying(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Тарифы</h1>
        <p className="text-slate-500 mt-1">
          Калькулятор доставки и поиск товаров — бесплатно. AI-калькулятор маржи: 3 расчёта бесплатно, далее 1 990 ₽/мес без лимитов.
        </p>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map(plan => (
          <div
            key={plan.id}
            className={`relative rounded-2xl border p-6 flex flex-col ${
              plan.highlight
                ? "border-green-500 bg-green-50 shadow-lg shadow-green-100"
                : "border-slate-200 bg-white"
            }`}
          >
            {plan.badge && (
              <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${
                plan.highlight ? "bg-green-500" : "bg-slate-400"
              }`}>
                {plan.badge}
              </span>
            )}

            <div className="mb-3">
              <h2 className="text-base font-bold text-slate-900">{plan.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{plan.description}</p>
            </div>

            <div className="mb-4">
              <span className={`text-2xl font-bold ${plan.highlight ? "text-green-700" : "text-slate-900"}`}>
                {plan.price}
              </span>
              {plan.period && (
                <span className="text-xs text-slate-500 ml-1">{plan.period}</span>
              )}
            </div>

            <ul className="flex flex-col gap-1.5 mb-4 flex-1">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
              {plan.limits.map(l => (
                <li key={l} className="flex items-start gap-2 text-xs text-slate-400">
                  <span className="mt-0.5 flex-shrink-0">—</span>
                  {l}
                </li>
              ))}
            </ul>

            {plan.cta.external ? (
              <a
                href={plan.cta.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full py-2.5 rounded-xl text-sm font-semibold text-center transition-colors ${
                  plan.highlight
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {plan.cta.label}
              </a>
            ) : plan.cta.pay ? (
              <button
                onClick={handleSubscribe}
                disabled={paying}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-center transition-colors bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white"
              >
                {paying ? "Переходим к оплате..." : plan.cta.label}
              </button>
            ) : (
              <Link
                href={plan.cta.href}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-center transition-colors bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                {plan.cta.label}
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Free tools note */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 flex gap-3 items-start">
        <span className="text-blue-500 text-lg mt-0.5">ℹ️</span>
        <div>
          <p className="text-sm font-semibold text-slate-800">Что бесплатно всегда</p>
          <p className="text-sm text-slate-600 mt-1">
            <strong>Калькулятор доставки</strong> и <strong>Поиск товаров</strong> — без ограничений и без регистрации.
            Платная подписка (1 990 ₽/мес) распространяется только на AI-калькулятор юнит-экономики после первых 3 расчётов.
          </p>
        </div>
      </div>

      {/* VS Competitors */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Чем мы отличаемся от конкурентов</h2>
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <span>Параметр</span>
            <span>MPStats / Moneyplace / MarketGuru</span>
            <span className="text-green-700">ChinaBridge</span>
          </div>
          {VS_COMPETITORS.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-3 px-4 py-3 text-sm border-b border-slate-100 last:border-0 ${
                i % 2 === 0 ? "bg-white" : "bg-slate-50/50"
              }`}
            >
              <span className="text-slate-700 font-medium">{row.feature}</span>
              <span className="text-slate-500">{row.competitors}</span>
              <span className={row.win ? "text-green-600 font-medium" : "text-slate-400"}>
                {row.win ? "✓ " : ""}{row.chinabridge}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-2">
          * Конкуренты (MPStats, Moneyplace, MarketGuru, Sellmonitor) — платформы аналитики рынка, от 4 000 до 40 000 ₽/мес. Чистые калькуляторы юнит-экономики (Wildbox, logidex) — бесплатные.
        </p>
      </div>

      {/* CTA block */}
      <div className="rounded-xl border border-green-200 bg-green-50 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-800">Нашли прибыльный товар?</p>
          <p className="text-sm text-slate-600 mt-0.5">
            Менеджер проверит ваш расчёт, найдёт поставщика на 1688 и рассчитает реальную стоимость закупки и доставки.
          </p>
        </div>
        <a
          href="https://t.me/ChinaBridgeLID_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition-colors text-center"
        >
          Написать менеджеру →
        </a>
      </div>

    </div>
  );
}
