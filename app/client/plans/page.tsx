"use client";

import Link from "next/link";

const PLANS = [
  {
    id: "free",
    name: "Бесплатный",
    price: "0 ₽",
    period: "",
    description: "3 расчёта в день без регистрации",
    features: [
      "3 расчёта в день бесплатно",
      "Маржа, ROI и прибыль/шт",
      "Все маркетплейсы: WB, Ozon, Kaspi, ЯМ",
    ],
    cta: null,
    current: true,
    highlight: false,
  },
  {
    id: "starter",
    name: "Стартовый",
    price: "Бесплатно",
    period: "после регистрации",
    description: "3 дополнительных расчёта",
    features: [
      "3 бесплатных расчёта после регистрации",
      "Все маркетплейсы: WB, Ozon, Kaspi, ЯМ",
      "AI-анализ с GPT-4o",
      "Разбивка по сценариям (осторожный / базовый / оптимистичный)",
      "P&L таблица с тарифами",
    ],
    cta: { label: "Активировать", href: "/ai-calculator" },
    current: false,
    highlight: false,
  },
  {
    id: "pro",
    name: "Про",
    price: "по запросу",
    period: "",
    description: "Безлимитный доступ для бизнеса",
    features: [
      "Безлимитные расчёты",
      "Все маркетплейсы",
      "AI-анализ ссылок с 1688 / Alibaba",
      "Приоритетная поддержка",
      "Выгрузка результатов",
    ],
    cta: { label: "Написать менеджеру", href: "https://t.me/ChinaBridgeLID_bot" },
    current: false,
    highlight: true,
  },
];

export default function PlansPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Тарифы</h1>
        <p className="text-slate-500 mt-1">Выберите подходящий план для работы с AI-калькулятором</p>
      </div>

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
            {plan.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                Рекомендуем
              </span>
            )}
            {plan.current && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-400 text-white text-xs font-bold px-3 py-1 rounded-full">
                Текущий план
              </span>
            )}

            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900">{plan.name}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{plan.description}</p>
            </div>

            <div className="mb-5">
              <span className="text-2xl font-bold text-slate-900">{plan.price}</span>
              {plan.period && (
                <span className="text-sm text-slate-500 ml-1">{plan.period}</span>
              )}
            </div>

            <ul className="flex flex-col gap-2 mb-6 flex-1">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            {plan.cta ? (
              plan.cta.href.startsWith("http") ? (
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
              ) : (
                <Link
                  href={plan.cta.href}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold text-center transition-colors ${
                    plan.highlight
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {plan.cta.label}
                </Link>
              )
            ) : (
              <div className="w-full py-2.5 rounded-xl text-sm font-semibold text-center bg-slate-50 text-slate-400 cursor-default">
                Активен
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-700 mb-1">Нужен индивидуальный тариф?</p>
        <p className="text-sm text-slate-500 mb-3">
          Если вы анализируете более 50 товаров в месяц — свяжитесь с менеджером для расчёта корпоративного плана.
        </p>
        <a
          href="https://t.me/ChinaBridgeLID_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-700"
        >
          Написать менеджеру →
        </a>
      </div>
    </div>
  );
}
