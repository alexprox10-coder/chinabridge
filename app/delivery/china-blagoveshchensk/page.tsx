import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FAQSection } from "@/components/seo/FAQSection";
import { CTASection } from "@/components/seo/CTASection";

export const metadata: Metadata = {
  title: "Доставка из Китая в Благовещенск — ChinaBridge",
  description: "Доставка из Китая в Благовещенск. Граница с Хэйхэ — минимальные сроки. Сборные грузы, авиа. Таможня, страхование. Рассчитайте стоимость.",
  keywords: "доставка из Китая в Благовещенск, Хэйхэ Благовещенск доставка, грузоперевозки Китай Благовещенск",
  alternates: { canonical: "https://chinabridge.pro/delivery/china-blagoveshchensk" },
  openGraph: {
    title: "Доставка из Китая в Благовещенск — ChinaBridge",
    description: "Граница с Хэйхэ — минимальный путь из Китая. Быстро и выгодно.",
    url: "https://chinabridge.pro/delivery/china-blagoveshchensk",
    type: "website",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Доставка из Китая в Благовещенск",
  provider: { "@type": "Organization", name: "ChinaBridge" },
  areaServed: { "@type": "City", name: "Благовещенск" },
};

const FAQ = [
  {
    question: "Что такое коридор Хэйхэ–Благовещенск?",
    answer: "Хэйхэ — китайский город прямо через реку Амур от Благовещенска. Паромная переправа летом и ледовый переход зимой. Это один из самых удобных пунктов пропуска для малого и среднего бизнеса.",
  },
  {
    question: "Какие грузы идут через Благовещенск?",
    answer: "Любые легальные товары: одежда, электроника, строительные материалы, промышленные товары. Ограничения — стандартные таможенные правила.",
  },
  {
    question: "Сколько стоит доставка из Хэйхэ в Благовещенск?",
    answer: "Переправа Хэйхэ–Благовещенск — от $50 до $200 за партию в зависимости от веса и сезона. Таможенное оформление — отдельно.",
  },
];

export default function BlagoveshchenskDeliveryPage() {
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
          { label: "Доставка в Благовещенск" },
        ]}
      />

      <section className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Доставка из Китая в Благовещенск
        </h1>
        <p className="text-[#8899aa] text-lg max-w-2xl mb-8">
          Благовещенск находится прямо на границе с Китаем — через Амур город Хэйхэ.
          Один из самых коротких и удобных маршрутов для грузов из Китая.
        </p>
        <Link
          href="/#calculator"
          className="inline-flex items-center gap-2 bg-[#00A86B] hover:bg-[#009060] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Рассчитать доставку →
        </Link>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-5">
          {[
            { name: "Авто из Хэйхэ + переправа", time: "3–7 дней", price: "от $2/кг", note: "Самый короткий маршрут — прямо через Амур" },
            { name: "Авто из Гуанчжоу/Иу", time: "18–28 дней", price: "от $2.5/кг", note: "Из южного Китая через Хэйхэ" },
          ].map((r) => (
            <div key={r.name} className="bg-[#0f2644]/60 border border-[#243a5e] rounded-2xl p-5">
              <h3 className="font-semibold mb-1">{r.name}</h3>
              <p className="text-[#8899aa] text-xs mb-2">{r.note}</p>
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
