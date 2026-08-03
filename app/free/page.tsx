import type { Metadata } from "next";
import LeadMagnetForm from "@/components/LeadMagnetForm";

export const metadata: Metadata = {
  title: "Бесплатный калькулятор импорта из Китая — Руководство PDF | ChinaBridge",
  description:
    "Скачайте бесплатное руководство: как рассчитать стоимость доставки из Китая, выбрать маршрут и сэкономить на импорте. 5 страниц практических советов.",
  keywords: [
    "калькулятор импорта из Китая",
    "доставка из Китая стоимость",
    "как везти товар из Китая",
    "расчёт таможенных пошлин",
    "импорт из Китая для бизнеса",
    "белый импорт из Китая",
    "белый импорт Китай",
    "импорт из Китая под ключ",
    "сертификация товара из Китая",
    "доставка Китай Россия",
    "доставка Китай Казахстан",
    "проверка товара перед закупкой",
    "таможенное оформление Китай",
    "оплата поставщикам в Китае",
    "валютные платежи Китай",
  ],
  alternates: { canonical: "https://chinabridge.pro/free" },
  openGraph: {
    title: "Бесплатное руководство: Калькулятор импорта из Китая",
    description: "5-страничный PDF с формулами расчёта, таблицей маршрутов и 5 способами сэкономить",
    url: "https://chinabridge.pro/free",
    siteName: "ChinaBridge",
    type: "website",
  },
};

const benefits = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: "Формула расчёта",
    text: "Все статьи затрат: пошлины, НДС, фрахт, брокер — в одном документе",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    title: "Таблица маршрутов",
    text: "Авиа, ЖД, авто, море — сроки, цены и когда что выгоднее",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "5 способов сэкономить",
    text: "Практические советы из опыта 500+ клиентов, которые уже везут из Китая",
  },
];

const faqs = [
  {
    q: "Для кого это руководство?",
    a: "Для предпринимателей, которые впервые везут товар из Китая или хотят снизить затраты на уже действующий импорт. Подойдёт и для небольших партий, и для регулярных поставок.",
  },
  {
    q: "Почему руководство бесплатное?",
    a: "Мы хотим помочь вам разобраться в стоимости импорта до начала работы. Если наши расчёты окажутся полезными — вы сможете обратиться к нам за реальной поставкой.",
  },
  {
    q: "Какие товары вы везёте из Китая?",
    a: "Электронику, одежду, обувь, мебель, авто-запчасти, стройматериалы, оборудование и большинство других категорий. Подскажем по вашему товару — напишите в Telegram.",
  },
  {
    q: "Сколько стоят ваши услуги?",
    a: "Стоимость зависит от маршрута, веса и объёма. Базовый расчёт — бесплатно. Отправьте заявку и получите коммерческое предложение в течение 2 часов.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://chinabridge.pro/free",
      url: "https://chinabridge.pro/free",
      name: "Бесплатный калькулятор импорта из Китая — Руководство PDF",
      description:
        "Скачайте бесплатное PDF-руководство по расчёту стоимости импорта из Китая",
      isPartOf: { "@id": "https://chinabridge.pro/#website" },
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Главная", item: "https://chinabridge.pro/" },
          { "@type": "ListItem", position: 2, name: "Бесплатное руководство", item: "https://chinabridge.pro/free" },
        ],
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ],
};

