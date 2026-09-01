import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

const CANONICAL = "https://chinabridge.pro/white-import";

export const metadata: Metadata = {
  title: "Белая таможня из Китая — официальный ввоз с вашим поставщиком | ChinaBridge",
  description:
    "Есть поставщик в Китае? Привезём официально: забор, консолидация, белая таможня, доставка в РФ и Казахстан. Сборные партии от небольших объёмов.",
  keywords: [
    "белая таможня из китая",
    "официальный ввоз из китая",
    "доставка от поставщика из китая",
    "карго белая таможня",
    "сборная доставка из китая",
    "импорт с поставщиком китай",
    "консолидация китай россия",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Белая таможня из Китая — официальный ввоз с вашим поставщиком | ChinaBridge",
    description:
      "Есть поставщик в Китае? Заберём товар, проведём консолидацию и официально оформим ввоз в РФ или Казахстан.",
    type: "article",
    url: CANONICAL,
    locale: "ru_RU",
    siteName: "ChinaBridge",
  },
  robots: { index: true, follow: true },
};

const FAQ = [
  {
    q: "Нужно ли мне самому общаться с поставщиком?",
    a: "Нет. Достаточно передать нам контакты фабрики или ссылку на товар — мы возьмём на себя всё взаимодействие, включая подтверждение заказа и контроль качества.",
  },
  {
    q: "Работаете ли вы с небольшими партиями?",
    a: "Да. Мы принимаем сборные грузы — объединяем вашу партию с грузами других клиентов. Минимальный объём от одного паллета.",
  },
  {
    q: "Чем белая таможня лучше карго?",
    a: "Официальный ввоз даёт реальные документы для бухгалтерии, возможность отгрузки на маркетплейсы и отсутствие риска задержания груза. Цена выше, но риски несопоставимо ниже.",
  },
  {
    q: "Сколько времени занимает доставка в Москву?",
    a: "Стандартный маршрут — от 18 до 30 дней в зависимости от провинции отправления и загруженности конкретного рейса. Точный срок сообщим после подтверждения готовности груза.",
  },
  {
    q: "Работаете ли вы с Казахстаном?",
    a: "Да, Казахстан — один из наших основных рынков. Доставляем в Алматы, Астану и другие города. Серая логистика (без официального таможенного оформления в РФ) для KZ-клиентов.",
  },
];

