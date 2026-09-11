import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

const CANONICAL = "https://chinabridge.pro/cargo-china-almaty";

export const metadata: Metadata = {
  title: "Карго из Китая в Алматы — доставка от 50 кг | ChinaBridge",
  description:
    "Карго и сборные грузы из Китая в Алматы. Авто 5–8 дней, авиа от 3 дней. Представитель в Китае, работаем с Kaspi.kz. Расчёт за 15 минут.",
  keywords: [
    "карго из китая в алматы",
    "доставка из китая алматы",
    "грузоперевозки китай алматы",
    "карго алматы",
    "доставка товаров из китая алматы 2026",
    "сборный груз китай алматы",
    "kaspi товары из китая алматы",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Карго из Китая в Алматы — доставка от 50 кг | ChinaBridge",
    description: "Карго из Китая в Алматы: авто 5–8 дней, авиа от 3 дней. Представитель в Китае.",
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
      "headline": "Карго из Китая в Алматы — доставка грузов в 2026 году",
      "url": CANONICAL,
      "publisher": { "@type": "Organization", "name": "ChinaBridge", "url": "https://chinabridge.pro" },
      "datePublished": "2026-09-01",
      "dateModified": "2026-09-11",
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Сколько стоит карго из Китая в Алматы?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Стоимость карго из Китая в Алматы — от $2.50/кг при авто-доставке (5–8 дней). Авиадоставка от $23/кг. Минимальная партия — 50 кг.",
          },
        },
        {
          "@type": "Question",
          "name": "Сколько идёт груз из Китая в Алматы?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Автодоставка из Китая в Алматы занимает 5–8 рабочих дней. Авиадоставка — 3–5 дней.",
          },
        },
        {
          "@type": "Question",
          "name": "Можно ли доставить товар из Китая для Kaspi?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Да, мы специализируемся на поставках для продавцов Kaspi.kz. Помогаем с расчётом экономики, выкупом у поставщика и доставкой на склад в Алматы.",
          },
        },
      ],
    },
  ],
};

const RATES = [
  { type: "Автодоставка", time: "5–8 дней", price: "от $2.50/кг", min: "50 кг", note: "Самый популярный маршрут" },
  { type: "Авиадоставка", time: "3–5 дней",  price: "от $23/кг",  min: "1 кг",  note: "Срочные и лёгкие грузы" },
];

export default function CargoAlmatyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <nav className="text-xs text-[#8899aa] mb-6 flex gap-1 flex-wrap">
          <Link href="/" className="hover:text-white">Главная</Link>
          <span>›</span>
          <span className="text-white">Карго из Китая в Алматы</span>
        </nav>

        <h1 className="text-3xl font-bold text-white mb-4 leading-tight">
          Карго из Китая в Алматы
        </h1>
        <p className="text-[#8899aa] text-base mb-8">
          Сборные грузы и карго из Китая в Алматы — от 50 кг. Наш представитель в Китае выкупает товар
          у поставщика, проверяет качество и отправляет напрямую на ваш склад или адрес в Алматы.
          Работаем с Kaspi.kz, оптовыми продавцами и частными закупками.
        </p>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">Тарифы доставки Китай → Алматы</h2>
          <div className="flex flex-col gap-3">
            {RATES.map(r => (
              <div key={r.type} className="border border-white/10 rounded-2xl p-4 bg-white/3 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <p className="text-white font-semibold">{r.type}</p>
                  <p className="text-[#8899aa] text-sm">{r.note}</p>
                </div>
                <div className="flex gap-6 text-sm">
                  <div><p className="text-[#5a7899] text-xs">Срок</p><p className="text-white font-medium">{r.time}</p></div>
                  <div><p className="text-[#5a7899] text-xs">Цена</p><p className="text-[#00A86B] font-bold">{r.price}</p></div>
                  <div><p className="text-[#5a7899] text-xs">Мин.</p><p className="text-white font-medium">{r.min}</p></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">Что включено в услугу</h2>
          <ul className="flex flex-col gap-2 text-sm text-[#c0d0e0]">
            {[
              "Выкуп товара у поставщика на 1688, Alibaba, Taobao",
              "Фотоотчёт и проверка качества перед отправкой",
              "Консолидация на нашем складе в Гуанчжоу",
              "Доставка авто или авиа — выбираете сами",
              "Отслеживание груза в реальном времени",
              "Расчёт экономики для Kaspi.kz до старта",
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-[#00A86B] mt-0.5">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">Часто задаваемые вопросы</h2>
          <div className="flex flex-col gap-4">
            {[
              {
                q: "Сколько стоит карго из Китая в Алматы?",
                a: "Автодоставка от $2.50/кг (5–8 дней), авиа от $23/кг (3–5 дней). Финальная цена зависит от объёма и плотности груза.",
              },
              {
                q: "Работаете ли вы с Kaspi.kz?",
                a: "Да, это наше основное направление. Помогаем рассчитать маржу, найти поставщика и доставить товар под ключ для продажи на Kaspi.",
              },
              {
                q: "Есть ли минимальный объём заказа?",
                a: "Минимальный вес для авто — 50 кг. Авиадоставку принимаем от 1 кг.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="border border-white/10 rounded-xl p-4 bg-white/3">
                <p className="text-white font-medium mb-1">{q}</p>
                <p className="text-[#8899aa] text-sm">{a}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/ai-calculator?country=KZ"
            className="flex-1 text-center bg-[#00A86B] hover:bg-[#009960] text-white font-bold py-4 rounded-xl transition-colors"
          >
            🧮 Рассчитать стоимость бесплатно
          </Link>
          <Link
            href="/lp/kz"
            className="flex-1 text-center border border-white/20 text-white font-semibold py-4 rounded-xl hover:border-white/40 transition-colors"
          >
            Оставить заявку
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
