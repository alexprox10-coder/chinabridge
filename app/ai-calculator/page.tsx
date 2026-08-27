import type { Metadata } from "next";
import Script from "next/script";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AIEconomicsFunnel from "@/components/ai-funnel/AIEconomicsFunnel";

const CANONICAL = "https://chinabridge.pro/ai-calculator";

export const metadata: Metadata = {
  title: "Калькулятор маржи Wildberries и Ozon — юнит-экономика из Китая | ChinaBridge",
  description:
    "Бесплатный AI-калькулятор: вставьте ссылку с 1688 или Alibaba → получите расчёт маржи, ROI, таможни и прибыли на WB, Ozon, Kaspi за 15 секунд. Реальные тарифы 2026.",
  keywords: [
    "калькулятор маржи wildberries",
    "калькулятор маржи ozon",
    "юнит-экономика маркетплейс",
    "расчёт прибыли из китая",
    "калькулятор импорта из китая",
    "юнит экономика для селлеров",
    "расчёт юнит экономики wb",
    "калькулятор wb ozon маржа",
    "прибыль от товара из китая",
    "1688 калькулятор маржи",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Калькулятор маржи WB и Ozon — расчёт за 15 секунд | ChinaBridge",
    description:
      "Вставьте ссылку на товар с 1688 → AI рассчитает маржу, ROI, таможню и прибыль на Wildberries, Ozon, Kaspi. Бесплатно, без регистрации.",
    type:    "website",
    url:     CANONICAL,
    locale:  "ru_RU",
    siteName: "ChinaBridge",
    images: [{
      url:    "https://chinabridge.pro/og-calculator.png",
      width:  1200,
      height: 630,
      alt:    "ChinaBridge — AI калькулятор маржи для маркетплейсов",
    }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Калькулятор маржи WB/Ozon из Китая — бесплатно",
    description: "Вставьте ссылку с 1688 → маржа, ROI, таможня за 15 секунд",
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "name": "AI-калькулятор маржи для маркетплейсов — ChinaBridge",
      "url": CANONICAL,
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "description": "Бесплатный AI-калькулятор: вставьте ссылку с 1688 или Alibaba и получите расчёт маржи, ROI, таможни и прибыли на WB, Ozon, Kaspi за 15 секунд.",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "RUB" },
      "featureList": [
        "Расчёт маржи Wildberries",
        "Расчёт маржи Ozon",
        "Юнит-экономика маркетплейс",
        "AI-анализ товара с 1688",
        "Расчёт таможенных пошлин",
        "Три сценария: консервативный, базовый, оптимистичный",
        "Product Score 0-10",
        "Целевая цена закупки"
      ],
      "provider": {
        "@type": "Organization",
        "name": "ChinaBridge",
        "url": "https://chinabridge.pro"
      }
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Как рассчитать маржу товара на Wildberries?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Вставьте ссылку на товар с 1688 или Alibaba в AI-калькулятор ChinaBridge. Система автоматически рассчитает маржу с учётом комиссии WB 23%, логистики FBW, таможни и доставки из Китая."
          }
        },
        {
          "@type": "Question",
          "name": "Какая комиссия Wildberries в 2026 году?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Комиссия Wildberries в 2026 году составляет 23% для большинства товаров. Для одежды и обуви — 43,5%, для электроники — 23–28%. Логистика FBW: от 75 ₽/единицу."
          }
        },
        {
          "@type": "Question",
          "name": "Как считается юнит-экономика для маркетплейса?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Юнит-экономика = выручка минус себестоимость (закупка + доставка из Китая + таможня + логистика МП + комиссия + реклама). Маржа = чистая прибыль / выручка × 100%."
          }
        },
        {
          "@type": "Question",
          "name": "Сколько стоит доставка из Китая на WB?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Доставка из Китая включает: карго 3–6 USD/кг, таможню ~20% от стоимости товара. Итого на примере товара за 500 ₽ — от 150 до 400 ₽ на единицу в зависимости от веса."
          }
        }
      ]
    }
  ]
};

