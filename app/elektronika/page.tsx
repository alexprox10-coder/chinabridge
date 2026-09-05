"use client";

import { useState } from "react";
import Link from "next/link";
import { trackGAEvent } from "@/lib/analytics/ga";

const CATEGORIES = [
  { emoji: "📱", label: "Смартфоны и планшеты" },
  { emoji: "🎧", label: "Аудио и аксессуары" },
  { emoji: "💻", label: "Ноутбуки и компьютеры" },
  { emoji: "📷", label: "Фото и видео" },
  { emoji: "🔌", label: "Зарядки и кабели" },
  { emoji: "🎮", label: "Игровые устройства" },
  { emoji: "🏠", label: "Умный дом" },
  { emoji: "⌚", label: "Умные часы и браслеты" },
];

const TRUST = [
  { icon: "🏭", title: "Прямо с завода", desc: "Работаем с фабриками Shenzhen и Dongguan напрямую — без посредников" },
  { icon: "🔍", title: "Проверка до отправки", desc: "Представитель осматривает партию на месте перед отгрузкой" },
  { icon: "📋", title: "Документы под ключ", desc: "Декларация соответствия, сертификаты — оформляем полный пакет" },
  { icon: "✈️", title: "Авиа от 5 дней", desc: "Авиа 5–7 дн или море 18–25 дн — выбираем оптимальный маршрут" },
];

