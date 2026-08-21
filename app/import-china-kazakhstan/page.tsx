import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

const CANONICAL = "https://chinabridge.pro/import-china-kazakhstan";

export const metadata: Metadata = {
  title: "Импорт из Китая в Казахстан — доставка карго 2026 | ChinaBridge",
  description:
    "Доставка товаров из Китая в Казахстан: карго, сборные грузы от 50 кг. Представитель в Китае, работаем с Kaspi.kz, Ozon KZ. Расчёт стоимости за 15 минут.",
  keywords: [
    "импорт из китая казахстан",
    "доставка из китая в казахстан",
    "карго китай казахстан",
    "товары из китая в казахстан",
    "поставщик китай казахстан",
    "доставка из китая алматы",
    "kaspi товары из китая",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Импорт из Китая в Казахстан — карго и сборные грузы | ChinaBridge",
    description: "Доставка из Китая в Казахстан от 50 кг. Представитель на месте, работаем с Kaspi.kz.",
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
      "headline": "Импорт из Китая в Казахстан в 2026 году",
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
          "name": "Сколько стоит доставка из Китая в Казахстан?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Стоимость карго из Китая в Казахстан — от 3 до 6 USD/кг в зависимости от типа груза, маршрута и объёма. Запросите точный расчёт у менеджера — ответим за 15 минут.",
          },
        },
        {
          "@type": "Question",
          "name": "Какие маркетплейсы Казахстана вы закрываете?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Работаем с продавцами Kaspi.kz, Ozon Kazakhstan, Wildberries Kazakhstan. Помогаем найти поставщика в Китае, рассчитать маржу и организовать доставку.",
          },
        },
        {
          "@type": "Question",
          "name": "Какой минимальный объём для доставки в Казахстан?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Минимум для сборного груза — от 50 кг или 0,3 м³. При меньших объёмах рекомендуем авиадоставку или объединение нескольких заказов.",
          },
        },
      ],
    },
  ],
};

