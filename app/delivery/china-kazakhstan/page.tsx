import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FAQSection } from "@/components/seo/FAQSection";
import { CTASection } from "@/components/seo/CTASection";

export const metadata: Metadata = {
  title: "Доставка из Китая в Казахстан — ChinaBridge",
  description: "Доставка грузов из Китая в Казахстан: Алматы, Астана, Шымкент. Авто от 30 кг, срок 18–22 дня. Авиа от 1 кг, от 5 дней. Рассчитайте стоимость.",
  keywords: "доставка из Китая в Казахстан, грузоперевозки Китай Казахстан, доставка Алматы из Китая, доставка Астана Китай",
  alternates: { canonical: "https://chinabridge.pro/delivery/china-kazakhstan" },
  openGraph: {
    title: "Доставка из Китая в Казахстан — ChinaBridge",
    description: "Доставка в Алматы, Астану, Шымкент. Авто 18–22 дня, авиа от 5 дней. Прямой маршрут через Хоргос.",
    url: "https://chinabridge.pro/delivery/china-kazakhstan",
    type: "website",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Доставка из Китая в Казахстан",
  provider: { "@type": "Organization", name: "ChinaBridge" },
  description: "Грузоперевозки из Китая в Казахстан: Алматы, Астана, Шымкент и другие города.",
  areaServed: { "@type": "Country", name: "Казахстан" },
};

const FAQ = [
  {
    question: "Почему доставка в Казахстан из Китая быстрее, чем в Москву?",
    answer: "Казахстан граничит с Китаем напрямую. Пограничные переходы: Хоргос–Коржынкол, Достык. Нет необходимости в длинном транзите через Россию для городов юга и востока Казахстана.",
  },
  {
    question: "Как оформляется доставка в Казахстан?",
    answer: "Доставляем через погранпереход Хоргос — прямой маршрут Китай–Казахстан. Груз приходит на ваш склад в Алматы, Астане или Шымкенте. Менеджер сопровождает на каждом этапе.",
  },
  {
    question: "В какие города Казахстана вы доставляете?",
    answer: "Доставляем в Алматы, Астану (Нур-Султан), Шымкент, Актобе, Атырау, Усть-Каменогорск и другие города. Последняя миля — через партнёрские транспортные компании.",
  },
  {
    question: "Принимаете ли вы оплату в тенге?",
    answer: "Расчёты ведём в долларах или рублях. Оплата в тенге — по согласованию с менеджером по актуальному курсу.",
  },
];

export default function KazakhstanDeliveryPage() {
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
          { label: "Доставка в Казахстан" },
        ]}
      />

      <section className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Доставка из Китая в Казахстан
        </h1>
        <p className="text-[#8899aa] text-lg max-w-2xl mb-8">
          Перевозим грузы из любого города Китая в Алматы, Астану, Шымкент и другие
          города Казахстана. Прямые маршруты через пограничные переходы Хоргос и Достык.
        </p>
        <Link
          href="/#calculator"
          className="inline-flex items-center gap-2 bg-[#00A86B] hover:bg-[#009060] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Рассчитать доставку →
        </Link>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Маршруты в Казахстан</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { name: "Авто Алматы", time: "18–22 дня", price: "от $2/кг", note: "Прямой маршрут через Хоргос, мин. 30 кг" },
            { name: "Авто Астана", time: "22–26 дней", price: "от $2.5/кг", note: "Хоргос → Алматы → Астана" },
            { name: "Авиа стандарт", time: "5–8 дней", price: "от $22/кг", note: "Алматы, Астана, Шымкент, от 1 кг" },
            { name: "Авиа экспресс", time: "3 дня", price: "от $32/кг", note: "Срочные отправки, от 1 кг" },
          ].map((r) => (
            <div key={r.name} className="bg-[#0f2644]/60 border border-[#243a5e] rounded-2xl p-5">
              <h3 className="font-semibold mb-1">{r.name}</h3>
              <p className="text-[#8899aa] text-xs mb-2">{r.note}</p>
              <div className="flex items-center gap-4">
                <span className="text-[#8899aa] text-sm">{r.time}</span>
                <span className="text-[#00A86B] font-medium">{r.price}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <FAQSection items={FAQ} />
      <CTASection />
    </main>
  );
}
