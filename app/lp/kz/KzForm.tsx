"use client";
import { useState } from "react";
import Image from "next/image";

export default function KzForm() {
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
          product: form.product || "Не указано",
          source: "website_form",
          service: "VK-KZ",
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
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-white mb-2">Заявка принята!</h2>
        <p className="text-[#8899aa] text-sm mb-6">
          Менеджер свяжется с вами в течение 15 минут
        </p>
        <a
          href="https://t.me/ChinaBridgeLID_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#229ED9] text-white font-semibold px-6 py-3 rounded-xl text-sm"
        >
          <TelegramIcon />
          Написать в Telegram
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060f1e] flex flex-col">
      {/* Header — logo only */}
      <header className="px-4 pt-4 pb-2">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <span className="text-white font-bold text-lg">China<span className="text-[#00A86B]">Bridge</span></span>
          <span className="text-[#8899aa] text-xs ml-2">Доставка из Китая</span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 px-4 pt-4 pb-8 max-w-lg mx-auto w-full">
        {/* Photo */}
        <div className="relative rounded-2xl overflow-hidden mb-5 h-[180px] sm:h-[220px]">
          <Image
            src="/photos/warehouse-office.jpg"
            alt="ChinaBridge — офис и склад в Китае"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-3 left-4">
            <p className="text-white text-sm font-semibold">Наш офис и склад в Китае</p>
            <p className="text-white/70 text-xs">Работаем с 2019 года · 500+ партий</p>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
          Доставка товаров<br />
          <span className="bg-gradient-to-r from-[#00A86B] to-[#00d48a] bg-clip-text text-transparent">
            из Китая в Казахстан
          </span>
        </h1>
        <p className="text-[#8899aa] text-sm mb-5">
          Карго, сборные грузы — от 50 кг. Представитель в Китае на месте.
          Оставьте заявку — менеджер ответит за 15 минут.
        </p>

        {/* Trust chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["📦 От 50 кг", "🇰🇿 Доставка в KZ", "🏭 Офис в Китае", "⚡ Ответим за 15 мин"].map(t => (
            <span key={t} className="text-xs bg-white/8 border border-white/10 text-white rounded-full px-3 py-1">{t}</span>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div>
            <input
              type="text"
              required
              placeholder="Ваше имя"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3.5 text-white placeholder-[#556677] text-sm focus:outline-none focus:border-[#00A86B] transition-colors"
            />
          </div>
          <div>
            <input
              type="tel"
              required
              placeholder="WhatsApp / Телефон"
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3.5 text-white placeholder-[#556677] text-sm focus:outline-none focus:border-[#00A86B] transition-colors"
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Что везёте из Китая? (необязательно)"
              value={form.product}
              onChange={e => setForm(p => ({ ...p, product: e.target.value }))}
              className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3.5 text-white placeholder-[#556677] text-sm focus:outline-none focus:border-[#00A86B] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-[#00A86B] hover:bg-[#009960] disabled:opacity-60 text-white font-bold py-4 rounded-xl text-base transition-colors mt-1"
          >
            {status === "loading" ? "Отправляем..." : "Получить расчёт → Бесплатно"}
          </button>

          {status === "err" && (
            <p className="text-red-400 text-xs text-center">Ошибка. Напишите нам в WhatsApp напрямую.</p>
          )}
        </form>

        {/* WhatsApp alternative */}
        <div className="mt-4 flex items-center gap-2">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[#556677] text-xs">или</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <a
          href="https://t.me/ChinaBridgeLID_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 w-full flex items-center justify-center gap-2 bg-[#229ED9]/15 border border-[#229ED9]/30 text-[#229ED9] font-semibold py-3.5 rounded-xl text-sm hover:bg-[#229ED9]/25 transition-colors"
        >
          <TelegramIcon />
          Написать напрямую в Telegram
        </a>

        {/* How it works */}
        <div className="mt-8 border border-white/10 rounded-2xl p-4 bg-white/3">
          <p className="text-white text-xs font-semibold uppercase tracking-wider mb-3">Как это работает</p>
          <div className="flex flex-col gap-3">
            {[
              { n: "1", t: "Оставьте заявку", d: "Укажите имя и телефон — это займёт 30 секунд" },
              { n: "2", t: "Менеджер перезвонит", d: "Обсудим товар, объём, маршрут и стоимость" },
              { n: "3", t: "Забираем на складе в Китае", d: "Наш представитель на месте инспектирует и отправляет груз" },
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
        </div>

        {/* Policy note */}
        <p className="text-[#445566] text-xs text-center mt-4">
          Нажимая кнопку, вы соглашаетесь с{" "}
          <a href="/privacy" className="underline">политикой конфиденциальности</a>
        </p>

        {/* Link to main site */}
        <a
          href="https://chinabridge.pro"
          className="mt-6 w-full flex items-center justify-center gap-2 border border-white/15 text-white/70 font-medium py-4 rounded-xl text-sm hover:border-white/30 hover:text-white transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          Перейти на полный сайт ChinaBridge
        </a>
      </main>
    </div>
  );
}

function TelegramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}
