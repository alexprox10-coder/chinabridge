"use client";

import { useState } from "react";
import Link from "next/link";
import { trackGAEvent } from "@/lib/analytics/ga";

const CITIES = ["Москва", "Санкт-Петербург", "Новосибирск", "Алматы", "Астана", "Екатеринбург", "Краснодар"];

type Step = "form" | "contact" | "done";

export default function WhiteImportPage() {
  const [step, setStep] = useState<Step>("form");
  const [product, setProduct] = useState("");
  const [city, setCity] = useState("");
  const [telegram, setTelegram] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleFormNext() {
    if (!product.trim()) return;
    trackGAEvent("white_import_step1", { product, city });
    setStep("contact");
  }

  async function handleSubmit() {
    if (!telegram.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/landing-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram,
          product,
          has_supplier: "yes",
          city,
          source: "landing_white_import",
        }),
      });
      trackGAEvent("white_import_lead", { product, city });
    } catch { /* ignore */ }
    setLoading(false);
    setStep("done");
  }

  return (
    <div className="min-h-screen bg-[#071829] text-white">
      {/* Header */}
      <header className="border-b border-[#243a5e]/50 px-4 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#00A86B] flex items-center justify-center text-white font-bold text-xs">CB</div>
          <span className="font-bold text-sm">China<span className="text-[#00A86B]">Bridge</span></span>
        </Link>
        <a href="https://t.me/ChinaBridgeLID_bot" target="_blank" rel="noopener noreferrer"
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
          Заберём с фабрики, проверим качество, доставим в Россию или Казахстан.
        </p>
        <p className="text-center text-[#556677] text-xs mb-8">
          от $1.1/кг морем · от $2.5/кг авиа · сборные партии от 50 кг
        </p>

        {/* Trust strip */}
        <div className="flex flex-wrap justify-center gap-4 mb-10 text-xs text-[#8899aa]">
          {["С 2019 года", "Офис в Гуанчжоу", "РФ и Казахстан", "Партии от 50 кг"].map(t => (
            <span key={t} className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] inline-block" />
              {t}
            </span>
          ))}
        </div>

        {/* Card */}
        <div className="bg-[#0B1F3A] border border-[#243a5e] rounded-2xl p-6 sm:p-8">

          {step === "form" && (
            <>
              <p className="text-sm font-semibold text-white mb-5">Расскажите о вашем товаре</p>

              <div className="mb-4">
                <label className="text-[10px] uppercase tracking-widest text-[#8899aa] mb-1.5 block">
                  Что везёте?
                </label>
                <input
                  type="text"
                  value={product}
                  onChange={e => setProduct(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleFormNext()}
                  placeholder="Например: наушники, автозапчасти, одежда..."
                  className="w-full bg-[#071829] border border-[#243a5e] focus:border-[#00A86B]/60 rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#556677] outline-none transition-colors"
                />
              </div>

              <div className="mb-6">
                <label className="text-[10px] uppercase tracking-widest text-[#8899aa] mb-1.5 block">
                  Куда доставить?
                </label>
                <select
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full bg-[#071829] border border-[#243a5e] focus:border-[#00A86B]/60 rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors appearance-none"
                >
                  <option value="">Выберите город</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {CITIES.slice(0, 5).map(c => (
                    <button key={c} type="button" onClick={() => setCity(c)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                        city === c
                          ? "bg-[#00A86B]/20 border-[#00A86B]/50 text-[#00A86B]"
                          : "border-[#243a5e] text-[#8899aa] hover:border-[#00A86B]/40 hover:text-white"
                      }`}>{c}</button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleFormNext}
                disabled={!product.trim()}
                className="w-full bg-[#00A86B] hover:bg-[#009060] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition active:scale-95">
                Получить расчёт →
              </button>

              {/* What we take care of */}
              <div className="mt-5 flex flex-col gap-2">
                {[
                  "Забираем с любой фабрики или склада в Китае",
                  "Консолидируем несколько поставщиков в одну партию",
                  "Белый ввоз с полным пакетом документов",
                ].map(t => (
                  <div key={t} className="flex items-start gap-2 text-xs text-[#8899aa]">
                    <span className="text-[#00A86B] mt-0.5 shrink-0">✓</span>
                    {t}
                  </div>
                ))}
              </div>
            </>
          )}

          {step === "contact" && (
            <>
              <div className="flex items-center gap-2 mb-5">
                <button onClick={() => setStep("form")} className="text-[#8899aa] hover:text-white transition-colors text-sm">← Назад</button>
              </div>
              <p className="text-sm font-semibold text-white mb-1">Куда прислать расчёт?</p>
              <p className="text-xs text-[#8899aa] mb-5">Менеджер ответит в течение 15 минут с ценой и сроками.</p>

              <div className="mb-4">
                <label className="text-[10px] uppercase tracking-widest text-[#8899aa] mb-1.5 block">
                  Ваш Telegram
                </label>
                <input
                  type="text"
                  value={telegram}
                  onChange={e => setTelegram(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  placeholder="@username или +7..."
                  className="w-full bg-[#071829] border border-[#243a5e] focus:border-[#00A86B]/60 rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#556677] outline-none transition-colors"
                  autoFocus
                />
              </div>

              {product && (
                <div className="bg-[#071829] border border-[#243a5e] rounded-xl px-4 py-3 mb-4 text-xs text-[#8899aa]">
                  <span className="text-[#00A86B]">📦</span> {product}
                  {city && <span className="ml-2 text-[#556677]">→ {city}</span>}
                  <span className="ml-2 text-[#00A86B]">✅ Поставщик есть</span>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!telegram.trim() || loading}
                className="w-full bg-[#00A86B] hover:bg-[#009060] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition active:scale-95">
                {loading ? "Отправляем..." : "Получить расчёт →"}
              </button>

              <p className="text-center text-[10px] text-[#556677] mt-3">
                Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности
              </p>
            </>
          )}

          {step === "done" && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-[#00A86B]/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h2 className="text-xl font-bold mb-2">Заявка принята!</h2>
              <p className="text-[#8899aa] text-sm mb-6">
                Менеджер напишет в Telegram в течение 15 минут с ценой и сроками.
              </p>
              <a
                href={`https://t.me/ChinaBridgeLID_bot?start=${encodeURIComponent(product || "white-import")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#00A86B] hover:bg-[#009060] text-white font-semibold px-6 py-3 rounded-xl transition active:scale-95 text-sm">
                Написать в Telegram сейчас
              </a>
              <div className="mt-6 pt-5 border-t border-[#243a5e]">
                <p className="text-xs text-[#8899aa] mb-2">Хотите проверить юнит-экономику?</p>
                <Link href="/ai-calculator" className="text-xs text-[#00A86B] hover:underline">
                  AI-калькулятор за 15 сек рассчитает маржу на WB, Ozon и Kaspi →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Route options */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            { icon: "🚢", label: "Море", detail: "$1.1/кг", sub: "18–25 дней" },
            { icon: "🚂", label: "Ж/Д", detail: "$1.8/кг", sub: "12–16 дней" },
            { icon: "✈️", label: "Авиа", detail: "$2.5/кг", sub: "5–7 дней" },
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
          <p className="text-xs text-[#8899aa]">Клиент работал с поставщиком 2 года — мы просто взяли логистику на себя. Белый ввоз, полный пакет документов.</p>
        </div>
      </main>
    </div>
  );
}
