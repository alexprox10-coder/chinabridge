import type { Metadata } from "next";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import DirectionsSplit from "@/components/DirectionsSplit";
import HowItWorks from "@/components/HowItWorks";
import KzRatesBanner from "@/components/KzRatesBanner";
import WarehouseGallery from "@/components/WarehouseGallery";
import ForWhom from "@/components/ForWhom";
import Advantages from "@/components/Advantages";
import ImportEcosystemBlock from "@/components/ImportEcosystemBlock";
import Services from "@/components/Services";
import Directions from "@/components/Directions";
import Cases from "@/components/Cases";
import TrustBlock from "@/components/TrustBlock";
import Calculator from "@/components/Calculator";
import LeadMagnetSection from "@/components/LeadMagnetSection";
import FAQ from "@/components/FAQ";
import TelegramChannelBanner from "@/components/TelegramChannelBanner";
import KnowledgePromoBlock from "@/components/KnowledgePromoBlock";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Импорт из Китая под ключ | AI-платформа ChinaBridge",
  description:
    "ChinaBridge — импорт из Китая в Россию и Казахстан на AI-платформе. Поиск поставщика, проверка фабрики, таможня, логистика. Сборные грузы от 50 кг.",
  keywords: [
    "импорт из Китая",
    "импорт из Китая под ключ",
    "белый импорт из Китая",
    "AI платформа импорт",
    "карго из Китая",
    "доставка Китай Россия",
    "доставка Китай Казахстан",
    "таможенное оформление Китай",
    "поиск поставщика в Китае",
    "проверка фабрики в Китае",
    "сборные грузы из Китая",
    "WB Ozon поставка из Китая",
    "ChinaBridge",
  ],
  alternates: { canonical: "https://chinabridge.pro" },
  openGraph: {
    title: "Импорт из Китая под ключ | AI-платформа ChinaBridge",
    description:
      "Белый импорт из Китая: AI-платформа + представитель в Китае. Поиск, инспекция, логистика, таможня. От 50 кг.",
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
      logo: "https://chinabridge.pro/images/logo.png",
      description: "Белый импорт из Китая в Россию и Казахстан на AI-платформе",
      foundingDate: "2019",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        availableLanguage: ["Russian"],
        url: "https://t.me/ChinaBridgeLID_bot",
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
        <KzRatesBanner />
        <DirectionsSplit />
        <HowItWorks />
        <WarehouseGallery />
        <ForWhom />
        <Advantages />
        <ImportEcosystemBlock />
        <Services />
        <Directions />
        <Cases />
        <TrustBlock />
        <Calculator />
        <LeadMagnetSection />
        <FAQ />
        <KnowledgePromoBlock />
        <TelegramChannelBanner />
        <Footer />
      </main>
    </>
  );
}
