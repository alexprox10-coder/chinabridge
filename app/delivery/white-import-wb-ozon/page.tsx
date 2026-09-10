import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FAQSection } from "@/components/seo/FAQSection";
import { CTASection } from "@/components/seo/CTASection";

export const metadata: Metadata = {
  title: "Белый импорт для Wildberries и Ozon из Китая — ChinaBridge",
  description: "Официальный импорт товаров из Китая для продажи на Wildberries и Ozon. ГТД, сертификаты, маркировка. Суньфэньхэ и Владивосток. Под ключ.",
  keywords: "белый импорт из Китая для wildberries, импорт для ozon из Китая, ввоз товаров для маркетплейса, ГТД Китай, сертификация товаров из Китая WB",
  alternates: { canonical: "https://chinabridge.pro/delivery/white-import-wb-ozon" },
  openGraph: {
    title: "Белый импорт для WB и Ozon из Китая | ChinaBridge",
    description: "ГТД, сертификаты, маркировка — всё под ключ. Суньфэньхэ, официальная таможня. Для WB, Ozon, Kaspi.",
    url: "https://chinabridge.pro/delivery/white-import-wb-ozon",
    type: "website",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Белый импорт из Китая для Wildberries и Ozon",
  provider: { "@type": "Organization", name: "ChinaBridge", url: "https://chinabridge.pro" },
  description: "Официальный импорт товаров из Китая для маркетплейсов WB, Ozon, Kaspi. ГТД, сертификация, маркировка.",
  areaServed: "RU",
  serviceType: "Таможенное оформление и логистика",
};

const FAQ = [
  {
    question: "Что такое белый импорт и зачем он нужен для WB/Ozon?",
    answer: "Белый импорт — это официальный ввоз товара через таможню с оплатой пошлин и получением ГТД (грузовой таможенной декларации). WB и Ozon требуют ГТД для многих категорий товаров при поставке. Без ГТД товар могут не принять на склад.",
  },
  {
    question: "Через какие переходы работает белый импорт?",
    answer: "Основной маршрут: Суньфэньхэ (Приморский край) → Владивосток → Москва. Также работаем через Забайкальск и Благовещенск. Срок Гуанчжоу → Москва: 25–35 дней.",
  },
  {
    question: "Что входит в услугу белого импорта под ключ?",
    answer: "Выкуп у поставщика → транспортировка до границы → таможенное оформление с оплатой пошлин → ГТД → доставка до склада WB/Ozon в Москве или регионе. Опционально: декларация соответствия, маркировка, упаковка по требованиям маркетплейса.",
  },
  {
    question: "Сколько стоит белый импорт по сравнению с серым?",
    answer: "Белый импорт дороже: добавляются пошлины (0–20% в зависимости от категории) + НДС 20% + услуги таможенного брокера. Но это единственный законный способ продавать на WB/Ozon с документами. Инвестиция в защиту бизнеса.",
  },
  {
    question: "Нужна ли сертификация для продажи на Wildberries из Китая?",
    answer: "Зависит от категории. Одежда — ТР ТС 017/2011. Детские товары — ТР ТС 007/2011. Электроника — ТР ТС 020/2011. Помогаем получить сертификат или декларацию через аккредитованную лабораторию.",
  },
];

const STEPS = [
  { n: "01", title: "Выбор товара", desc: "Помогаем найти поставщика на 1688, проверить качество, согласовать цену" },
  { n: "02", title: "Выкуп и проверка", desc: "Оплачиваем в юанях, инспектируем товар на складе в Китае" },
  { n: "03", title: "Таможня", desc: "Оформляем ГТД через брокера, оплачиваем пошлины, получаем все документы" },
  { n: "04", title: "Доставка на склад", desc: "Везём товар на склад WB, Ozon или Kaspi. Готово к продажам." },
];

export default function WhiteImportPage() {
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
          { label: "Белый импорт WB / Ozon" },
        ]}
      />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="inline-flex items-center gap-2 bg-[#00A86B]/10 border border-[#00A86B]/30 rounded-full px-4 py-1.5 text-[#00A86B] text-sm mb-6">
          🛒 Wildberries · Ozon · Kaspi · ГТД · Сертификаты
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
          Белый импорт из Китая<br className="hidden md:block" /> для WB и Ozon
        </h1>
        <p className="text-[#8899aa] text-lg max-w-2xl mb-8">
          Официальный ввоз товаров с ГТД, пошлинами и всеми документами.
          Товар принимают на все склады Wildberries, Ozon и Kaspi без вопросов.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="https://t.me/ChinaBridgeLID_bot"
            target="_blank"
            className="inline-flex items-center gap-2 bg-[#00A86B] hover:bg-[#009060] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Получить консультацию →
          </Link>
          <Link
            href="/#calculator"
            className="inline-flex items-center gap-2 border border-[#243a5e] hover:border-[#00A86B] text-white px-6 py-3 rounded-xl transition-colors"
          >
            Рассчитать стоимость
          </Link>
        </div>
      </section>

      {/* Что включено */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Что входит в белый импорт под ключ</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: "📄", title: "ГТД", desc: "Грузовая таможенная декларация — основной документ для маркетплейсов" },
            { icon: "🏷️", title: "Маркировка", desc: "Маркировка по требованиям WB и Ozon: штрихкоды, состав, страна производства" },
            { icon: "✅", title: "Сертификация", desc: "Декларация или сертификат соответствия ТР ТС под вашу категорию" },
            { icon: "💳", title: "Оплата поставщику", desc: "Переводим юани напрямую — без комиссий за конвертацию" },
            { icon: "🔍", title: "Инспекция", desc: "Проверка товара до отправки: комплектность, качество, упаковка" },
            { icon: "🚚", title: "Доставка до склада", desc: "До склада WB, Ozon, Kaspi или вашего FBO/FBS-склада" },
          ].map((item) => (
            <div key={item.title} className="bg-[#0f2644]/40 border border-[#243a5e] rounded-xl p-5">
              <span className="text-2xl mb-3 block">{item.icon}</span>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-[#8899aa] text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Как это работает */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Как работает процесс</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((step) => (
            <div key={step.n} className="bg-[#0f2644]/40 border border-[#243a5e] rounded-xl p-5">
              <div className="text-[#00A86B] font-mono text-sm font-bold mb-3">{step.n}</div>
              <h3 className="font-semibold mb-2">{step.title}</h3>
              <p className="text-[#8899aa] text-sm">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <FAQSection items={FAQ} />
      <CTASection />
    </main>
  );
}
