"use client";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function KzAutoPartsPage() {
  const [form, setForm] = useState({ name: "", phone: "", part: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:       form.name,
          phone:      form.phone,
          product:    form.part || "Автозапчасть из Китая",
          source:     "kz_auto_parts",
          utm_source: params.get("utm_source") ?? "vk",
          utm_campaign: params.get("utm_campaign") ?? "kz_auto",
          country_destination: "Kazakhstan",
          city_destination: "Алматы",
          comment: `KZ автозапчасти. Запрос: ${form.part}`,
        }),
      });
      setStatus("ok");
    } catch {
      setStatus("err");
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#050e1d] text-white">
        {/* Hero */}
        <section className="pt-20 pb-12 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-xs font-semibold text-[#00A86B] uppercase tracking-widest mb-3">Казахстан · Доставка из Китая</p>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
              Нужна запчасть<br className="hidden sm:block" /> из Китая?
            </h1>
            <p className="text-[#8899aa] text-base leading-relaxed max-w-lg mx-auto mb-8">
              Найдём поставщика, проверим и организуем доставку в Казахстан.<br />
              Представитель в Гуанчжоу — работаем напрямую с заводами.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm">
              {[
                { n: "29%", label: "импорта КЗ из Китая" },
                { n: "5–8 дней", label: "авто-доставка" },
                { n: "$2.50/кг", label: "тариф карго" },
              ].map(s => (
                <div key={s.n} className="text-center">
                  <div className="text-xl font-bold text-[#00A86B]">{s.n}</div>
                  <div className="text-[#8899aa] text-xs">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Form */}
        <section className="pb-16 px-4">
          <div className="max-w-lg mx-auto">
            {status === "ok" ? (
              <div className="rounded-2xl border border-[#00A86B]/40 bg-[#00A86B]/10 p-8 text-center">
                <div className="text-4xl mb-3">✅</div>
                <h2 className="text-xl font-bold mb-2">Заявка принята!</h2>
                <p className="text-[#8899aa]">Менеджер свяжется с вами в течение 15 минут и рассчитает стоимость поставки.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="rounded-2xl border border-[#1a3a5c] bg-[#0B1F3A]/60 p-6 sm:p-8 space-y-4">
                <h2 className="text-lg font-bold mb-1">Узнать стоимость</h2>
                <p className="text-[#8899aa] text-sm mb-4">Опишите что нужно — рассчитаем за 15 минут</p>

                <div>
                  <label className="block text-xs text-[#8899aa] mb-1">Запчасть / модель авто / артикул *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Например: передняя фара BYD Song Plus 2024, 2 шт, арт. 4116200-01-E"
                    value={form.part}
                    onChange={e => setForm(f => ({ ...f, part: e.target.value }))}
                    className="w-full rounded-xl bg-[#0a1929] border border-[#1a3a5c] px-4 py-3 text-sm text-white placeholder-[#445566] focus:outline-none focus:border-[#00A86B] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#8899aa] mb-1">Ваше имя *</label>
                  <input
                    required
                    type="text"
                    placeholder="Имя"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-xl bg-[#0a1929] border border-[#1a3a5c] px-4 py-3 text-sm text-white placeholder-[#445566] focus:outline-none focus:border-[#00A86B]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#8899aa] mb-1">Телефон / WhatsApp *</label>
                  <input
                    required
                    type="tel"
                    placeholder="+7 (___) ___-__-__"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-xl bg-[#0a1929] border border-[#1a3a5c] px-4 py-3 text-sm text-white placeholder-[#445566] focus:outline-none focus:border-[#00A86B]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full bg-[#00A86B] hover:bg-[#00d48a] disabled:opacity-60 text-white font-semibold rounded-xl py-3.5 transition-colors"
                >
                  {status === "loading" ? "Отправляем..." : "Узнать стоимость"}
                </button>

                {status === "err" && (
                  <p className="text-red-400 text-xs text-center">Ошибка. Попробуйте ещё раз или напишите в WhatsApp.</p>
                )}

                <p className="text-[#445566] text-xs text-center">Ответим за 15 минут · Без обязательств</p>
              </form>
            )}

            {/* Trust */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-sm">
              {[
                { icon: "🏭", title: "Представитель в Китае", desc: "Проверяем поставщиков лично" },
                { icon: "🚚", title: "Доставка в Алматы", desc: "Авто 5–8 дней, авиа 3–5 дней" },
                { icon: "📦", title: "От 1 штуки", desc: "Работаем с частными и бизнес-заказами" },
              ].map(t => (
                <div key={t.title} className="rounded-xl border border-[#1a3a5c] bg-[#0B1F3A]/40 p-4">
                  <div className="text-2xl mb-1">{t.icon}</div>
                  <div className="font-semibold text-white text-xs">{t.title}</div>
                  <div className="text-[#8899aa] text-xs mt-0.5">{t.desc}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <Link href="/import-china-kazakhstan" className="text-[#00A86B] text-sm hover:underline">
                Узнать больше о доставке из Китая в Казахстан →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
