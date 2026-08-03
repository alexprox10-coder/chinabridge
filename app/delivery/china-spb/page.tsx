import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FAQSection } from "@/components/seo/FAQSection";
import { CTASection } from "@/components/seo/CTASection";

export const metadata: Metadata = {
  title: "Доставка из Китая в Санкт-Петербург — ChinaBridge",
  description: "Доставка грузов из Китая в Санкт-Петербург: сборные грузы, контейнеры, авиа. Срок 30–50 дней. Таможня, страхование. Рассчитайте стоимость.",
  keywords: "доставка из Китая в Санкт-Петербург, доставка из Китая в СПб, грузоперевозки Китай Питер",
  alternates: { canonical: "https://chinabridge.pro/delivery/china-spb" },
  openGraph: {
    title: "Доставка из Китая в Санкт-Петербург — ChinaBridge",
    description: "Сборные грузы из Китая в СПб. Срок 30–50 дней. Таможня включена.",
    url: "https://chinabridge.pro/delivery/china-spb",
    type: "website",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Доставка из Китая в Санкт-Петербург",
  provider: { "@type": "Organization", name: "ChinaBridge" },
  description: "Грузоперевозки из Китая в Санкт-Петербург.",
  areaServed: { "@type": "City", name: "Санкт-Петербург" },
};

const FAQ = [
  {
    question: "Сколько стоит доставка из Китая в Петербург?",
    answer: "Сборный груз авто: от $3 до $4.5 за кг. Авиа: от $6.5/кг. Стоимость немного выше, чем в Москву, из-за большего расстояния от пограничных переходов.",
  },
  {
    question: "Есть ли прямые рейсы Китай → Петербург?",
    answer: "Прямых авиарейсов для грузов мало. Обычно груз летит через Москву (Шереметьево) и довозится до Петербурга автотранспортом. Общий срок авиа+авто: 10–18 дней.",
  },
  {
    question: "Какие склады работают с вашими грузами в Петербурге?",
    answer: "Доставляем до склада клиента, до складов Wildberries (Шушары, Парголово) и Ozon в Петербурге. Возможна доставка до транспортных компаний.",
  },
];

export default function SpbDeliveryPage() {
  return (
    <main className="min-h-screen bg-[#0B1F3A] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Направления", href: "/delivery" },
          { label: "Доставка в Петербург" },
        ]}
      />

      <section className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Доставка из Китая в Санкт-Петербург
        </h1>
        <p className="text-[#8899aa] text-lg max-w-2xl mb-8">
          Перевозим грузы из Китая в Санкт-Петербург. Сборные грузы от 50 кг,
          полные контейнеры, авиадоставка через Москву. Таможня и страхование.
        </p>
        <Link
          href="/#calculator"
          className="inline-flex items-center gap-2 bg-[#00A86B] hover:bg-[#009060] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Рассчитать доставку →
        </Link>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Маршруты Китай → Петербург</h2>
        <div className="grid md:grid-cols-2 gap-5">
          {[
            { name: "Авто через Казахстан → Москва → СПб", time: "30–40 дней", price: "от $3/кг" },
            { name: "Авиа Китай → Москва → СПб", time: "10–18 дней", price: "от $6.5/кг" },
          ].map((r) => (
            <div key={r.name} className="bg-[#0f2644]/60 border border-[#243a5e] rounded-2xl p-5">
              <h3 className="font-semibold mb-2">{r.name}</h3>
              <div className="flex items-center gap-4">
                <span className="text-[#8899aa] text-sm">{r.time}</span>
                <span className="text-[#00A86B] font-medium">{r.price}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <FAQSection items={FAQ} />
      <CTASection />
    </main>
  );
}
