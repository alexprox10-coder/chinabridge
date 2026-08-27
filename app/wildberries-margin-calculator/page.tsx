import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import AIEconomicsFunnel from "@/components/ai-funnel/AIEconomicsFunnel";
import { TelegramLeadCapture } from "@/components/leads/TelegramLeadCapture";

const CANONICAL = "https://chinabridge.pro/wildberries-margin-calculator";

export const metadata: Metadata = {
  title: "Калькулятор маржи Wildberries из Китая — AI-расчёт юнит-экономики 2026",
  description:
    "Бесплатный калькулятор маржи Wildberries: вставьте ссылку с 1688 или Alibaba → AI рассчитает маржу, ROI, таможню и прибыль на WB за 15 секунд. Комиссия WB 2026, реальные тарифы логистики.",
  keywords: [
    "калькулятор маржи wildberries",
    "калькулятор маржи вайлдберриз",
    "юнит экономика wildberries",
    "расчёт маржи вб из китая",
    "калькулятор прибыли вайлдберриз",
    "комиссия wildberries 2026",
    "юнит-экономика маркетплейс",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Калькулятор маржи Wildberries — AI-расчёт за 15 сек | ChinaBridge",
    description:
      "Вставьте ссылку с 1688 → AI рассчитает маржу, ROI и прибыль на Wildberries с учётом таможни и доставки из Китая.",
    type: "website",
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
      "@type": "WebApplication",
      "name": "Калькулятор маржи Wildberries — ChinaBridge",
      "url": "https://chinabridge.pro/ai-calculator",
      "applicationCategory": "BusinessApplication",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "RUB" },
      "description": "AI-калькулятор маржи для продавцов Wildberries. Расчёт юнит-экономики с учётом закупки в Китае, таможни, логистики и комиссии WB.",
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Какая комиссия Wildberries в 2026 году?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Комиссия Wildberries в 2026: одежда и обувь — 43,5%, электроника — 23–28%, товары для дома — 23%, игрушки — 23%. Логистика FBW: от 75 ₽/единицу. Хранение: от 0,07 ₽/литр в сутки.",
          },
        },
        {
          "@type": "Question",
          "name": "Как посчитать маржу товара из Китая на Wildberries?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Маржа = (Цена продажи − Комиссия WB − Логистика WB − Себестоимость товара − Таможня − Доставка из Китая − Реклама) / Цена продажи × 100%. Используйте AI-калькулятор ChinaBridge — он считает всё автоматически за 15 секунд.",
          },
        },
        {
          "@type": "Question",
          "name": "Какая маржа считается хорошей для Wildberries?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Хорошая маржа для WB при импорте из Китая: от 30%. При марже ниже 20% бизнес уязвим к колебаниям курса и росту ставок. AI-калькулятор ChinaBridge строит три сценария: консервативный, базовый и оптимистичный.",
          },
        },
      ],
    },
  ],
};

const wbRates2026 = [
  { category: "Одежда и обувь", commission: "43,5%", logistics: "от 100 ₽" },
  { category: "Электроника", commission: "23–28%", logistics: "от 75 ₽" },
  { category: "Товары для дома", commission: "23%", logistics: "от 75 ₽" },
  { category: "Игрушки", commission: "23%", logistics: "от 55 ₽" },
  { category: "Красота и здоровье", commission: "36%", logistics: "от 55 ₽" },
  { category: "Спорт и отдых", commission: "23%", logistics: "от 75 ₽" },
];

