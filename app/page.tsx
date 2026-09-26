import type { Metadata } from "next";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import KzRatesBanner from "@/components/KzRatesBanner";
import RatesSection from "@/components/RatesSection";
import ForWhom from "@/components/ForWhom";
import Advantages from "@/components/Advantages";
import GtdCompareBlock from "@/components/GtdCompareBlock";
import ImportEcosystemBlock from "@/components/ImportEcosystemBlock";
import Services from "@/components/Services";
import Directions from "@/components/Directions";
import Cases from "@/components/Cases";
import TrustBlock from "@/components/TrustBlock";
import Calculator from "@/components/Calculator";
import LeadMagnetSection from "@/components/LeadMagnetSection";
import LogisticsAuditSection from "@/components/LogisticsAuditSection";
import FAQ from "@/components/FAQ";
import TelegramChannelBanner from "@/components/TelegramChannelBanner";
import KnowledgePromoBlock from "@/components/KnowledgePromoBlock";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Доставка из Китая в Россию и Казахстан | ChinaBridge",
  description:
    "ChinaBridge — доставка из Китая под ключ в Россию и Казахстан. Найдём поставщика, проверим фабрику, оформим таможню, доставим до склада. Авто, авиа, Хэйхэ — Благовещенск.",
  keywords: [
    "доставка из Китая",
    "доставка из Китая под ключ",
    "импорт из Китая",
    "карго из Китая",
    "доставка из Китая в Россию",
    "доставка из Китая в Казахстан",
    "поставка из Китая WB Ozon Kaspi",
    "таможенное оформление Китай",
    "поиск поставщика в Китае",
    "закупка на 1688",
    "сборные грузы из Китая",
    "ChinaBridge",
  ],
  alternates: { canonical: "https://chinabridge.pro" },
  openGraph: {
    title: "Доставка из Китая в Россию и Казахстан | ChinaBridge",
    description:
      "Доставка из Китая под ключ: найдём поставщика, проверим фабрику, оформим таможню, доставим. WB, Ozon, Kaspi. Авто, авиа, маршрут через Хэйхэ.",
    url: "https://chinabridge.pro",
    siteName: "ChinaBridge",
    locale: "ru_RU",
    type: "website",
  },
};

