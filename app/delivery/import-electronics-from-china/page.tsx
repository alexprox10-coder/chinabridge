import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FAQSection } from "@/components/seo/FAQSection";
import { CTASection } from "@/components/seo/CTASection";

export const metadata: Metadata = {
  title: "Доставка электроники из Китая — ChinaBridge",
  description: "Доставка электроники из Китая в Россию и Казахстан. Смартфоны, ноутбуки, комплектующие от $2.5/кг. Таможня, сертификация. Рассчитайте онлайн.",
  keywords: "доставка электроники из Китая, ввоз электроники из Китая, импорт электроники Китай Россия, телефоны из Китая оптом, ноутбуки из Китая",
  alternates: { canonical: "https://chinabridge.pro/delivery/import-electronics-from-china" },
  openGraph: {
    title: "Доставка электроники из Китая — ChinaBridge",
    description: "Смартфоны, ноутбуки, комплектующие из Китая. Авто от $2.5/кг, авиа от $23/кг. Таможня включена.",
    url: "https://chinabridge.pro/delivery/import-electronics-from-china",
    type: "website",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Доставка электроники из Китая",
  provider: { "@type": "Organization", name: "ChinaBridge", url: "https://chinabridge.pro" },
  description: "Доставка электроники из Китая в Россию и Казахстан. Смартфоны, ноутбуки, комплектующие.",
  areaServed: ["RU", "KZ"],
  serviceType: "Грузоперевозки электроники",
  offers: {
    "@type": "Offer",
    price: "2.50",
    priceCurrency: "USD",
    description: "от $2.50/кг авто через Казахстан",
  },
};

const FAQ = [
  {
    question: "Какие пошлины на электронику из Китая?",
    answer: "Электроника (HS-коды 84xx, 85xx) в России облагается пошлиной 0–5% + НДС 20%. Смартфоны — 0%. Компьютеры — 0%. Телевизоры — 10%. Точную ставку подбираем под конкретный HS-код. В Казахстан — серая схема до €200/50кг без пошлин.",
  },
  {
    question: "Нужна ли сертификация для ввоза электроники?",
    answer: "Для коммерческого ввоза в Россию: нотификация Роскомнадзора для устройств с шифрованием (WiFi, Bluetooth), декларация соответствия TR ТС. Помогаем оформить документы через партнёров.",
  },
  {
    question: "Можно ли везти б/у электронику из Китая?",
    answer: "Можно, но есть нюансы: б/у товар сложнее в таможенном оформлении, нужна оценка стоимости. Рекомендуем заранее согласовать с нашим менеджером.",
  },
  {
    question: "Как быстро доставите смартфоны из Китая?",
    answer: "Авиа из Гуанчжоу в Москву: 5–7 дней. Авто через Казахстан: 14–18 дней. Авто через Алматы: 5–8 дней. Рекомендуем авиа для дорогостоящей электроники — дешевле страховать, быстрее оборот.",
  },
  {
    question: "Есть ли минимальный заказ для электроники?",
    answer: "Авто: мин. 30 кг (КЗ) или 100 кг (РФ). Авиа: от 1 кг. Для малых партий смартфонов авиа выгоднее — меньше хранение, быстрее деньги.",
  },
];

const DUTIES: { category: string; hs: string; rate: string }[] = [
  { category: "Смартфоны / телефоны", hs: "8517.13", rate: "0% + НДС 20%" },
  { category: "Ноутбуки / компьютеры", hs: "8471", rate: "0% + НДС 20%" },
  { category: "Наушники / аудио", hs: "8518", rate: "0% + НДС 20%" },
  { category: "Телевизоры", hs: "8528", rate: "10% + НДС 20%" },
  { category: "Зарядные устройства", hs: "8504.40", rate: "0% + НДС 20%" },
  { category: "Умные часы", hs: "8517.62", rate: "0% + НДС 20%" },
];

export default function ElectronicsImportPage() {
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
          { label: "Электроника из Китая" },
        ]}
      />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="inline-flex items-center gap-2 bg-[#00A86B]/10 border border-[#00A86B]/30 rounded-full px-4 py-1.5 text-[#00A86B] text-sm mb-6">
          📱 Смартфоны · Ноутбуки · Комплектующие · Аксессуары
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
          Доставка электроники<br className="hidden md:block" /> из Китая
        </h1>
        <p className="text-[#8899aa] text-lg max-w-2xl mb-8">
          Везём смартфоны, ноутбуки, комплектующие и любую другую электронику из Китая
          в Россию и Казахстан. Знаем HS-коды, пошлины и требования сертификации.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/#calculator"
            className="inline-flex items-center gap-2 bg-[#00A86B] hover:bg-[#009060] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Рассчитать доставку →
          </Link>
          <Link
            href="https://t.me/ChinaBridgeLID_bot"
            target="_blank"
            className="inline-flex items-center gap-2 border border-[#243a5e] hover:border-[#00A86B] text-white px-6 py-3 rounded-xl transition-colors"
          >
            Спросить менеджера
          </Link>
        </div>
      </section>

      {/* Тарифы */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Тарифы на доставку электроники</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              icon: "🚛",
              title: "Авто → Казахстан",
              price: "от $2.50/кг",
              time: "5–8 дней",
              min: "мин. 30 кг",
              note: "Алматы, Астана, Шымкент",
            },
            {
              icon: "🚛",
              title: "Авто → Россия",
              price: "от $3.00/кг",
              time: "14–18 дней",
              min: "мин. 100 кг",
              note: "Москва, все города РФ",
            },
            {
              icon: "✈️",
              title: "Авиа → РФ/КЗ",
              price: "от $23/кг",
              time: "5–7 дней",
              min: "мин. 1 кг",
              note: "Идеально для срочных партий",
            },
          ].map((item) => (
            <div key={item.title} className="bg-[#0f2644]/60 border border-[#243a5e] rounded-2xl p-6">
              <span className="text-3xl mb-3 block">{item.icon}</span>
              <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
              <p className="text-[#00A86B] text-2xl font-bold mb-2">{item.price}</p>
              <div className="text-sm text-[#8899aa] space-y-1">
                <p>⏱ {item.time}</p>
                <p>📦 {item.min}</p>
                <p>📍 {item.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Пошлины */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-2">Пошлины на электронику в РФ</h2>
        <p className="text-[#8899aa] mb-6">Актуальные ставки таможенных пошлин по основным категориям</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#243a5e] text-[#8899aa]">
                <th className="text-left py-3 pr-4">Категория товара</th>
                <th className="text-left py-3 pr-4">HS-код</th>
                <th className="text-left py-3">Пошлина (Россия)</th>
              </tr>
            </thead>
            <tbody>
              {DUTIES.map((row) => (
                <tr key={row.hs} className="border-b border-[#243a5e]/40">
                  <td className="py-3 pr-4 font-medium">{row.category}</td>
                  <td className="py-3 pr-4 text-[#8899aa] font-mono">{row.hs}</td>
                  <td className="py-3 text-[#00A86B]">{row.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[#8899aa] text-xs mt-3">* Ставки актуальны на 2026 год. Уточняйте у менеджера для конкретного HS-кода.</p>
      </section>

      {/* Почему мы */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Почему выбирают ChinaBridge для электроники</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: "📋", title: "Знаем HS-коды", desc: "Правильно классифицируем каждую позицию, минимизируем пошлины законно" },
            { icon: "🔒", title: "Страхование груза", desc: "Страхуем электронику на полную стоимость — риски на нас" },
            { icon: "⚡", title: "Авиа от 1 кг", desc: "Для срочных поставок — авиа без минимального веса" },
            { icon: "✅", title: "Инспекция", desc: "Проверяем товар на складе в Китае перед отправкой" },
          ].map((item) => (
            <div key={item.title} className="bg-[#0f2644]/40 border border-[#243a5e] rounded-xl p-5">
              <span className="text-2xl mb-3 block">{item.icon}</span>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-[#8899aa] text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <FAQSection items={FAQ} />
      <CTASection />
    </main>
  );
}
