import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

const CANONICAL = "https://chinabridge.pro/supplier-wildberries-china";

export const metadata: Metadata = {
  title: "Поставщик для Wildberries из Китая — найти и привезти товар 2026",
  description:
    "Как найти поставщика для Wildberries в Китае? ChinaBridge: поиск на 1688 и Alibaba, инспекция качества, доставка под ключ, AI-расчёт маржи. Работаем с WB с 2019 года.",
  keywords: [
    "поставщик для wildberries китай",
    "поставщик для вайлдберриз из китая",
    "найти поставщика в китае для вб",
    "товары для wildberries из китая оптом",
    "закупка товара в китае для wildberries",
    "1688 товары для вайлдберриз",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Поставщик для Wildberries из Китая | ChinaBridge",
    description: "Найдём поставщика на 1688/Alibaba, проверим качество, привезём в РФ с расчётом маржи WB.",
    type: "article",
    url: CANONICAL,
    locale: "ru_RU",
    siteName: "ChinaBridge",
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "headline": "Как найти поставщика для Wildberries в Китае в 2026 году",
      "url": CANONICAL,
      "publisher": { "@type": "Organization", "name": "ChinaBridge", "url": "https://chinabridge.pro" },
      "datePublished": "2026-08-01",
      "dateModified": "2026-08-21",
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Где найти поставщика для Wildberries в Китае?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Лучшие площадки для поиска поставщиков под WB: 1688.com (оптовая Alibaba для внутреннего рынка Китая), Alibaba.com, Canton Fair. ChinaBridge ищет поставщиков напрямую через своего представителя в Китае.",
          },
        },
        {
          "@type": "Question",
          "name": "Сколько стоит найти поставщика в Китае для WB?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Поиск поставщика входит в комплекс услуг ChinaBridge. Стоимость зависит от объёма и маршрута. Запросите расчёт у менеджера — ответим за 15 минут.",
          },
        },
        {
          "@type": "Question",
          "name": "Можно ли самому закупаться на 1688 для Wildberries?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Технически — да, но требуется: аккаунт на 1688, знание китайского или переводчик, оплата через китайский WeChat Pay / Alipay, организация доставки и таможни. ChinaBridge берёт всё это на себя.",
          },
        },
      ],
    },
  ],
};

const steps = [
  {
    icon: "🔍",
    title: "Поиск поставщика",
    desc: "Ищем на 1688, Alibaba и через прямые контакты в Китае. Проверяем репутацию, документы, минимальный заказ.",
  },
  {
    icon: "🏭",
    title: "Инспекция фабрики",
    desc: "Наш представитель выезжает на производство: фотоотчёт, проверка качества образцов до отгрузки.",
  },
  {
    icon: "📊",
    title: "AI-расчёт маржи",
    desc: "Считаем юнит-экономику ещё до закупки: маржа WB, ROI, срок окупаемости с учётом всех расходов.",
  },
  {
    icon: "🚢",
    title: "Доставка и таможня",
    desc: "Организуем доставку карго или авиа. Белая схема через Суньфэньхэ с таможенным оформлением.",
  },
  {
    icon: "📦",
    title: "Приёмка и маркировка",
    desc: "Принимаем груз, наносим маркировку WB (ШК, честный знак при необходимости), отправляем на FBO.",
  },
];

const niches = [
  "Одежда и аксессуары", "Обувь", "Товары для дома", "Игрушки и детские товары",
  "Электроника и гаджеты", "Спорт и фитнес", "Красота и уход", "Автотовары",
];

