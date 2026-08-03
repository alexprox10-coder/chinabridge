import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FAQSection } from "@/components/seo/FAQSection";
import { CTASection } from "@/components/seo/CTASection";
import { ServiceCard } from "@/components/seo/ServiceCard";

export const metadata: Metadata = {
  title: "Выкуп с 1688 — закупка товаров из Китая | ChinaBridge",
  description: "Выкуп товаров с 1688.com по ценам китайского оптового рынка. Проверка поставщика, контроль качества, доставка в Россию. Комиссия от 5%.",
  keywords: "выкуп с 1688, заказать с 1688, посредник 1688, закупка на 1688, 1688 Россия",
  alternates: { canonical: "https://chinabridge.pro/services/1688-buyout" },
  openGraph: {
    title: "Выкуп с 1688 — закупка товаров из Китая | ChinaBridge",
    description: "Покупаем на 1688 по оптовым ценам, проверяем поставщика, доставляем в Россию.",
    url: "https://chinabridge.pro/services/1688-buyout",
    type: "website",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Выкуп с 1688",
  provider: { "@type": "Organization", name: "ChinaBridge" },
  description: "Закупка товаров на оптовой платформе 1688.com с доставкой в Россию. Проверка поставщика, контроль качества.",
  areaServed: "RU",
  serviceType: "Торговое посредничество",
};

const FAQ = [
  {
    question: "Почему 1688 выгоднее AliExpress и Alibaba?",
    answer: "1688 — оптовая площадка для внутреннего рынка Китая. Здесь нет наценки для иностранных покупателей: цены на 30–60% ниже, чем на Alibaba, и в 2–5 раз ниже, чем на AliExpress.",
  },
  {
    question: "Можно ли самостоятельно купить на 1688?",
    answer: "Нет. 1688 работает только с аккаунтами китайских компаний. Без местного юрлица, Alipay и адреса в Китае оформить заказ невозможно. Именно для этого нужен посредник.",
  },
  {
    question: "Какова ваша комиссия за выкуп?",
    answer: "Комиссия за выкуп — от 5% до 10% от стоимости товара, в зависимости от объёма и сложности заказа. Транспорт внутри Китая и международная доставка — отдельно.",
  },
  {
    question: "Как вы проверяете поставщика на 1688?",
    answer: "Наш представитель в Китае проверяет Business License компании, историю на платформе, физическое существование производства. Для крупных заказов — выезд на фабрику.",
  },
  {
    question: "Есть ли минимальный заказ?",
    answer: "Минимального заказа по стоимости нет. Минимальный вес для отправки сборным грузом — 50 кг. Мелкие партии можно консолидировать с другими заказами.",
  },
];

export default function Buyout1688Page() {
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
          { label: "Выкуп с 1688" },
        ]}
      />

      <section className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Выкуп товаров с 1688
        </h1>
        <p className="text-[#8899aa] text-lg max-w-2xl mb-8">
          Закупаем товары на крупнейшей оптовой платформе Китая по ценам для местных покупателей.
          Проверяем поставщика, контролируем качество, доставляем в Россию.
        </p>
        <Link
          href="/#calculator"
          className="inline-flex items-center gap-2 bg-[#00A86B] hover:bg-[#009060] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Рассчитать доставку →
        </Link>
      </section>

      {/* Why 1688 */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Почему 1688 выгоднее</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#243a5e]">
                <th className="text-left py-3 px-4 text-[#8899aa] font-medium">Платформа</th>
                <th className="text-left py-3 px-4 text-[#8899aa] font-medium">Цена (пример)</th>
                <th className="text-left py-3 px-4 text-[#8899aa] font-medium">Работа с Россией</th>
                <th className="text-left py-3 px-4 text-[#8899aa] font-medium">MOQ</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "AliExpress", price: "$18–25/шт", work: "Напрямую", moq: "1 шт." },
                { name: "Alibaba", price: "$8–14/шт", work: "Напрямую", moq: "50–200 шт." },
                { name: "1688", price: "$4–7/шт", work: "Через посредника", moq: "10–30 шт.", highlight: true },
              ].map((row) => (
                <tr
                  key={row.name}
                  className={`border-b border-[#243a5e] ${row.highlight ? "bg-[#00A86B]/10" : ""}`}
                >
                  <td className="py-3 px-4 font-medium">{row.name}</td>
                  <td className="py-3 px-4 text-[#8899aa]">{row.price}</td>
                  <td className="py-3 px-4 text-[#8899aa]">{row.work}</td>
                  <td className="py-3 px-4 text-[#8899aa]">{row.moq}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Process */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Процесс выкупа</h2>
        <div className="space-y-4">
          {[
            { step: "01", title: "Вы присылаете ссылку", desc: "Скопируйте ссылку с 1688 или опишите товар — мы найдём сами." },
            { step: "02", title: "Проверяем поставщика", desc: "Проверяем регистрацию, историю, физическое производство. Запрашиваем актуальные цены." },
            { step: "03", title: "Выкупаем товар", desc: "Оплачиваем от своего имени, принимаем на склад в Китае, делаем фотоотчёт." },
            { step: "04", title: "Доставляем в Россию", desc: "Консолидируем с другими грузами или отправляем отдельно. Таможня, доставка до склада." },
          ].map((item) => (
            <div key={item.step} className="flex gap-4 bg-[#0f2644]/40 border border-[#243a5e] rounded-xl p-5">
              <span className="text-2xl font-bold text-[#00A86B] shrink-0">{item.step}</span>
              <div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-[#8899aa] text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Related */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Связанные услуги</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ServiceCard icon="🚚" title="Доставка из Китая" description="Сборные грузы, контейнеры, авиа" href="/services/china-delivery" />
          <ServiceCard icon="🔍" title="Поиск поставщиков" description="Находим производителя под ваш запрос" href="/services/supplier-search" />
          <ServiceCard icon="✅" title="Проверка товара" description="Инспекция качества перед отправкой" href="/services/inspection" />
        </div>
      </section>

      <FAQSection items={FAQ} />
      <CTASection />
    </main>
  );
}
