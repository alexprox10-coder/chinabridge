"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

const FEATURES = [
  "Мультитенантная CRM с воронкой продаж",
  "AI-директора для каждого отдела",
  "Финансовые дашборды и P&L в реальном времени",
  "Интеграции с Telegram, 1С и маркетплейсами",
  "Аналитика по клиентам, маршрутам и грузам",
  "Белый лейбл — запустите под своим брендом",
];

const MOCK_STATS = [
  { label: "Активных клиентов", value: "2 847" },
  { label: "Грузов в пути", value: "143" },
  { label: "Выручка (мес)", value: "₽4.2M" },
  { label: "AI-отчётов сегодня", value: "28" },
];

export default function SaaSPlatformBlock() {
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — text */}
          <div>
            <div className="fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00A86B]/30 bg-[#00A86B]/10 text-[#00A86B] text-xs font-medium mb-6">
              SaaS-платформа для карго
            </div>
            <h2 className="fade-up text-3xl sm:text-4xl font-bold text-white mb-5 leading-tight">
              Запустите карго-бизнес с&nbsp;
              <span className="text-gradient">AI-платформой</span>
            </h2>
            <p className="fade-up text-[#8899aa] text-base leading-relaxed mb-8">
              Готовая инфраструктура для карго-компаний: от CRM и финансов до AI-директоров по каждому направлению. Разворачивается за 1 день.
            </p>
            <ul className="fade-up flex flex-col gap-3 mb-9">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <span className="text-[#00A86B] mt-0.5 flex-shrink-0 text-base">✓</span>
                  <span className="text-slate-200">{f}</span>
                </li>
              ))}
            </ul>
            <div className="fade-up flex flex-col sm:flex-row gap-3">
              <Link href="/platform" className="btn-primary">
                Подключить платформу
              </Link>
              <Link href="/admin/dashboard" className="btn-outline">
                Демо-кабинет →
              </Link>
            </div>
          </div>

          {/* Right — mock dashboard */}
          <div className="fade-up">
            <div className="card-glass rounded-2xl p-5 border border-[#243a5e] shadow-2xl">
              {/* Window header */}
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#243a5e]">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/60" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <span className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <span className="text-[#8899aa] text-xs ml-2">chinabridge.pro / admin / dashboard</span>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {MOCK_STATS.map((s) => (
                  <div key={s.label} className="bg-[#0B1F3A] rounded-xl p-3 border border-[#243a5e]">
                    <div className="text-white font-bold text-lg">{s.value}</div>
                    <div className="text-[#8899aa] text-[11px] mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Mini funnel bars */}
              <div className="bg-[#0B1F3A] rounded-xl p-4 border border-[#243a5e] mb-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white text-xs font-semibold">Воронка продаж</span>
                  <span className="text-[#00A86B] text-xs">↑ 12%</span>
                </div>
                {[
                  { label: "Лиды", pct: 100, cnt: "284" },
                  { label: "Переговоры", pct: 68, cnt: "193" },
                  { label: "КП отправлено", pct: 45, cnt: "128" },
                  { label: "Сделки", pct: 22, cnt: "63" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3 mb-2">
                    <span className="text-[#8899aa] text-[11px] w-28 flex-shrink-0">{row.label}</span>
                    <div className="flex-1 h-2 bg-[#243a5e] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#00A86B] to-[#009060] rounded-full"
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                    <span className="text-white text-[11px] font-mono w-8 text-right">{row.cnt}</span>
                  </div>
                ))}
              </div>

              {/* AI report pill */}
              <div className="flex items-center gap-3 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-xl px-4 py-3">
                <span className="text-xl">🤖</span>
                <div>
                  <div className="text-[#C9A84C] text-xs font-bold">CEO AI — отчёт за сегодня</div>
                  <div className="text-slate-300 text-[11px] mt-0.5">Конверсия выросла на 3.2%. Рекомендую усилить направление РФ-авто.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
