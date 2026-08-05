"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

const CARDS = [
  {
    emoji: "📦",
    title: "Импортёры",
    subtitle: "Закупаете товар в Китае",
    points: [
      "Поиск проверенных фабрик",
      "Выкуп и инспекция товара",
      "Белый импорт с документами",
      "Доставка в РФ и Казахстан",
    ],
    cta: "Начать импорт",
    href: "/free",
    accent: true,
  },
  {
    emoji: "🛒",
    title: "Продавцы WB / Ozon",
    subtitle: "Торгуете на маркетплейсах",
    points: [
      "Поиск уникального товара",
      "Маркировка и упаковка под МП",
      "Фулфилмент на склад WB/Ozon",
      "AI-аналитика продаж",
    ],
    cta: "Рассчитать поставку",
    href: "/free",
    accent: false,
  },
  {
    emoji: "🚚",
    title: "Карго-компании",
    subtitle: "Оказываете услуги логистики",
    points: [
      "SaaS-платформа под ключ",
      "AI-директора для каждого отдела",
      "CRM + воронка + аналитика",
      "Белый лейбл под ваш бренд",
    ],
    cta: "Посмотреть платформу",
    href: "/platform",
    accent: false,
  },
];

export default function ForWhom() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
      { threshold: 0.1 }
    );
    el.querySelectorAll(".fade-up").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <section className="py-20 bg-[#0B1F3A]" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00A86B]/30 bg-[#00A86B]/10 text-[#00A86B] text-xs font-medium mb-4">
            Для кого мы работаем
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Решения под каждую&nbsp;
            <span className="text-gradient">задачу</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CARDS.map((card, i) => (
            <div
              key={card.title}
              className={`fade-up rounded-2xl p-7 flex flex-col transition-transform hover:-translate-y-1 ${
                card.accent
                  ? "bg-gradient-to-b from-[#00A86B]/20 to-[#00A86B]/5 border border-[#00A86B]/40 shadow-lg shadow-[#00A86B]/10"
                  : "card-glass border border-[#243a5e]"
              }`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              {card.accent && (
                <div className="mb-3 inline-flex self-start">
                  <span className="text-[10px] font-bold text-[#00A86B] bg-[#00A86B]/15 border border-[#00A86B]/30 px-2.5 py-1 rounded-full tracking-wide uppercase">
                    Популярно
                  </span>
                </div>
              )}
              <div className="text-4xl mb-4">{card.emoji}</div>
              <h3 className="text-white font-bold text-xl mb-1">{card.title}</h3>
              <p className="text-[#8899aa] text-sm mb-5">{card.subtitle}</p>
              <ul className="flex flex-col gap-2.5 mb-7 flex-1">
                {card.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-[#8899aa]">
                    <span className="text-[#00A86B] mt-0.5 flex-shrink-0">✓</span>
                    {p}
                  </li>
                ))}
              </ul>
              <Link
                href={card.href}
                className={`text-center text-sm font-semibold py-3 px-5 rounded-xl transition-colors ${
                  card.accent
                    ? "bg-[#00A86B] hover:bg-[#009060] text-white"
                    : "border border-[#243a5e] hover:border-[#00A86B]/50 text-white hover:text-[#00A86B]"
                }`}
              >
                {card.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
