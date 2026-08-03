"use client";

import { useState } from "react";

const ORDER = {
  id: "ORD-2024-038",
  product: "Электрические скутеры ES-Pro 2000W",
  supplier: "Guangzhou Electric Vehicle Factory",
  qty: 1000,
  unit_price: 15,
  currency: "USD",
  created: "15.07.2026",
  delivery_date: "20.09.2026",
};

const STATUSES = [
  { key: "search", label: "Поиск поставщика", date: "15.07.2026", done: true },
  { key: "verification", label: "Проверка товара", date: "22.07.2026", done: true },
  { key: "payment", label: "Оплата поставщику", date: "01.08.2026", done: true },
  { key: "certification", label: "Сертификация", date: "10.08.2026", done: false, active: true },
  { key: "logistics", label: "Логистика из Китая", date: "01.09.2026", done: false },
  { key: "customs", label: "Таможенное оформление", date: "12.09.2026", done: false },
  { key: "delivery", label: "Доставка до склада", date: "20.09.2026", done: false },
];

const DOCS = [
  { name: "Коммерческое предложение", type: "PDF", size: "245 KB", date: "15.07.2026", icon: "📄" },
  { name: "Договор поставки #038", type: "PDF", size: "128 KB", date: "20.07.2026", icon: "📋" },
  { name: "Инвойс поставщика", type: "PDF", size: "89 KB", date: "01.08.2026", icon: "💰" },
  { name: "Упаковочный лист", type: "XLSX", size: "45 KB", date: "01.08.2026", icon: "📦" },
];

const MSGS = [
  { from: "manager", name: "Алексей К.", text: "Поставщик подтверждён, договор готов к подписанию.", time: "01.08 14:30" },
  { from: "client", name: "Вы", text: "Отлично! Когда ожидать инвойс на оплату?", time: "01.08 15:02" },
  { from: "manager", name: "Алексей К.", text: "Инвойс пришёл — загрузил в документы. Сертификация начнётся 10 августа.", time: "01.08 16:45" },
];

export default function DemoClient() {
  const [tab, setTab] = useState<"overview" | "docs" | "chat">("overview");

  const totalUSD = ORDER.qty * ORDER.unit_price;
  const totalRUB = totalUSD * 91.5;
  const activeStep = STATUSES.findIndex(s => s.active);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Кабинет клиента</h1>
          <p className="text-slate-500 text-sm mt-0.5">ООО Восток Импорт · {ORDER.id}</p>
        </div>
        <span className="ml-auto px-3 py-1 bg-amber-100 border border-amber-200 text-amber-700 text-xs font-semibold rounded-full">
          ⚙️ В процессе
        </span>
      </div>

      {/* Order summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-14 h-14 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-3xl shrink-0">
            🛵
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-slate-800 text-lg">{ORDER.product}</h2>
            <p className="text-sm text-slate-500">{ORDER.supplier}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Количество", value: `${ORDER.qty.toLocaleString("ru-RU")} шт.` },
            { label: "Сумма (USD)", value: `$${totalUSD.toLocaleString("ru-RU")}`, accent: true },
            { label: "Сумма (RUB)", value: `${Math.round(totalRUB).toLocaleString("ru-RU")} ₽` },
            { label: "Доставка", value: ORDER.delivery_date },
          ].map((s, i) => (
            <div key={i} className={`p-3 rounded-xl ${s.accent ? "bg-green-50 border border-green-200" : "bg-slate-50"}`}>
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className={`font-bold text-sm ${s.accent ? "text-green-700" : "text-slate-800"}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Status timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800 mb-5">Этапы импорта</h2>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
          <div className="space-y-4">
            {STATUSES.map((s, i) => (
              <div key={s.key} className="flex items-center gap-4 relative">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm z-10 shrink-0 ${
                  s.done
                    ? "bg-green-500 border-green-500 text-white"
                    : s.active
                    ? "bg-white border-amber-400 text-amber-500"
                    : "bg-white border-slate-200 text-slate-300"
                }`}>
                  {s.done ? "✓" : s.active ? "●" : (i + 1)}
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <span className={`text-sm font-medium ${s.done ? "text-green-700" : s.active ? "text-amber-700" : "text-slate-400"}`}>
                    {s.label}
                  </span>
                  <span className={`text-xs ${s.done || s.active ? "text-slate-500" : "text-slate-300"}`}>{s.date}</span>
                </div>
                {s.active && (
                  <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium border border-amber-200 shrink-0">
                    Текущий
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-1 mb-4">
          {(["overview", "docs", "chat"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? "bg-green-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t === "overview" ? "📊 Финансы" : t === "docs" ? "📄 Документы" : "💬 Чат"}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-800">Структура затрат</h3>
            {[
              { label: "Стоимость товара (1 000 шт × $15)", amount: "$15 000", rub: "1 372 500 ₽", pct: 76 },
              { label: "Логистика (авиа, Гуанчжоу → Москва)", amount: "$2 200", rub: "201 300 ₽", pct: 11 },
              { label: "Сертификация и документы", amount: "$800", rub: "73 200 ₽", pct: 4 },
              { label: "Таможня (пошлина + НДС)", amount: "$1 400", rub: "128 100 ₽", pct: 7 },
              { label: "Комиссия ChinaBridge", amount: "$400", rub: "36 600 ₽", pct: 2 },
            ].map((r, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-600">{r.label}</span>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-slate-800">{r.amount}</span>
                    <span className="text-xs text-slate-400 ml-2">{r.rub}</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <span className="font-bold text-slate-900">Итого (полная стоимость)</span>
              <div className="text-right">
                <span className="text-xl font-bold text-green-600">$19 800</span>
                <span className="text-sm text-slate-500 ml-2">1 811 700 ₽</span>
              </div>
            </div>
            <p className="text-xs text-slate-400">Себестоимость единицы: $19.80 / 1 812 ₽</p>
          </div>
        )}

        {tab === "docs" && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {DOCS.map((d, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50">
                  <span className="text-2xl">{d.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{d.name}</p>
                    <p className="text-xs text-slate-400">{d.type} · {d.size} · {d.date}</p>
                  </div>
                  <button className="text-xs text-green-600 font-medium hover:text-green-700">Скачать ↓</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "chat" && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 space-y-4 min-h-48">
              {MSGS.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.from === "client" ? "flex-row-reverse" : ""}`}>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm shrink-0">
                    {m.from === "client" ? "👤" : "🙋"}
                  </div>
                  <div className={`max-w-sm rounded-2xl px-4 py-2.5 ${m.from === "client" ? "bg-green-600 text-white" : "bg-slate-100 text-slate-800"}`}>
                    <p className="text-xs opacity-70 mb-1">{m.name} · {m.time}</p>
                    <p className="text-sm">{m.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 p-4 flex gap-3">
              <input
                type="text"
                placeholder="Написать менеджеру..."
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-green-400"
              />
              <button className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg">→</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