export default function FreePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-[#060f1e] text-white">
        {/* Nav breadcrumb */}
        <div className="border-b border-white/5">
          <div className="max-w-5xl mx-auto px-4 py-3">
            <nav aria-label="breadcrumb" className="text-xs text-slate-500">
              <a href="/" className="hover:text-slate-300 transition-colors">Главная</a>
              <span className="mx-2">›</span>
              <span className="text-slate-400">Бесплатное руководство</span>
            </nav>
          </div>
        </div>

        {/* Hero + Form */}
        <section id="lead-form" className="max-w-5xl mx-auto px-4 py-14 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#00A86B]/10 border border-[#00A86B]/30 rounded-full px-4 py-1.5 text-[#00A86B] text-sm font-medium mb-6">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Бесплатный PDF-гид
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-5">
                Калькулятор импорта{" "}
                <span className="text-[#00A86B]">из Китая</span>:{" "}
                считайте правильно
              </h1>

              <p className="text-slate-400 text-lg leading-relaxed mb-8">
                5-страничное руководство с формулами, таблицей маршрутов и реальными примерами расчёта. Скачайте бесплатно — без подписки и без спама.
              </p>

              {/* Benefits */}
              <div className="space-y-5">
                {benefits.map((b) => (
                  <div key={b.title} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] border border-[#00A86B]/20 flex items-center justify-center flex-shrink-0 text-[#00A86B]">
                      {b.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm mb-0.5">{b.title}</p>
                      <p className="text-slate-400 text-sm leading-relaxed">{b.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust line */}
              <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap gap-6 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-[#00A86B]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Без регистрации
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-[#00A86B]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  8 лет опыта в импорте
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-[#00A86B]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  500+ клиентов
                </span>
              </div>
            </div>

            {/* Right: form */}
            <div className="bg-[#0B1F3A] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-1">Получить руководство</h2>
              <p className="text-slate-400 text-sm mb-6">Заполните форму — ссылка придёт мгновенно</p>
              <LeadMagnetForm />
            </div>
          </div>
        </section>

        {/* Pre-purchase check block */}
        <section className="border-t border-white/5 py-14 bg-gradient-to-b from-[#060f1e] to-[#0B1F3A]">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A84C] mb-3">
                Полный цикл проверки
              </p>
              <h2 className="text-2xl font-bold text-white mb-2">
                Что мы проверяем перед закупкой
              </h2>
              <p className="text-slate-400 text-sm max-w-xl mx-auto">
                Анализируем каждый этап, чтобы вы знали полную стоимость и риски до первой оплаты
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                {
                  emoji: "📦",
                  title: "Товар",
                  desc: "Характеристики, фото, видео, соответствие требованиям рынка",
                },
                {
                  emoji: "🏭",
                  title: "Поставщик",
                  desc: "Проверка фабрики, условия производства, репутация",
                },
                {
                  emoji: "📋",
                  title: "Документы",
                  desc: "Нужна ли сертификация, декларации, разрешения ЕАЭС",
                },
                {
                  emoji: "🚚",
                  title: "Логистика",
                  desc: "Маршрут, сроки, стоимость доставки до вашего склада",
                },
                {
                  emoji: "💰",
                  title: "Итоговая стоимость",
                  desc: "Товар + логистика + таможня + документы = себестоимость",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="bg-[#0B1F3A] border border-white/5 rounded-xl p-4 flex flex-col gap-2 hover:border-[#C9A84C]/30 transition-colors"
                >
                  <span className="text-2xl">{card.emoji}</span>
                  <h3 className="text-white font-semibold text-sm">{card.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
            {/* Lead magnet checklist */}
            <div className="mt-8 bg-[#0B1F3A] border border-[#C9A84C]/20 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <div className="flex-1">
                <p className="text-xs font-semibold text-[#C9A84C] uppercase tracking-wider mb-2">Что вы получаете</p>
                <ul className="space-y-1.5">
                  {[
                    "Можно ли продавать товар",
                    "Нужна ли сертификация",
                    "Какие документы нужны",
                    "Примерная стоимость доставки",
                    "Итоговая себестоимость",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-[#00A86B] font-bold mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href="#lead-form"
                className="flex-shrink-0 bg-[#00A86B] hover:bg-[#009060] text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm whitespace-nowrap"
              >
                Получить бесплатно
              </a>
            </div>
          </div>
        </section>

        {/* What's inside */}
        <section className="border-t border-white/5 py-14">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-10">Что внутри руководства</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { page: "Стр. 1", title: "Обложка", desc: "Что такое калькулятор импорта и зачем он нужен" },
                { page: "Стр. 2", title: "Статьи затрат", desc: "Все 7 составляющих себестоимости: пошлина, НДС, фрахт, брокер" },
                { page: "Стр. 3", title: "Таблица маршрутов", desc: "Авиа, ЖД, авто, море: сроки, цены, когда что выгоднее" },
                { page: "Стр. 4", title: "5 советов", desc: "Как сэкономить 20–60% на логистике — проверенные методы" },
                { page: "Стр. 5", title: "Как начать", desc: "Пошаговый путь от запроса до доставки товара на ваш склад" },
              ].map((item) => (
                <div key={item.page} className="bg-[#0B1F3A] border border-white/5 rounded-xl p-5 hover:border-[#00A86B]/30 transition-colors">
                  <span className="text-xs font-medium text-[#00A86B] uppercase tracking-wider">{item.page}</span>
                  <h3 className="text-white font-semibold mt-1 mb-1.5">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
              {/* Last card: CTA */}
              <div className="bg-[#00A86B]/10 border border-[#00A86B]/30 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-medium text-[#00A86B] uppercase tracking-wider">Бонус</span>
                  <h3 className="text-white font-semibold mt-1 mb-1.5">Персональный расчёт</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">После скачивания получите предложение по вашему конкретному товару</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-white/5 py-14">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-10">Частые вопросы</h2>
            <div className="space-y-4">
              {faqs.map(({ q, a }) => (
                <div key={q} className="bg-[#0B1F3A] border border-white/5 rounded-xl p-6">
                  <h3 className="font-semibold text-white mb-2">{q}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-white/5 py-14">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-3">Готовы рассчитать вашу поставку?</h2>
            <p className="text-slate-400 mb-8">
              Заполните форму выше и получите руководство + бесплатную консультацию менеджера
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/delivery-calculator"
                className="bg-[#00A86B] hover:bg-[#009060] text-white font-semibold px-8 py-3.5 rounded-xl transition-colors"
              >
                Рассчитать доставку
              </a>
              <a
                href="https://t.me/ChinaBridgeLID_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-white/20 hover:border-white/40 text-white font-medium px-8 py-3.5 rounded-xl transition-colors"
              >
                Написать в Telegram
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
