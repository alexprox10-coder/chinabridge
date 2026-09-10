import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FAQSection } from "@/components/seo/FAQSection";
import { CTASection } from "@/components/seo/CTASection";

export const metadata: Metadata = {
  title: "Карго из Китая в Москву — от $3.00/кг за 14–18 дней | ChinaBridge",
  description: "Доставка грузов из Китая в Москву авто от $3.00/кг, срок 14–18 дней. Авиа от $23/кг за 5–7 дней. Мин. 100 кг. Таможня, страхование, до двери.",
  keywords: "карго из Китая в Москву, доставка из Китая в Москву, грузоперевозки Китай Москва, сборный груз Китай Москва цена, карго Гуанчжоу Москва",
  alternates: { canonical: "https://chinabridge.pro/delivery/cargo-china-moscow" },
  openGraph: {
    title: "Карго из Китая в Москву от $3/кг | ChinaBridge",
    description: "Авто 14–18 дней от $3/кг. Авиа 5–7 дней от $23/кг. Мин. 100 кг. Таможня включена.",
    url: "https://chinabridge.pro/delivery/cargo-china-moscow",
    type: "website",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Карго из Китая в Москву",
  provider: { "@type": "Organization", name: "ChinaBridge", url: "https://chinabridge.pro" },
  description: "Доставка грузов из Китая в Москву. Авто от $3/кг за 14–18 дней, авиа от $23/кг за 5–7 дней.",
  areaServed: { "@type": "City", name: "Москва" },
  serviceType: "Грузоперевозки",
  offers: {
    "@type": "Offer",
    price: "3.00",
    priceCurrency: "USD",
    description: "от $3.00/кг авто",
  },
};

const FAQ = [
  {
    question: "Сколько стоит доставка сборного груза из Китая в Москву?",
    answer: "Авто сборный груз: от $3.00/кг при весе от 100 кг. На 200 кг — около $600. Авиа: от $23/кг — на 50 кг выйдет $1,150. Точную цену считайте в нашем калькуляторе — 30 секунд.",
  },
  {
    question: "Какой минимальный вес для отправки в Москву?",
    answer: "Авто сборный груз — минимум 100 кг. Авиа — от 1 кг без ограничений. Если у вас меньше 100 кг авто, рассмотрите авиа или подождём пока наберётся попутная партия.",
  },
  {
    question: "Какие маршруты идут из Китая в Москву?",
    answer: "Основной авто-маршрут: Гуанчжоу → Казахстан (Алматы) → Россия → Москва, 14–18 дней. Также: через Монголию (16–20 дней) и через Дальний Восток Суньфэньхэ→Хабаровск→Москва (25–35 дней). Авиа: прямые рейсы Пекин/Шанхай → Москва, 5–7 дней.",
  },
  {
    question: "Доставляете ли до склада Wildberries или Ozon?",
    answer: "Да, доставляем прямо на склады WB (Коледино, Электросталь, Казань) и Ozon (Хоругвино, Пушкино). Для этого нужен белый импорт с ГТД — подробнее на странице белого импорта.",
  },
  {
    question: "Включена ли таможня в цену?",
    answer: "Зависит от маршрута. Авто через КЗ — серая схема, пошлин нет до €200/50кг. Для белого импорта: таможня + ГТД рассчитываются отдельно в зависимости от категории и стоимости товара.",
  },
];

const ROUTES = [
  { name: "Гуанчжоу → Алматы → Москва", type: "Авто (основной)", time: "14–18 дней", price: "от $3.00/кг", min: "мин. 100 кг" },
  { name: "Пекин/Шанхай → Москва", type: "Авиа", time: "5–7 дней", price: "от $23/кг", min: "мин. 1 кг" },
  { name: "Гуанчжоу → Монголия → Москва", type: "Авто", time: "16–20 дней", price: "от $3.50/кг", min: "мин. 100 кг" },
  { name: "Суньфэньхэ → Хабаровск → Москва", type: "Авто (белый)", time: "25–35 дней", price: "по запросу", min: "мин. 100 кг" },
];

export default function CargoMoscowPage() {
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
          { label: "Карго Китай → Москва" },
        ]}
      />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="inline-flex items-center gap-2 bg-[#00A86B]/10 border border-[#00A86B]/30 rounded-full px-4 py-1.5 text-[#00A86B] text-sm mb-6">
          🇨🇳 Китай → 🇷🇺 Москва · Авто и Авиа
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
          Карго из Китая<br className="hidden md:block" /> в Москву
        </h1>
        <p className="text-[#8899aa] text-lg max-w-2xl mb-6">
          Сборные грузы из любого города Китая в Москву.
          Авто от <strong className="text-white">$3.00/кг за 14–18 дней</strong>,
          авиа от <strong className="text-white">$23/кг за 5–7 дней</strong>.
        </p>
        <div className="flex flex-wrap gap-3 mb-8">
          {["✅ Офис в Гуанчжоу", "✅ Выкуп с 1688 и Alibaba", "✅ Таможня под ключ", "✅ До склада WB/Ozon"].map((f) => (
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

      {/* Маршруты */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Маршруты Китай → Москва</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#243a5e] text-[#8899aa]">
                <th className="text-left py-3 pr-4">Маршрут</th>
                <th className="text-left py-3 pr-4">Тип</th>
                <th className="text-left py-3 pr-4">Срок</th>
                <th className="text-left py-3 pr-4">Цена</th>
                <th className="text-left py-3">Мин. вес</th>
              </tr>
            </thead>
            <tbody>
              {ROUTES.map((r) => (
                <tr key={r.name} className="border-b border-[#243a5e]/40">
                  <td className="py-3 pr-4 font-medium">{r.name}</td>
                  <td className="py-3 pr-4 text-[#8899aa]">{r.type}</td>
                  <td className="py-3 pr-4 text-white">{r.time}</td>
                  <td className="py-3 pr-4 text-[#00A86B] font-medium">{r.price}</td>
                  <td className="py-3 text-[#8899aa]">{r.min}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Калькулятор-промо */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-[#00A86B]/10 to-[#0f2644]/60 border border-[#00A86B]/30 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold mb-2">Точная стоимость за 30 секунд</h2>
            <p className="text-[#8899aa]">Введите вес, категорию и направление — получите цену мгновенно</p>
          </div>
          <Link
            href="/#calculator"
            className="shrink-0 inline-flex items-center gap-2 bg-[#00A86B] hover:bg-[#009060] text-white font-semibold px-6 py-3 rounded-xl transition-colors whitespace-nowrap"
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
