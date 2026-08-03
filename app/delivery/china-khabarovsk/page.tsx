import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FAQSection } from "@/components/seo/FAQSection";
import { CTASection } from "@/components/seo/CTASection";

export const metadata: Metadata = {
  title: "Доставка из Китая в Хабаровск — ChinaBridge",
  description: "Доставка грузов из Китая в Хабаровск. Короткий маршрут через Дальний Восток. Сборные грузы от 50 кг. Срок 15–25 дней. Таможня включена.",
  keywords: "доставка из Китая в Хабаровск, грузоперевозки Китай Хабаровск, сборный груз Хабаровск",
  alternates: { canonical: "https://chinabridge.pro/delivery/china-khabarovsk" },
  openGraph: {
    title: "Доставка из Китая в Хабаровск — ChinaBridge",
    description: "Короткий маршрут через Дальний Восток. Срок 15–25 дней.",
    url: "https://chinabridge.pro/delivery/china-khabarovsk",
    type: "website",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Доставка из Китая в Хабаровск",
  provider: { "@type": "Organization", name: "ChinaBridge" },
  areaServed: { "@type": "City", name: "Хабаровск" },
};

const FAQ = [
  {
    question: "Почему доставка в Хабаровск быстрее, чем в Москву?",
    answer: "Хабаровск граничит с Китаем (провинция Хэйлунцзян). Расстояние от основных промышленных районов северо-востока Китая — в разы меньше. Плюс нет транзита через всю Россию.",
  },
  {
    question: "Сколько длится доставка из Гуанчжоу в Хабаровск?",
    answer: "Из южного Китая (Гуанчжоу, Шэньчжэнь) — 20–30 дней авто. Из северного Китая (Харбин, Суйфэньхэ) — 10–18 дней. Авиа из любого города — 5–10 дней.",
  },
  {
    question: "Где у вас склад в Хабаровске?",
    answer: "Принимаем грузы в Хабаровске и организуем последнюю милю до адреса клиента. Также можем работать через партнёрские склады транспортных компаний.",
  },
];

export default function KhabarovskDeliveryPage() {
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
          { label: "Доставка в Хабаровск" },
        ]}
      />

      <section className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Доставка из Китая в Хабаровск
        </h1>
        <p className="text-[#8899aa] text-lg max-w-2xl mb-8">
          Благодаря близости к китайской границе — один из самых коротких маршрутов.
          Сборные грузы от 50 кг, авиа, полные контейнеры. Официальная таможня.
        </p>
        <Link
          href="/#calculator"
          className="inline-flex items-center gap-2 bg-[#00A86B] hover:bg-[#009060] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Рассчитать доставку →
        </Link>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-5">
          {[
            { name: "Авто из Северного Китая", time: "10–18 дней", price: "от $2.5/кг", note: "Харбин, Суйфэньхэ, Муданьцзян" },
            { name: "Авто из Южного Китая", time: "20–30 дней", price: "от $3/кг", note: "Гуанчжоу, Шэньчжэнь, Иу" },
            { name: "Авиа", time: "5–10 дней", price: "от $6/кг", note: "Через аэропорт Хабаровск (ХБВ)" },
            { name: "Морской контейнер", time: "25–40 дней", price: "от $2/кг", note: "Через порт Владивосток + авто" },
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
