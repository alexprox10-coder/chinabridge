import type { Metadata } from "next";
import Script from "next/script";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ImportAuditForm from "@/components/ImportAuditForm";

const CANONICAL = "https://chinabridge.pro/import-audit";

export const metadata: Metadata = {
  title: "Бесплатный аудит импорта из Китая за 15 минут | ChinaBridge",
  description:
    "Уже возите из Китая? Бесплатный экспресс-аудит: найдём 1–3 конкретные точки утечки прибыли в вашей схеме доставки и дадим план на 30 дней.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Аудит импорта из Китая — бесплатно за 15 минут | ChinaBridge",
    description: "Найдём где вы теряете прибыль на таможне, логистике или у поставщика. Конкретный план действий.",
    type:     "website",
    url:      CANONICAL,
    locale:   "ru_RU",
    siteName: "ChinaBridge",
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type":    "Service",
  "name":     "Бесплатный аудит схемы импорта из Китая",
  "url":      CANONICAL,
  "provider": { "@type": "Organization", "name": "ChinaBridge", "url": "https://chinabridge.pro" },
  "description": "Экспресс-аудит за 15 минут: анализ маржи, логистики, поставщиков и таможни. Конкретный план улучшений.",
  "offers":   { "@type": "Offer", "price": "0", "priceCurrency": "RUB" },
};

const AUDIT_POINTS = [
  { icon: "📉", title: "Маржа", text: "Найдём, где именно уходит прибыль — комиссии, логистика, курс" },
  { icon: "🏭", title: "Поставщик", text: "Сравним вашу закупочную цену с рыночными benchmarks" },
  { icon: "🚢", title: "Логистика", text: "Проверим маршрут и тарифы — часто экономия 15–25% лежит здесь" },
  { icon: "🛃", title: "Таможня", text: "Убедимся, что используется оптимальный код ТН ВЭД и ставка пошлины" },
];

export default function ImportAuditPage() {
  return (
    <main>
      <Script
        id="import-audit-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <div className="min-h-screen bg-[#060f1e] pt-24 pb-24">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-64 top-1/3 w-[700px] h-[700px] rounded-full bg-[#00A86B]/5 blur-[140px]" />
          <div className="absolute -right-40 bottom-1/4 w-[500px] h-[500px] rounded-full bg-[#00A86B]/4 blur-[120px]" />
        </div>

        <div className="relative max-w-2xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-10">
            <p className="text-[#00A86B] text-xs font-semibold uppercase tracking-widest mb-3">
              Для тех, кто уже возит из Китая
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              Бесплатный аудит<br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-[#00A86B] to-[#00d48a] bg-clip-text text-transparent">
                {" "}вашей схемы импорта
              </span>
            </h1>
            <p className="text-[#8899aa] text-sm leading-relaxed max-w-lg mx-auto">
              За 15 минут найдём конкретные точки утечки прибыли в вашей схеме —
              и дадим план, как их устранить в ближайшие 30 дней.
            </p>
          </div>

          {/* What we check */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {AUDIT_POINTS.map(p => (
              <div key={p.title} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
                <p className="text-xl mb-1.5">{p.icon}</p>
                <p className="text-white text-sm font-semibold mb-1">{p.title}</p>
                <p className="text-[#8899aa] text-xs leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>

          {/* Form card */}
          <div className="bg-[#0a1829] border border-[#1a3050] rounded-2xl p-6 mb-8">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white mb-1">Записаться на аудит</h2>
              <p className="text-sm text-[#8899aa]">Бесплатно · 15 минут · Конкретный результат</p>
            </div>
            <ImportAuditForm />
          </div>

          {/* Trust section */}
          <div className="text-center">
            <p className="text-xs text-[#8899aa] mb-4">Уже провели аудит для 50+ импортёров в 2026 году</p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-[#8899aa]">
              <span>✓ Электроника</span>
              <span>✓ Одежда и обувь</span>
              <span>✓ Оборудование</span>
              <span>✓ Автозапчасти</span>
              <span>✓ Мебель</span>
            </div>
          </div>

          {/* CTA to calculator */}
          <div className="mt-8 text-center">
            <a
              href="/ai-calculator"
              className="text-xs text-[#8899aa] hover:text-[#00A86B] transition-colors underline underline-offset-2"
            >
              Ещё не выбрали товар? → Бесплатный AI-калькулятор маржи
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
