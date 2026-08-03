import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FAQSection } from "@/components/seo/FAQSection";
import { CTASection } from "@/components/seo/CTASection";
import { ServiceCard } from "@/components/seo/ServiceCard";

export const metadata: Metadata = {
  title: "Сборные грузы из Китая — консолидация от 50 кг | ChinaBridge",
  description: "Сборные грузы из Китая в Россию: объединяем несколько заказов в одну отправку. От 50 кг. Экономия на доставке до 40% vs индивидуальные отправки.",
  keywords: "сборный груз из Китая, консолидация грузов Китай, LCL доставка Китай, совместная доставка из Китая",
  alternates: { canonical: "https://chinabridge.pro/services/cargo-consolidation" },
  openGraph: {
    title: "Сборные грузы из Китая — консолидация от 50 кг | ChinaBridge",
    description: "Объединяем грузы разных поставщиков в одну отправку. Экономия до 40%.",
    url: "https://chinabridge.pro/services/cargo-consolidation",
    type: "website",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Сборные грузы из Китая",
  provider: { "@type": "Organization", name: "ChinaBridge" },
  description: "Консолидация и доставка сборных грузов из Китая в Россию. От 50 кг.",
  areaServed: "RU",
  serviceType: "Грузоперевозки",
};

const FAQ = [
  {
    question: "Что такое сборный груз?",
    answer: "Сборный груз (LCL, Less than Container Load) — когда несколько разных клиентов объединяют свои товары в одном контейнере или транспортном средстве. Каждый платит только за свою долю, а не за весь контейнер.",
  },
  {
    question: "Какой минимальный объём для сборной доставки?",
    answer: "Минимум — 50 кг или 0.1 м³. При меньших объёмах выгоднее использовать почтовые службы или экспресс-доставку.",
  },
  {
    question: "Можно ли объединить товары от разных поставщиков?",
    answer: "Да, это основная суть услуги. Принимаем товар от нескольких поставщиков на наш склад в Китае, консолидируем и отправляем одной партией. Вы экономите на доставке по Китаю и международном фрахте.",
  },
  {
    question: "Как рассчитывается стоимость сборного груза?",
    answer: "По реальному или объёмному весу (что больше). Объёмный вес = Д×Ш×В (см) / 6000. Тариф — от $2.5 до $5 за расчётный кг в зависимости от маршрута.",
  },
  {
    question: "Чем сборный груз отличается от полного контейнера?",
    answer: "Полный контейнер (FCL) арендуется целиком — от $3,500 за 20-футовый. Сборный груз оплачивается только за занятое место. Для партий до 8–10 м³ сборный груз выгоднее.",
  },
];

export default function CargoConsolidationPage() {
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
          { label: "Сборные грузы" },
        ]}
      />

      <section className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Сборные грузы из Китая
        </h1>
        <p className="text-[#8899aa] text-lg max-w-2xl mb-8">
          Объединяем ваши заказы от разных поставщиков в одну отправку.
          Принимаем грузы на склад в Китае, консолидируем и доставляем в Россию.
          Минимум от 50 кг.
        </p>
        <Link
          href="/#calculator"
          className="inline-flex items-center gap-2 bg-[#00A86B] hover:bg-[#009060] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Рассчитать доставку →
        </Link>
      </section>

      {/* Benefits */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Преимущества консолидации</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {[
            { icon: "💰", title: "Экономия на фрахте", desc: "Платите только за своё место в контейнере. При объёме 1–5 м³ экономия vs отдельной отправки — 30–40%." },
            { icon: "📍", title: "Один адрес доставки", desc: "Заказали у 5 поставщиков? Все привозят на наш склад в Китае — и едет одна посылка." },
            { icon: "📦", title: "Правильная упаковка", desc: "Переупаковываем и маркируем по требованиям: WB, Ozon или склад получателя." },
            { icon: "🔒", title: "Страхование", desc: "Страхуем каждую партию. Ваш товар защищён от потери и повреждения при транспортировке." },
          ].map((item) => (
            <div key={item.title} className="bg-[#0f2644]/60 border border-[#243a5e] rounded-2xl p-6">
              <span className="text-3xl mb-3 block">{item.icon}</span>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-[#8899aa] text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Price guide */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-4">Ориентиры по стоимости</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#243a5e]">
                <th className="text-left py-3 px-4 text-[#8899aa] font-medium">Маршрут</th>
                <th className="text-left py-3 px-4 text-[#8899aa] font-medium">Тариф</th>
                <th className="text-left py-3 px-4 text-[#8899aa] font-medium">Срок</th>
              </tr>
            </thead>
            <tbody>
              {[
                { route: "Авто через Казахстан", rate: "$2.5–3.5/кг", time: "25–35 дней" },
                { route: "Авто через Дальний Восток", rate: "$3–5/кг", time: "30–45 дней" },
                { route: "Море через Владивосток", rate: "$2–3.5/кг", time: "35–55 дней" },
                { route: "Авиа", rate: "$6–12/кг", time: "5–14 дней" },
              ].map((row) => (
                <tr key={row.route} className="border-b border-[#243a5e]">
                  <td className="py-3 px-4 font-medium">{row.route}</td>
                  <td className="py-3 px-4 text-[#00A86B]">{row.rate}</td>
                  <td className="py-3 px-4 text-[#8899aa]">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[#8899aa] text-xs mt-3">* Тарифы ориентировочные. Точную стоимость рассчитайте в калькуляторе.</p>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Связанные услуги</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <ServiceCard icon="🚚" title="Доставка из Китая" description="Все виды международных грузоперевозок" href="/services/china-delivery" />
          <ServiceCard icon="🛒" title="Выкуп с 1688" description="Выкупим товары у разных поставщиков" href="/services/1688-buyout" />
          <ServiceCard icon="✅" title="Проверка товара" description="Инспекция перед консолидацией" href="/services/inspection" />
        </div>
      </section>

      <FAQSection items={FAQ} />
      <CTASection />
    </main>
  );
}
