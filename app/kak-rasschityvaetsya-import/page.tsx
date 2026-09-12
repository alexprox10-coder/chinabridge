import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

const CANONICAL = "https://chinabridge.pro/kak-rasschityvaetsya-import";

export const metadata: Metadata = {
  title: "Как рассчитывается стоимость импорта из Китая — методология ChinaBridge",
  description:
    "Подробная методология расчёта себестоимости импорта из Китая: закупочная цена, международная логистика, таможня, комиссии маркетплейсов, итоговая маржа. Реальные формулы и коэффициенты 2026.",
  keywords: [
    "расчёт себестоимости импорта из китая",
    "как считать стоимость товара из китая",
    "формула расчёта импорта",
    "себестоимость товара из китая",
    "расчёт таможенных расходов",
    "юнит-экономика импорт",
    "расчёт комиссии маркетплейса",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Методология расчёта импорта из Китая | ChinaBridge",
    description: "Как формируется полная себестоимость товара из Китая: пошаговая методология с формулами.",
    type: "article",
    url: CANONICAL,
    locale: "ru_RU",
    siteName: "ChinaBridge",
  },
  robots: { index: true, follow: true },
};

const STEPS = [
  {
    num: "01",
    title: "Закупочная цена на 1688 / Alibaba",
    icon: "🛒",
    color: "border-blue-500/40 bg-blue-500/5",
    numColor: "text-blue-400",
    body: [
      "Берётся цена за единицу у поставщика на 1688.com или Alibaba в юанях (CNY).",
      "Курс юань/рубль и юань/тенге обновляется ежедневно по данным ЦБ РФ и Нацбанка РК.",
      "Для расчёта используется средний курс дня + 1–2% банковская конвертация.",
      "Формула: <code>закупочная_цена_руб = цена_cny × курс × (1 + конвертация)</code>",
    ],
  },
  {
    num: "02",
    title: "Международная логистика",
    icon: "🚢",
    color: "border-indigo-500/40 bg-indigo-500/5",
    numColor: "text-indigo-400",
    body: [
      "Стоимость карго из Китая рассчитывается по весу или объёму (применяется больший тариф).",
      "Плотность груза: объёмный вес = длина × ширина × высота / 6000.",
      "Тарифы авто-доставки: 1.20–2.70 юань/кг в зависимости от плотности товара.",
      "Сроки авто: 18–22 дня (Китай → Россия/Казахстан).",
      "Авиа: от 220 юань/кг, срок 3–5 дней.",
      "Формула: <code>логистика_руб = max(вес_кг, объём_м³ × 167) × ставка_cny/кг × курс</code>",
    ],
  },
  {
    num: "03",
    title: "Таможенные расходы (Россия)",
    icon: "🏛️",
    color: "border-amber-500/40 bg-amber-500/5",
    numColor: "text-amber-400",
    body: [
      "НДС 20% начисляется на таможенную стоимость (цена + доставка до границы).",
      "Ввозная пошлина зависит от кода ТН ВЭД товара, в среднем 5–15%.",
      "Таможенный сбор: фиксированный в зависимости от суммы декларации.",
      "Для большинства товаров суммарная таможенная нагрузка составляет 25–35% от FOB-стоимости.",
      "Казахстан (ЕАЭС): принципиально схожая структура, ставки отличаются по ряду позиций.",
    ],
  },
  {
    num: "04",
    title: "Комиссии маркетплейсов",
    icon: "🛍️",
    color: "border-purple-500/40 bg-purple-500/5",
    numColor: "text-purple-400",
    body: [
      "Wildberries: 5–25% от цены продажи (зависит от категории товара и схемы работы).",
      "Ozon: 4–22% + дополнительные сборы за эквайринг (1.5%) и операционные расходы.",
      "Kaspi.kz: 12–16% в зависимости от категории.",
      "Тарифы обновляются. Наши расчёты используют официальные данные маркетплейсов (дата актуализации указана в расчёте).",
      "Логистика маркетплейса (FBW/FBO): 25–80 ₽/литр + 50–200 ₽ за обработку в зависимости от размера и веса.",
    ],
  },
  {
    num: "05",
    title: "Итоговая себестоимость и маржа",
    icon: "📊",
    color: "border-green-500/40 bg-green-500/5",
    numColor: "text-green-400",
    body: [
      "Полная себестоимость = закупка + международная логистика + таможня + комиссия МП + логистика МП.",
      "Маржа = (цена продажи − полная себестоимость) / цена продажи × 100%.",
      "ROI = чистая прибыль / полная себестоимость × 100%.",
      "Наш AI-вердикт: Зелёный ≥25% маржи, Жёлтый 10–25%, Красный <10%.",
      "Максимальная закупочная цена (Target Price) = цена, при которой маржа равна целевому порогу.",
    ],
  },
  {
    num: "06",
    title: "AI-вердикт и оценка товара",
    icon: "🤖",
    color: "border-cyan-500/40 bg-cyan-500/5",
    numColor: "text-cyan-400",
    body: [
      "AI оценивает товар по 6 факторам: маржа, ROI, цена закупки, логистика, поставщик, MOQ.",
      "Оценка 0–10: взвешенное среднее по всем факторам с коэффициентами важности.",
      "Рекомендуется только AI-анализ как вспомогательный инструмент планирования.",
      "Итоговые параметры поставки уточняются менеджером с учётом реального груза, маршрута и документации.",
    ],
  },
];

