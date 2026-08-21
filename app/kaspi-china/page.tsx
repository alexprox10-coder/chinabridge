"use client";
import { useState } from "react";
import Link from "next/link";

function TelegramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

export default function KaspiChinaPage() {
  const [form, setForm] = useState({ name: "", phone: "", product: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          product: form.product || "Kaspi.kz",
          source: "kaspi_landing",
          service: "KZ-Kaspi",
          from_city: "Китай",
          to_city: "Казахстан",
        }),
      });
      setStatus(res.ok ? "ok" : "err");
    } catch {
      setStatus("err");
    }
  }

  if (status === "ok") {
    return (
      <div className="min-h-screen bg-[#060f1e] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-white mb-2">Заявка принята!</h2>
          <p className="text-[#8899aa] text-sm mb-6">Менеджер свяжется за 15 минут</p>
          <a
            href="https://t.me/ChinaBridgeLID_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#229ED9] text-white font-bold px-6 py-3 rounded-xl text-sm"
          >
            <TelegramIcon />
            Написать в Telegram
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060f1e] flex flex-col">

      {/* Header */}
      <header className="px-4 pt-4 pb-2 border-b border-white/5">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/" className="text-white font-bold text-lg">
            China<span className="text-[#00A86B]">Bridge</span>
          </Link>
          <span className="text-[#8899aa] text-xs">Доставка из Китая</span>
        </div>
      </header>

      <main className="flex-1 px-4 pt-6 pb-12 max-w-lg mx-auto w-full">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[#00A86B]/10 border border-[#00A86B]/20 rounded-full px-3 py-1.5 mb-5">
          <span className="text-lg">🇰🇿</span>
          <span className="text-[#00A86B] text-xs font-bold">Специалисты по Kaspi.kz</span>
        </div>

        {/* Headline */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 leading-tight">
          Товары из Китая<br />
          <span className="bg-gradient-to-r from-[#00A86B] to-[#00d48a] bg-clip-text text-transparent">
            для Kaspi.kz
          </span>
        </h1>
        <p className="text-[#8899aa] text-sm mb-6 leading-relaxed">
          Найдём товар на 1688, рассчитаем маржу на Kaspi и доставим карго из Китая в Алматы.
          Представитель в Китае на месте.
        </p>

        {/* Advantages */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            "🔍 Поиск на 1688",
            "📊 Расчёт маржи Kaspi",
            "🚢 Карго от 50 кг",
            "⚡ Ответ за 15 мин",
          ].map((t) => (
            <span key={t} className="text-xs bg-white/6 border border-white/10 text-white rounded-full px-3 py-1.5">
              {t}
            </span>
          ))}
        </div>

        {/* AI Calculator CTA */}
        <div className="bg-[#00A86B]/8 border border-[#00A86B]/20 rounded-2xl p-4 mb-6">
          <p className="text-white font-semibold text-sm mb-1">🤖 Сначала проверьте маржу</p>
          <p className="text-[#8899aa] text-xs mb-3">
            Вставьте ссылку с 1688 → AI рассчитает прибыль на Kaspi за 15 секунд. Бесплатно.
          </p>
          <Link
            href="/ai-calculator"
            className="inline-flex items-center gap-1.5 bg-[#00A86B] text-white font-bold px-4 py-2 rounded-lg text-xs"
          >
            Рассчитать маржу →
          </Link>
        </div>

        {/* Form */}
        <div className="bg-[#0d1b2e] border border-[#1a3050] rounded-2xl p-5">
          <p className="text-white font-bold text-sm mb-4">Получить расчёт доставки</p>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <input
              type="text"
              required
              placeholder="Ваше имя"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full bg-white/6 border border-white/12 rounded-xl px-4 py-3.5 text-white placeholder-[#556677] text-sm focus:outline-none focus:border-[#00A86B] transition-colors"
            />
            <input
              type="tel"
              required
              placeholder="WhatsApp / Телефон"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              className="w-full bg-white/6 border border-white/12 rounded-xl px-4 py-3.5 text-white placeholder-[#556677] text-sm focus:outline-none focus:border-[#00A86B] transition-colors"
            />
            <input
              type="text"
              placeholder="Что везёте? (товар, ссылка 1688)"
              value={form.product}
              onChange={(e) => setForm((p) => ({ ...p, product: e.target.value }))}
              className="w-full bg-white/6 border border-white/12 rounded-xl px-4 py-3.5 text-white placeholder-[#556677] text-sm focus:outline-none focus:border-[#00A86B] transition-colors"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-[#00A86B] hover:bg-[#009960] disabled:opacity-60 text-white font-bold py-4 rounded-xl text-sm transition-colors"
            >
              {status === "loading" ? "Отправляем..." : "Рассчитать стоимость → Бесплатно"}
            </button>
            {status === "err" && (
              <p className="text-red-400 text-xs text-center">Ошибка. Напишите в Telegram: @ChinaBridgeLID_bot</p>
            )}
          </form>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-white/8" />
          <span className="text-[#556677] text-xs">или сразу в Telegram</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>

        <a
          href="https://t.me/ChinaBridgeLID_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 bg-[#229ED9]/12 border border-[#229ED9]/25 text-[#229ED9] font-semibold py-3.5 rounded-xl text-sm hover:bg-[#229ED9]/20 transition-colors"
        >
          <TelegramIcon />
          Написать напрямую в Telegram
        </a>

        {/* How it works */}
        <div className="mt-8 border border-white/8 rounded-2xl p-4 bg-white/2">
          <p className="text-white text-xs font-semibold uppercase tracking-wider mb-3">Как мы работаем</p>
          <div className="flex flex-col gap-3">
            {[
              { n: "1", t: "Вы описываете товар", d: "Ссылка с 1688 или название товара + желаемый объём" },
              { n: "2", t: "Считаем маржу и стоимость", d: "AI-расчёт маржи на Kaspi + стоимость доставки карго" },
              { n: "3", t: "Находим поставщика", d: "Наш представитель в Китае проверяет производителя и образцы" },
              { n: "4", t: "Доставляем в Казахстан", d: "Карго или авиа — в зависимости от объёма и срочности" },
            ].map((s) => (
              <div key={s.n} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#00A86B]/15 text-[#00A86B] text-xs font-bold flex items-center justify-center">
                  {s.n}
                </span>
                <div>
                  <p className="text-white text-sm font-medium">{s.t}</p>
                  <p className="text-[#8899aa] text-xs mt-0.5">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust */}
        <div className="mt-6 grid grid-cols-3 gap-2 text-center">
          {[
            { v: "500+", l: "партий\nдоставлено" },
            { v: "2019", l: "год\nначала" },
            { v: "KZ+RU", l: "оба\nнаправления" },
          ].map((s) => (
            <div key={s.v} className="bg-white/3 rounded-xl py-3">
              <div className="text-[#00A86B] font-extrabold text-base">{s.v}</div>
              <div className="text-[#5a7899] text-[10px] mt-0.5 whitespace-pre-line">{s.l}</div>
            </div>
          ))}
        </div>

        <p className="text-[#334455] text-xs text-center mt-5">
          Нажимая кнопку, вы соглашаетесь с{" "}
          <Link href="/privacy" className="underline">политикой конфиденциальности</Link>
        </p>

      </main>
    </div>
  );
}
