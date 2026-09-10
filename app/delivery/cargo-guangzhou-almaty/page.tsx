import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FAQSection } from "@/components/seo/FAQSection";
import { CTASection } from "@/components/seo/CTASection";

export const metadata: Metadata = {
  title: "Карго Гуанчжоу — Алматы: от $2.50/кг за 5–8 дней | ChinaBridge",
  description: "Доставка товаров из Гуанчжоу в Алматы авто от $2.50/кг, срок 5–8 дней. Сборные грузы от 30 кг. Серая схема до €200 без пошлин. Рассчитать онлайн.",
  keywords: "карго Гуанчжоу Алматы, доставка из Китая в Казахстан, карго Китай Алматы, грузоперевозки Гуанчжоу Алматы, доставка из Китая Казахстан",
  alternates: { canonical: "https://chinabridge.pro/delivery/cargo-guangzhou-almaty" },
  openGraph: {
    title: "Карго Гуанчжоу → Алматы от $2.50/кг | ChinaBridge",
    description: "Авто 5–8 дней от $2.50/кг, авиа 5–7 дней от $23/кг. Сборные грузы от 30 кг. Офис в Гуанчжоу.",
    url: "https://chinabridge.pro/delivery/cargo-guangzhou-almaty",
    type: "website",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Карго из Гуанчжоу в Алматы",
  provider: { "@type": "Organization", name: "ChinaBridge", url: "https://chinabridge.pro" },
  description: "Доставка грузов из Гуанчжоу в Алматы. Авто 5–8 дней от $2.50/кг, авиа 5–7 дней от $23/кг.",
  areaServed: { "@type": "City", name: "Алматы" },
  serviceType: "Грузоперевозки",
  offers: {
    "@type": "Offer",
    price: "2.50",
    priceCurrency: "USD",
    description: "от $2.50/кг авто через КЗ",
  },
};

const FAQ = [
  {
    question: "Сколько стоит карго из Гуанчжоу в Алматы?",
    answer: "Авто сборный груз: $2.50/кг при весе от 30 кг. Авиа: от $23/кг. Итого на 100 кг авто — около $250, авиа — около $2,300. Точную цену считайте в калькуляторе на сайте.",
  },
  {
    question: "Сколько идёт груз из Гуанчжоу до Алматы?",
    answer: "Авто сборный груз: 5–8 рабочих дней. Авиа: 5–7 дней. Срок считается от даты отправки с нашего склада в Гуанчжоу, не от закупки у поставщика.",
  },
  {
    question: "Нужна ли таможня при доставке в Казахстан?",
    answer: "Для личного ввоза до €200 за посылку и до 50 кг в месяц — без пошлин и деклараций. Для коммерческих партий оформляем ИМ40 через брокера. Уточняйте у менеджера под вашу ситуацию.",
  },
  {
    question: "Можно ли заказать доставку прямо с 1688 или Alibaba?",
    answer: "Да. Мы выкупаем товар у поставщика от вашего имени, оплачиваем в юанях напрямую поставщику, проверяем качество и отправляем вам. Комиссия 3–5% от суммы закупки.",
  },
  {
    question: "Есть ли склад в Алматы для получения груза?",
    answer: "Доставляем до вашего адреса или склада в Алматы. Также можем доставить до складов Kaspi, Wildberries KZ или другого маркетплейса.",
  },
];

export default function CargoGuangzhouAlmatyPage() {
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
          { label: "Гуанчжоу → Алматы" },
        ]}
      />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="inline-flex items-center gap-2 bg-[#00A86B]/10 border border-[#00A86B]/30 rounded-full px-4 py-1.5 text-[#00A86B] text-sm mb-6">
          🇨🇳 Гуанчжоу → 🇰🇿 Алматы · от 30 кг
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
          Карго Гуанчжоу — Алматы
        </h1>
        <p className="text-[#8899aa] text-lg max-w-2xl mb-6">
          Быстрее и дешевле всех на рынке. Офис в Гуанчжоу, прямой маршрут через КЗ.
          Авто 5–8 дней от <strong className="text-white">$2.50/кг</strong>.
        </p>
        <div className="flex flex-wrap gap-3 mb-8">
          {["✅ Серая схема до €200 без пошлин", "✅ Выкуп с 1688 и Alibaba", "✅ Инспекция товара", "✅ Доставка до двери"].map((f) => (
            <span key={f} className="text-sm text-[#8899aa] bg-[#0f2644]/40 border border-[#243a5e] rounded-full px-3 py-1">{f}</span>
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/#calculator"
            className="inline-flex items-center gap-2 bg-[#00A86B] hover:bg-[#009060] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Рассчитать стоимость →
          </Link>
          <Link
            href="https://t.me/ChinaBridgeLID_bot"
            target="_blank"
            className="inline-flex items-center gap-2 border border-[#243a5e] hover:border-[#00A86B] text-white px-6 py-3 rounded-xl transition-colors"
          >
            Написать менеджеру
          </Link>
        </div>
      </section>

      {/* Тарифы */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Тарифы Гуанчжоу → Алматы</h2>
        <div className="grid md:grid-cols-2 gap-5">
          {[
            {
              icon: "🚛",
              title: "Авто (сборный груз)",
              price: "$2.50/кг",
              time: "5–8 дней",
              min: "от 30 кг",
              details: ["Прямой маршрут через КЗ", "Консолидация на складе в Гуанчжоу", "Доставка до адреса в Алматы", "Страхование груза включено"],
            },
            {
              icon: "✈️",
              title: "Авиа",
              price: "$23/кг",
              time: "5–7 дней",
              min: "от 1 кг",
              details: ["Для срочных и дорогих товаров", "Прямые рейсы или через Урумчи", "Доставка от 1 кг без ограничений", "Идеально для электроники и одежды"],
            },
          ].map((item) => (
            <div key={item.title} className="bg-[#0f2644]/60 border border-[#243a5e] rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-3xl block mb-1">{item.icon}</span>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                </div>
                <div className="text-right">
                  <p className="text-[#00A86B] text-2xl font-bold">{item.price}</p>
                  <p className="text-[#8899aa] text-sm">{item.time} · {item.min}</p>
                </div>
              </div>
              <ul className="space-y-1.5">
                {item.details.map((d) => (
                  <li key={d} className="text-sm text-[#8899aa] flex items-center gap-2">
                    <span className="text-[#00A86B]">✓</span> {d}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Калькулятор-промо */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-[#00A86B]/10 to-[#0f2644]/60 border border-[#00A86B]/30 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">Рассчитайте стоимость за 30 секунд</h2>
          <p className="text-[#8899aa] mb-6">Введите вес и категорию товара — получите точную цену доставки из Гуанчжоу в Алматы</p>
          <Link
            href="/#calculator"
            className="inline-flex items-center gap-2 bg-[#00A86B] hover:bg-[#009060] text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg"
          >
            Открыть калькулятор →
          </Link>
        </div>
      </section>

      <FAQSection items={FAQ} />
      <CTASection />
    </main>
  );
}
