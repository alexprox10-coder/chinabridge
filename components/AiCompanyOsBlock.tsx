"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

const DEPARTMENTS = [
  { icon: "💰", name: "Финансы AI", desc: "P&L, unit-экономика, прогнозы" },
  { icon: "📊", name: "Аналитика AI", desc: "Дашборды, тренды, инсайты" },
  { icon: "🎯", name: "Маркетинг AI", desc: "Каналы, CPL, воронка" },
  { icon: "🤝", name: "Продажи AI", desc: "CRM, пайплайн, KPI" },
  { icon: "✍️", name: "Контент AI", desc: "SEO, статьи, соцсети" },
  { icon: "⚙️", name: "Операции AI", desc: "Логистика, процессы, партнёры" },
  { icon: "🗺️", name: "Стратегия AI", desc: "Рынок, конкуренты, цели" },
];

export default function AiCompanyOsBlock() {
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
    <section className="py-20 bg-[#060f1e]" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[#C9A84C] text-xs font-medium mb-4">
            AI Company OS
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            CEO AI управляет&nbsp;
            <span className="text-gradient">7 отделами</span>
          </h2>
          <p className="text-[#8899aa] max-w-xl mx-auto text-base">
            Каждый отдел — отдельный AI-директор с ежедневным отчётом, KPI и рекомендациями
          </p>
        </div>

        {/* CEO AI node */}
        <div className="fade-up flex justify-center mb-10">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#C9A84C]/30 to-[#C9A84C]/10 border-2 border-[#C9A84C]/50 flex flex-col items-center justify-center shadow-xl shadow-[#C9A84C]/10 mx-auto">
              <span className="text-3xl mb-1">🤖</span>
              <span className="text-white font-bold text-sm">CEO AI</span>
              <span className="text-[#C9A84C] text-[10px]">Командный центр</span>
            </div>
            {/* Connector line down */}
            <div className="absolute left-1/2 -translate-x-0.5 top-full w-0.5 h-8 bg-gradient-to-b from-[#C9A84C]/60 to-[#00A86B]/30" />
          </div>
        </div>

        {/* Departments grid — decorative, not clickable */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          {DEPARTMENTS.map((dept, i) => (
            <div
              key={dept.name}
              className="fade-up card-glass rounded-2xl p-4 flex flex-col items-center text-center"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-[#0B1F3A] border border-[#243a5e] flex items-center justify-center mb-3">
                <span className="text-2xl">{dept.icon}</span>
              </div>
              <span className="text-white text-xs font-bold mb-1 leading-tight">{dept.name}</span>
              <span className="text-[#8899aa] text-[11px] leading-tight">{dept.desc}</span>
            </div>
          ))}
        </div>

        <div className="fade-up flex justify-center mt-10">
          <Link href="/platform" className="btn-primary">
            Попробовать платформу →
          </Link>
        </div>
      </div>
    </section>
  );
}
