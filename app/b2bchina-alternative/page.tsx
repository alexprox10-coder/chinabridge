import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

const CANONICAL = "https://chinabridge.pro/b2bchina-alternative";

export const metadata: Metadata = {
  title: "Альтернатива B2BChina в 2026 году — лучшие сервисы импорта из Китая",
  description:
    "B2BChina закрылся? Найдите лучшую альтернативу b2bchina.ru для импорта из Китая в Россию. ChinaBridge: поиск поставщиков, доставка, AI-калькулятор маржи. Работаем с WB, Ozon, Kaspi.",
  keywords: [
    "альтернатива b2bchina",
    "b2bchina альтернатива",
    "замена b2bchina ru",
    "импорт из китая вместо b2bchina",
    "сервис импорта из китая",
    "поставщики китай для wildberries",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Альтернатива B2BChina 2026 — ChinaBridge",
    description:
      "B2BChina прекратил работу. ChinaBridge — полноценная замена: поиск поставщиков, доставка, AI-расчёт маржи, личный кабинет.",
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
      "headline": "Альтернатива B2BChina в 2026 году",
      "description": "Обзор лучших альтернатив b2bchina.ru для импорта из Китая в Россию и Казахстан",
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
          "name": "Почему закрылся B2BChina?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "B2BChina (b2bchina.ru) прекратил работу в 2023–2024 годах. Домен припаркован, поддержка не отвечает. Бывшим клиентам рекомендуем перейти на ChinaBridge — сервис с аналогичным функционалом плюс AI-инструменты.",
          },
        },
        {
          "@type": "Question",
          "name": "Какая лучшая альтернатива B2BChina для Wildberries?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "ChinaBridge — лучшая альтернатива B2BChina для продавцов Wildberries и Ozon. Предлагает: поиск поставщиков на 1688, инспекцию фабрик, доставку из Китая, AI-калькулятор маржи и личный кабинет для отслеживания грузов.",
          },
        },
        {
          "@type": "Question",
          "name": "Как перенести поставки с B2BChina на другой сервис?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Напишите менеджеру ChinaBridge в Telegram: @ChinaBridgeLID_bot. Расскажите о своём товаре и объёме — подберём маршрут и рассчитаем стоимость за 15 минут.",
          },
        },
      ],
    },
  ],
};

const competitors = [
  {
    name: "ChinaBridge",
    url: "chinabridge.pro",
    status: "Лучший выбор",
    statusColor: "#00A86B",
    features: ["✓ AI-калькулятор маржи", "✓ Личный кабинет", "✓ WB / Ozon / Kaspi", "✓ Инспекция фабрик", "✓ Казахстан"],
    highlight: true,
  },
  {
    name: "MasterTao",
    url: "mastertao.ru",
    status: "Активен",
    statusColor: "#f59e0b",
    features: ["✓ Поиск поставщиков", "✓ WB / Ozon", "✗ Нет калькулятора", "✗ Нет кабинета", "✗ Нет Казахстана"],
    highlight: false,
  },
  {
    name: "Sinmeng",
    url: "sinmeng.ru",
    status: "Активен",
    statusColor: "#f59e0b",
    features: ["✓ Логистика РФ", "✓ Таможня", "✗ Нет маркетплейс-фокуса", "✗ Нет AI-инструментов", "✗ Нет KZ"],
    highlight: false,
  },
];