export default function AICalculatorPage() {
  return (
    <main>
      <Script
        id="ai-calculator-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <div className="relative min-h-screen bg-[#060f1e] pt-16 sm:pt-24 pb-24 sm:pb-24">
        {/* Background glow — absolute, not fixed, to avoid CLS */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -left-64 top-1/3 w-[700px] h-[700px] rounded-full bg-[#00A86B]/6 blur-[140px]" />
          <div className="absolute -right-40 bottom-1/4 w-[500px] h-[500px] rounded-full bg-[#00A86B]/4 blur-[120px]" />
        </div>

        <div className="relative max-w-2xl mx-auto px-4 sm:px-6">
          {/* Page header — compact on mobile */}
          <div className="text-center mb-4 sm:mb-10">
            <p className="hidden sm:block text-[#00A86B] text-xs font-semibold uppercase tracking-widest mb-3">
              AI Unit Economics
            </p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-4 leading-tight">
              Проверьте товар
              <span className="bg-gradient-to-r from-[#00A86B] to-[#00d48a] bg-clip-text text-transparent">
                {" "}перед закупкой
              </span>
            </h1>
            <p className="hidden sm:block text-[#8899aa] text-sm leading-relaxed max-w-lg mx-auto">
              Не покупайте вслепую — вставьте ссылку с 1688 или Alibaba и получите
              реальную маржу с учётом таможни, доставки и комиссии маркетплейса. Бесплатно.
            </p>
          </div>


          {/* Trust badges — hidden on mobile to keep form above fold */}
          <div className="hidden sm:flex flex-wrap justify-center gap-4 mb-8 text-xs text-[#8899aa]">
            {[
              { icon: "🎁", text: "Бесплатно · без ограничений" },
              { icon: "⚡", text: "Результат за 15 сек" },
              { icon: "🤖", text: "AI-анализ GPT-4o" },
              { icon: "🚀", text: "Реальные данные" },
            ].map(b => (
              <div key={b.text} className="flex items-center gap-1.5">
                <span>{b.icon}</span>
                <span>{b.text}</span>
              </div>
            ))}
          </div>

          {/* Funnel — explicit min-h prevents CLS on hydration */}
          <div id="calculator-top" className="min-h-[420px]">
            <AIEconomicsFunnel />
          </div>

          {/* Social proof */}
          <div className="mt-10 text-center">
            <p className="text-xs text-[#8899aa] mb-4">Работает с маркетплейсами</p>
            <div className="flex flex-wrap justify-center gap-6 text-xs text-[#8899aa]">
              <span>🛍️ Wildberries</span>
              <span>🟠 Ozon</span>
              <span>🇰🇿 Kaspi</span>
              <span>🟡 Яндекс Маркет</span>
              <span>📦 Оптовики</span>
            </div>
          </div>

          {/* ── SAMPLE RESULT — показываем что получит пользователь ─────────────── */}
          <div className="mt-14">
            <div className="text-center mb-6">
              <p className="text-xs font-semibold text-[#00A86B] uppercase tracking-widest mb-2">Пример расчёта</p>
              <h2 className="text-xl font-bold text-white">Вот что вы получите за 15 секунд</h2>
              <p className="text-sm text-[#8899aa] mt-1">Наушники TWS Bluetooth с 1688 → Wildberries</p>
            </div>

            {/* Result card */}
            <div className="rounded-2xl border border-[#243a5e] overflow-hidden bg-[#0B1F3A]/60 backdrop-blur-sm">

              {/* Header */}
              <div className="px-5 py-4 border-b border-[#243a5e] flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#8899aa]">Наушники TWS Bluetooth 5.3</p>
                  <p className="text-sm font-semibold text-white mt-0.5">¥38/шт · 100 штук · Wildberries · Москва</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-[#8899aa] uppercase mb-0.5">Product Score</p>
                  <p className="text-xl font-bold text-emerald-400">7.4<span className="text-xs text-[#8899aa] font-normal"> /10</span></p>
                </div>
              </div>

              {/* Scenario tabs */}
              <div className="flex border-b border-[#243a5e]">
                {[
                  { label: "Осторожный", margin: "18.3%", roi: "59%", profit: "+34 700 ₽", color: "text-amber-400" },
                  { label: "Базовый",    margin: "28.6%", roi: "107%", profit: "+57 200 ₽", color: "text-emerald-400", active: true },
                  { label: "Оптимистич.", margin: "36.1%", roi: "159%", profit: "+72 200 ₽", color: "text-emerald-400" },
                ].map(t => (
                  <div key={t.label} className={`flex-1 py-2.5 px-1 text-center border-b-2 ${t.active ? "border-[#00A86B] bg-[#00A86B]/10" : "border-transparent"}`}>
                    <p className={`text-[10px] font-medium ${t.active ? "text-[#00A86B]" : "text-[#8899aa]"}`}>{t.label}</p>
                  </div>
                ))}
              </div>

              {/* Key metrics */}
              <div className="grid grid-cols-3 divide-x divide-[#243a5e] border-b border-[#243a5e]">
                {[
                  { label: "Маржа", value: "28.6%", color: "text-emerald-400" },
                  { label: "ROI",   value: "107%",  color: "text-white" },
                  { label: "Прибыль", value: "+57 200 ₽", color: "text-emerald-400" },
                ].map(m => (
                  <div key={m.label} className="py-3 text-center">
                    <p className="text-[10px] text-[#8899aa] uppercase mb-0.5">{m.label}</p>
                    <p className={`text-base font-bold ${m.color}`}>{m.value}</p>
                  </div>
                ))}
              </div>

              {/* P&L breakdown */}
              <div className="divide-y divide-[#243a5e]/60">
                {[
                  { label: "Цена продажи (WB)",        value: "1 990 ₽",  color: "text-white" },
                  { label: "Закупка (¥38 × 6.8 + тамож.)", value: "−396 ₽", color: "text-[#8899aa]" },
                  { label: "Доставка из Китая (карго)", value: "−148 ₽",  color: "text-[#8899aa]" },
                  { label: "Комиссия WB 23%",           value: "−458 ₽",  color: "text-[#8899aa]" },
                  { label: "Логистика FBW",             value: "−87 ₽",   color: "text-[#8899aa]" },
                  { label: "Реклама (5%)",               value: "−100 ₽",  color: "text-[#8899aa]" },
                  { label: "Чистая прибыль / шт",       value: "+572 ₽",  color: "text-emerald-400", bold: true },
                ].map(row => (
                  <div key={row.label} className={`flex justify-between items-center px-5 py-2 text-sm ${row.bold ? "bg-[#00A86B]/5" : ""}`}>
                    <span className="text-[#8899aa] text-xs">{row.label}</span>
                    <span className={`font-semibold text-xs ${row.color} ${row.bold ? "text-sm" : ""}`}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Score bars */}
              <div className="px-5 py-4 border-t border-[#243a5e] bg-[#060f1e]/40">
                <p className="text-xs font-semibold text-[#8899aa] uppercase tracking-wide mb-3">Оценка товара</p>
                {[
                  { label: "Маржа (30%)",     pct: 78 },
                  { label: "ROI (20%)",        pct: 85 },
                  { label: "Цена (15%)",       pct: 70 },
                  { label: "Логистика (15%)",  pct: 90 },
                  { label: "Поставщик (10%)",  pct: 65 },
                  { label: "MOQ (10%)",         pct: 80 },
                ].map(bar => (
                  <div key={bar.label} className="flex items-center gap-2 text-xs mb-1.5">
                    <span className="w-32 text-[#8899aa] shrink-0">{bar.label}</span>
                    <div className="flex-1 h-1.5 bg-[#243a5e] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${bar.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA inside card */}
              <div className="px-5 py-4 border-t border-[#243a5e] bg-[#00A86B]/5 text-center">
                <p className="text-xs text-[#8899aa] mb-3">Рассчитайте <span className="text-white font-semibold">ваш товар</span> за 15 секунд — бесплатно</p>
                <a
                  href="#calculator-top"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00A86B] hover:bg-[#008f59] text-white font-semibold rounded-xl text-sm transition-all"
                >
                  🚀 Рассчитать свой товар ↑
                </a>
              </div>
            </div>

            <p className="text-center text-xs text-[#5a7899] mt-3">
              * Данные примерные. Реальный расчёт использует актуальный курс юаня и тарифы WB 2026.
            </p>
          </div>

          {/* Back to main calculator */}
          <div className="mt-8 text-center">
            <a
              href="/delivery-calculator"
              className="text-xs text-[#8899aa] hover:text-[#00A86B] transition-colors underline underline-offset-2"
            >
              Нужен детальный расчёт доставки? → Калькулятор доставки
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
