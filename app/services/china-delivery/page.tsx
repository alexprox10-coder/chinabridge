import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FAQSection } from "@/components/seo/FAQSection";
import { CTASection } from "@/components/seo/CTASection";
import { ServiceCard } from "@/components/seo/ServiceCard";

export const metadata: Metadata = {
  title: "Доставка из Китая в Россию — ChinaBridge",
  description: "Доставка грузов из Китая в Россию: сборные грузы от 50 кг, контейнеры, авиа. Официальное таможенное оформление. Рассчитайте стоимость онлайн.",
  keywords: "доставка из Китая в Россию, грузоперевозки из Китая, сборный груз из Китая, доставка товаров из Китая",
  alternates: { canonical: "https://chinabridge.pro/services/china-delivery" },
  openGraph: {
    title: "Доставка из Китая в Россию — ChinaBridge",
    description: "Сборные грузы от 50 кг, контейнеры, авиа. Официальная таможня. Рассчитайте онлайн.",
    url: "https://chinabridge.pro/services/china-delivery",
    type: "website",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Доставка из Китая в Россию",
  provider: { "@type": "Organization", name: "ChinaBridge" },
  description: "Грузоперевозки из Китая в Россию: сборные грузы, контейнеры, авиа. Официальное таможенное оформление.",
  areaServed: "RU",
  serviceType: "Грузоперевозки",
};

const FAQ = [
  {
    question: "Сколько стоит доставка сборного груза из Китая?",
    answer: "Стоимость сборного груза — от $2.5 до $5 за кг в зависимости от маршрута и характеристик груза. Точную цену рассчитайте в нашем калькуляторе — это займёт 30 секунд.",
  },
  {
    question: "Какой минимальный вес для сборной доставки?",
    answer: "Минимальный вес для сборного груза — 50 кг или 0.1 м³. Для меньших объёмов рассмотрите почтовые отправления или доставку через маркетплейсы.",
  },
  {
    question: "Сколько времени занимает доставка из Китая?",
    answer: "Авто через Казахстан/Монголию — 25–35 дней, через Дальний Восток — 30–45 дней. Авиа — 5–14 дней. Морем через Владивосток — 35–55 дней.",
  },
  {
    question: "Вы занимаетесь таможенным оформлением?",
    answer: "Да, мы предоставляем полный цикл: от закупки в Китае до таможенного оформления и доставки по России. Работаем с официальным таможенным брокером.",
  },
  {
    question: "Какие товары нельзя доставить из Китая?",
    answer: "Запрещены: оружие, наркотики, контрафактная продукция, опасные материалы, товары под санкциями. По некоторым категориям (БАД, электроника, детские товары) требуется сертификация.",
  },
];

export default function ChinaDeliveryPage() {
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
          { label: "Доставка из Китая" },
        ]}
      />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Доставка из Китая в Россию
        </h1>
        <p className="text-[#8899aa] text-lg max-w-2xl mb-8">
          Перевозим грузы из любого города Китая в Россию. Сборные грузы от 50 кг,
          контейнеры, авиа. Официальная таможня, страхование груза.
        </p>
        <Link
          href="/#calculator"
          className="inline-flex items-center gap-2 bg-[#00A86B] hover:bg-[#009060] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Рассчитать доставку →
        </Link>
      </section>

      {/* Ways */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Способы доставки</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: "🚛",
              title: "Автомобильная доставка",
              desc: "Через Казахстан, Монголию или Дальний Восток. Оптимальное соотношение цены и скорости для грузов от 50 кг.",
              terms: "25–45 дней",
              price: "от $2.5/кг",
            },
            {
              icon: "✈️",
              title: "Авиадоставка",
              desc: "Самый быстрый способ. Подходит для срочных партий, дорогостоящих товаров небольшого объёма.",
              terms: "5–14 дней",
              price: "от $6/кг",
            },
            {
              icon: "🚢",
              title: "Морская доставка",
              desc: "Полные контейнеры 20' и 40' для крупных партий. Самая выгодная цена за кг при больших объёмах.",
              terms: "35–55 дней",
              price: "от $2/кг",
            },
          ].map((item) => (
            <div key={item.title} className="bg-[#0f2644]/60 border border-[#243a5e] rounded-2xl p-6">
              <span className="text-3xl mb-3 block">{item.icon}</span>
              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-[#8899aa] text-sm mb-4">{item.desc}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#8899aa]">Срок: <span className="text-white">{item.terms}</span></span>
                <span className="text-[#00A86B] font-medium">{item.price}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Как работает доставка</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { step: "1", title: "Заявка", desc: "Рассчитайте стоимость в калькуляторе и отправьте заявку" },
            { step: "2", title: "Закупка", desc: "Наш представитель в Китае выкупает товар у поставщика" },
            { step: "3", title: "Отправка", desc: "Консолидируем груз на складе в Китае и отправляем" },
            { step: "4", title: "Доставка", desc: "Растаможиваем и доставляем до вашего склада в России" },
          ].map((item) => (
            <div key={item.step} className="bg-[#0f2644]/40 border border-[#243a5e] rounded-xl p-5">
              <div className="w-8 h-8 rounded-full bg-[#00A86B] text-white text-sm font-bold flex items-center justify-center mb-3">
                {item.step}
              </div>
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-[#8899aa] text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Related services */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Связанные услуги</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ServiceCard icon="🛒" title="Выкуп с 1688" description="Закупка товаров у китайских поставщиков" href="/services/1688-buyout" />
          <ServiceCard icon="🔍" title="Поиск поставщиков" description="Находим надёжных производителей в Китае" href="/services/supplier-search" />
          <ServiceCard icon="📦" title="Сборные грузы" description="Объединяем несколько заказов в одну отправку" href="/services/cargo-consolidation" />
          <ServiceCard icon="✅" title="Проверка товара" description="Инспекция качества перед отправкой" href="/services/inspection" />
        </div>
      </section>

      <FAQSection items={FAQ} />
      <CTASection />
    </main>
  );
}