export default function B2BchinaAlternativePage() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />

      <div className="min-h-screen bg-[#060f1e] pt-20 pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">

          {/* Breadcrumb */}
          <nav className="text-xs text-[#5a7899] mb-6">
            <Link href="/" className="hover:text-white">Главная</Link>
            <span className="mx-2">›</span>
            <span>Альтернатива B2BChina</span>
          </nav>

          {/* Hero */}
          <div className="mb-10">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-[#00A86B] mb-3">
              Актуально в 2026 году
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
              Альтернатива B2BChina —<br className="hidden sm:block" />
              <span className="text-[#00A86B]"> что выбрать в 2026</span>
            </h1>
            <p className="text-[#8899aa] text-base leading-relaxed max-w-2xl">
              B2BChina (b2bchina.ru) прекратил работу. Если вы искали надёжного посредника для
              импорта из Китая в Россию или Казахстан — ниже сравнение всех живых альтернатив.
            </p>
          </div>

          {/* Alert box */}
          <div className="bg-[#ef444412] border border-[#ef444430] rounded-2xl p-4 mb-10 flex gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-white font-semibold text-sm mb-1">B2BChina больше не работает</p>
              <p className="text-[#8899aa] text-sm">
                Сайт b2bchina.ru припаркован с 2024 года. Поддержка не отвечает.
                Если у вас были активные поставки — свяжитесь с нами, поможем переоформить маршрут.
              </p>
            </div>
          </div>

          {/* Section: Comparison */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-white mb-6">Сравнение альтернатив B2BChina</h2>
            <div className="flex flex-col gap-4">
              {competitors.map((c) => (
                <div
                  key={c.name}
                  className={`rounded-2xl border p-5 ${
                    c.highlight
                      ? "border-[#00A86B]/40 bg-[#00A86B]/5"
                      : "border-[#1a3050] bg-[#0d1b2e]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div>
                      <span className="font-bold text-white text-base">{c.name}</span>
                      <span className="text-[#5a7899] text-xs ml-2 font-mono">{c.url}</span>
                    </div>
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ color: c.statusColor, background: c.statusColor + "18", border: `1px solid ${c.statusColor}33` }}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {c.features.map((f) => (
                      <span
                        key={f}
                        className={`text-xs ${f.startsWith("✓") ? "text-[#00A86B]" : "text-[#5a7899]"}`}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                  {c.highlight && (
                    <div className="mt-4 flex gap-3 flex-wrap">
                      <a
                        href="https://t.me/ChinaBridgeLID_bot"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-[#229ED9] text-white text-sm font-bold px-4 py-2.5 rounded-xl"
                      >
                        Написать менеджеру →
                      </a>
                      <Link
                        href="/ai-calculator"
                        className="inline-flex items-center gap-2 border border-[#00A86B]/40 text-[#00A86B] text-sm font-semibold px-4 py-2.5 rounded-xl"
                      >
                        AI-калькулятор маржи
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Section: Why ChinaBridge */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-white mb-4">
              Почему ChinaBridge — лучшая альтернатива B2BChina
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: "🤖",
                  title: "AI-калькулятор маржи",
                  desc: "Единственный сервис с AI-анализом юнит-экономики. Вставьте ссылку с 1688 — получите маржу для WB/Ozon за 15 секунд.",
                },
                {
                  icon: "🇰🇿",
                  title: "Казахстан и Kaspi.kz",
                  desc: "Работаем с доставкой в Казахстан. Ни один прямой конкурент это направление не закрывает.",
                },
                {
                  icon: "🏭",
                  title: "Представитель в Китае",
                  desc: "Физическое присутствие на производстве: инспекция качества, фотоотчёт, работа с 1688 и Alibaba.",
                },
                {
                  icon: "📦",
                  title: "Личный кабинет",
                  desc: "Трекинг грузов, история заказов, документы — всё в одном месте. B2BChina такого не предлагал.",
                },
              ].map((item) => (
                <div key={item.title} className="bg-[#0d1b2e] border border-[#1a3050] rounded-2xl p-4">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <h3 className="text-white font-bold text-sm mb-1">{item.title}</h3>
                  <p className="text-[#8899aa] text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section: FAQ */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-white mb-6">Частые вопросы</h2>
            <div className="flex flex-col gap-4">
              {[
                {
                  q: "Почему закрылся B2BChina?",
                  a: "B2BChina прекратил работу в 2023–2024 годах. Официальных причин не объявлялось. Домен сейчас припаркован, сервис недоступен.",
                },
                {
                  q: "Возьмёте ли вы клиентов, которые раньше работали с B2BChina?",
                  a: "Да. Если у вас были отработанные маршруты или поставщики через B2BChina — расскажите менеджеру, воспроизведём схему доставки.",
                },
                {
                  q: "Какие маркетплейсы вы закрываете?",
                  a: "Wildberries, Ozon, Яндекс Маркет, Kaspi.kz. Также работаем с оптовыми закупками без привязки к маркетплейсу.",
                },
                {
                  q: "Сколько стоит доставка из Китая?",
                  a: "Зависит от веса, объёма и маршрута. Используйте AI-калькулятор или напишите менеджеру — расчёт за 15 минут.",
                },
              ].map((item, i) => (
                <div key={i} className="bg-[#0d1b2e] border border-[#1a3050] rounded-2xl p-4">
                  <p className="text-white font-semibold text-sm mb-2">{item.q}</p>
                  <p className="text-[#8899aa] text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="bg-gradient-to-br from-[#00A86B]/10 to-[#060f1e] border border-[#00A86B]/20 rounded-2xl p-6 text-center">
            <h2 className="text-white font-bold text-xl mb-2">Готовы начать?</h2>
            <p className="text-[#8899aa] text-sm mb-5">
              Опишите задачу — менеджер ответит за 15 минут и подберёт маршрут
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
                Рассчитать маржу бесплатно
              </Link>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </main>
  );
}
