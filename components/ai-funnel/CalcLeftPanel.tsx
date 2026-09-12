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

const CALC_ITEMS = [
  { icon: "🏷️", label: "Закупочная цена", sub: "1688 / Alibaba / описание" },
  { icon: "🚢", label: "Логистика Китай→РФ/КЗ", sub: "карго, авиа, море" },
  { icon: "🏛️", label: "Таможня и пошлины", sub: "НДС 20% + ставка ТН ВЭД" },
  { icon: "💳", label: "Комиссия маркетплейса", sub: "WB 23% · Ozon 20% · Kaspi 12.6%" },
  { icon: "📦", label: "Логистика FBW/FBO", sub: "хранение и доставка МП" },
  { icon: "📈", label: "Прибыль, маржа, ROI", sub: "три сценария" },
];

function verdictMeta(verdict: string) {
  if (verdict === "green")  return { emoji: "🟢", label: "Можно рассматривать", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" };
  if (verdict === "yellow") return { emoji: "🟡", label: "Стоит пересчитать", color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30" };
  return                           { emoji: "🔴", label: "Не рекомендуем",     color: "text-red-400",     bg: "bg-red-500/10 border-red-500/30" };
}

function fmtRub(n: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n) + " ₽";
}

function BeforeLeft() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="rounded-2xl border border-[#1a3a5c] bg-[#0B1F3A]/70 p-4">
        <p className="text-[10px] font-semibold text-[#00A86B] uppercase tracking-widest mb-3">Что учитывает AI</p>
        <div className="flex flex-col gap-2.5">
          {CALC_ITEMS.map(item => (
            <div key={item.label} className="flex gap-2.5 items-start">
              <span className="text-base mt-0.5 shrink-0">{item.icon}</span>
              <div>
                <p className="text-xs font-medium text-white leading-tight">{item.label}</p>
                <p className="text-[10px] text-[#5a7899] mt-0.5">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actuality */}
      <div className="rounded-xl border border-[#1a3a5c] bg-[#060f1e]/50 px-3 py-2.5 text-[10px] text-[#5a7899]">
        ⏱ Тарифы и курсы обновляются ежедневно — дата актуальности указана в каждом расчёте
      </div>

      {/* Collapsible */}
      <button
        onClick={() => setOpen(p => !p)}
        className="text-left text-[11px] text-[#00A86B] hover:text-[#00d48a] transition-colors"
      >
        {open ? "▲ Скрыть" : "▸ Как формируется расчёт"}
      </button>
      {open && (
        <div className="rounded-xl border border-[#1a3a5c] bg-[#0B1F3A]/50 px-3 py-3 text-[10px] text-[#8899aa] leading-relaxed flex flex-col gap-1.5">
          <p>• Цена закупки конвертируется по курсу ЦБ на день расчёта</p>
          <p>• Логистика — тариф из нашего Rate Engine (авто / авиа / море)</p>
          <p>• Таможня — оценочная ставка; точная зависит от ТН ВЭД</p>
          <p>• Комиссии МП — актуальные публичные тарифы 2026</p>
          <p className="pt-1 text-[#5a7899]">Расчёт предварительный. Точный — после уточнения параметров партии.</p>
          <a href="/kak-rasschityvaetsya-import" className="text-[#00A86B] hover:underline mt-1 block">
            Методология расчёта →
          </a>
        </div>
      )}
    </div>
  );
}

function AfterLeft({ d }: { d: CalcDoneDetail }) {
  const ec = d.economics;
  if (!ec) return <BeforeLeft />;

  const vm = verdictMeta(ec.verdict);
  const tp = ec.target_price;

  return (
    <div className="flex flex-col gap-3">
      {/* Verdict */}
      <div className={`rounded-2xl border px-4 py-3 ${vm.bg}`}>
        <p className="text-[10px] font-semibold text-[#8899aa] uppercase tracking-widest mb-1.5">AI Вердикт</p>
        <p className={`text-sm font-bold ${vm.color}`}>{vm.emoji} {vm.label}</p>
        {ec.verdict_label && (
          <p className="text-[10px] text-[#8899aa] mt-1">{ec.verdict_label}</p>
        )}
      </div>

      {/* Key metrics */}
      <div className="rounded-2xl border border-[#1a3a5c] bg-[#0B1F3A]/70 p-4">
        <p className="text-[10px] font-semibold text-[#8899aa] uppercase tracking-widest mb-3">Ваш результат</p>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-[#8899aa]">Себестоимость / шт</span>
            <span className="text-xs font-semibold text-white">{fmtRub(ec.unit_cost_rub)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-[#8899aa]">Прибыль / шт</span>
            <span className={`text-xs font-semibold ${ec.net_profit_rub >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {ec.net_profit_rub >= 0 ? "+" : ""}{fmtRub(ec.net_profit_rub)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-[#8899aa]">Маржа</span>
            <span className={`text-xs font-semibold ${ec.margin_pct >= 25 ? "text-emerald-400" : ec.margin_pct >= 10 ? "text-amber-400" : "text-red-400"}`}>
              {ec.margin_pct.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-[#8899aa]">ROI</span>
            <span className="text-xs font-semibold text-white">{ec.roi_pct.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Target price */}
      {tp && (
        <div className="rounded-2xl border border-[#1a3a5c] bg-[#0B1F3A]/70 p-4 text-center">
          <p className="text-[10px] font-semibold text-[#8899aa] uppercase tracking-widest mb-1">Макс. цена закупки</p>
          <p className="text-2xl font-bold text-white tabular-nums">
            {tp.max_purchase_price_cny.toFixed(1)}
            <span className="text-sm font-normal text-[#8899aa] ml-1">¥</span>
          </p>
          <p className="text-[10px] text-[#5a7899] mt-1 leading-snug">
            При более высокой цене маржа {tp.target_margin_pct}% не выполняется
          </p>
          {tp.max_purchase_price_rub > 0 && (
            <p className="text-[11px] text-[#8899aa] mt-1">≈ {fmtRub(tp.max_purchase_price_rub)}</p>
          )}
        </div>
      )}

      {/* Tariff date */}
      {ec.tariff_date && (
        <p className="text-[10px] text-[#5a7899] text-center">
          📅 Тарифы актуальны на {ec.tariff_date} · курс ЦБ
        </p>
      )}
    </div>
  );
}

export default function CalcLeftPanel() {
  const [done, setDone]       = useState(false);
  const [detail, setDetail]   = useState<CalcDoneDetail | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent<CalcDoneDetail>).detail;
      setDone(true);
      setDetail(d);
    };
    window.addEventListener("cb:calc_done", handler);
    return () => window.removeEventListener("cb:calc_done", handler);
  }, []);

  return done && detail ? <AfterLeft d={detail} /> : <BeforeLeft />;
}
