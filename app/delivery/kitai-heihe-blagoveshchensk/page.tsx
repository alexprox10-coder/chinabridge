import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FAQSection } from "@/components/seo/FAQSection";
import { CTASection } from "@/components/seo/CTASection";

export const metadata: Metadata = {
  title: "Доставка из Китая через Хэйхэ — Благовещенск | ChinaBridge",
  description:
    "Доставка из Китая в Россию через Хэйхэ — Благовещенск. Сборные коммерческие партии от 100 кг. Склад в Хэйхэ, таможенное оформление, доставка по России: Москва, СПб, Екатеринбург.",
  keywords:
    "доставка из Китая через Хэйхэ, Хэйхэ Благовещенск доставка, доставка из Гуанчжоу через Хэйхэ, грузоперевозки Хэйхэ Благовещенск, доставка из Китая в Россию",
  alternates: {
    canonical: "https://chinabridge.pro/delivery/kitai-heihe-blagoveshchensk",
  },
  openGraph: {
    title: "Доставка из Китая через Хэйхэ — Благовещенск | ChinaBridge",
    description:
      "Маршрут Китай → Хэйхэ → Благовещенск → Россия. Сборные партии от 100 кг. Таможня, склад, доставка по РФ.",
    url: "https://chinabridge.pro/delivery/kitai-heihe-blagoveshchensk",
    type: "website",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Доставка из Китая через Хэйхэ в Россию",
  provider: { "@type": "Organization", name: "ChinaBridge" },
  description:
    "Маршрут из Китая в Россию через Хэйхэ — Благовещенск. Сборные коммерческие партии, таможенное оформление, доставка по РФ.",
  areaServed: { "@type": "Country", name: "Россия" },
};

const FAQ_ITEMS = [
  {
    question: "Можно ли доставить товар из Гуанчжоу через Хэйхэ?",
    answer:
      "Да, если груз и выбранная логистическая схема подходят для этого маршрута. Товар консолидируется на складе логистического партнёра в Хэйхэ, затем проходит через международный переход Хэйхэ — Благовещенск.",
  },
  {
    question: "Какой минимальный вес для отправки через Хэйхэ?",
    answer:
      "Для сборных коммерческих грузов по текущим условиям логистического партнёра — от 100 кг. Это формат сборного груза, который объединяет партии разных клиентов в один рейс.",
  },
  {
    question: "Кто принимает товар в Хэйхэ?",
    answer:
      "Товар поступает на склад логистического партнёра в Хэйхэ. Там выполняются консолидация, пересчёт, упаковка и маркировка перед отправкой через границу.",
  },
  {
    question: "Кто занимается таможенным оформлением?",
    answer:
      "В зависимости от выбранной схемы оформление может выполнять логистический партнёр: у него есть штатные декларанты, подбор кода ТН ВЭД, расчёт таможенных платежей и сопровождение. Конкретная схема определяется исходя из товара, документов и стоимости партии.",
  },
  {
    question: "Можно ли доставить груз в Москву?",
    answer:
      "Да. После прохождения таможни в Благовещенске груз направляется дальше по России — в Москву, Санкт-Петербург, Екатеринбург или любой другой город через партнёрские транспортные компании.",
  },
  {
    question: "Можно ли доставить на склад Wildberries или Ozon?",
    answer:
      "Да, при наличии правильной маркировки и документов груз может быть направлен на фулфилмент-склад маркетплейса. Этот вопрос уточняется с менеджером при согласовании поставки.",
  },
  {
    question: "Чем этот маршрут отличается от доставки через Казахстан?",
    answer:
      "Маршрут через Хэйхэ — Благовещенск предназначен для грузов, которые идут в Россию напрямую, без транзита через Казахстан. Хэйхэ — пограничный город в Амурской области Китая, с паромной переправой летом и ледовым переходом зимой. Это один из нескольких вариантов доставки в Россию.",
  },
  {
    question: "Сколько времени занимает маршрут?",
    answer:
      "Зависит от города отправки и пункта назначения в России. Доставка из Гуанчжоу или Иу до Благовещенска — ориентировочно 18–28 дней. Дополнительно: время таможенного оформления и доставка по России.",
  },
];

const ROUTE_STEPS = [
  { icon: "🏭", title: "Поставщик в Китае", desc: "Гуанчжоу, Иу, Шэньчжэнь или другой город" },
  { icon: "📦", title: "Консолидация", desc: "Склад логистического партнёра в Хэйхэ" },
  { icon: "🌉", title: "Переход Хэйхэ — Благовещенск", desc: "Паром летом, ледовый переход зимой" },
  { icon: "🏛️", title: "Таможенное оформление", desc: "Благовещенск, штатные декларанты партнёра" },
  { icon: "🚚", title: "Доставка по России", desc: "Москва, СПб, Екатеринбург и другие города" },
  { icon: "✅", title: "Получение", desc: "Ваш склад или адрес назначения" },
];

const RU_CITIES = [
  { name: "Москва", note: "Центральный хаб, все маркетплейсы" },
  { name: "Санкт-Петербург", note: "СЗФО, оптовые склады" },
  { name: "Екатеринбург", note: "Урал, крупный распределительный центр" },
  { name: "Новосибирск", note: "Сибирь, WB, Ozon" },
  { name: "Хабаровск", note: "ДФО, ближайший крупный город" },
];

export default function HeihePage() {
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
          { label: "Хэйхэ — Благовещенск" },
        ]}
      />

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00A86B]/30 bg-[#00A86B]/10 text-[#00A86B] text-xs font-medium mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse" />
          🇷🇺 Доставка в Россию · Один из маршрутов ChinaBridge
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-5 leading-tight">
          Доставка из Китая<br />
          <span className="text-[#00A86B]">через Хэйхэ в Россию</span>
        </h1>
        <p className="text-[#8899aa] text-lg max-w-2xl mb-4">
          Один из маршрутов ChinaBridge для сборных коммерческих партий из Китая
          в Россию. Товар консолидируется в Хэйхэ, проходит через международный
          переход в Благовещенск, далее — таможня и доставка по России.
        </p>
        <p className="text-[#8899aa] text-sm max-w-2xl mb-8">
          Сборные коммерческие партии <span className="text-white font-medium">от 100 кг</span>.
          Заявку рассмотрим индивидуально: менеджер подберёт схему под ваш груз,
          документы и параметры поставки.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/#calculator"
            className="inline-flex items-center gap-2 bg-[#00A86B] hover:bg-[#009060] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Рассчитать маршрут →
          </Link>
          <a
            href="https://t.me/ChinaBridgeLID_bot?start=heihe"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-[#243a5e] hover:border-[#00A86B]/40 text-[#8899aa] hover:text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Написать менеджеру
          </a>
        </div>
      </section>

      {/* ── Route chain ── */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold mb-6">Как работает маршрут</h2>
        <div className="relative">
          <div className="hidden md:block absolute top-8 left-8 right-8 h-px bg-gradient-to-r from-[#00A86B]/30 via-[#00A86B]/60 to-[#00A86B]/30" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {ROUTE_STEPS.map((step, i) => (
              <div
                key={i}
                className="relative flex flex-col items-center text-center gap-2"
              >
                <div className="w-16 h-16 rounded-full bg-[#0f2644] border border-[#243a5e] flex items-center justify-center text-2xl z-10">
                  {step.icon}
                </div>
                <p className="text-sm font-semibold text-white leading-tight">{step.title}</p>
                <p className="text-xs text-[#8899aa] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For whom ── */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold mb-6">Для кого подходит маршрут</h2>
        <div className="grid md:grid-cols-2 gap-5">
          {[
            {
              icon: "🛍️",
              title: "Продавцы маркетплейсов",
              desc: "Wildberries, Ozon — товары из Китая с необходимой маркировкой и документами для приёмки на склад маркетплейса.",
            },
            {
              icon: "🏪",
              title: "Оптовики и дистрибьюторы",
              desc: "Коммерческие партии от 100 кг: одежда, электроника, оборудование, стройматериалы, промышленные товары.",
            },
            {
              icon: "🏭",
              title: "Производственные компании",
              desc: "Регулярные поставки комплектующих и материалов. Маршрут подходит для планомерных сборных грузов.",
            },
            {
              icon: "🔄",
              title: "Те, кто уже возит из Китая",
              desc: "Уже работаете с китайскими поставщиками? Можем сравнить ваш текущий маршрут и предложить альтернативу.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-[#0f2644]/60 border border-[#243a5e] rounded-2xl p-5 flex gap-4"
            >
              <span className="text-2xl flex-shrink-0 mt-0.5">{item.icon}</span>
              <div>
                <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-sm text-[#8899aa] leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Partner & Infrastructure ── */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold mb-6">Инфраструктура маршрута</h2>
        <div className="grid md:grid-cols-3 gap-5">
          <div className="bg-[#0f2644]/60 border border-[#243a5e] rounded-2xl p-5">
            <div className="text-3xl mb-3">🏗️</div>
            <h3 className="font-bold text-white mb-2">Склад в Хэйхэ</h3>
            <p className="text-sm text-[#8899aa] leading-relaxed">
              Товар принимается на склад логистического партнёра в Хэйхэ —
              консолидация, пересчёт, упаковка и маркировка перед отправкой.
            </p>
          </div>
          <div className="bg-[#0f2644]/60 border border-[#243a5e] rounded-2xl p-5">
            <div className="text-3xl mb-3">🌉</div>
            <h3 className="font-bold text-white mb-2">Переход Хэйхэ — Благовещенск</h3>
            <p className="text-sm text-[#8899aa] leading-relaxed">
              Международный мост и паромная переправа через Амур. Один из
              ключевых пунктов пропуска для сборных грузов на Дальнем Востоке.
            </p>
          </div>
          <div className="bg-[#0f2644]/60 border border-[#243a5e] rounded-2xl p-5">
            <div className="text-3xl mb-3">🏛️</div>
            <h3 className="font-bold text-white mb-2">Таможня в Благовещенске</h3>
            <p className="text-sm text-[#8899aa] leading-relaxed">
              Оформление в зависимости от выбранной схемы: логистический партнёр
              располагает штатными декларантами и возможностью подбора кода ТН ВЭД.
            </p>
          </div>
        </div>

        {/* Customs disclaimer */}
        <div className="mt-5 bg-[#0f2644]/40 border border-[#243a5e] rounded-xl px-5 py-4">
          <p className="text-sm text-[#8899aa] leading-relaxed">
            <span className="text-white font-medium">О таможенном оформлении.</span>{" "}
            Конкретная схема определяется исходя из товара, документов, заявленной стоимости,
            веса и условий поставки. Финальное решение принимается после проверки груза
            и согласования с участником ВЭД.
          </p>
        </div>
      </section>

      {/* ── Destinations ── */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold mb-6">Города доставки по России</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-5">
          {RU_CITIES.map((city) => (
            <div
              key={city.name}
              className="bg-[#0f2644]/60 border border-[#243a5e] rounded-xl p-4 text-center"
            >
              <p className="font-semibold text-white mb-1">{city.name}</p>
              <p className="text-xs text-[#8899aa]">{city.note}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-[#8899aa]">
          Доставляем в любой город России через партнёрские транспортные компании.
          Точный срок и стоимость последней мили — уточняется при согласовании поставки.
        </p>
      </section>

      {/* ── Marketplaces ── */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold mb-4">Маркетплейсы: WB и Ozon</h2>
        <p className="text-[#8899aa] mb-6">
          Товары, привезённые через маршрут Хэйхэ — Благовещенск, можно направить
          на склад Wildberries или Ozon при наличии правильной маркировки и сопроводительных
          документов. Этот вопрос прорабатывается с менеджером при согласовании поставки.
        </p>
        <div className="grid md:grid-cols-2 gap-5">
          {[
            {
              name: "Wildberries",
              icon: "🛍️",
              note: "Маркировка Честного знака, транспортные ярлыки WB, упаковка по требованиям.",
            },
            {
              name: "Ozon",
              icon: "📦",
              note: "FBO / FBS схемы. Документы и маркировка согласуются заранее.",
            },
          ].map((mp) => (
            <div
              key={mp.name}
              className="bg-[#0f2644]/60 border border-[#243a5e] rounded-2xl p-5 flex gap-4"
            >
              <span className="text-3xl flex-shrink-0">{mp.icon}</span>
              <div>
                <h3 className="font-bold text-white mb-1">{mp.name}</h3>
                <p className="text-sm text-[#8899aa] leading-relaxed">{mp.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Audit CTA ── */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-[#0f2644]/80 border border-[#00A86B]/20 rounded-2xl p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">
              Уже возите из Китая?
            </h3>
            <p className="text-sm text-[#8899aa] max-w-lg">
              Покажите текущий маршрут — проверим схему и стоимость. Иногда смена
              маршрута или партнёра снижает себестоимость поставки на 15–30%.
            </p>
          </div>
          <a
            href="https://t.me/ChinaBridgeLID_bot?start=audit_heihe"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 bg-[#00A86B] hover:bg-[#009060] text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm whitespace-nowrap"
          >
            Аудит логистики →
          </a>
        </div>
      </section>

      {/* ── FAQ ── */}
      <FAQSection items={FAQ_ITEMS} />

      {/* ── CTA ── */}
      <CTASection />

      {/* ── Internal links ── */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold mb-5">Другие направления ChinaBridge</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              href: "/delivery/china-kazakhstan",
              title: "Доставка в Казахстан",
              desc: "Алматы, Астана, Шымкент. Авто от 30 кг, авиа от 1 кг.",
              flag: "🇰🇿",
            },
            {
              href: "/delivery/china-moscow",
              title: "Доставка в Москву",
              desc: "Авто, авиа, контейнер. Все маршруты из Китая.",
              flag: "🇷🇺",
            },
            {
              href: "/delivery/china-blagoveshchensk",
              title: "Доставка в Благовещенск",
              desc: "Маршрут через Хэйхэ — ближайший пункт пропуска.",
              flag: "🇷🇺",
            },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-[#0f2644]/40 border border-[#243a5e] hover:border-[#00A86B]/40 rounded-xl p-4 flex gap-3 group transition-colors"
            >
              <span className="text-2xl">{link.flag}</span>
              <div>
                <p className="font-semibold text-white group-hover:text-[#00A86B] transition-colors text-sm">
                  {link.title}
                </p>
                <p className="text-xs text-[#8899aa] mt-0.5">{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
