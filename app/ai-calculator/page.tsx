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
      "Вставьте ссылку на товар с 1688 → AI рассчитает маржу, ROI, таможню и прибыль на Wildberries, Ozon, Kaspi. Первый расчёт бесплатно.",
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
      <div className="min-h-screen bg-[#060f1e] pt-24 pb-24">
        {/* Background glow */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-64 top-1/3 w-[700px] h-[700px] rounded-full bg-[#00A86B]/6 blur-[140px]" />
          <div className="absolute -right-40 bottom-1/4 w-[500px] h-[500px] rounded-full bg-[#00A86B]/4 blur-[120px]" />
        </div>

        <div className="relative max-w-2xl mx-auto px-4 sm:px-6">
          {/* Page header */}
          <div className="text-center mb-10">
            <p className="text-[#00A86B] text-xs font-semibold uppercase tracking-widest mb-3">
              AI Unit Economics
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              Проверьте товар<br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-[#00A86B] to-[#00d48a] bg-clip-text text-transparent">
                {" "}перед закупкой из Китая
              </span>
            </h1>
            <p className="text-[#8899aa] text-sm leading-relaxed max-w-lg mx-auto">
              Не покупайте вслепую — вставьте ссылку с 1688 или Alibaba и получите
              реальную маржу с учётом таможни, доставки и комиссии маркетплейса. Бесплатно.
            </p>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-4 mb-8 text-xs text-[#8899aa]">
            {[
              { icon: "🎁", text: "3 расчёта бесплатно" },
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

          {/* Funnel */}
          <AIEconomicsFunnel />

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
