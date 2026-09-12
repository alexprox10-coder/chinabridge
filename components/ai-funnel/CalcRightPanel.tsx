"use client";
import { useState, useEffect } from "react";
import type { EconomicsResult } from "@/lib/calculator/types";

interface CalcDoneDetail {
  economics: EconomicsResult;
  marketplace: string;
  country_to: string;
  city_to: string;
  supplierExists: boolean | null;
}

const MP_LABELS: Record<string, string> = {
  wildberries: "Wildberries",
  ozon:        "Ozon",
  kaspi:       "Kaspi",
  yandex:      "Яндекс Маркет",
  wholesale:   "Опт",
};

function openConsultant() {
  window.dispatchEvent(new CustomEvent("cb:open_consultant"));
  const el = document.getElementById("calculator-top");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function scrollToCalc() {
  const el = document.getElementById("calculator-top");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function ChinaTrustBlock() {
  return (
    <div className="rounded-xl border border-[#1a3a5c] bg-[#060f1e]/50 p-3">
      <div className="flex items-start gap-2.5">
        <span className="text-xl shrink-0">🇨🇳</span>
        <div>
          <p className="text-xs font-semibold text-white mb-0.5">ChinaBridge в Китае</p>
          <p className="text-[10px] text-[#8899aa] leading-relaxed">
            Партнёр в Гуанчжоу — поиск поставщиков, проверка, выкуп, консолидация
          </p>
          <p className="text-[10px] text-[#5a7899] mt-1">Еженедельные рейсы в РФ и КЗ</p>
        </div>
      </div>
    </div>
  );
}

function BeforeRight() {
  const [supplierClick, setSupplierClick] = useState(false);

  function handleSupplierClick() {
    setSupplierClick(true);
    window.dispatchEvent(new CustomEvent("cb:supplier_exists", { detail: true }));
    scrollToCalc();
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Primary CTA */}
      <div className="rounded-2xl border border-[#1a3a5c] bg-[#0B1F3A]/70 p-4">
        <p className="text-[10px] font-semibold text-[#00A86B] uppercase tracking-widest mb-2">После расчёта</p>
        <p className="text-sm font-semibold text-white mb-1 leading-snug">
          Хотите не только проверить товар, но и привезти его?
        </p>
        <p className="text-[11px] text-[#8899aa] mb-4 leading-relaxed">
          Рассчитаем стоимость поставки до вашего города — с учётом таможни, логистики и сроков.
        </p>
        <button
          onClick={scrollToCalc}
          className="w-full py-2.5 bg-[#00A86B] hover:bg-[#009560] text-white text-sm font-bold rounded-xl transition-all active:scale-[0.98]"
        >
          🚚 Рассчитать поставку
        </button>
        <p className="text-[10px] text-[#5a7899] text-center mt-2">
          Без обязательств · сначала расчёт
        </p>
      </div>

      {/* Supplier block */}
      <div className="rounded-xl border border-[#1a3a5c] bg-[#060f1e]/50 p-3">
        <p className="text-[11px] font-semibold text-white mb-1">📦 Поставщик уже есть?</p>
        <p className="text-[10px] text-[#8899aa] mb-2.5 leading-relaxed">
          Менять его не нужно — работаем с вашим текущим поставщиком в Китае.
        </p>
        <button
          onClick={handleSupplierClick}
          className={`w-full py-2 border rounded-xl text-xs font-semibold transition-all ${
            supplierClick
              ? "bg-[#00A86B]/20 border-[#00A86B]/50 text-[#00A86B]"
              : "bg-white/5 hover:bg-white/10 border-[#1e3a5f] text-white"
          }`}
        >
          {supplierClick ? "✅ Отмечено" : "✅ У меня есть поставщик"}
        </button>
      </div>

      <ChinaTrustBlock />
    </div>
  );
}

function AfterRight({ d }: { d: CalcDoneDetail }) {
  const mpLabel = MP_LABELS[d.marketplace] ?? d.marketplace;
  const isKZ = d.country_to === "Kazakhstan";

  return (
    <div className="flex flex-col gap-3">
      {/* Primary: Delivery CTA */}
      <div className="rounded-2xl border border-[#00A86B]/30 bg-[#00A86B]/8 p-4">
        <p className="text-[10px] font-semibold text-[#00A86B] uppercase tracking-widest mb-2">Следующий шаг</p>
        <p className="text-sm font-bold text-white mb-1 leading-snug">
          Хотите привезти этот товар?
        </p>
        {(d.city_to || d.marketplace) && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {d.marketplace && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 border border-[#1a3a5c] text-[#8899aa]">
                {mpLabel}
              </span>
            )}
            {d.city_to && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 border border-[#1a3a5c] text-[#8899aa]">
                📍 {d.city_to}
              </span>
            )}
            {isKZ && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 border border-[#1a3a5c] text-[#8899aa]">
                🇰🇿 KZ
              </span>
            )}
          </div>
        )}
        <p className="text-[11px] text-[#8899aa] mb-4 leading-relaxed">
          {d.supplierExists === true
            ? "Поставщика менять не нужно. Рассчитаем доставку с вашим текущим поставщиком."
            : "Можем найти поставщика или работать с вашим. Рассчитаем поставку до вашего города."}
        </p>
        <button
          onClick={openConsultant}
          className="w-full py-2.5 bg-[#00A86B] hover:bg-[#009560] text-white text-sm font-bold rounded-xl transition-all active:scale-[0.98]"
          data-ab="delivery_cta_a"
        >
          🚚 Рассчитать поставку
        </button>
        <p className="text-[10px] text-[#5a7899] text-center mt-2">Без обязательств · сначала расчёт</p>
      </div>

      {/* AI Consultant CTA */}
      <div className="rounded-xl border border-[#1a3a5c] bg-[#0B1F3A]/70 p-3">
        <div className="flex items-start gap-2.5 mb-2.5">
          <span className="text-lg shrink-0">🤖</span>
          <div>
            <p className="text-xs font-semibold text-white mb-0.5">AI-консультант</p>
            <p className="text-[10px] text-[#8899aa] leading-relaxed">
              Вижу ваш товар и результаты расчёта. Могу уточнить параметры и подготовить коммерческое предложение.
            </p>
          </div>
        </div>
        <button
          onClick={openConsultant}
          className="w-full py-2 bg-white/5 hover:bg-white/10 border border-[#1e3a5f] hover:border-[#00A86B]/40 text-white text-xs font-semibold rounded-xl transition-all"
        >
          Продолжить с AI →
        </button>
      </div>

      <ChinaTrustBlock />

      {/* Pro nudge (subtle) */}
      <div className="rounded-xl border border-[#1a3a5c]/60 bg-[#060f1e]/30 px-3 py-2.5">
        <p className="text-[10px] text-[#5a7899] mb-1.5">Считаете товары регулярно?</p>
        <a
          href="/pricing"
          className="text-[10px] text-[#8899aa] hover:text-[#00A86B] transition-colors"
        >
          Pro — сохранение расчётов, история, AI без лимитов · 1 990 ₽/мес →
        </a>
      </div>
    </div>
  );
}

export default function CalcRightPanel() {
  const [done, setDone]     = useState(false);
  const [detail, setDetail] = useState<CalcDoneDetail | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent<CalcDoneDetail>).detail;
      setDone(true);
      setDetail(d);
    };
    window.addEventListener("cb:calc_done", handler);
    return () => window.removeEventListener("cb:calc_done", handler);
  }, []);

  return done && detail ? <AfterRight d={detail} /> : <BeforeRight />;
}
