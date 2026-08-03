"use client";

import { useState } from "react";

const EXPENSE_RATES = {
  logistics_air: 2.20,
  logistics_sea: 0.85,
  certification: 0.80,
  customs_pct: 0.07,
  commission_pct: 0.02,
};

const EXCHANGE = 91.5;

type LogisticsType = "air" | "sea";

export default function DemoCalculator() {
  const [qty, setQty] = useState(1000);
  const [unitPrice, setUnitPrice] = useState(15);
  const [logistics, setLogistics] = useState<LogisticsType>("air");
  const [calculated, setCalculated] = useState(true);

  const goodsCost = qty * unitPrice;
  const logisticsCost = qty * (logistics === "air" ? EXPENSE_RATES.logistics_air : EXPENSE_RATES.logistics_sea);
  const certCost = EXPENSE_RATES.certification * (goodsCost / 1000);
  const customsCost = goodsCost * EXPENSE_RATES.customs_pct;
  const commissionCost = goodsCost * EXPENSE_RATES.commission_pct;
  const totalUSD = goodsCost + logisticsCost + certCost + customsCost + commissionCost;
  const perUnitUSD = totalUSD / qty;
  const totalRUB = totalUSD * EXCHANGE;

  const rows = [
    { label: "Стоимость товара", usd: goodsCost, pct: (goodsCost / totalUSD) * 100 },
    { label: logistics === "air" ? "Авиалогистика" : "Морская логистика", usd: logisticsCost, pct: (logisticsCost / totalUSD) * 100 },
    { label: "Сертификация", usd: certCost, pct: (certCost / totalUSD) * 100 },
    { label: "Таможенные расходы", usd: customsCost, pct: (customsCost / totalUSD) * 100 },
    { label: "Комиссия ChinaBridge", usd: commissionCost, pct: (commissionCost / totalUSD) * 100 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">AI-Калькулятор импорта</h1>
        <p className="text-slate-500 text-sm mt-1">Рассчитайте полную себестоимость товара из Китая</p>
      </div>

      {/* Input form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800 mb-5">Параметры заказа</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Количество (шт.)</label>
            <input
              type="number"
              value={qty}
              onChange={e => { setQty(Number(e.target.value)); setCalculated(false); }}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold outline-none focus:border-green-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Цена поставщика (USD / ед.)</label>
            <input
              type="number"
              value={unitPrice}
              step={0.5}
              onChange={e => { setUnitPrice(Number(e.target.value)); setCalculated(false); }}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold outline-none focus:border-green-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Способ доставки</label>
            <div className="flex gap-2">
              <button
                onClick={() => { setLogistics("air"); setCalculated(false); }}
                className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-colors ${logistics === "air" ? "bg-green-600 text-white border-green-600" : "bg-white text-slate-600 border-slate-200 hover:border-green-300"}`}
              >
                ✈️ Авиа
              </button>
              <button
                onClick={() => { setLogistics("sea"); setCalculated(false); }}
                className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-colors ${logistics === "sea" ? "bg-green-600 text-white border-green-600" : "bg-white text-slate-600 border-slate-200 hover:border-green-300"}`}
              >
                🚢 Море
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={() => setCalculated(true)}
          className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          Рассчитать стоимость →
        </button>
      </div>

      {/* Result */}
      {calculated && (
        <>
          {/* Hero result */}
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white shadow-sm">
            <p className="text-green-200 text-sm mb-1">Полная стоимость партии</p>
            <p className="text-4xl font-bold mb-1">${totalUSD.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
            <p className="text-green-200 text-sm mb-4">≈ {Math.round(totalRUB).toLocaleString("ru-RU")} ₽ (курс {EXCHANGE} ₽/$)</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-green-200 text-xs mb-0.5">Себестоимость / ед.</p>
                <p className="text-xl font-bold">${perUnitUSD.toFixed(2)}</p>
                <p className="text-green-200 text-xs">{Math.round(perUnitUSD * EXCHANGE)} ₽/шт.</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-green-200 text-xs mb-0.5">Товар FOB</p>
                <p className="text-xl font-bold">${goodsCost.toLocaleString()}</p>
                <p className="text-green-200 text-xs">{(goodsCost / totalUSD * 100).toFixed(0)}% от итого</p>
              </div>
            </div>
          </div>

          {/* Cost breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">Детализация расходов</h3>
            <div className="space-y-4">
              {rows.map((r, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600">{r.label}</span>
                    <span className="text-sm font-semibold text-slate-800">
                      ${r.usd.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      <span className="text-slate-400 font-normal ml-1 text-xs">({r.pct.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${i === 0 ? "bg-green-500" : i === 1 ? "bg-blue-400" : i === 2 ? "bg-purple-400" : i === 3 ? "bg-orange-400" : "bg-teal-400"}`}
                      style={{ width: `${r.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing scenarios */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">Варианты ценообразования</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { margin: "×2.0", label: "Минимальная наценка", price: perUnitUSD * 2, color: "slate" },
                { margin: "×2.5", label: "Рекомендуемая", price: perUnitUSD * 2.5, color: "green" },
                { margin: "×3.0", label: "Премиальная", price: perUnitUSD * 3, color: "purple" },
              ].map((s, i) => (
                <div key={i} className={`p-4 rounded-xl border text-center ${s.color === "green" ? "bg-green-50 border-green-200" : s.color === "purple" ? "bg-purple-50 border-purple-200" : "bg-slate-50 border-slate-200"}`}>
                  <p className={`text-2xl font-bold mb-1 ${s.color === "green" ? "text-green-700" : s.color === "purple" ? "text-purple-700" : "text-slate-800"}`}>
                    {s.margin}
                  </p>
                  <p className="text-xs text-slate-500 mb-2">{s.label}</p>
                  <p className="text-sm font-semibold text-slate-700">${s.price.toFixed(0)} / ед.</p>
                  <p className="text-xs text-slate-400">{Math.round(s.price * EXCHANGE)} ₽</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* CTA */}
      <div className="text-center py-2">
        <a href="/platform#demo-form" className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors text-sm">
          Получить такой калькулятор →
        </a>
      </div>
    </div>
  );
}
