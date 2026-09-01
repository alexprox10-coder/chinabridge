"use client";

import { useState, useRef } from "react";
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

function trackContact(method: string, source: string) {
  trackGAEvent("contact", { method, source });
  if (typeof window !== "undefined") {
    const w = window as unknown as { VK?: { Goal: (g: string) => void } };
    if (w.VK) w.VK.Goal("lead");
  }
}

export function NicheLeadPage({ config }: { config: NicheConfig }) {
  const [form, setForm] = useState({
    name: "", phone: "", product_name: config.default_product ?? "", quantity: "", city_to: "",
    telegram: "", whatsapp: "",
  });
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [phoneError, setPhoneError] = useState(false);
  const submittedRef = useRef(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.phone.trim()) { setPhoneError(true); return; }
    setPhoneError(false);
    if (submittedRef.current) return;
    submittedRef.current = true;
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
        if (typeof window !== "undefined") {
          const w = window as unknown as { VK?: { Goal: (g: string) => void } };
          if (w.VK) w.VK.Goal("lead");
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

  const tgHref = `https://t.me/ChinaBridgeLID_bot?start=${config.source}`;
  const waHref = "https://wa.me/79145889874?text=%D0%97%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5%21+%D0%A5%D0%BE%D1%87%D1%83+%D1%83%D0%B7%D0%BD%D0%B0%D1%82%D1%8C+%D0%BE+%D0%B4%D0%BE%D1%81%D1%82%D0%B0%D0%B2%D0%BA%D0%B5+%D0%B8%D0%B7+%D0%9A%D0%B8%D1%82%D0%B0%D1%8F";

  const TgIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-2.03 9.57c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.26 14.105l-2.95-.924c-.642-.2-.654-.642.136-.953l11.527-4.448c.535-.194 1.003.13.59.468z"/>
    </svg>
  );
  const WaIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 px-4 py-3 flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg">🇨🇳</span>
          <span className="font-bold text-white text-sm">ChinaBridge</span>
        </Link>
        <a href="tel:+79145889874" className="text-slate-400 hover:text-white text-xs transition">
          +7 914 588-98-74
        </a>
      </header>

      <main className="max-w-5xl mx-auto px-4">

        {/* ── MOBILE HERO: CTA first ── */}
        <div className="md:hidden pt-6 pb-8">
          <div className="text-3xl mb-3">{config.emoji}</div>
          <h1 className="text-2xl font-bold leading-tight mb-2">{config.title}</h1>
          <p className="text-slate-400 text-sm mb-5 leading-relaxed">{config.subtitle}</p>

          {/* CTA buttons — visible immediately, before any scroll */}
          <div className="flex flex-col gap-3 mb-6">
            <a
              href={tgHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackContact("telegram_hero", config.source)}
              className="flex items-center justify-center gap-2.5 bg-[#229ED9] text-white font-bold py-4 rounded-2xl text-base shadow-lg shadow-[#229ED9]/20"
            >
              <TgIcon />
              Написать в Telegram
            </a>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackContact("whatsapp_hero", config.source)}
              className="flex items-center justify-center gap-2.5 bg-[#25D366] text-white font-bold py-4 rounded-2xl text-base shadow-lg shadow-[#25D366]/20"
            >
              <WaIcon />
              Написать в WhatsApp
            </a>
          </div>

          <p className="text-slate-500 text-xs text-center mb-6">
            Бесплатный расчёт · Ответим за 5 минут
          </p>

          {/* Benefits compact */}
          <ul className="space-y-2 mb-4">
            {config.benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-red-500 mt-0.5 shrink-0 text-xs">✓</span>
                {b}
              </li>
            ))}
          </ul>

          {/* Trust pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {["📦 Склад в Гуанчжоу", "🚢 Море · Авиа · Ж/Д", "🇰🇿 Казахстан и РФ", "⏱ От 7 дней"].map(t => (
              <span key={t} className="text-xs text-slate-400 bg-slate-800 rounded-full px-3 py-1">{t}</span>
            ))}
          </div>
        </div>

        {/* ── DESKTOP: 2-column layout ── */}
        <div className="hidden md:grid md:grid-cols-2 gap-12 items-start py-20">
          {/* Left: copy */}
          <div>
            <div className="text-4xl mb-4">{config.emoji}</div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">{config.title}</h1>
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
                <div className="text-slate-400 text-sm mb-6">
                  Напишите менеджеру в Telegram — ответим за 5 минут.
                </div>
                <a
                  href={tgHref}
                  onClick={() => trackContact("telegram_after_form", config.source)}
                  className="inline-flex items-center justify-center gap-2 w-full bg-[#229ED9] hover:bg-[#1a8fc4] text-white font-semibold py-3.5 rounded-xl transition text-sm mb-4"
                >
                  <TgIcon />
                  Написать менеджеру в Telegram →
                </a>
                <Link href="/" className="inline-block text-sm text-slate-500 hover:text-white transition">
                  ← На главную
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="text-lg font-semibold">Получить расчёт стоимости</div>
                </div>
                <form onSubmit={submit} className="space-y-4">
                  <input
                    type="text"
                    placeholder={config.product_placeholder}
                    value={form.product_name}
                    onChange={set("product_name")}
                    className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition"
                  />
                  <div>
                    <input
                      type="tel"
                      placeholder="+7 (999) 000-00-00"
                      value={form.phone}
                      onChange={(e) => { set("phone")(e); setPhoneError(false); }}
                      className={`w-full bg-slate-800 border text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition ${phoneError ? "border-red-500 ring-1 ring-red-500" : "border-slate-700 focus:border-red-500"}`}
                    />
                    {phoneError && (
                      <div className="mt-1 text-red-400 text-xs font-medium pl-1">
                        Введите номер — мы перезвоним в течение 5 минут
                      </div>
                    )}
                  </div>
                  {state === "error" && (
                    <div className="text-red-400 text-sm">
                      Ошибка отправки. Позвоните или попробуйте ещё раз.
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
                <p className="text-slate-600 text-xs mt-3 text-center">
                  Нажимая кнопку, вы соглашаетесь с{" "}
                  <Link href="/privacy" className="hover:text-slate-400 transition">политикой конфиденциальности</Link>
                </p>

                {/* Inline TG/WA for desktop form card too */}
                <div className="mt-4 pt-4 border-t border-slate-800 flex gap-3">
                  <a
                    href={tgHref}
                    onClick={() => trackContact("telegram_form_alt", config.source)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium py-2.5 rounded-xl transition text-xs"
                  >
                    <TgIcon />
                    Telegram
                  </a>
                  <a
                    href={waHref}
                    onClick={() => trackContact("whatsapp_form_alt", config.source)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium py-2.5 rounded-xl transition text-xs"
                  >
                    <WaIcon />
                    WhatsApp
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Trust bar — desktop only (mobile has pills above) */}
      <div className="hidden md:block border-t border-slate-800 py-6 mt-8">
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
