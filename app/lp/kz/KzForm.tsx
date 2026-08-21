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
          href="https://wa.me/79918825647"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#25D366] text-white font-semibold px-6 py-3 rounded-xl text-sm"
        >
          <WhatsAppIcon />
          Написать в WhatsApp
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
          href="https://wa.me/79918825647?text=Здравствуйте%2C+хочу+узнать+условия+доставки+из+Китая+в+Казахстан"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 w-full flex items-center justify-center gap-2 bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] font-semibold py-3.5 rounded-xl text-sm hover:bg-[#25D366]/25 transition-colors"
        >
          <WhatsAppIcon />
          Написать напрямую в WhatsApp
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

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}
