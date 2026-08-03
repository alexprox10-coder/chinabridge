import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FAQSection } from "@/components/seo/FAQSection";
import { CTASection } from "@/components/seo/CTASection";

export const metadata: Metadata = {
  title: "Доставка из Китая в Москву — ChinaBridge",
  description: "Доставка грузов из Китая в Москву: сборные грузы от 50 кг, контейнеры, авиа. Срок 25–45 дней. Таможенное оформление включено. Рассчитайте стоимость.",
  keywords: "доставка из Китая в Москву, грузоперевозки Китай Москва, сборный груз в Москву из Китая",
  alternates: { canonical: "https://chinabridge.pro/delivery/china-moscow" },
  openGraph: {
    title: "Доставка из Китая в Москву — ChinaBridge",
    description: "Сборные грузы от 50 кг. Срок 25–45 дней. Таможня включена.",
    url: "https://chinabridge.pro/delivery/china-moscow",
    type: "website",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Доставка из Китая в Москву",
  provider: { "@type": "Organization", name: "ChinaBridge" },
  description: "Грузоперевозки из Китая в Москву: сборные грузы, контейнеры, авиа.",
  areaServed: { "@type": "City", name: "Москва" },
};

const FAQ = [
  {
    question: "Сколько стоит доставка из Китая в Москву?",
    answer: "Сборный груз авто: от $2.5 до $4 за кг в зависимости от маршрута. Авиа: от $6/кг. Контейнер 20' под ключ с растаможкой: от $5,000. Точная цена — в калькуляторе.",
  },
  {
    question: "Сколько дней идёт груз из Китая в Москву?",
    answer: "Авто через Казахстан: 25–35 дней. Авто через Дальний Восток + транзит по России: 35–45 дней. Авиа: 7–14 дней. Морской контейнер через Владивосток: 45–60 дней.",
  },
  {
    question: "Куда в Москве доставляете?",
    answer: "Доставляем до склада клиента в Москве и Московской области, до складов Wildberries и Ozon, до транспортных терминалов. Самовывоз с нашего московского склада также возможен.",
  },
  {
    question: "Занимаетесь таможенным оформлением?",
    answer: "Да, оформляем таможенные декларации через аккредитованного брокера. Пошлины, НДС и брокерские услуги включены в итоговую стоимость.",
  },
];

export default function MoscowDeliveryPage() {
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
          { label: "Доставка в Москву" },
        ]}
      />

      <section className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Доставка из Китая в Москву
        </h1>
        <p className="text-[#8899aa] text-lg max-w-2xl mb-8">
          Перевозим грузы из любого города Китая в Москву. Сборные грузы
          от 50 кг, полные контейнеры, авиадоставка. Таможенное оформление,
          страхование груза.
        </p>
        <Link
          href="/#calculator"
          className="inline-flex items-center gap-2 bg-[#00A86B] hover:bg-[#009060] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Рассчитать доставку →
        </Link>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Маршруты Китай → Москва</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { name: "Авто через Казахстан", time: "25–35 дней", price: "от $2.5/кг", desc: "Основной маршрут. Через Казахстан — Россия без морских пересадок." },
            { name: "Авто Дальний Восток", time: "35–45 дней", price: "от $3/кг", desc: "Через Хабаровск или Владивосток. Длиннее, но стабильный маршрут." },
            { name: "Авиа", time: "7–14 дней", price: "от $6/кг", desc: "Срочная доставка. Аэропорты Шереметьево, Домодедово, Внуково." },
          ].map((r) => (
            <div key={r.name} className="bg-[#0f2644]/60 border border-[#243a5e] rounded-2xl p-5">
              <h3 className="font-semibold mb-1">{r.name}</h3>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[#8899aa] text-sm">{r.time}</span>
                <span className="text-[#00A86B] text-sm font-medium">{r.price}</span>
              </div>
              <p className="text-[#8899aa] text-xs">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <FAQSection items={FAQ} />
      <CTASection />
    </main>
  );
}