export default function WhiteImportPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#060e1c] text-white">
        {/* ── HERO ─────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-[#1a2f50]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#001529] via-[#060e1c] to-[#001529] opacity-80" />
          <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-24">
            <div className="inline-flex items-center gap-2 bg-[#00A86B]/10 border border-[#00A86B]/30 rounded-full px-4 py-1.5 text-xs text-[#00A86B] font-medium mb-6">
              <span>🏭</span> Белая таможня · собственный поставщик
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-5">
              Поставщик в Китае{" "}
              <span className="text-[#00A86B]">уже есть?</span>
              <br />Привезём официально.
            </h1>
            <p className="text-lg text-[#8899aa] max-w-2xl mb-8">
              Не меняйте фабрику. Мы заберём товар у вашего поставщика, проведём
              консолидацию и официально оформим ввоз в Россию или Казахстан —
              с полным пакетом документов.
            </p>
            <div className="flex flex-wrap gap-3 mb-10">
              {[
                "Не нужно менять поставщика",
                "Сборные партии от 1 паллета",
                "Белая таможня + документы",
                "РФ · КЗ · ЕАЭС",
              ].map((t) => (
                <span
                  key={t}
                  className="bg-[#0a1929] border border-[#1e3a5f] rounded-lg px-3 py-1.5 text-sm text-[#c8d8e8]"
                >
                  ✓ {t}
                </span>
              ))}
            </div>
            <a
              href="https://t.me/chinabridge_manager"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#00A86B] hover:bg-[#00966a] text-white font-bold px-7 py-3.5 rounded-xl transition-colors text-base"
            >
              Рассчитать поставку
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
            <p className="text-xs text-[#556677] mt-3">Менеджер ответит в течение 5 минут</p>
          </div>
        </section>

        {/* ── ЧТО МЫ БЕРЁМ НА СЕБЯ ────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 py-14">
          <h2 className="text-2xl font-bold mb-8 text-center">Что мы берём на себя</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: "📦",
                title: "Забор у поставщика",
                text: "Наш представитель в Китае забирает товар с фабрики, проверяет количество и состояние.",
              },
              {
                icon: "🏗️",
                title: "Консолидация",
                text: "Объединяем с другими грузами — вы платите только за свои кубометры, без оплаты пустого контейнера.",
              },
              {
                icon: "📄",
                title: "Таможенное оформление",
                text: "Официальный ввоз по ТК ЕАЭС с полным пакетом: ДТ, инвойс, упаковочный лист, сертификаты.",
              },
              {
                icon: "🚛",
                title: "Доставка до склада",
                text: "Магистраль до Москвы, СПб или транзит в КЗ — всё в одной цепочке, один менеджер.",
              },
              {
                icon: "📊",
                title: "Юнит-экономика",
                text: "Перед отправкой просчитываем маржинальность — убедитесь, что товар выгоден после всех расходов.",
              },
              {
                icon: "💬",
                title: "Общение с фабрикой",
                text: "Говорим по-китайски. Берём переписку на себя — проконтролируем отгрузку и маркировку.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-[#0a1929] border border-[#1e3a5f] rounded-2xl p-5"
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-[#8899aa] leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── КАК ЭТО РАБОТАЕТ ─────────────────────────────────────── */}
        <section className="border-t border-[#1a2f50] bg-[#060e1c]">
          <div className="max-w-4xl mx-auto px-4 py-14">
            <h2 className="text-2xl font-bold mb-8 text-center">Как это работает</h2>
            <div className="flex flex-col gap-4">
              {[
                {
                  n: "1",
                  title: "Вы передаёте контакты поставщика",
                  text: "Достаточно WeChat, Alibaba-ссылки или названия фабрики. Мы свяжемся сами.",
                },
                {
                  n: "2",
                  title: "Мы считаем юнит-экономику",
                  text: "Прямо сейчас — на нашем AI-калькуляторе. Вы увидите маржу, ROI и точку безубыточности.",
                },
                {
                  n: "3",
                  title: "Фиксируем ставку и сроки",
                  text: "Выставляем счёт с полной стоимостью: закупка, забор, консолидация, таможня, доставка.",
                },
                {
                  n: "4",
                  title: "Забираем и везём",
                  text: "Наш агент в Китае принимает груз, упаковывает, маркирует и отправляет по согласованному маршруту.",
                },
                {
                  n: "5",
                  title: "Вы получаете товар + документы",
                  text: "Полный комплект для бухгалтерии и маркетплейсов. Статус груза — в режиме реального времени.",
                },
              ].map((step) => (
                <div
                  key={step.n}
                  className="flex items-start gap-4 bg-[#0a1929] border border-[#1e3a5f] rounded-xl px-5 py-4"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#00A86B]/20 border border-[#00A86B]/40 flex items-center justify-center text-[#00A86B] font-bold text-sm">
                    {step.n}
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm mb-0.5">{step.title}</div>
                    <div className="text-xs text-[#8899aa]">{step.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA КАЛЬКУЛЯТОР ──────────────────────────────────────── */}
        <section className="border-t border-[#1a2f50]">
          <div className="max-w-3xl mx-auto px-4 py-12 text-center">
            <h2 className="text-2xl font-bold mb-3">Сначала проверьте прибыльность</h2>
            <p className="text-[#8899aa] mb-6 text-sm">
              Введите товар или ссылку — AI рассчитает юнит-экономику за 15 секунд
            </p>
            <Link
              href="/ai-calculator"
              className="inline-flex items-center gap-2 bg-[#00A86B] hover:bg-[#00966a] text-white font-bold px-7 py-3.5 rounded-xl transition-colors text-base"
            >
              Запустить AI-калькулятор
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────── */}
        <section className="border-t border-[#1a2f50]">
          <div className="max-w-3xl mx-auto px-4 py-14">
            <h2 className="text-2xl font-bold mb-8 text-center">Частые вопросы</h2>
            <div className="flex flex-col gap-4">
              {FAQ.map((item) => (
                <details
                  key={item.q}
                  className="bg-[#0a1929] border border-[#1e3a5f] rounded-xl px-5 py-4 group"
                >
                  <summary className="font-semibold text-white cursor-pointer list-none flex items-center justify-between gap-3 text-sm">
                    {item.q}
                    <svg
                      className="w-4 h-4 text-[#8899aa] flex-shrink-0 transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="mt-3 text-sm text-[#8899aa] leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── ФИНАЛЬНЫЙ CTA ────────────────────────────────────────── */}
        <section className="border-t border-[#1a2f50] bg-gradient-to-b from-[#060e1c] to-[#001529]">
          <div className="max-w-3xl mx-auto px-4 py-16 text-center">
            <h2 className="text-2xl font-bold mb-3">Готовы привезти?</h2>
            <p className="text-[#8899aa] mb-6 text-sm">
              Напишите нам — менеджер ответит в течение 5 минут и рассчитает точную
              стоимость доставки от вашего поставщика
            </p>
            <a
              href="https://t.me/chinabridge_manager"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#00A86B] hover:bg-[#00966a] text-white font-bold px-8 py-4 rounded-xl transition-colors text-base"
            >
              Написать менеджеру в Telegram
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