export default function HowImportCostCalculatedPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#060f1e] text-white">
        {/* Hero */}
        <section className="max-w-3xl mx-auto px-4 pt-16 pb-8">
          <div className="mb-4">
            <Link href="/ai-calculator" className="inline-flex items-center gap-1.5 text-xs text-[#5a7899] hover:text-[#8899aa] transition-colors">
              ← AI-калькулятор импорта
            </Link>
          </div>
          <div className="inline-flex items-center gap-2 bg-[#00A86B]/10 border border-[#00A86B]/30 rounded-full px-3 py-1 text-xs text-[#00A86B] font-medium mb-5">
            📋 Методология расчёта
          </div>
          <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-4 text-white">
            Как рассчитывается<br />
            <span className="text-[#00A86B]">стоимость импорта из Китая</span>
          </h1>
          <p className="text-base text-[#8899aa] leading-relaxed max-w-2xl">
            Полная себестоимость товара из Китая включает 5 компонентов. AI-калькулятор ChinaBridge автоматически считает каждый из них. Вот как именно — прозрачно, с формулами и источниками.
          </p>

          {/* Author / E-E-A-T */}
          <div className="mt-8 flex items-start gap-3 bg-[#0a1628] border border-[#1a3a5c] rounded-xl px-4 py-4">
            <div className="w-10 h-10 rounded-full bg-[#00A86B]/20 border border-[#00A86B]/40 flex items-center justify-center text-lg flex-shrink-0">
              🏭
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Команда ChinaBridge</p>
              <p className="text-xs text-[#5a7899] mt-0.5">
                Экспорт-импортный брокер с партнёром в Гуанчжоу. Опыт работы с поставщиками 1688, Alibaba, Taobao с 2020 года. Обработано более 1 200 поставок в Россию и Казахстан.
              </p>
              <p className="text-[10px] text-[#3a5a7c] mt-1.5">Обновлено: сентябрь 2026</p>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="max-w-3xl mx-auto px-4 pb-12">
          <div className="flex flex-col gap-6">
            {STEPS.map(step => (
              <div key={step.num} className={`border rounded-2xl p-5 sm:p-6 ${step.color}`}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className={`text-3xl font-black ${step.numColor} leading-none`}>{step.num}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{step.icon}</span>
                      <h2 className="text-base sm:text-lg font-bold text-white">{step.title}</h2>
                    </div>
                    <ul className="flex flex-col gap-2">
                      {step.body.map((line, i) => (
                        <li key={i} className="text-sm text-[#8899aa] leading-relaxed">
                          {line.startsWith("<code>") ? (
                            <span>
                              {line.replace(/<code>/, "").replace(/<\/code>/, "").split("=").map((part, j, arr) =>
                                j < arr.length - 1
                                  ? [<span key={`t${j}`}>{part}=</span>]
                                  : [<code key={`c${j}`} className="text-xs bg-[#0a1628] text-[#00A86B] px-2 py-0.5 rounded font-mono border border-[#1a3a5c]">{part}</code>]
                              )}
                            </span>
                          ) : (
                            <>• {line}</>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <section className="max-w-3xl mx-auto px-4 pb-10">
          <div className="bg-[#0a1628] border border-[#1a3a5c] rounded-xl px-5 py-4">
            <div className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0 mt-0.5">ℹ️</span>
              <div>
                <p className="text-sm font-semibold text-[#8899aa] mb-1">Предварительный расчёт</p>
                <p className="text-xs text-[#5a7899] leading-relaxed">
                  AI-калькулятор использует актуальные тарифные данные маркетплейсов, рыночные карго-ставки и официальный курс ЦБ. Итоговая стоимость поставки уточняется менеджером с учётом реального веса, габаритов, упаковки, маршрута и таможенного оформления.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto px-4 pb-20">
          <div className="bg-gradient-to-br from-[#00A86B]/10 to-[#00A86B]/5 border border-[#00A86B]/30 rounded-2xl p-6 text-center">
            <p className="text-xl font-bold text-white mb-2">Проверьте реальную себестоимость вашего товара</p>
            <p className="text-sm text-[#8899aa] mb-5">Вставьте ссылку с 1688 или Alibaba — AI рассчитает все 5 компонентов за 15 секунд</p>
            <Link
              href="/ai-calculator"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#00A86B] hover:bg-[#008f59] text-white font-bold rounded-xl transition-all text-sm"
            >
              🤖 Рассчитать бесплатно →
            </Link>
            <p className="text-xs text-[#5a7899] mt-3">Бесплатно · без регистрации · 3 расчёта в день</p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
