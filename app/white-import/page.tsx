"use client";

import { useEffect } from "react";
import Link from "next/link";
import { analytics } from "@/lib/analytics";
import { setCountryContext } from "@/lib/utils/country-detect";

export default function WhiteImportPage() {
  useEffect(() => {
    setCountryContext({ country: "RU", source: "landing", currency: "RUB" });
    analytics.landingView({ source: "white_import" });
  }, []);

  return (
    <div className="min-h-screen bg-[#071829] text-white">
      {/* Header */}
      <header className="border-b border-[#243a5e]/50 px-4 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#00A86B] flex items-center justify-center text-white font-bold text-xs">CB</div>
          <span className="font-bold text-sm">China<span className="text-[#00A86B]">Bridge</span></span>
        </Link>
        <a href="https://t.me/ChinaBridgeLID_bot" target="_blank" rel="noopener noreferrer"
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
          Везём от вашего<br/>поставщика в Китае
        </h1>
        <p className="text-center text-[#8899aa] text-sm sm:text-base mb-2">
          Заберём с фабрики, проверим качество, доставим в Россию.
        </p>
        <p className="text-center text-[#556677] text-xs mb-8">
          от $1.1/кг морем · от $3.0/кг авто · сборные партии от 50 кг
        </p>

        {/* Trust strip */}
        <div className="flex flex-wrap justify-center gap-4 mb-10 text-xs text-[#8899aa]">
          {["С 2019 года", "Офис в Гуанчжоу", "🇷🇺 Доставка в РФ", "Партии от 50 кг"].map(t => (
            <span key={t} className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] inline-block" />
              {t}
            </span>
          ))}
        </div>

        {/* CTA Card */}
        <div className="bg-[#0B1F3A] border border-[#243a5e] rounded-2xl p-6 sm:p-8">
          <p className="text-sm font-semibold text-white mb-2 text-center">Получите расчёт прямо сейчас</p>
          <p className="text-xs text-[#8899aa] text-center mb-6">
            AI-консультант задаст несколько вопросов и рассчитает стоимость под ваш товар за 2 минуты
          </p>

          {/* Primary CTA — Telegram bot */}
          <a
            href="https://t.me/ChinaBridgeLID_bot"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => analytics.telegramClick()}
            className="w-full flex items-center justify-center gap-2 bg-[#00A86B] hover:bg-[#009060] text-white font-semibold py-4 rounded-xl transition active:scale-95 mb-3 text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            AI-консультант в Telegram
          </a>

          {/* Secondary CTA — calculator */}
          <Link
            href="/ai-calculator?country=RU"
            onClick={() => analytics.calculatorStart()}
            className="w-full flex items-center justify-center gap-2 border border-[#243a5e] hover:border-[#00A86B]/40 text-[#8899aa] hover:text-white font-medium py-3.5 rounded-xl transition text-sm"
          >
            🧮 Рассчитать стоимость в калькуляторе
          </Link>

          <div className="mt-5 flex flex-col gap-2">
            {[
              "Забираем с любой фабрики или склада в Китае",
              "Консолидируем несколько поставщиков в одну партию",
              "Белый ввоз с полным пакетом документов для РФ",
            ].map(t => (
              <div key={t} className="flex items-start gap-2 text-xs text-[#8899aa]">
                <span className="text-[#00A86B] mt-0.5 shrink-0">✓</span>
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Route options */}
        <div className="mt-8 grid grid-cols-3 gap-3">
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
        <div className="mt-6 bg-[#0B1F3A] border border-[#243a5e] rounded-xl p-5">
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
          <p className="text-xs text-[#8899aa]">Клиент работал с поставщиком 2 года — мы взяли логистику на себя. Белый ввоз, полный пакет документов.</p>
        </div>
      </main>
    </div>
  );
}
