"use client";

import { useEffect } from "react";
import Link from "next/link";
import { analytics } from "@/lib/analytics";
import { setCountryContext } from "@/lib/utils/country-detect";
import { PrimaryConversionCTA, StickyMobileCTA } from "@/components/conversion/PrimaryConversionCTA";

export default function WhiteImportPage() {
  useEffect(() => {
    setCountryContext({ country: "RU", source: "landing", currency: "RUB" });
    analytics.landingView({ source: "white_import" });
    analytics.serviceCtaView({ page: "white_import", country: "RU", vertical: "white_import" });
  }, []);

  return (
    <div className="min-h-screen bg-[#071829] text-white pb-20 sm:pb-0">
      {/* Header */}
      <header className="border-b border-[#243a5e]/50 px-4 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#00A86B] flex items-center justify-center text-white font-bold text-xs">CB</div>
          <span className="font-bold text-sm">China<span className="text-[#00A86B]">Bridge</span></span>
        </Link>
        <a href="https://t.me/ChinaBridgeLID_bot?start=seo_white_import" target="_blank" rel="noopener noreferrer"
          onClick={() => analytics.telegramClick()}
          className="text-xs text-[#8899aa] hover:text-white transition-colors">
          Написать менеджеру →
        </a>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-1.5 bg-[#00A86B]/10 border border-[#00A86B]/30 text-[#00A86B] text-xs font-medium px-3 py-1.5 rounded-full">
            ✅ Поставщик есть — менять не нужно
          </span>
        </div>

        {/* Hero */}
        <h1 className="text-3xl sm:text-4xl font-bold text-center leading-tight mb-3">
          Официальный импорт из Китая<br/>в Россию
        </h1>
        <p className="text-center text-[#8899aa] text-sm sm:text-base mb-2">
          Ваши поставщики в Китае уже есть? Мы организуем консолидацию,<br className="hidden sm:block" />
          международную доставку и сопровождение официального импорта.
        </p>
        <p className="text-center text-[#556677] text-xs mb-8">
          от $1.1/кг морем · от $3.0/кг авто · сборные партии от 50 кг
        </p>

        {/* PRIMARY CTA — above the fold */}
        <div className="mb-3">
          <PrimaryConversionCTA
            type="CALCULATOR"
            country="RU"
            vertical="white_import"
            page="white_import"
            label="Получить расчёт поставки"
          />
        </div>
        <div className="mb-8">
          <PrimaryConversionCTA
            type="TELEGRAM"
            country="RU"
            vertical="white_import"
            page="white_import"
            label="У меня уже есть поставщик — написать"
          />
        </div>

        {/* Trust strip */}
        <div className="flex flex-wrap justify-center gap-4 mb-10 text-xs text-[#8899aa]">
          {["С 2019 года", "Офис в Гуанчжоу", "🇷🇺 Доставка в РФ", "Партии от 50 кг"].map(t => (
            <span key={t} className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] inline-block" />
              {t}
            </span>
          ))}
        </div>

        {/* Process block */}
        <div className="bg-[#0B1F3A] border border-[#243a5e] rounded-2xl p-5 sm:p-6 mb-6">
          <p className="text-xs text-[#00A86B] font-semibold uppercase tracking-widest mb-4">Как это работает</p>
          <div className="flex flex-col gap-3">
            {[
              { n: "1", t: "Ваши поставщики в Китае", d: "Консолидируем несколько партий в одну отправку" },
              { n: "2", t: "Международная перевозка", d: "Авто 12–16 дн, море 18–25 дн, авиа 5–7 дн" },
              { n: "3", t: "Таможенное оформление", d: "Полный пакет документов для белого ввоза в РФ" },
              { n: "4", t: "Выпуск и доставка", d: "До вашего склада, WB или Ozon" },
            ].map(s => (
              <div key={s.n} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#00A86B]/20 text-[#00A86B] text-xs font-bold flex items-center justify-center">{s.n}</span>
                <div>
                  <p className="text-white text-sm font-medium">{s.t}</p>
                  <p className="text-[#8899aa] text-xs mt-0.5">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
          {/* CTA after process */}
          <div className="mt-5">
            <PrimaryConversionCTA
              type="CALCULATOR"
              country="RU"
              vertical="white_import"
              page="white_import"
              label="Рассчитать поставку"
            />
          </div>
        </div>

        {/* Existing supplier block */}
        <div className="bg-[#0B1F3A] border border-[#243a5e] rounded-2xl p-5 sm:p-6 mb-6">
          <p className="text-sm font-semibold text-white mb-3">🏭 Поставщик уже есть — менять его не нужно</p>
          <div className="flex flex-col gap-2 mb-5">
            {[
              "Заберём товар с любой фабрики или склада в Китае",
              "Объединим партии от нескольких поставщиков",
              "Организуем международную доставку",
              "Сопроводим таможенное оформление под ключ",
            ].map(t => (
              <div key={t} className="flex items-start gap-2 text-xs text-[#8899aa]">
                <span className="text-[#00A86B] mt-0.5 shrink-0">✓</span>
                {t}
              </div>
            ))}
          </div>
          <PrimaryConversionCTA
            type="CALCULATOR"
            country="RU"
            vertical="white_import"
            page="white_import"
            label="Получить расчёт"
          />
        </div>

        {/* Route options */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          {[
            { icon: "🚢", label: "Море", detail: "$1.1/кг", sub: "18–25 дней" },
            { icon: "🚛", label: "Авто", detail: "$3.0/кг", sub: "12–16 дней" },
            { icon: "✈️", label: "Авиа", detail: "$23/кг",  sub: "5–7 дней" },
          ].map(r => (
            <div key={r.label} className="bg-[#0B1F3A] border border-[#243a5e] rounded-xl p-3 text-center">
              <div className="text-xl mb-1">{r.icon}</div>
              <div className="text-xs font-semibold text-white">{r.label}</div>
              <div className="text-sm font-bold text-[#00A86B]">{r.detail}</div>
              <div className="text-[10px] text-[#556677]">{r.sub}</div>
            </div>
          ))}
        </div>

        {/* Case */}
        <div className="mb-6 bg-[#0B1F3A] border border-[#243a5e] rounded-xl p-5">
          <p className="text-xs text-[#556677] uppercase tracking-widest mb-3">Кейс</p>
          <p className="text-sm font-semibold text-white mb-2">500 единиц электроники с фабрики в Shenzhen → Москва</p>
          <div className="flex gap-4 mb-3">
            {[{ v: "18 дн.", l: "морем" }, { v: "$1.1/кг", l: "ставка" }, { v: "0 проблем", l: "с таможней" }].map(s => (
              <div key={s.l} className="text-center">
                <div className="text-base font-bold text-[#00A86B]">{s.v}</div>
                <div className="text-[10px] text-[#8899aa]">{s.l}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#8899aa] mb-4">Клиент работал с поставщиком 2 года — мы взяли логистику на себя. Белый ввоз, полный пакет документов.</p>
          {/* Final CTA */}
          <PrimaryConversionCTA
            type="CALCULATOR"
            country="RU"
            vertical="white_import"
            page="white_import"
            label="Рассчитать мою поставку"
          />
        </div>

        {/* FAQ */}
        <div className="bg-[#0B1F3A] border border-[#243a5e] rounded-2xl p-5">
          <p className="text-xs text-[#00A86B] font-semibold uppercase tracking-widest mb-4">Частые вопросы</p>
          {[
            { q: "Нужно ли менять поставщика?", a: "Нет. Мы работаем с вашими текущими поставщиками — забираем товар с любого склада или фабрики в Китае." },
            { q: "Какой минимальный объём?", a: "Сборные партии от 50 кг. Можно объединить нескольких поставщиков в одну отправку." },
            { q: "Как оформляется таможня?", a: "Полный белый ввоз с ДТ, инвойсами и сертификатами. Оформляем через уполномоченного брокера." },
          ].map(faq => (
            <div key={faq.q} className="mb-4 last:mb-0">
              <p className="text-sm font-semibold text-white mb-1">{faq.q}</p>
              <p className="text-xs text-[#8899aa]">{faq.a}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Sticky mobile CTA */}
      <StickyMobileCTA
        type="CALCULATOR"
        country="RU"
        vertical="white_import"
        page="white_import"
        label="Получить расчёт бесплатно"
      />
    </div>
  );
}
