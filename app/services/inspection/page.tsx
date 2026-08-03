import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FAQSection } from "@/components/seo/FAQSection";
import { CTASection } from "@/components/seo/CTASection";
import { ServiceCard } from "@/components/seo/ServiceCard";

export const metadata: Metadata = {
  title: "Проверка товара в Китае — инспекция перед отправкой | ChinaBridge",
  description: "Инспекция качества товара на складе поставщика в Китае перед отправкой в Россию. Фотоотчёт, проверка соответствия образцу, выборочный контроль.",
  keywords: "проверка товара в Китае, инспекция груза Китай, контроль качества из Китая, pre-shipment inspection",
  alternates: { canonical: "https://chinabridge.pro/services/inspection" },
  openGraph: {
    title: "Проверка товара в Китае — ChinaBridge",
    description: "Наш представитель проверяет товар на складе поставщика перед отправкой в Россию.",
    url: "https://chinabridge.pro/services/inspection",
    type: "website",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Проверка товара в Китае",
  provider: { "@type": "Organization", name: "ChinaBridge" },
  description: "Инспекция качества и соответствия товара на складах поставщиков в Китае.",
  areaServed: "CN",
  serviceType: "Контроль качества",
};

const FAQ = [
  {
    question: "Когда нужна инспекция товара?",
    answer: "Инспекция нужна при заказе партии от $2,000–3,000, при работе с новым поставщиком или если в прошлых партиях были проблемы с качеством. Также обязательна для товаров с жёсткими требованиями к характеристикам.",
  },
  {
    question: "Что проверяется при инспекции?",
    answer: "Соответствие образцу по внешнему виду, размерам, цвету, весу, материалу. Функциональность. Упаковка и маркировка. Количество единиц в партии. Случайная выборка: обычно 10–15% партии.",
  },
  {
    question: "Сколько стоит инспекция?",
    answer: "Инспекция одного поставщика — $150–400 в зависимости от сложности и расположения. Цена включает выезд, проверку, фотоотчёт. Для нескольких поставщиков в одном регионе — скидка.",
  },
  {
    question: "Что происходит если найден брак?",
    answer: "Немедленно сообщаем вам и поставщику. Организуем замену дефектных единиц или перепроизводство. Вы принимаете решение: ждать устранения или отгружать с дисконтом.",
  },
  {
    question: "За сколько дней до отгрузки нужно заказывать инспекцию?",
    answer: "Рекомендуем заказывать за 3–5 рабочих дней до плановой даты отгрузки. Срочная инспекция возможна за 24–48 часов с доплатой.",
  },
];

export default function InspectionPage() {
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
          { label: "Проверка товара" },
        ]}
      />

      <section className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Проверка товара в Китае
        </h1>
        <p className="text-[#8899aa] text-lg max-w-2xl mb-8">
          Наш представитель выезжает на склад поставщика и проверяет партию
          до отправки в Россию. Фотоотчёт с производства, выборочный контроль,
          проверка маркировки и упаковки.
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
        <h2 className="text-2xl font-bold mb-6">Что включает инспекция</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: "🔍", title: "Соответствие образцу", desc: "Сравниваем с утверждённым образцом: внешний вид, цвет, размер, материал" },
            { icon: "⚡", title: "Функциональный тест", desc: "Для электроники и механических товаров — проверка работоспособности" },
            { icon: "📏", title: "Размеры и вес", desc: "Замеряем выборку: расхождение более 5% — основание для рекламации" },
            { icon: "📦", title: "Упаковка", desc: "Целостность, маркировка, штрихкоды (WB, Ozon), состав, страна производства" },
            { icon: "🔢", title: "Количество", desc: "Пересчёт коробок, пересчёт единиц в выборке, сверка с инвойсом" },
            { icon: "📸", title: "Фотоотчёт", desc: "Детальные фото склада, товара, упаковки, маркировки — передаём вам" },
          ].map((item) => (
            <div key={item.title} className="bg-[#0f2644]/60 border border-[#243a5e] rounded-2xl p-5">
              <span className="text-2xl mb-3 block">{item.icon}</span>
              <h3 className="font-semibold mb-1 text-sm">{item.title}</h3>
              <p className="text-[#8899aa] text-xs">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* When needed */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-4">Когда особенно важна инспекция</h2>
        <div className="bg-[#0f2644]/40 border border-[#243a5e] rounded-2xl p-6 space-y-3">
          {[
            "Первый заказ у нового поставщика",
            "Партия стоимостью от $2,000",
            "Товары с жёсткими требованиями (электроника, детские товары)",
            "Ситуации когда прошлые партии содержали брак",
            "Сезонные товары с жёсткими сроками (нельзя ждать замену)",
            "Товары под маркетплейс с требованиями к упаковке и маркировке",
          ].map((point) => (
            <div key={point} className="flex items-start gap-3">
              <span className="text-[#00A86B] mt-0.5 shrink-0">✓</span>
              <span className="text-sm text-[#8899aa]">{point}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Связанные услуги</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <ServiceCard icon="🔍" title="Поиск поставщиков" description="Сначала найдём проверенного поставщика" href="/services/supplier-search" />
          <ServiceCard icon="🛒" title="Выкуп с 1688" description="Выкупим товар после одобрения инспекции" href="/services/1688-buyout" />
          <ServiceCard icon="🚚" title="Доставка из Китая" description="Доставим проверенный товар в Россию" href="/services/china-delivery" />
        </div>
      </section>

      <FAQSection items={FAQ} />
      <CTASection />
    </main>
  );
}
