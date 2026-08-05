"use client";

import { useEffect, useRef } from "react";
import { trackGAEvent } from "@/lib/analytics/ga";

const STEPS = [
  {
    n: "01",
    icon: "📋",
    title: "Заявка",
    desc: "Опишите товар, объём и бюджет — менеджер отвечает за 2 часа",
  },
  {
    n: "02",
    icon: "🔍",
    title: "Поиск поставщика",
    desc: "Находим и проверяем 3–5 лучших фабрик, сравниваем цены и условия",
  },
  {
    n: "03",
    icon: "✅",
    title: "Инспекция",
    desc: "Наш представитель в Китае проверяет образцы и производство лично",
  },
  {
    n: "04",
    icon: "🚢",
    title: "Логистика",
    desc: "Выкупаем товар, оформляем таможню, доставляем до склада в РФ или Казахстане",
  },
  {
    n: "05",
    icon: "💰",
    title: "Ваша прибыль",
    desc: "Товар у вас с экономией 20–40% от Alibaba и полным пакетом документов",
  },
];

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const tracked = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            if (!tracked.current) {
              tracked.current = true;
              trackGAEvent("how_it_works_view");
            }
          }
        });
      },
      { threshold: 0.15 }
    );

    el.querySelectorAll(".fade-up").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <section id="how-it-works" className="py-20 bg-[#060f1e]" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00A86B]/30 bg-[#00A86B]/10 text-[#00A86B] text-xs font-medium mb-4">
            Как мы работаем
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            5 шагов от заявки до&nbsp;
            <span className="text-gradient">товара на складе</span>
          </h2>
          <p className="text-[#8899aa] max-w-xl mx-auto text-base">
            Весь процесс занимает 10–40 дней в зависимости от товара и маршрута
          </p>
        </div>

        {/* Desktop timeline */}
        <div className="hidden md:flex items-start gap-0 relative">
          {/* Connector line */}
          <div className="absolute top-10 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-[#00A86B]/20 via-[#00A86B]/60 to-[#00A86B]/20 z-0" />

          {STEPS.map((step, i) => (
            <div
              key={step.n}
              className="fade-up flex-1 flex flex-col items-center text-center px-3 relative z-10"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="w-20 h-20 rounded-full bg-[#0B1F3A] border-2 border-[#00A86B]/40 flex flex-col items-center justify-center mb-5 shadow-lg shadow-[#00A86B]/10">
                <span className="text-2xl leading-none">{step.icon}</span>
                <span className="text-[10px] text-[#00A86B] font-bold mt-1">{step.n}</span>
              </div>
              <h3 className="text-white font-bold text-base mb-2">{step.title}</h3>
              <p className="text-[#8899aa] text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Mobile list */}
        <div className="md:hidden flex flex-col gap-5">
          {STEPS.map((step, i) => (
            <div
              key={step.n}
              className="fade-up flex items-start gap-4 card-glass rounded-2xl p-5"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="w-14 h-14 rounded-full bg-[#0B1F3A] border border-[#00A86B]/40 flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-xl leading-none">{step.icon}</span>
                <span className="text-[9px] text-[#00A86B] font-bold mt-0.5">{step.n}</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-base mb-1">{step.title}</h3>
                <p className="text-[#8899aa] text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