export default function WildberriesMarginCalculatorPage() {
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
            <span>Калькулятор маржи Wildberries</span>
          </nav>

          {/* Hero */}
          <div className="mb-8">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-[#00A86B] mb-3">
              Бесплатно · AI-расчёт · 2026
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
              Калькулятор маржи<br className="hidden sm:block" />
              <span className="text-[#00A86B]"> Wildberries из Китая</span>
            </h1>
            <p className="text-[#8899aa] text-base leading-relaxed">
              Вставьте ссылку на товар с 1688 или Alibaba — AI рассчитает маржу, ROI, таможню
              и чистую прибыль на Wildberries с учётом реальных тарифов 2026 года.
            </p>
          </div>

          {/* Embedded calculator */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🤖</span>
              <div>
                <p className="text-white font-bold">AI-калькулятор маржи WB</p>
                <p className="text-[#8899aa] text-xs">GPT-4o · расчёт за 15 секунд · бесплатно</p>
              </div>
            </div>
            <AIEconomicsFunnel />
            <TelegramLeadCapture
              source="wb-margin-calculator"
              contextHint="расчёт маржи WB"
            />
          </div>

          {/* Smart service CTA */}
          <section className="mb-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                icon: "🚚",
                title: "Доставка под ключ",
                desc: "Рассчитаем реальную стоимость доставки вашего товара из Китая",
                cta: "Рассчитать доставку",
                href: "/delivery-calculator",
                color: "border-[#243a5e] hover:border-[#00A86B]/40",
              },
              {
                icon: "🏭",
                title: "Найти поставщика дешевле",
                desc: "Если маржа не устраивает — найдём производителя с ценой ниже",
                cta: "AI поиск поставщика",
                href: "/supplier-finder",
                color: "border-[#243a5e] hover:border-[#00A86B]/40",
              },
              {
                icon: "📦",
                title: "Импорт под ключ",
                desc: "Закупим, проверим качество, доставим и растаможим — вы только продаёте",
                cta: "Узнать условия",
                href: "/#contact",
                color: "border-[#00A86B]/20 hover:border-[#00A86B]/50 bg-[#00A86B]/5",
              },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`block card-glass rounded-2xl p-4 border ${item.color} transition-all group`}
              >
                <div className="text-2xl mb-2">{item.icon}</div>
                <p className="text-white font-semibold text-sm mb-1 group-hover:text-[#00A86B] transition-colors">
                  {item.title}
                </p>
                <p className="text-[#8899aa] text-xs mb-3 leading-relaxed">{item.desc}</p>
                <span className="text-[#00A86B] text-xs font-semibold">{item.cta} →</span>
              </a>
            ))}
          </section>

          {/* Formula */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-white mb-4">
              Формула расчёта маржи для WB из Китая
            </h2>
            <div className="bg-[#0d1b2e] border border-[#1a3050] rounded-2xl p-5">
              <p className="text-[#00A86B] font-mono text-sm mb-3 font-bold">
                Маржа = (Цена − Все расходы) / Цена × 100%
              </p>
              <div className="flex flex-col gap-2">
                {[
                  ["Цена продажи на WB", "100%"],
                  ["− Комиссия WB", "23–43%"],
                  ["− Логистика FBW", "75–150 ₽/ед"],
                  ["− Себестоимость (Китай)", "индивидуально"],
                  ["− Таможня", "~20% от стоимости"],
                  ["− Карго/доставка из Китая", "3–6 USD/кг"],
                  ["− Реклама WB", "5–15%"],
                  ["= Чистая прибыль", "цель: >30%"],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between text-sm border-b border-[#1a3050] pb-1.5 last:border-0">
                    <span className="text-[#8899aa]">{label}</span>
                    <span className={val.startsWith("=") || val === "цель: >30%" ? "text-[#00A86B] font-bold" : "text-white"}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Commissions table */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-white mb-4">
              Комиссии Wildberries 2026 по категориям
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#1a3050]">
                    <th className="text-left text-xs font-bold uppercase tracking-wider text-[#5a7899] py-2.5 pr-4">Категория</th>
                    <th className="text-left text-xs font-bold uppercase tracking-wider text-[#5a7899] py-2.5 pr-4">Комиссия</th>
                    <th className="text-left text-xs font-bold uppercase tracking-wider text-[#5a7899] py-2.5">Логистика</th>
                  </tr>
                </thead>
                <tbody>
                  {wbRates2026.map((row, i) => (
                    <tr key={i} className="border-b border-[#1a3050]/50">
                      <td className="text-sm text-white py-2.5 pr-4">{row.category}</td>
                      <td className="text-sm text-[#f59e0b] font-semibold py-2.5 pr-4">{row.commission}</td>
                      <td className="text-sm text-[#8899aa] py-2.5">{row.logistics}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-[#5a7899] mt-2">* Тарифы актуальны на август 2026. AI-калькулятор использует актуальные данные автоматически.</p>
          </section>

          {/* How it works */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-white mb-4">Как работает AI-калькулятор</h2>
            <div className="flex flex-col gap-3">
              {[
                { n: "1", t: "Вставьте ссылку", d: "Ссылка на товар с 1688, Alibaba или опишите его словами" },
                { n: "2", t: "AI анализирует", d: "GPT-4o определяет категорию WB, среднюю цену продажи, вес и габариты" },
                { n: "3", t: "Полный расчёт", d: "Маржа, ROI, себестоимость с таможней и доставкой, Product Score 0–10" },
                { n: "4", t: "Три сценария", d: "Консервативный, базовый, оптимистичный — чтобы видеть риски" },
              ].map((s) => (
                <div key={s.n} className="flex gap-4 bg-[#0d1b2e] border border-[#1a3050] rounded-xl p-4">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#00A86B]/15 text-[#00A86B] text-xs font-bold flex items-center justify-center">
                    {s.n}
                  </span>
                  <div>
                    <p className="text-white font-semibold text-sm">{s.t}</p>
                    <p className="text-[#8899aa] text-xs mt-0.5">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-white mb-4">Частые вопросы</h2>
            <div className="flex flex-col gap-3">
              {[
                {
                  q: "Какая комиссия Wildberries в 2026 году?",
                  a: "Зависит от категории: одежда и обувь — 43,5%, большинство других товаров — 23–28%. Плюс логистика FBW от 75 ₽ и хранение.",
                },
                {
                  q: "Какая маржа считается нормальной для WB?",
                  a: "Для товаров из Китая целевая маржа — от 30%. При марже 20–30% бизнес работает, но уязвим к росту курса и рекламных ставок. Меньше 20% — опасно.",
                },
                {
                  q: "Как включить таможню в расчёт маржи?",
                  a: "AI-калькулятор делает это автоматически. Для ручного расчёта: таможенная пошлина ~20% от таможенной стоимости + НДС 20% (для физлиц/ИП). Точный расчёт зависит от кода ТН ВЭД.",
                },
              ].map((item, i) => (
                <div key={i} className="bg-[#0d1b2e] border border-[#1a3050] rounded-2xl p-4">
                  <p className="text-white font-semibold text-sm mb-2">{item.q}</p>
                  <p className="text-[#8899aa] text-sm">{item.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Bottom CTA */}
          <div className="bg-[#0d1b2e] border border-[#1a3050] rounded-2xl p-6 text-center">
            <p className="text-white font-bold mb-2">Хотите помощь с расчётом?</p>
            <p className="text-[#8899aa] text-sm mb-4">Менеджер подберёт товар и рассчитает реальную маржу под ваш бюджет</p>
            <a
              href="https://t.me/ChinaBridgeLID_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#229ED9] text-white font-bold px-6 py-3 rounded-xl text-sm"
            >
              Написать в Telegram
            </a>
          </div>

        </div>
      </div>

      <Footer />
    </main>
  );
}
