import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { ServiceCard } from "@/components/seo/ServiceCard";
import { CTASection } from "@/components/seo/CTASection";

export const metadata: Metadata = {
  title: "Доставка из Китая по городам России — ChinaBridge",
  description: "Доставка грузов из Китая в Москву, Санкт-Петербург, Хабаровск, Благовещенск и Казахстан. Сборные грузы, таможня, страхование.",
  alternates: { canonical: "https://chinabridge.pro/delivery" },
};

const CITIES = [
  { icon: "🏙️", title: "Доставка в Москву", description: "Сборные грузы и контейнеры из любого города Китая в Москву. 25–45 дней.", href: "/delivery/china-moscow" },
  { icon: "🌊", title: "Доставка в Петербург", description: "Доставка из Китая в Санкт-Петербург. Авто и морские маршруты.", href: "/delivery/china-spb" },
  { icon: "🦅", title: "Доставка в Хабаровск", description: "Короткий маршрут через Дальний Восток. Благоприятное расположение.", href: "/delivery/china-khabarovsk" },
  { icon: "🌸", title: "Доставка в Благовещенск", description: "Граница с Китаем — минимальные сроки доставки.", href: "/delivery/china-blagoveshchensk" },
  { icon: "🇰🇿", title: "Доставка в Казахстан", description: "Доставка из Китая в Алматы, Астану и другие города Казахстана.", href: "/delivery/china-kazakhstan" },
];

export default function DeliveryIndexPage() {
  return (
    <main className="min-h-screen bg-[#0B1F3A] text-white">
      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Направления доставки" },
        ]}
      />

      <section className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Направления доставки из Китая
        </h1>
        <p className="text-[#8899aa] text-lg max-w-2xl mb-10">
          Доставляем грузы из Китая в крупные города России и Казахстана.
          Сборные грузы, контейнеры, авиа — выберите удобное направление.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CITIES.map((c) => (
            <ServiceCard key={c.href} {...c} />
          ))}
        </div>
      </section>

      <CTASection />
    </main>
  );
}
