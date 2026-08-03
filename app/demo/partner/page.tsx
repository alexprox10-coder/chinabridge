"use client";

import { useState } from "react";
import Link from "next/link";

type Lang = "ru" | "cn";

const CONTENT = {
  ru: {
    title: "Кабинет партнёра",
    company: "Guangzhou Electric Vehicle Factory Co., Ltd.",
    subtitle: "Поставщик · ID: SUP-GZ-2024-047",
    order_label: "Текущий заказ",
    product: "Электрические скутеры ES-Pro 2000W",
    qty_label: "Количество",
    qty: "1 000 шт.",
    price_label: "Сумма заказа",
    price: "$15 000",
    status_label: "Статус",
    status: "Оплата получена",
    ship_label: "Дата отгрузки",
    ship: "20.08.2026",
    contact_ru: "Менеджер (RU)",
    contact_cn: "联系人 (CN)",
    docs_title: "Документы",
    docs: ["Инвойс #038", "Упаковочный лист", "Сертификат качества"],
    items_title: "Позиции заказа",
    items: [
      { sku: "ES-PRO-2000W-BLK", name: "Скутер ES-Pro 2000W (чёрный)", qty: 600, price: "$9 000" },
      { sku: "ES-PRO-2000W-WHT", name: "Скутер ES-Pro 2000W (белый)", qty: 400, price: "$6 000" },
    ],
    chat_placeholder: "Написать сообщение...",
    chat_label: "Чат с менеджером ChinaBridge",
    msgs: [
      { from: "manager", text: "Иван Петров (ООО Восток Импорт) подтвердил оплату. Пожалуйста, подготовьте партию к 20 августа.", time: "01.08 10:15" },
      { from: "partner", text: "Понял, подготовим в срок. Упаковочный лист отправим 5 августа.", time: "01.08 11:30" },
    ],
    cta: "Получить такую платформу →",
  },
  cn: {
    title: "合作伙伴后台",
    company: "广州电动车工厂有限公司",
    subtitle: "供应商 · 编号: SUP-GZ-2024-047",
    order_label: "当前订单",
    product: "电动踏板车 ES-Pro 2000W",
    qty_label: "数量",
    qty: "1,000 件",
    price_label: "订单金额",
    price: "$15,000",
    status_label: "状态",
    status: "已收到付款",
    ship_label: "发货日期",
    ship: "2026年8月20日",
    contact_ru: "俄方经理",
    contact_cn: "中方联系人",
    docs_title: "文件",
    docs: ["发票 #038", "装箱单", "质量证书"],
    items_title: "订单明细",
    items: [
      { sku: "ES-PRO-2000W-BLK", name: "踏板车 ES-Pro 2000W（黑色）", qty: 600, price: "$9,000" },
      { sku: "ES-PRO-2000W-WHT", name: "踏板车 ES-Pro 2000W（白色）", qty: 400, price: "$6,000" },
    ],
    chat_placeholder: "发送消息...",
    chat_label: "与 ChinaBridge 经理沟通",
    msgs: [
      { from: "manager", text: "伊万·彼得罗夫（东方进口公司）已确认付款。请于8月20日前准备好货物。", time: "08/01 10:15" },
      { from: "partner", text: "明白，我们将按时完成。装箱单将于8月5日发送。", time: "08/01 11:30" },
    ],
    cta: "获取此平台 →",
  },
};

export default function DemoPartner() {
  const [lang, setLang] = useState<Lang>("ru");
  const c = CONTENT[lang];

  return (
    <div className="space-y-6">
      {/* Header with language toggle */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{c.title}</h1>
          <p className="text-slate-500 text-sm mt-1">{c.subtitle}</p>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setLang("ru")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${lang === "ru" ? "bg-white shadow text-slate-800" : "text-slate-500"}`}
          >
            🇷🇺 RU
          </button>
          <button
            onClick={() => setLang("cn")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${lang === "cn" ? "bg-white shadow text-slate-800" : "text-slate-500"}`}
          >
            🇨🇳 CN
          </button>
        </div>
      </div>

      {/* Company card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-3xl shrink-0">
            🏭
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">{c.company}</h2>
            <p className="text-sm text-slate-500">{lang === "ru" ? "Гуанчжоу, КНР · Проверенный поставщик" : "广州，中国 · 认证供应商"}</p>
            <div className="flex gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full border border-green-200 font-medium">
                {lang === "ru" ? "✓ Проверен" : "✓ 已认证"}
              </span>
              <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200 font-medium">
                {lang === "ru" ? "3 поставки" : "3次交货"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: c.order_label, value: "ORD-2024-038" },
            { label: c.qty_label, value: c.qty },
            { label: c.price_label, value: c.price, accent: true },
            { label: c.ship_label, value: c.ship },
          ].map((s, i) => (
            <div key={i} className={`p-3 rounded-xl ${s.accent ? "bg-green-50 border border-green-200" : "bg-slate-50"}`}>
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className={`font-bold text-sm ${s.accent ? "text-green-700" : "text-slate-800"}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white text-2xl shrink-0">
          ✓
        </div>
        <div>
          <p className="font-bold text-green-800">{c.status_label}: {c.status}</p>
          <p className="text-sm text-green-700">{lang === "ru" ? "Оплата получена 01.08.2026 · Курс: $1 = 91.5 ₽" : "付款于2026年8月1日收到 · 汇率：$1 = 91.5卢布"}</p>
        </div>
      </div>

      {/* Order items */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">{c.items_title}</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {c.items.map((item, i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold shrink-0">
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                <p className="text-xs text-slate-400">SKU: {item.sku}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-slate-800">{item.price}</p>
                <p className="text-xs text-slate-400">{item.qty} {lang === "ru" ? "шт." : "件"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800 mb-4">{c.docs_title}</h2>
        <div className="space-y-2">
          {c.docs.map((doc, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400">📄</span>
              <span className="text-sm text-slate-700 flex-1">{doc}</span>
              <button className="text-xs text-green-600 font-medium">↓</button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">{c.chat_label}</h2>
        </div>
        <div className="p-6 space-y-4 min-h-36">
          {c.msgs.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.from === "partner" ? "flex-row-reverse" : ""}`}>
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm shrink-0">
                {m.from === "manager" ? "👤" : "🏭"}
              </div>
              <div className={`max-w-sm rounded-2xl px-4 py-2.5 ${m.from === "partner" ? "bg-green-600 text-white" : "bg-slate-100 text-slate-800"}`}>
                <p className="text-xs opacity-60 mb-1">{m.time}</p>
                <p className="text-sm">{m.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100 p-4 flex gap-3">
          <input
            type="text"
            placeholder={c.chat_placeholder}
            className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-green-400"
          />
          <button className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg">→</button>
        </div>
      </div>

      <div className="text-center py-2">
        <Link href="/platform#demo-form" className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors text-sm">
          {c.cta}
        </Link>
      </div>
    </div>
  );
}
