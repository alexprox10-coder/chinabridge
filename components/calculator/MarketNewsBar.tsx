"use client";
import { useEffect, useState } from "react";

interface Rates {
  cny: number;
  usd: number;
  eur: number;
  source: string;
}

// Актуальные новости маркетплейсов и ВЭД — обновлять вручную при изменениях
const NEWS_ITEMS = [
  "🔴 Ozon: с 28.08.2026 комиссия повышена на 20–25% по всем категориям и схемам (FBO/FBS)",
  "📦 WB: новые тарифы логистики FBW с 20.07.2026 — новая формула расчёта по объёму",
  "🛃 ФТС: с 01.08.2026 таможенный порог для физлиц остался 200€ / 31 кг",
  "🇰🇿 Kaspi: комиссия 10,9% + НДС 16% = 12,6% — актуально на 2026",
  "📊 ЯМ: FBY пакет без изменений до конца 2026 (~12% combined)",
  "💰 WB: эквайринг 1,5% включён в базовую комиссию для РФ",
];

export default function MarketNewsBar() {
  const [rates, setRates] = useState<Rates | null>(null);
  const [newsIdx, setNewsIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    fetch("/api/currency")
      .then(r => r.json())
      .then(d => { if (d.ok) setRates({ cny: d.cny, usd: d.usd, eur: d.eur, source: d.source }); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setNewsIdx(i => (i + 1) % NEWS_ITEMS.length);
        setFade(true);
      }, 300);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="w-full rounded-xl border border-[#1e3a5f] bg-[#060f1e]/80 overflow-hidden">
      {/* Currency rates row */}
      <div className="flex items-center gap-4 px-3 py-2 border-b border-[#1e3a5f] flex-wrap">
        <span className="text-[10px] font-semibold text-[#5a7899] uppercase tracking-wider flex-shrink-0">
          ЦБ РФ
        </span>
        {rates ? (
          <>
            <RateChip label="CNY" value={rates.cny} />
            <RateChip label="USD" value={rates.usd} />
            <RateChip label="EUR" value={rates.eur} />
            {rates.source === "fallback" && (
              <span className="text-[9px] text-[#5a7899]">~приблизительно</span>
            )}
          </>
        ) : (
          <span className="text-[10px] text-[#5a7899] animate-pulse">Загружаем курсы...</span>
        )}
        <span className="ml-auto text-[9px] text-[#3a5570] flex-shrink-0">
          {rates ? `обновлено ${new Date().toLocaleDateString("ru-RU")}` : ""}
        </span>
      </div>

      {/* News ticker */}
      <div className="flex items-center gap-2 px-3 py-1.5">
        <span className="text-[9px] font-bold text-[#229ED9] uppercase tracking-wider flex-shrink-0">
          Новости
        </span>
        <p
          className="text-[10px] text-[#8899aa] leading-snug truncate transition-opacity duration-300"
          style={{ opacity: fade ? 1 : 0 }}
        >
          {NEWS_ITEMS[newsIdx]}
        </p>
      </div>
    </div>
  );
}

function RateChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[9px] text-[#5a7899]">{label}</span>
      <span className="text-[11px] font-semibold text-white tabular-nums">
        {value.toFixed(2)} ₽
      </span>
    </div>
  );
}
