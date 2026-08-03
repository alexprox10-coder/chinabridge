import Header from "@/components/Header";
import Services from "@/components/Services";
import Calculator from "@/components/Calculator";
import Footer from "@/components/Footer";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { ServiceCard } from "@/components/seo/ServiceCard";
import { CTASection } from "@/components/seo/CTASection";

export const metadata: Metadata = {
  title: "Услуги доставки из Китая — ChinaBridge",
  description: "Все услуги ChinaBridge: доставка из Китая, выкуп с 1688, поиск поставщиков, сборные грузы, проверка товара. Расчёт стоимости онлайн.",
  keywords: "услуги доставки из Китая, выкуп с 1688, поиск поставщиков в Китае, сборный груз",
  alternates: { canonical: "https://chinabridge.pro/services" },
  openGraph: {
    title: "Услуги доставки из Китая — ChinaBridge",
    description: "Полный цикл: поставщик → выкуп → проверка → доставка в Россию.",
    url: "https://chinabridge.pro/services",
    type: "website",
  },
};

const SERVICE_LINKS = [
  { icon: "🚚", title: "Доставка из Китая", description: "Сборные грузы от 50 кг, контейнеры, авиа. Официальная таможня.", href: "/services/china-delivery" },
  { icon: "🛒", title: "Выкуп с 1688", description: "Закупаем по оптовым ценам 1688.com. Проверка поставщика.", href: "/services/1688-buyout" },
  { icon: "🔍", title: "Поиск поставщиков", description: "Находим надёжных производителей. Переговоры, образцы.", href: "/services/supplier-search" },
  { icon: "📦", title: "Сборные грузы", description: "Объединяем несколько заказов в одну отправку.", href: "/services/cargo-consolidation" },
  { icon: "✅", title: "Проверка товара", description: "Инспекция качества перед отправкой. Фотоотчёт.", href: "/services/inspection" },
];

export default function ServicesPage() {
  return (
    <main className="bg-[#0B1F3A]">
      <Header />
      <div className="pt-20">
        <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Услуги" }]} />
        <section className="max-w-6xl mx-auto px-4 py-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Наши услуги</h1>
          <p className="text-[#8899aa] text-lg max-w-2xl mb-8">
            Полный цикл работы с Китаем: от поиска поставщика до доставки в Россию и Казахстан.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
            {SERVICE_LINKS.map((s) => (
              <ServiceCard key={s.href} {...s} />
            ))}
          </div>
        </section>
        <Services />
        <Calculator />
        <CTASection />
      </div>
      <Footer />
    </main>
  );
}
