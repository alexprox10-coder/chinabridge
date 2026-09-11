import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

const CANONICAL = "https://chinabridge.pro/import-kaspi";

export const metadata: Metadata = {
  title: "Товары из Китая для Kaspi.kz — поставщик и доставка | ChinaBridge",
  description:
    "Найдём производителя в Китае, рассчитаем экономику и доставим товар для продажи на Kaspi.kz. Готовые схемы под ключ: выкуп → доставка → Алматы.",
  keywords: [
    "товары для kaspi из китая",
    "поставщик для kaspi казахстан",
    "импорт для kaspi kz",
    "закупка товаров из китая kaspi",
    "как продавать на kaspi из китая",
    "карго китай kaspi алматы",
    "доставка для kaspi под ключ",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Товары из Китая для Kaspi.kz — поставщик и доставка | ChinaBridge",
    description: "Найдём поставщика, рассчитаем маржу и доставим товар для Kaspi.kz из Китая под ключ.",
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
      "headline": "Как закупать товары из Китая для Kaspi.kz в 2026 году",
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
          "name": "Как найти товар в Китае для Kaspi.kz?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Мы ищем товары на 1688.com, Alibaba и Taobao, проверяем поставщика, рассчитываем маржу с учётом доставки и комиссии Kaspi, и доставляем под ключ.",
          },
        },
        {
          "@type": "Question",
          "name": "Какая маржа на товарах из Китая для Kaspi?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Средняя маржа на товарах из Китая для Kaspi составляет 150–300%. Точный расчёт делаем бесплатно в нашем AI-калькуляторе.",
          },
        },
        {
          "@type": "Question",
          "name": "Сколько стоит доставка из Китая для Kaspi?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Авто-доставка из Китая в Алматы — от $2.50/кг (5–8 дней). Авиа — от $23/кг (3–5 дней). Итоговая стоимость учитывается в расчёте маржи.",
          },
        },
      ],
    },
  ],
};

const STEPS = [
  { n: "01", title: "Находим товар", desc: "Ищем на 1688, Alibaba, Taobao. Проверяем рейтинг поставщика и реальные отзывы." },
  { n: "02", title: "Считаем маржу", desc: "AI-калькулятор учитывает цену закупки, доставку, комиссию Kaspi и конкуренцию." },
  { n: "03", title: "Выкупаем товар", desc: "Наш представитель в Китае выкупает партию, делает фотоотчёт и проверяет качество." },
  { n: "04", title: "Доставляем", desc: "Авто 5–8 дней или авиа 3–5 дней. Вы получаете товар в Алматы или Астане." },
];

export default function ImportKaspiPage() {
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
          <span className="text-white">Товары из Китая для Kaspi.kz</span>
        </nav>

        <h1 className="text-3xl font-bold text-white mb-4 leading-tight">
          Товары из Китая для Kaspi.kz
        </h1>
        <p className="text-[#8899aa] text-base mb-8">
          Помогаем предпринимателям закупать товары из Китая для продажи на Kaspi.kz.
          Найдём поставщика, рассчитаем маржу, выкупим и доставим под ключ.
          Средняя маржа наших клиентов — <span className="text-[#00A86B] font-semibold">150–300%</span>.
        </p>

        {/* Calculator CTA — primary action */}
        <Link
          href="/ai-calculator?country=KZ"
          className="w-full mb-8 flex items-center justify-center gap-2 bg-[#00A86B] hover:bg-[#009960] text-white font-bold py-4 rounded-2xl text-base transition-colors"
        >
          🧮 Рассчитать маржу для Kaspi — бесплатно
        </Link>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-5">Как это работает</h2>
          <div className="flex flex-col gap-4">
            {STEPS.map(s => (
              <div key={s.n} className="flex gap-4 items-start border border-white/10 rounded-2xl p-4 bg-white/3">
                <span className="flex-shrink-0 text-2xl font-black text-[#00A86B]/30">{s.n}</span>
                <div>
                  <p className="text-white font-semibold">{s.title}</p>
                  <p className="text-[#8899aa] text-sm mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">Почему выбирают ChinaBridge</h2>
          <ul className="flex flex-col gap-2 text-sm text-[#c0d0e0]">
            {[
              "Представитель в Китае — Гуанчжоу, работает круглосуточно",
              "Проверка поставщика и фотоотчёт перед отправкой",
              "AI-калькулятор с расчётом маржи специально для Kaspi",
              "Авто-доставка 5–8 дней, авиа 3–5 дней",
              "Работаем с 2019 года, 500+ партий для казахстанских клиентов",
              "Помогаем с выбором ниши и анализом конкурентов",
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
                q: "Как найти товар в Китае для Kaspi?",
                a: "Мы ищем на 1688.com, Alibaba и Taobao. Проверяем рейтинг поставщика, реальные отзывы и соответствие описанию. Вы получаете ссылку на товар с нашей рекомендацией.",
              },
              {
                q: "Какая маржа на товарах из Китая для Kaspi?",
                a: "Средняя маржа наших клиентов — 150–300%. Точный расчёт для вашего товара делаем в AI-калькуляторе бесплатно за 2 минуты.",
              },
              {
                q: "Нужно ли ИП для закупки товаров из Китая?",
                a: "Для начала — нет. Первые партии можно ввезти как физическое лицо. При регулярных закупках от 300 кг рекомендуем оформить ИП.",
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
            🧮 Рассчитать маржу бесплатно
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