export default function SupplierWildberriesChinaPage() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />

      <div className="min-h-screen bg-[#060f1e] pt-20 pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">

          <nav className="text-xs text-[#5a7899] mb-6">
            <Link href="/" className="hover:text-white">Главная</Link>
            <span className="mx-2">›</span>
            <span>Поставщик для Wildberries из Китая</span>
          </nav>

          <div className="mb-8">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-[#00A86B] mb-3">
              Работаем с 2019 · 500+ партий
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
              Поставщик для Wildberries<br className="hidden sm:block" />
              <span className="text-[#00A86B]"> из Китая</span>
            </h1>
            <p className="text-[#8899aa] text-base leading-relaxed">
              Найдём производителя на 1688 или Alibaba, проверим качество, рассчитаем маржу WB
              и привезём товар до вашего склада или FBO. Представитель на месте в Китае.
            </p>
          </div>

          {/* CTA mobile */}
          <div className="sm:hidden mb-8">
            <a
              href="https://t.me/ChinaBridgeLID_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-4 bg-[#229ED9] text-white font-bold rounded-2xl text-sm"
            >
              Найти поставщика — бесплатная консультация
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-10">
            {[
              { val: "500+", label: "партий\nдоставлено" },
              { val: "7 лет", label: "на рынке\nс 2019" },
              { val: "15 мин", label: "ответ\nменеджера" },
            ].map((s) => (
              <div key={s.val} className="bg-[#0d1b2e] border border-[#1a3050] rounded-2xl p-4 text-center">
                <div className="text-[#00A86B] font-extrabold text-xl font-mono">{s.val}</div>
                <div className="text-[#5a7899] text-xs mt-1 whitespace-pre-line">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Process */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-white mb-5">Как мы работаем</h2>
            <div className="flex flex-col gap-3">
              {steps.map((s, i) => (
                <div key={i} className="flex gap-4 bg-[#0d1b2e] border border-[#1a3050] rounded-xl p-4">
                  <span className="text-2xl flex-shrink-0">{s.icon}</span>
                  <div>
                    <p className="text-white font-semibold text-sm">{s.title}</p>
                    <p className="text-[#8899aa] text-xs mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Niches */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-white mb-4">Ниши для WB из Китая — с чем работаем</h2>
            <div className="flex flex-wrap gap-2">
              {niches.map((n) => (
                <span key={n} className="text-xs bg-[#0d1b2e] border border-[#1a3050] text-[#8899aa] rounded-full px-3 py-1.5">
                  {n}
                </span>
              ))}
            </div>
          </section>

          {/* AI calculator callout */}
          <div className="bg-[#00A86B]/5 border border-[#00A86B]/20 rounded-2xl p-5 mb-10">
            <p className="text-white font-bold mb-1">🤖 Рассчитайте маржу до закупки</p>
            <p className="text-[#8899aa] text-sm mb-3">
              Вставьте ссылку с 1688 — AI покажет маржу, ROI и целевую цену закупки для WB за 15 секунд.
            </p>
            <Link
              href="/ai-calculator"
              className="inline-flex items-center gap-2 bg-[#00A86B] text-white font-bold px-5 py-2.5 rounded-xl text-sm"
            >
              Открыть AI-калькулятор →
            </Link>
          </div>

          {/* FAQ */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-white mb-4">Частые вопросы</h2>
            <div className="flex flex-col gap-3">
              {[
                {
                  q: "Где найти поставщика для Wildberries в Китае?",
                  a: "1688.com — оптовая платформа для внутреннего рынка Китая, цены на 30–50% ниже Alibaba. Наш представитель работает с 1688 напрямую, минуя языковой барьер.",
                },
                {
                  q: "Какой минимальный заказ при работе через вас?",
                  a: "Зависит от поставщика и товара. В среднем от 50 кг или от 100 000 ₽ закупочной стоимости. Уточните у менеджера под конкретный товар.",
                },
                {
                  q: "Как проверить качество товара до отгрузки?",
                  a: "Наш представитель проводит инспекцию на складе или фабрике — проверяет образцы, соответствие размерной сетке, упаковку. Вы получаете фотоотчёт до отгрузки.",
                },
                {
                  q: "Нужен ли мне ИП или ООО для импорта через WB?",
                  a: "Для работы на Wildberries как продавец — да, нужен статус ИП, ООО или самозанятого. ChinaBridge работает с юридическими лицами и ИП.",
                },
              ].map((item, i) => (
                <div key={i} className="bg-[#0d1b2e] border border-[#1a3050] rounded-2xl p-4">
                  <p className="text-white font-semibold text-sm mb-2">{item.q}</p>
                  <p className="text-[#8899aa] text-sm">{item.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="bg-gradient-to-br from-[#00A86B]/10 to-[#060f1e] border border-[#00A86B]/20 rounded-2xl p-6 text-center">
            <h2 className="text-white font-bold text-xl mb-2">Нашли товар? Давайте посчитаем</h2>
            <p className="text-[#8899aa] text-sm mb-5">
              Опишите нишу или скиньте ссылку с 1688 — предложим поставщика и рассчитаем маржу
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://t.me/ChinaBridgeLID_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#229ED9] text-white font-bold px-6 py-3.5 rounded-xl text-sm"
              >
                Написать в Telegram
              </a>
              <Link
                href="/ai-calculator"
                className="inline-flex items-center justify-center gap-2 bg-[#00A86B] text-white font-bold px-6 py-3.5 rounded-xl text-sm"
              >
                AI-калькулятор маржи
              </Link>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </main>
  );
}
