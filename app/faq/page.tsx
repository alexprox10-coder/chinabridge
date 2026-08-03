import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FAQSection } from "@/components/seo/FAQSection";
import { CTASection } from "@/components/seo/CTASection";

export const metadata: Metadata = {
  title: "Часто задаваемые вопросы о доставке из Китая — ChinaBridge",
  description: "Ответы на вопросы о доставке из Китая: стоимость, сроки, таможня, выкуп с 1688, поиск поставщиков, сборные грузы. Задайте вопрос менеджеру.",
  keywords: "вопросы доставка из Китая, FAQ доставка Китай, таможня из Китая вопросы, 1688 вопросы",
  alternates: { canonical: "https://chinabridge.pro/faq" },
  openGraph: {
    title: "FAQ — Частые вопросы о доставке из Китая | ChinaBridge",
    description: "Ответы на вопросы о стоимости, сроках, таможне, выкупе, поставщиках.",
    url: "https://chinabridge.pro/faq",
    type: "website",
  },
};

const FAQ_DELIVERY = [
  {
    question: "Сколько стоит доставка сборного груза из Китая?",
    answer: "Стоимость сборного груза — от $2.5 до $5 за кг в зависимости от маршрута. Авто через Казахстан: $2.5–3.5/кг, через Дальний Восток: $3–5/кг. Авиа: от $6/кг. Морской контейнер под ключ: от $3,500 за 20 футов.",
  },
  {
    question: "Сколько времени занимает доставка из Китая в Россию?",
    answer: "Авто через Казахстан: 25–35 дней. Авто через Дальний Восток: 30–45 дней. Авиа: 5–14 дней. Море через Владивосток: 35–55 дней. Сроки ориентировочные и зависят от города отправления и назначения.",
  },
  {
    question: "Какой минимальный вес для сборной доставки?",
    answer: "Минимум — 50 кг или 0.1 м³. Для меньших объёмов рассмотрите почтовые отправления или экспресс-доставку.",
  },
  {
    question: "Как рассчитывается объёмный вес?",
    answer: "Объёмный вес = Длина × Ширина × Высота (в см) / 6000. Тарификация идёт по большему из реального и объёмного веса. Это важно для лёгких, но объёмных грузов.",
  },
  {
    question: "Доставляете ли в Казахстан?",
    answer: "Да, работаем с Казахстаном. Доставляем в Алматы, Астану, Шымкент и другие города. Маршрут через пограничные переходы Хоргос или Достык. Срок — 15–28 дней в зависимости от города.",
  },
];

const FAQ_CUSTOMS = [
  {
    question: "Вы занимаетесь таможенным оформлением?",
    answer: "Да, предоставляем полный цикл: от закупки в Китае до таможенного оформления и доставки по России. Работаем через аккредитованного таможенного брокера.",
  },
  {
    question: "Какие пошлины платятся при ввозе товаров из Китая?",
    answer: "Таможенная пошлина зависит от кода ТН ВЭД товара и составляет 0–20% от стоимости. Дополнительно — НДС 20% и сбор за таможенное оформление. Точный расчёт — после определения кода ТН ВЭД вашего товара.",
  },
  {
    question: "Какие товары нельзя ввозить из Китая?",
    answer: "Запрещены: оружие, наркотики, контрафактная продукция (копии брендов), опасные материалы, товары под международными санкциями. По ряду категорий требуется обязательная сертификация (детские товары, электроника, медицинские изделия).",
  },
  {
    question: "Нужен ли сертификат на товар?",
    answer: "Зависит от категории. Обязательная сертификация: детские товары, электроника, одежда, продукты питания, медизделия, средства защиты. Декларация соответствия ТР ТС — обязательна для большинства промышленных товаров.",
  },
];

const FAQ_SUPPLIERS = [
  {
    question: "Помогаете ли с поиском поставщиков в Китае?",
    answer: "Да, это одна из наших ключевых услуг. Находим поставщиков через 1688, Alibaba и собственные контакты. Проверяем Business License, историю компании, организуем визит на фабрику.",
  },
  {
    question: "Как проверить поставщика в Китае?",
    answer: "Базовая проверка включает: Business License, статус на 1688/Alibaba, видеозвонок с демонстрацией производства, заказ образца. Углублённая — физический выезд на фабрику и инспекция. Мы делаем это для вас.",
  },
  {
    question: "Можно ли купить на 1688 без посредника?",
    answer: "Нет. 1688.com работает только с китайскими аккаунтами. Без местного юрлица, Alipay и адреса доставки внутри Китая купить невозможно. Именно поэтому нужен посредник.",
  },
  {
    question: "Какова ваша комиссия за выкуп с 1688?",
    answer: "Комиссия за выкуп — 5–10% от стоимости товара в зависимости от объёма. Доставка внутри Китая и международная логистика — отдельно по тарифам.",
  },
];

const FAQ_MARKETPLACE = [
  {
    question: "Помогаете с доставкой товаров для Wildberries и Ozon?",
    answer: "Да. Организуем маркировку товара по требованиям маркетплейса прямо на фабрике в Китае, контроль качества и доставку до склада WB или Ozon.",
  },
  {
    question: "Можно ли нанести маркировку WB на фабрике в Китае?",
    answer: "Да, и это выгоднее, чем делать в России. Поставщик наносит ваш штрихкод, размерную сетку и состав согласно требованиям WB. Мы согласовываем всё с поставщиком.",
  },
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-[#0B1F3A] text-white">
      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "FAQ" },
        ]}
      />

      <section className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Часто задаваемые вопросы
        </h1>
        <p className="text-[#8899aa] text-lg mb-10">
          Ответы на самые распространённые вопросы о доставке из Китая, закупках и таможне.
          Не нашли ответ? Напишите нам в Telegram.
        </p>

        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-bold mb-4 text-[#00A86B]">Доставка и сроки</h2>
            <FAQSection items={FAQ_DELIVERY} withSchema={false} title="" />
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 text-[#00A86B]">Таможня и документы</h2>
            <FAQSection items={FAQ_CUSTOMS} withSchema={false} title="" />
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 text-[#00A86B]">Поставщики и закупка</h2>
            <FAQSection items={FAQ_SUPPLIERS} withSchema={false} title="" />
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 text-[#00A86B]">Маркетплейсы</h2>
            <FAQSection items={FAQ_MARKETPLACE} withSchema={false} title="" />
          </section>
        </div>

        {/* Combined FAQPage schema with all items */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                ...FAQ_DELIVERY,
                ...FAQ_CUSTOMS,
                ...FAQ_SUPPLIERS,
                ...FAQ_MARKETPLACE,
              ].map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: { "@type": "Answer", text: item.answer },
              })),
            }),
          }}
        />

        <div className="mt-12 text-center">
          <p className="text-[#8899aa] mb-4">Остались вопросы? Ответим в Telegram</p>
          <Link
            href="https://t.me/ChinaBridgeLID_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#00A86B] hover:bg-[#009060] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Написать в Telegram →
          </Link>
        </div>
      </section>

      <CTASection />
    </main>
  );
}
