"use client";

import { useEffect, useRef } from "react";
import { trackGAEvent } from "@/lib/analytics/ga";
import {
  Search, PackageCheck, CreditCard, FileText, Truck, ClipboardList, Warehouse,
  ShieldCheck, TrendingUp, Store, ChevronDown,
} from "lucide-react";

/* ── Accent colours ── */
const GOLD = "#C9A84C";

const stages = [
  {
    icon: Search,
    flag: "🇨🇳",
    step: "01",
    title: "Поиск и проверка поставщика",
    desc: "Помогаем найти производителей и поставщиков в Китае. Проверяем условия сотрудничества, цены и возможности производства.",
    extras: null,
    badge: null,
    analyticsEvent: null,
  },
  {
    icon: PackageCheck,
    flag: "📦",
    step: "02",
    title: "Проверка товара",
    desc: "Проверяем характеристики товара, фото, видео, соответствие требованиям рынка.",
    extras: ["Перед закупкой понимаем риски и дополнительные расходы."],
    badge: null,
    analyticsEvent: null,
  },
  {
    icon: CreditCard,
    flag: "💱",
    step: "03",
    title: "Безопасная оплата поставщикам",
    desc: "Помогаем организовать международные платежи китайским поставщикам и контролировать финансовую часть сделки.",
    extras: [
      "✓ Валютные платежи поставщику",
      "✓ Контроль суммы оплаты",
      "✓ Прозрачный расчёт расходов",
      "✓ Связь оплаты с конкретной поставкой",
    ],
    badge: null,
    analyticsEvent: "currencyPaymentClick",
  },
  {
    icon: FileText,
    flag: "📋",
    step: "04",
    title: "Сертификация и разрешительные документы",
    desc: "Помогаем определить, нужны ли сертификаты или декларации соответствия для вашего товара.",
    extras: [
      "✓ Консультация по необходимости сертификации",
      "✓ Определение необходимых документов",
      "✓ Поиск аккредитованного центра",
      "✓ Помощь с оформлением сертификатов и деклараций ЕАЭС",
    ],
    badge: { label: "Помощь при сертификации", price: "от 1 500 ₽", note: "Ответ по требованиям — до 3 рабочих дней." },
    analyticsEvent: "certificationServiceClick",
  },
  {
    icon: Truck,
    flag: "🚚",
    step: "05",
    title: "Логистика из Китая",
    desc: "Подбираем оптимальный вариант доставки: сборные грузы или индивидуальная перевозка.",
    extras: ["Доставляем в Россию 🇷🇺 и Казахстан 🇰🇿"],
    badge: null,
    analyticsEvent: null,
  },
  {
    icon: ClipboardList,
    flag: "📄",
    step: "06",
    title: "Таможенное оформление",
    desc: "Организуем официальное оформление импорта.",
    extras: [
      "✓ Определение кода ТН ВЭД",
      "✓ Подготовка декларации",
      "✓ Расчет таможенных платежей",
      "✓ Работа с дополнительными запросами таможни",
    ],
    badge: { label: "Таможенное оформление", price: "от 11 000 ₽", note: "+450 ₽ за каждый дополнительный лист." },
    analyticsEvent: "customsServiceClick",
  },
  {
    icon: Warehouse,
    flag: "🏭",
    step: "07",
    title: "Доставка до склада",
    desc: "Получаете товар с понятной стоимостью и всеми необходимыми документами.",
    extras: null,
    badge: null,
    analyticsEvent: null,
  },
];

const whyCards = [
  {
    icon: ShieldCheck,
    title: "Прозрачность",
    desc: "Вы заранее знаете все расходы: товар, логистика, документы, таможня.",
  },
  {
    icon: TrendingUp,
    title: "Масштабирование",
    desc: "Можно увеличивать объёмы поставок без смены схемы работы.",
  },
  {
    icon: Store,
    title: "Безопасность",
    desc: "Документы позволяют работать с маркетплейсами и юридическими лицами.",
  },
];

