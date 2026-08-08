"use client";

interface Step {
  number: number;
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  done?: boolean;
}

const STEPS: Step[] = [
  {
    number: 1,
    icon: "👤",
    title: "Заполните профиль компании",
    description:
      "Укажите название компании, ИНН и контактные данные. Это ускорит оформление документов и подготовку договора.",
    action: { label: "Заполнить профиль", href: "/client/profile" },
  },
  {
    number: 2,
    icon: "📦",
    title: "Опишите ваш первый товар",
    description:
      "Расскажите менеджеру, что хотите импортировать: название товара, примерный объём и откуда. Рассчитаем стоимость за 15 минут.",
    action: { label: "Написать менеджеру", href: "https://t.me/ChinaBridgeLID_bot" },
  },
  {
    number: 3,
    icon: "📋",
    title: "Получите коммерческое предложение",
    description:
      "Вы получите детальный расчёт: стоимость доставки, таможенные пошлины, сроки. Предложение появится в разделе «Мои заявки».",
    action: { label: "Мои заявки", href: "/client/orders" },
  },
  {
    number: 4,
    icon: "🚀",
    title: "Подпишите договор и начните импорт",
    description:
      "После согласования условий подписываем договор и запускаем вашу первую поставку. Личный менеджер ведёт груз от отправки до доставки.",
    action: { label: "Документы", href: "/client/documents" },
  },
];

interface Props {
  /** Признак «нового» клиента — нет ни одного заказа */
  isNew: boolean;
}

export default function OnboardingSteps({ isNew }: Props) {
  if (!isNew) return null;

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-800">С чего начать?</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          4 шага до вашей первой поставки из Китая
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-1">
        {STEPS.map((step, idx) => (
          <div key={step.number} className="relative">
            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <span
                className="absolute left-[22px] top-[48px] w-0.5 h-5 bg-green-200"
                aria-hidden="true"
              />
            )}

            <div className="flex items-start gap-4 bg-white rounded-xl px-4 py-4 border border-green-100 hover:border-green-300 hover:shadow-sm transition-all">
              {/* Number badge */}
              <div className="shrink-0 w-11 h-11 rounded-full bg-green-100 border-2 border-green-200 flex items-center justify-center">
                <span className="text-xl">{step.icon}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">
                    Шаг {step.number}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-800 leading-snug">
                  {step.title}
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {step.description}
                </p>
                {step.action && (
                  <a
                    href={step.action.href}
                    target={step.action.href.startsWith("http") ? "_blank" : undefined}
                    rel={step.action.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-green-700 hover:text-green-800 transition-colors"
                  >
                    {step.action.label}
                    <span className="text-green-400">→</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-5 pt-4 border-t border-green-200 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <p className="text-xs text-slate-500 flex-1">
          Есть вопросы? Менеджер ответит за 15 минут в рабочее время.
        </p>
        <a
          href="https://t.me/ChinaBridgeLID_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-green-200"
        >
          ✈️ Написать менеджеру
        </a>
      </div>
    </div>
  );
}