export default function ElektronikaPage() {
  const [step, setStep] = useState<"form" | "contact" | "done">("form");
  const [product, setProduct] = useState("");
  const [hasSupplier, setHasSupplier] = useState<"yes" | "no" | "">("");
  const [city, setCity] = useState("");
  const [telegram, setTelegram] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product.trim()) return;
    trackGAEvent("electronics_form_step1", { product, has_supplier: hasSupplier, city });
    setStep("contact");
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegram.trim()) return;
    setLoading(true);
    trackGAEvent("electronics_lead_submit", { telegram });
    try {
      await fetch("/api/landing-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram,
          product,
          has_supplier: hasSupplier,
          city,
          source: "landing_elektronika",
        }),
      });
    } catch {
      // не блокируем
    }
    setStep("done");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#060F1E] text-white">
      {/* Minimal header */}
      <header className="sticky top-0 z-50 bg-[#060F1E]/95 backdrop-blur border-b border-[#1a2d47]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-white font-bold text-lg tracking-tight">
            China<span className="text-[#00A86B]">Bridge</span>
          </Link>
          <a
            href="https://t.me/ChinaBridgeLID_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-[#00A86B] hover:text-white transition-colors"
          >
            <span>Написать в Telegram</span>
          </a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12 sm:py-20">

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00A86B]/30 bg-[#00A86B]/10 text-[#00A86B] text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse"/>
            🇨🇳 Прямые поставки с заводов Китая
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
            Нужна электроника<br/>
            <span className="text-[#00A86B]">из Китая?</span>
          </h1>
          <p className="text-[#8899aa] text-base leading-relaxed max-w-lg mx-auto">
            Найдём производителя, проверим фабрику, привезём с документами в Россию или Казахстан.
            Поставщик уже есть — менять не нужно.
          </p>
        </div>

        {/* Step 1: Qualifier form */}
        {step === "form" && (
          <form onSubmit={handleFormSubmit} className="bg-[#0B1F3A] border border-[#243a5e] rounded-2xl p-6 sm:p-8 mb-12">
            <h2 className="font-semibold text-lg mb-6 text-white">Расскажите о вашем товаре</h2>

            <div className="flex flex-col gap-5">
              <div>
                <label className="text-xs text-[#8899aa] mb-2 block font-medium uppercase tracking-wide">Что хотите привезти?</label>
                <input
                  type="text"
                  value={product}
                  onChange={e => setProduct(e.target.value)}
                  placeholder="Наушники, смартфоны, зарядки..."
                  required
                  className="w-full bg-[#060F1E] border border-[#243a5e] focus:border-[#00A86B]/60 rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#445566] outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-[#8899aa] mb-2 block font-medium uppercase tracking-wide">Поставщик в Китае уже есть?</label>
                <div className="flex gap-3">
                  {(["yes", "no"] as const).map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setHasSupplier(v)}
                      className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all border ${
                        hasSupplier === v
                          ? "bg-[#00A86B]/20 border-[#00A86B] text-[#00A86B]"
                          : "border-[#243a5e] text-[#8899aa] hover:border-[#00A86B]/40 hover:text-white"
                      }`}
                    >
                      {v === "yes" ? "Да, есть" : "Нет, нужен"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-[#8899aa] mb-2 block font-medium uppercase tracking-wide">Куда доставить?</label>
                <select
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full bg-[#060F1E] border border-[#243a5e] focus:border-[#00A86B]/60 rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors appearance-none"
                >
                  <option value="">Выберите город</option>
                  <optgroup label="Россия">
                    <option value="Москва">Москва</option>
                    <option value="Санкт-Петербург">Санкт-Петербург</option>
                    <option value="Екатеринбург">Екатеринбург</option>
                    <option value="Новосибирск">Новосибирск</option>
                    <option value="Краснодар">Краснодар</option>
                    <option value="Другой город РФ">Другой город РФ</option>
                  </optgroup>
                  <optgroup label="Казахстан">
                    <option value="Алматы">Алматы</option>
                    <option value="Астана">Астана</option>
                    <option value="Другой город КЗ">Другой город КЗ</option>
                  </optgroup>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-[#00A86B] hover:bg-[#009060] text-white font-semibold py-3.5 rounded-xl transition active:scale-95"
              >
                Получить расчёт →
              </button>

              <p className="text-center text-[#445566] text-xs">Без обязательств · Ответим за 15 минут</p>
            </div>
          </form>
        )}

        {/* Step 2: Contact */}
        {step === "contact" && (
          <form onSubmit={handleContactSubmit} className="bg-[#0B1F3A] border border-[#243a5e] rounded-2xl p-6 sm:p-8 mb-12">
            <div className="mb-6">
              <div className="text-xs text-[#00A86B] font-medium mb-1">Почти готово!</div>
              <h2 className="font-semibold text-lg text-white">Куда отправить расчёт?</h2>
              <p className="text-[#8899aa] text-sm mt-1">Менеджер напишет вам напрямую с ценой и сроками</p>
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <label className="text-xs text-[#8899aa] mb-2 block font-medium uppercase tracking-wide">Ваш Telegram</label>
                <input
                  type="text"
                  value={telegram}
                  onChange={e => setTelegram(e.target.value)}
                  placeholder="@username или номер"
                  required
                  className="w-full bg-[#060F1E] border border-[#243a5e] focus:border-[#00A86B]/60 rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#445566] outline-none transition-colors"
                />
              </div>

              <div className="bg-[#060F1E] rounded-xl p-4 text-sm text-[#8899aa] space-y-1">
                <div><span className="text-white font-medium">Товар:</span> {product || "—"}</div>
                {hasSupplier && <div><span className="text-white font-medium">Поставщик:</span> {hasSupplier === "yes" ? "Есть" : "Нужен"}</div>}
                {city && <div><span className="text-white font-medium">Город:</span> {city}</div>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00A86B] hover:bg-[#009060] disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition active:scale-95"
              >
                {loading ? "Отправляем..." : "Получить расчёт бесплатно →"}
              </button>

              <button
                type="button"
                onClick={() => setStep("form")}
                className="text-center text-[#556677] text-xs hover:text-white transition-colors"
              >
                ← Изменить данные
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Success */}
        {step === "done" && (
          <div className="bg-[#0B1F3A] border border-[#00A86B]/40 rounded-2xl p-8 mb-12 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="font-bold text-xl mb-2">Заявка принята!</h2>
            <p className="text-[#8899aa] mb-6">
              Менеджер напишет вам в Telegram в течение 15 минут с ценой и сроками поставки.
            </p>
            <a
              href={`https://t.me/ChinaBridgeLID_bot?start=${encodeURIComponent(product || "elektronika")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#00A86B] hover:bg-[#009060] text-white font-semibold px-6 py-3 rounded-xl transition"
            >
              Написать в Telegram сейчас
            </a>
          </div>
        )}

        {/* Trust blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {TRUST.map(t => (
            <div key={t.title} className="bg-[#0B1F3A] border border-[#1a2d47] rounded-xl p-5">
              <div className="text-2xl mb-2">{t.icon}</div>
              <div className="font-semibold text-sm mb-1">{t.title}</div>
              <div className="text-[#8899aa] text-xs leading-relaxed">{t.desc}</div>
            </div>
          ))}
        </div>

        {/* Categories */}
        <div className="mb-12">
          <h2 className="font-bold text-lg mb-5">Категории электроники</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map(c => (
              <div
                key={c.label}
                className="bg-[#0B1F3A] border border-[#1a2d47] hover:border-[#00A86B]/40 rounded-xl p-3 text-center cursor-pointer transition-colors"
                onClick={() => {
                  if (step === "form") setProduct(c.label);
                  trackGAEvent("electronics_category_click", { category: c.label });
                }}
              >
                <div className="text-2xl mb-1">{c.emoji}</div>
                <div className="text-xs text-[#8899aa] leading-tight">{c.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Case study */}
        <div className="bg-gradient-to-br from-[#00A86B]/10 to-[#00A86B]/5 border border-[#00A86B]/30 rounded-2xl p-6 mb-12">
          <div className="text-xs text-[#00A86B] font-medium uppercase tracking-wide mb-3">Кейс</div>
          <h3 className="font-bold text-lg mb-3">500 наушников из Shenzhen в Москву</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[
              { v: "18 дн.", l: "морем" },
              { v: "$1.1/кг", l: "ставка" },
              { v: "38%", l: "маржа" },
            ].map(s => (
              <div key={s.l} className="text-center">
                <div className="text-xl font-bold text-[#00A86B]">{s.v}</div>
                <div className="text-xs text-[#8899aa]">{s.l}</div>
              </div>
            ))}
          </div>
          <p className="text-[#8899aa] text-sm leading-relaxed">
            Клиент нашёл поставщика на 1688, мы проверили фабрику, выкупили партию, организовали консолидацию и доставку с полным пакетом документов.
          </p>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <p className="text-[#8899aa] text-sm mb-4">Есть вопросы? Напишите напрямую</p>
          <a
            href="https://t.me/ChinaBridgeLID_bot"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackGAEvent("electronics_final_cta")}
            className="inline-flex items-center gap-2 bg-[#229ED9] hover:bg-[#1a8dbf] text-white font-semibold px-6 py-3 rounded-xl transition"
          >
            <span>Написать в Telegram</span>
          </a>
        </div>
      </main>
    </div>
  );
}