const partnerCards = [
  { emoji: "🔍", title: "Поставщики", desc: "Поиск и проверка производителей" },
  { emoji: "💱", title: "Финансы", desc: "Контроль оплаты поставки" },
  { emoji: "🚚", title: "Логистика", desc: "Доставка Китай → Россия / Казахстан" },
  { emoji: "📋", title: "Документы", desc: "Сертификация и таможня" },
];


export default function ImportEcosystemBlock() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            if (!trackedRef.current) {
              trackedRef.current = true;
              trackGAEvent("importEcosystemView");
            }
          }
        });
      },
      { threshold: 0.1 }
    );
    sectionRef.current?.querySelectorAll(".fade-up").forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section
      id="import-ecosystem"
      className="relative py-20 md:py-28 border-t border-[#243a5e] overflow-hidden"
      ref={sectionRef}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#060f1e] via-[#0B1F3A] to-[#060f1e] pointer-events-none" />
      {/* Subtle gold radial glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(ellipse, ${GOLD}08 0%, transparent 70%)` }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="text-center mb-16 fade-up">
          <p
            className="text-sm font-semibold uppercase tracking-widest mb-3"
            style={{ color: GOLD }}
          >
            Полный цикл импорта
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Импорт из Китая{" "}
            <span style={{ color: GOLD }}>без серых схем</span>
          </h2>
          <p className="text-[#8899aa] text-lg max-w-2xl mx-auto leading-relaxed">
            Берём на себя весь путь: от поиска поставщика и оплаты до доставки и получения товара в России или Казахстане.
          </p>
        </div>

        {/* ── Route visual (7 steps) ── */}
        <div className="fade-up flex items-center justify-center gap-2 flex-wrap mb-16 text-sm font-medium">
          {[
            { label: "🇨🇳 Поиск поставщика", color: GOLD },
            "arrow",
            { label: "🔍 Проверка товара", color: "#00A86B" },
            "arrow",
            { label: "💱 Оплата поставщику", color: GOLD },
            "arrow",
            { label: "📋 Сертификация", color: "#00A86B" },
            "arrow",
            { label: "🚚 Доставка", color: "#00A86B" },
            "arrow",
            { label: "📄 Таможня", color: "#00A86B" },
            "arrow",
            { label: "🏭 Получение товара", color: GOLD },
          ].map((item, i) =>
            item === "arrow" ? (
              <ChevronDown
                key={i}
                className="w-4 h-4 rotate-[-90deg] text-[#243a5e] flex-shrink-0 hidden sm:block"
              />
            ) : (
              <span
                key={i}
                className="px-3 py-1.5 rounded-full border text-xs font-semibold"
                style={{
                  borderColor: (item as { label: string; color: string }).color + "40",
                  color: (item as { label: string; color: string }).color,
                  background: (item as { label: string; color: string }).color + "10",
                }}
              >
                {(item as { label: string; color: string }).label}
              </span>
            )
          )}
        </div>

        {/* ── Stage cards (7 stages) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-20">
          {stages.map((stage, i) => (
            <div
              key={stage.step}
              className={`fade-up card-glass rounded-2xl p-6 flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-200 group relative${
                stage.analyticsEvent === "currencyPaymentClick"
                  ? " ring-1"
                  : ""
              }`}
              style={{
                transitionDelay: `${i * 60}ms`,
                ...(stage.analyticsEvent === "currencyPaymentClick"
                  ? { ringColor: `${GOLD}40` }
                  : {}),
              }}
            >
              {/* Gold highlight for payment stage */}
              {stage.analyticsEvent === "currencyPaymentClick" && (
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{ boxShadow: `inset 0 0 0 1px ${GOLD}30` }}
                />
              )}

              {/* Step number + icon */}
              <div className="flex items-start justify-between">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}30` }}
                >
                  <stage.icon className="w-5 h-5" style={{ color: GOLD }} />
                </div>
                <span
                  className="text-2xl font-bold tabular-nums"
                  style={{ color: `${GOLD}25` }}
                >
                  {stage.step}
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2 leading-snug">
                  {stage.flag} {stage.title}
                </h3>
                <p className="text-[#8899aa] text-sm leading-relaxed">{stage.desc}</p>
              </div>

              {/* Extras */}
              {stage.extras && (
                <ul className="space-y-1">
                  {stage.extras.map((ex) => (
                    <li key={ex} className="text-[#8899aa] text-sm leading-relaxed">
                      {ex}
                    </li>
                  ))}
                </ul>
              )}

              {/* Price badge */}
              {stage.badge && (
                <div
                  className="mt-auto pt-4 border-t"
                  style={{ borderColor: `${GOLD}20` }}
                  onClick={() =>
                    stage.analyticsEvent && trackGAEvent(stage.analyticsEvent)
                  }
                >
                  <div
                    className="inline-flex flex-col gap-0.5 px-3 py-2 rounded-xl"
                    style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}25` }}
                  >
                    <span className="text-xs text-[#8899aa]">{stage.badge.label}</span>
                    <span className="font-bold text-white text-sm">{stage.badge.price}</span>
                  </div>
                  <p className="text-xs text-[#8899aa] mt-2">{stage.badge.note}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Why white import ── */}
        <div className="mb-16">
          <div className="text-center mb-10 fade-up">
            <h2 className="text-2xl md:text-3xl font-bold">
              Почему бизнес выбирает{" "}
              <span className="text-[#00A86B]">официальный импорт?</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {whyCards.map((card, i) => (
              <div
                key={card.title}
                className="fade-up card-glass rounded-2xl p-6 flex flex-col gap-3 hover:-translate-y-1 transition-transform duration-200"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="w-10 h-10 rounded-xl bg-[#00A86B]/10 border border-[#00A86B]/20 flex items-center justify-center">
                  <card.icon className="w-5 h-5 text-[#00A86B]" />
                </div>
                <h3 className="font-semibold text-white">{card.title}</h3>
                <p className="text-[#8899aa] text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── One partner for all import ── */}
        <div className="fade-up mb-16">
          <div className="text-center mb-8">
            <p
              className="text-sm font-semibold uppercase tracking-widest mb-2"
              style={{ color: GOLD }}
            >
              Один партнёр на весь импорт
            </p>
            <h2 className="text-2xl md:text-3xl font-bold">
              Мы закрываем каждый этап
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {partnerCards.map((card, i) => (
              <div
                key={card.title}
                className="card-glass rounded-2xl p-5 text-center fade-up hover:-translate-y-1 transition-transform duration-200"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className="text-3xl mb-3">{card.emoji}</div>
                <h4 className="font-semibold text-white text-sm mb-1">{card.title}</h4>
                <p className="text-[#8899aa] text-xs leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div
          className="fade-up rounded-2xl p-8 md:p-12 text-center"
          style={{
            background: `linear-gradient(135deg, #0f2644 0%, #0B1F3A 100%)`,
            border: `1px solid ${GOLD}25`,
          }}
        >
          <div
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4"
            style={{ background: `${GOLD}15`, color: GOLD, border: `1px solid ${GOLD}30` }}
          >
            Бесплатная проверка
          </div>
          <h3 className="text-2xl md:text-3xl font-bold mb-3">
            Проверьте товар перед закупкой
          </h3>
          <p className="text-[#8899aa] mb-8 max-w-xl mx-auto leading-relaxed">
            Узнайте: можно ли продавать товар, какие документы нужны и сколько будет стоить импорт.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/delivery-calculator"
              onClick={() => {
                trackGAEvent("whiteImportCalculatorClick");
                trackGAEvent("financialCalculatorStart");
              }}
              className="inline-flex items-center justify-center gap-2 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors"
              style={{ background: GOLD, color: "#0B1F3A" }}
            >
              Рассчитать белый импорт
            </a>
            <a
              href="/free"
              onClick={() => trackGAEvent("whiteImportFreeClick")}
              className="inline-flex items-center justify-center gap-2 border font-medium px-8 py-3.5 rounded-xl transition-colors hover:bg-white/5"
              style={{ borderColor: `${GOLD}40`, color: GOLD }}
            >
              Получить бесплатный расчёт
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