const schemaOrg = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://chinabridge.pro/#organization",
      name: "ChinaBridge",
      url: "https://chinabridge.pro",
      description: "Белый импорт из Китая в Россию и Казахстан на AI-платформе",
      foundingDate: "2019",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        availableLanguage: ["Russian"],
        url: "https://t.me/ChinaBridgeLID_bot?start=landing",
      },
    },
    {
      "@type": "Service",
      "@id": "https://chinabridge.pro/#service",
      name: "Импорт из Китая под ключ",
      provider: { "@id": "https://chinabridge.pro/#organization" },
      description:
        "Полный цикл импорта: поиск поставщика, инспекция фабрики, выкуп товара, таможня, логистика до склада.",
      areaServed: ["Russia", "Kazakhstan"],
      serviceType: "Import Logistics",
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://chinabridge.pro/#platform",
      name: "ChinaBridge AI Platform",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", priceCurrency: "RUB" },
      description:
        "SaaS-платформа для карго-компаний с AI-директорами, CRM, финансами и аналитикой.",
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />
      <main>
        <Header />
        <Hero />
        <RatesSection />
        <KzRatesBanner />

        {/* ── §12 БЛОК ХЭЙХЭ ──────────────────────────────────────────────── */}
        <section className="py-14 bg-[#060f1e]">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Left: Heihe info */}
              <div>
                <span className="inline-block text-xs font-semibold tracking-widest text-[#00A86B] uppercase mb-3">
                  Новый маршрут для России
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Хэйхэ → Благовещенск → Россия
                </h2>
                <p className="text-[#8899aa] text-sm leading-relaxed mb-6">
                  Один из маршрутов ChinaBridge для доставки коммерческих партий из Китая в Россию.
                  Груз консолидируется на складе логистического партнёра в Хэйхэ, проходит через
                  международный переход в Благовещенск, после чего организуется таможенное оформление
                  и дальнейшая доставка по России.
                </p>
                <div className="flex flex-wrap gap-3 mb-6">
                  {[
                    { icon: "📦", label: "от 100 кг" },
                    { icon: "🗓", label: "3–7 дней до границы" },
                    { icon: "🤝", label: "Партнёр ТПТ" },
                    { icon: "🛃", label: "Таможня через партнёра" },
                  ].map((b) => (
                    <span key={b.label} className="inline-flex items-center gap-1.5 text-xs bg-[#0f2644] border border-[#243a5e] text-[#8899aa] rounded-full px-3 py-1.5">
                      {b.icon} {b.label}
                    </span>
                  ))}
                </div>
                <a
                  href="/delivery/kitai-heihe-blagoveshchensk"
                  className="inline-flex items-center gap-2 bg-[#00A86B] hover:bg-[#009060] text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  Подробнее о маршруте →
                </a>
              </div>

              {/* Right: route chain */}
              <div className="bg-[#0f2644]/70 border border-[#243a5e] rounded-2xl p-6">
                <p className="text-xs text-[#8899aa] uppercase tracking-widest mb-4">Цепочка поставки</p>
                {[
                  { icon: "🏭", step: "Поставщик в Китае", sub: "Гуанчжоу, Иу, Шэньчжэнь" },
                  { icon: "🏢", step: "Склад партнёра в Хэйхэ", sub: "Консолидация, упаковка" },
                  { icon: "🌉", step: "Переход Хэйхэ — Благовещенск", sub: "Международный мост" },
                  { icon: "🛃", step: "Таможенное оформление", sub: "Декларант партнёра" },
                  { icon: "🚛", step: "Доставка по России", sub: "Москва, СПб, регионы" },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
                    <div className="w-8 h-8 rounded-lg bg-[#00A86B]/10 flex items-center justify-center text-base shrink-0">
                      {s.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{s.step}</p>
                      <p className="text-xs text-[#8899aa]">{s.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── §13 БЛОК КАЗАХСТАН ────────────────────────────────────────────── */}
        <section className="py-10 bg-[#050e1d]">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-[#0f2644]/60 border border-[#243a5e] rounded-2xl px-7 py-6">
              <div className="flex items-center gap-4">
                <span className="text-3xl">🇰🇿</span>
                <div>
                  <h3 className="text-lg font-bold text-white">Доставка из Китая в Казахстан</h3>
                  <p className="text-sm text-[#8899aa]">
                    Алматы, Астана, Шымкент — авто 18–22 дня, авиа 5–8 дней. Kaspi, WB KZ, Ozon KZ.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["Авто $2.50/кг", "Авиа $23/кг", "Kaspi.kz", "Представитель в Китае"].map(t => (
                      <span key={t} className="text-xs bg-[#0B1F3A] border border-[#243a5e] text-[#8899aa] rounded-full px-2.5 py-1">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
              <a
                href="/delivery/china-kazakhstan"
                className="shrink-0 inline-flex items-center gap-2 border border-[#00A86B]/50 hover:bg-[#00A86B]/10 text-[#00A86B] font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm whitespace-nowrap"
              >
                Рассчитать в KZ →
              </a>
            </div>
          </div>
        </section>

        <Calculator />
        <HowItWorks />

        {/* ── VIDEO: Сборный груз ──────────────────────────────────────────── */}
        <section className="py-14 bg-[#050e1d]">
          <div className="max-w-2xl mx-auto px-4">
            <div className="text-center mb-6">
              <p className="text-xs font-semibold text-[#00A86B] uppercase tracking-widest mb-2">Сборный груз из Китая</p>
              <h2 className="text-2xl font-bold text-white">Как выглядит ваш груз на нашем складе</h2>
              <p className="text-sm text-[#8899aa] mt-1">Еженедельные рейсы в Россию и Казахстан</p>
            </div>
            <div className="rounded-2xl overflow-hidden border border-[#1a3a5c]" style={{aspectRatio: '16/9'}}>
              <iframe
                src="https://www.youtube.com/embed/fwBtwO6HgAc?rel=0&modestbranding=1"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        </section>

<ForWhom />
        <Advantages />
        <GtdCompareBlock />
        <ImportEcosystemBlock />
        <Services />
        <Directions />
        <Cases />
        <TrustBlock />
        <LogisticsAuditSection />
        <LeadMagnetSection />
        <FAQ />
        <KnowledgePromoBlock />
        <TelegramChannelBanner />
        <Footer />
      </main>
    </>
  );
}
