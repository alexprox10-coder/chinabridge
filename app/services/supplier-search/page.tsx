import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FAQSection } from "@/components/seo/FAQSection";
import { CTASection } from "@/components/seo/CTASection";
import { ServiceCard } from "@/components/seo/ServiceCard";

export const metadata: Metadata = {
  title: "Поиск поставщиков в Китае — ChinaBridge",
  description: "Находим надёжных производителей и поставщиков в Китае. Проверка документов, визит на фабрику, переговоры. Работаем с Alibaba, 1688, собственной базой.",
  keywords: "поиск поставщика в Китае, найти производителя в Китае, проверка поставщика Китай, поставщик из Китая",
  alternates: { canonical: "https://chinabridge.pro/services/supplier-search" },
  openGraph: {
    title: "Поиск поставщиков в Китае — ChinaBridge",
    description: "Найдём надёжного производителя в Китае. Проверка, визит на фабрику, переговоры.",
    url: "https://chinabridge.pro/services/supplier-search",
    type: "website",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Поиск поставщиков в Китае",
  provider: { "@type": "Organization", name: "ChinaBridge" },
  description: "Поиск и проверка надёжных производителей и поставщиков в Китае.",
  areaServed: "CN",
  serviceType: "Торговое посредничество",
};

const FAQ = [
  {
    question: "Сколько времени занимает поиск поставщика?",
    answer: "Базовый поиск и первичная проверка — 3–5 рабочих дней. С выездом на фабрику — 7–14 дней в зависимости от региона Китая.",
  },
  {
    question: "Что входит в проверку поставщика?",
    answer: "Проверяем Business License, историю компании на торговых платформах, физическое существование производства. Для крупных заказов — личный визит, фотоотчёт, образцы.",
  },
  {
    question: "Вы работаете с конкретными нишами или с любыми товарами?",
    answer: "Работаем с любыми легальными товарами: электроника, одежда, оборудование, строительные материалы, автозапчасти, товары для дома. Есть ограничения по санкционным категориям.",
  },
  {
    question: "Что делать, если поставщик не подошёл?",
    answer: "Ищем альтернативы до результата. Обычно предлагаем 3–5 проверенных вариантов — вы выбираете лучший по цене, качеству и условиям работы.",
  },
];

export default function SupplierSearchPage() {
  return (
    <main className="min-h-screen bg-[#0B1F3A] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Услуги", href: "/services" },
          { label: "Поиск поставщиков" },
        ]}
      />

      <section className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Поиск поставщиков в Китае
        </h1>
        <p className="text-[#8899aa] text-lg max-w-2xl mb-8">
          Находим надёжных производителей под ваш запрос. Проверяем документы,
          договариваемся об условиях, организуем образцы. Вы получаете готовый
          список проверенных поставщиков.
        </p>
        <Link
          href="/#calculator"
          className="inline-flex items-center gap-2 bg-[#00A86B] hover:bg-[#009060] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Рассчитать доставку →
        </Link>
      </section>

      {/* What we check */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Что мы проверяем</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: "📋", title: "Юридические документы", desc: "Business License, срок работы компании, уставный капитал" },
            { icon: "🏭", title: "Производство", desc: "Физический адрес, мощности, оборудование, складские запасы" },
            { icon: "⭐", title: "Репутация", desc: "История на 1688/Alibaba, отзывы, объём торговли" },
            { icon: "💬", title: "Переговоры", desc: "Уточняем цену, MOQ, сроки, возможность кастомизации" },
            { icon: "📦", title: "Образцы", desc: "Организуем заказ и доставку образцов перед крупной партией" },
            { icon: "📸", title: "Фотоотчёт", desc: "Фотографии производства, склада и товара с нашим маркером" },
          ].map((item) => (
            <div key={item.title} className="bg-[#0f2644]/60 border border-[#243a5e] rounded-2xl p-5">
              <span className="text-2xl mb-3 block">{item.icon}</span>
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-[#8899aa] text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Related */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Следующий шаг</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <ServiceCard icon="🛒" title="Выкуп с 1688" description="Выкупим товар у найденного поставщика" href="/services/1688-buyout" />
          <ServiceCard icon="✅" title="Проверка товара" description="Инспекция качества партии перед отправкой" href="/services/inspection" />
          <ServiceCard icon="🚚" title="Доставка из Китая" description="Привезём товар после выкупа" href="/services/china-delivery" />
        </div>
      </section>

      <FAQSection items={FAQ} />
      <CTASection />
    </main>
  );
}
