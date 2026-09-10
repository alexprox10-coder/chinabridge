import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FAQSection } from "@/components/seo/FAQSection";
import { CTASection } from "@/components/seo/CTASection";

export const metadata: Metadata = {
  title: "Оплатить поставщику в Китае в юанях — ChinaBridge",
  description: "Переводим юани поставщику в Китай напрямую. Оплата с 1688, Alibaba, любому поставщику. Без блокировок и конвертации. Комиссия от 3%.",
  keywords: "оплатить поставщику в Китай, перевод юаней в Китай, оплата в юанях поставщику, оплата 1688 из России, перевод денег в Китай для бизнеса",
  alternates: { canonical: "https://chinabridge.pro/delivery/pay-supplier-china" },
  openGraph: {
    title: "Оплата поставщику в Китае | ChinaBridge",
    description: "Прямой перевод юаней поставщику. 1688, Alibaba, любой поставщик. Комиссия от 3%. Без блокировок.",
    url: "https://chinabridge.pro/delivery/pay-supplier-china",
    type: "website",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Оплата поставщику в Китае в юанях",
  provider: { "@type": "Organization", name: "ChinaBridge", url: "https://chinabridge.pro" },
  description: "Переводим юани поставщику в Китай напрямую. 1688, Alibaba, любой поставщик.",
  areaServed: ["RU", "KZ"],
  serviceType: "Финансовый агент",
};

const FAQ = [
  {
    question: "Как вы переводите деньги в Китай?",
    answer: "У нас открыт корпоративный счёт в китайском банке. Вы переводите рубли или доллары нам, мы моментально переводим юани напрямую вашему поставщику со своего китайского счёта. Поставщик получает платёж как обычный внутренний перевод.",
  },
  {
    question: "Какая комиссия за перевод?",
    answer: "Комиссия от 3% от суммы перевода. При регулярных платежах (от 3 в месяц) — 2.5%. Курс юаня — межбанковский + 0.5%. Рассчитайте точную сумму у менеджера.",
  },
  {
    question: "Как быстро поставщик получает деньги?",
    answer: "В течение 1 рабочего дня после поступления вашего платежа к нам. Большинство переводов проходят в тот же день до 18:00 по московскому времени.",
  },
  {
    question: "Можно ли оплатить заказ на 1688 или Alibaba?",
    answer: "Да, это самый частый запрос. Вы присылаете ссылку на товар, мы производим оплату продавцу и выкупаем товар. Дополнительно можем организовать доставку в Россию или Казахстан.",
  },
  {
    question: "Работаете ли вы с физлицами или только с ИП/ООО?",
    answer: "Работаем со всеми. Физлица, ИП, ООО — без разницы. Для крупных сумм (от $10,000) нужно подписать агентский договор.",
  },
  {
    question: "Безопасно ли платить через посредника?",
    answer: "Да. Мы компания с 2019 года, сотни успешных переводов ежемесячно. Работаем по договору агента, каждый перевод подтверждается чеком от поставщика. Деньги застрахованы агентским договором.",
  },
];

export default function PaySupplierChinaPage() {
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
          { label: "Оплата поставщику в Китае" },
        ]}
      />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="inline-flex items-center gap-2 bg-[#00A86B]/10 border border-[#00A86B]/30 rounded-full px-4 py-1.5 text-[#00A86B] text-sm mb-6">
          💴 Перевод юаней · Любой поставщик · Комиссия от 3%
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
          Оплата поставщику<br className="hidden md:block" /> в Китае в юанях
        </h1>
        <p className="text-[#8899aa] text-lg max-w-2xl mb-8">
          Российские банки не переводят юани? Мы переводим.
          Прямой платёж любому китайскому поставщику — <strong className="text-white">без блокировок,
          без SWIFT, без конвертации</strong>. Комиссия от 3%.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="https://t.me/ChinaBridgeLID_bot"
            target="_blank"
            className="inline-flex items-center gap-2 bg-[#00A86B] hover:bg-[#009060] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Узнать условия →
          </Link>
          <Link
            href="/#calculator"
            className="inline-flex items-center gap-2 border border-[#243a5e] hover:border-[#00A86B] text-white px-6 py-3 rounded-xl transition-colors"
          >
            Рассчитать доставку
          </Link>
        </div>
      </section>

      {/* Как это работает */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Как работает оплата</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { n: "1", title: "Вы присылаете", desc: "Ссылку на товар или реквизиты поставщика + сумму в юанях" },
            { n: "2", title: "Вы переводите", desc: "Рубли или доллары нам по текущему курсу + комиссия 3%" },
            { n: "3", title: "Мы переводим", desc: "Юани поставщику напрямую с нашего китайского счёта" },
            { n: "4", title: "Поставщик получает", desc: "Деньги в тот же день. Вы получаете чек от поставщика" },
          ].map((s) => (
            <div key={s.n} className="bg-[#0f2644]/40 border border-[#243a5e] rounded-xl p-5">
              <div className="w-8 h-8 rounded-full bg-[#00A86B] text-white text-sm font-bold flex items-center justify-center mb-3">{s.n}</div>
              <h3 className="font-semibold mb-2">{s.title}</h3>
              <p className="text-[#8899aa] text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Преимущества */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Почему через нас выгоднее банка</h2>
        <div className="grid md:grid-cols-2 gap-5">
          {[
            {
              bank: "❌ Российский банк",
              items: ["SWIFT заблокирован для юаней", "Конвертация по невыгодному курсу", "Комиссия 3–7% + SWIFT", "Платёж идёт 3–7 дней", "Поставщик может не принять"],
              color: "border-red-500/20 bg-red-500/5",
            },
            {
              bank: "✅ ChinaBridge",
              items: ["Прямой перевод юаней", "Межбанковский курс + 0.5%", "Комиссия от 3%", "Платёж за 1 рабочий день", "Гарантия получения поставщиком"],
              color: "border-[#00A86B]/30 bg-[#00A86B]/5",
            },
          ].map((col) => (
            <div key={col.bank} className={`border rounded-2xl p-6 ${col.color}`}>
              <h3 className="font-bold text-lg mb-4">{col.bank}</h3>
              <ul className="space-y-2">
                {col.items.map((item) => (
                  <li key={item} className="text-[#8899aa] text-sm">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <FAQSection items={FAQ} />
      <CTASection />
    </main>
  );
}
