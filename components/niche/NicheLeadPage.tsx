"use client";

import { useState } from "react";
import Link from "next/link";
import { trackGAEvent } from "@/lib/analytics/ga";

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
    telegram: "", whatsapp: "",
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
      if (r.ok) {
        setState("done");
        trackGAEvent("generate_lead", { source: config.source, method: "form" });
        if (typeof window !== "undefined" && (window as any).VK) {
          (window as any).VK.Goal("lead");
        }
      } else setState("error");
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
        <a href="tel:+79145889874" className="text-slate-400 hover:text-white text-sm transition">
          +7 914 588-98-74 →
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

                <div className="flex gap-3 mb-4">
                  <a
                    href="https://wa.me/79145889874"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackGAEvent("contact", { method: "whatsapp", source: config.source })}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1db954] text-white font-semibold py-3 rounded-xl transition text-sm"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                    WhatsApp
                  </a>
                  <a
                    href={`https://t.me/ChinaBridgeLID_bot?start=${config.source}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackGAEvent("contact", { method: "telegram", source: config.source })}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#229ED9] hover:bg-[#1a8fc4] text-white font-semibold py-3 rounded-xl transition text-sm"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-2.03 9.57c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.26 14.105l-2.95-.924c-.642-.2-.654-.642.136-.953l11.527-4.448c.535-.194 1.003.13.59.468z"/></svg>
                    Telegram
                  </a>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-slate-800" />
                  <span className="text-slate-500 text-xs">или оставьте заявку</span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>

                <form onSubmit={submit} className="space-y-4">
                  <input
                    type="text"
                    placeholder={config.product_placeholder}
                    value={form.product_name}
                    onChange={set("product_name")}
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

                <div className="flex items-center gap-3 mt-4">
                  <div className="flex-1 h-px bg-slate-800" />
                  <span className="text-slate-500 text-xs">Как с вами удобнее связаться?</span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <input
                    type="text"
                    placeholder="Ваш Telegram @username"
                    value={form.telegram}
                    onChange={set("telegram")}
                    className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition"
                  />
                  <input
                    type="text"
                    placeholder="Ваш WhatsApp +7..."
                    value={form.whatsapp}
                    onChange={set("whatsapp")}
                    className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition"
                  />
                </div>

                <p className="text-slate-600 text-xs mt-3 text-center">
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