export default function ImportChinaKazakhstanPage() {
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
            <span>Импорт из Китая в Казахстан</span>
          </nav>

          <div className="mb-8">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-[#00A86B] mb-3">
              Казахстан · Алматы · Астана
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
              Импорт из Китая<br className="hidden sm:block" />
              <span className="text-[#00A86B]"> в Казахстан</span>
            </h1>
            <p className="text-[#8899aa] text-base leading-relaxed">
              Карго и сборные грузы из Китая в Казахстан от 50 кг. Представитель на месте в Китае.
              Работаем с продавцами Kaspi.kz, Ozon KZ и оптовиками.
            </p>
          </div>

          {/* Mobile CTA */}
          <div className="sm:hidden mb-8">
            <a
              href="https://t.me/ChinaBridgeLID_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-4 bg-[#229ED9] text-white font-bold rounded-2xl text-sm"
            >
              Рассчитать доставку — бесплатно
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-10">
            {[
              { val: "50 кг", label: "минимальный\nобъём" },
              { val: "15 мин", label: "расчёт\nстоимости" },
              { val: "KZ+RU", label: "оба\nнаправления" },
            ].map((s) => (
              <div key={s.val} className="bg-[#0d1b2e] border border-[#1a3050] rounded-2xl p-4 text-center">
                <div className="text-[#00A86B] font-extrabold text-xl font-mono">{s.val}</div>
                <div className="text-[#5a7899] text-xs mt-1 whitespace-pre-line">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Services */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-white mb-4">Что мы делаем</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { icon: "🔍", t: "Поиск поставщика", d: "Находим производителя на 1688 и Alibaba, проверяем качество образцов перед отгрузкой" },
                { icon: "🚢", t: "Карго из Китая", d: "Сборные грузы и выкупленные партии. Маршруты: авто, ж/д, авиа — в зависимости от срочности" },
                { icon: "📦", t: "Доставка до склада в KZ", d: "Доставляем в Алматы, Астану и другие города Казахстана" },
                { icon: "🛒", t: "Kaspi.kz и Ozon KZ", d: "Помогаем рассчитать маржу для казахстанских маркетплейсов и подобрать товары" },
              ].map((item) => (
                <div key={item.t} className="bg-[#0d1b2e] border border-[#1a3050] rounded-2xl p-4">
                  <span className="text-xl">{item.icon}</span>
                  <p className="text-white font-semibold text-sm mt-2 mb-1">{item.t}</p>
                  <p className="text-[#8899aa] text-xs leading-relaxed">{item.d}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Kaspi callout */}
          <div className="bg-[#00A86B]/5 border border-[#00A86B]/20 rounded-2xl p-5 mb-10">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🇰🇿</span>
              <div>
                <p className="text-white font-bold mb-1">Продаёте на Kaspi.kz?</p>
                <p className="text-[#8899aa] text-sm mb-3">
                  Рассчитайте маржу до закупки: вставьте ссылку на товар с 1688 →
                  AI покажет прибыльность на Kaspi за 15 секунд.
                </p>
                <Link
                  href="/ai-calculator"
                  className="inline-flex items-center gap-2 bg-[#00A86B] text-white font-bold px-5 py-2.5 rounded-xl text-sm"
                >
                  AI-калькулятор для Kaspi →
                </Link>
              </div>
            </div>
          </div>

          {/* Routes */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-white mb-4">Маршруты доставки в Казахстан</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#1a3050]">
                    <th className="text-left text-xs font-bold uppercase tracking-wider text-[#5a7899] py-2.5 pr-4">Маршрут</th>
                    <th className="text-left text-xs font-bold uppercase tracking-wider text-[#5a7899] py-2.5 pr-4">Срок</th>
                    <th className="text-left text-xs font-bold uppercase tracking-wider text-[#5a7899] py-2.5">Подходит для</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Авто (карго)", "18–25 дней", "Большие объёмы от 200 кг"],
                    ["Ж/д (контейнер)", "14–20 дней", "Крупные партии от 500 кг"],
                    ["Авиа", "5–7 дней", "Срочные грузы до 100 кг"],
                    ["Сборный груз", "20–30 дней", "От 50 кг, объединение партий"],
                  ].map(([route, days, suitable], i) => (
                    <tr key={i} className="border-b border-[#1a3050]/50">
                      <td className="text-sm text-white py-2.5 pr-4 font-medium">{route}</td>
                      <td className="text-sm text-[#00A86B] font-semibold py-2.5 pr-4">{days}</td>
                      <td className="text-sm text-[#8899aa] py-2.5">{suitable}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-white mb-4">Частые вопросы</h2>
            <div className="flex flex-col gap-3">
              {[
                {
                  q: "Сколько стоит доставка из Китая в Казахстан?",
                  a: "Карго-доставка: от 3 до 6 USD/кг. Итоговая стоимость зависит от веса, объёма и маршрута. Запросите точный расчёт — ответим за 15 минут.",
                },
                {
                  q: "Как найти товар для Kaspi.kz в Китае?",
                  a: "Воспользуйтесь нашим AI-калькулятором: вставьте ссылку с 1688 или опишите товар — получите расчёт маржи для Kaspi. Если товар прибыльный, поможем найти поставщика и организовать доставку.",
                },
                {
                  q: "Работаете ли вы с маленькими объёмами?",
                  a: "Минимальный объём для сборного карго — от 50 кг. Если меньше, рекомендуем авиадоставку или объединение заказа с другими партиями.",
                },
                {
                  q: "Привезёте ли товар прямо в Алматы?",
                  a: "Да, доставляем до вашего склада или адреса в Алматы, Астане и других городах Казахстана.",
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
            <h2 className="text-white font-bold text-xl mb-2">Нужна доставка из Китая в Казахстан?</h2>
            <p className="text-[#8899aa] text-sm mb-5">
              Укажите товар и объём — рассчитаем стоимость за 15 минут
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
                href="/lp/kz"
                className="inline-flex items-center justify-center gap-2 bg-[#00A86B] text-white font-bold px-6 py-3.5 rounded-xl text-sm"
              >
                Оставить заявку
              </Link>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </main>
  );
}
