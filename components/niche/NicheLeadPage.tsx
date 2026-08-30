"use client";

import { useState } from "react";
import Link from "next/link";

export interface NicheConfig {
  emoji: string;
  title: string;
  subtitle: string;
  product_placeholder: string;
  benefits: string[];
  source: string;
  default_product?: string;
}

export function NicheLeadPage({ config }: { config: NicheConfig }) {
  const [form, setForm] = useState({
    name: "", phone: "", product_name: config.default_product ?? "", quantity: "", city_to: "",
  });
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const r = await fetch("/api/calculator/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          product_name: form.product_name || config.default_product || "",
          country_from: "China",
          country_to: "Russia",
          source: config.source,
          category: config.source,
          service_type: "sourcing_and_delivery",
        }),
      });
      if (r.ok) setState("done");
      else setState("error");
    } catch {
      setState("error");
    }
  }

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">🇨🇳</span>
          <span className="font-bold text-white">ChinaBridge</span>
        </Link>
        <a href="tel:+78005551234" className="text-slate-400 hover:text-white text-sm transition">
          Бесплатная консультация →
        </a>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-12 items-start">

          {/* Left: copy */}
          <div>
            <div className="text-4xl mb-4">{config.emoji}</div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
              {config.title}
            </h1>
            <p className="text-slate-400 text-lg mb-8">{config.subtitle}</p>

            <ul className="space-y-3 mb-10">
              {config.benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-red-500 mt-1 shrink-0">✓</span>
                  <span className="text-slate-300">{b}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Офис в Гуанчжоу
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Доставка в РФ и Казахстан
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
            {state === "done" ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✅</div>
                <div className="text-xl font-bold mb-2">Заявка принята!</div>
                <div className="text-slate-400 text-sm">
                  Менеджер свяжется в течение 5 минут.
                </div>
                <Link
                  href="/"
                  className="inline-block mt-6 text-sm text-slate-500 hover:text-white transition"
                >
                  ← На главную
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="text-lg font-semibold mb-1">Получить расчёт стоимости</div>
                  <div className="text-slate-500 text-sm">Ответим за 5 минут</div>
                </div>

                <form onSubmit={submit} className="space-y-4">
                  <input
                    type="text"
                    placeholder={config.product_placeholder}
                    value={form.product_name}
                    onChange={set("product_name")}
                    required
                    className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Количество / кг"
                      value={form.quantity}
                      onChange={set("quantity")}
                      className="bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition"
                    />
                    <input
                      type="text"
                      placeholder="Город доставки"
                      value={form.city_to}
                      onChange={set("city_to")}
                      className="bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Ваше имя"
                    value={form.name}
                    onChange={set("name")}
                    required
                    className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition"
                  />
                  <input
                    type="tel"
                    placeholder="+7 (999) 000-00-00"
                    value={form.phone}
                    onChange={set("phone")}
                    required
                    className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition"
                  />

                  {state === "error" && (
                    <div className="text-red-400 text-sm">
                      Ошибка отправки. Позвоните нам или попробуйте ещё раз.
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={state === "loading"}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition text-sm"
                  >
                    {state === "loading" ? "Отправляем..." : "Получить расчёт →"}
                  </button>
                </form>

                <p className="text-slate-600 text-xs mt-4 text-center">
                  Нажимая кнопку, вы соглашаетесь с{" "}
                  <Link href="/privacy" className="hover:text-slate-400 transition">политикой конфиденциальности</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Trust bar */}
      <div className="border-t border-slate-800 py-6 mt-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap gap-6 justify-center text-sm text-slate-500">
          <span>📦 Склад в Гуанчжоу</span>
          <span>🚢 Море · Авиа · Ж/Д</span>
          <span>📄 Белый ввоз и документы</span>
          <span>🇰🇿 Доставка в Казахстан</span>
          <span>⏱ От 7 дней</span>
        </div>
      </div>
    </div>
  );
}
