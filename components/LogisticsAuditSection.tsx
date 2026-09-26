"use client";
import { useState } from "react";

export default function LogisticsAuditSection() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    country: "Russia",
    current_route: "",
    origin: "",
    destination: "",
    weight: "",
    current_price: "",
    contact: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contact || !form.current_route) return;
    setLoading(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.contact,
          phone: form.contact.startsWith("+") ? form.contact : "",
          telegram: !form.contact.startsWith("+") ? form.contact : "",
          product: `Аудит логистики: ${form.current_route}`,
          source: "website_form",
          country_destination: form.country,
          from_city: form.origin,
          to_city: form.destination,
          weight: form.weight,
          landing_page: "/audit-logistics",
          vertical: "logistics_audit",
        }),
      });
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-14 bg-[#060f1e]">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left */}
          <div>
            <span className="inline-block text-xs font-semibold tracking-widest text-[#00A86B] uppercase mb-3">
              Бесплатный аудит
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Уже возите из Китая?
            </h2>
            <p className="text-[#8899aa] text-sm leading-relaxed mb-6">
              Покажите текущую логистику — проверим маршрут, тариф и схему таможни.
              Работаем как для России, так и для Казахстана.
            </p>
            <ul className="space-y-2">
              {[
                "Сравним тариф с рыночным",
                "Найдём оптимальный маршрут",
                "Проверим таможенную схему",
                "Дадим письменное заключение",
              ].map(t => (
                <li key={t} className="flex items-center gap-2 text-sm text-[#8899aa]">
                  <span className="text-[#00A86B] font-bold">✓</span> {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: form */}
          <div className="bg-[#0f2644]/70 border border-[#243a5e] rounded-2xl p-6">
            {sent ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-white font-semibold">Заявка принята!</p>
                <p className="text-sm text-[#8899aa] mt-1">Менеджер ответит в течение 15 минут</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-[#8899aa] mb-1 block">Страна назначения</label>
                  <div className="flex gap-2">
                    {[{ v: "Russia", l: "🇷🇺 Россия" }, { v: "Kazakhstan", l: "🇰🇿 Казахстан" }].map(c => (
                      <button key={c.v} type="button" onClick={() => set("country", c.v)}
                        className={`flex-1 text-xs px-3 py-2 rounded-xl border transition-colors font-medium ${form.country === c.v ? "border-[#00A86B] bg-[#00A86B]/15 text-[#00A86B]" : "border-[#243a5e] text-[#8899aa] hover:border-[#00A86B]/50"}`}>
                        {c.l}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  placeholder="Текущий маршрут (напр.: Гуанчжоу → Москва)"
                  value={form.current_route}
                  onChange={e => set("current_route", e.target.value)}
                  className="w-full px-3.5 py-3 bg-[#0B1F3A] border border-[#243a5e] rounded-xl text-sm text-white placeholder:text-[#8899aa] outline-none focus:border-[#00A86B]/60"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="Вес (кг)"
                    value={form.weight}
                    onChange={e => set("weight", e.target.value)}
                    className="w-full px-3.5 py-3 bg-[#0B1F3A] border border-[#243a5e] rounded-xl text-sm text-white placeholder:text-[#8899aa] outline-none focus:border-[#00A86B]/60"
                  />
                  <input
                    placeholder="Текущий тариф ($/кг)"
                    value={form.current_price}
                    onChange={e => set("current_price", e.target.value)}
                    className="w-full px-3.5 py-3 bg-[#0B1F3A] border border-[#243a5e] rounded-xl text-sm text-white placeholder:text-[#8899aa] outline-none focus:border-[#00A86B]/60"
                  />
                </div>
                <input
                  placeholder="Telegram или телефон"
                  value={form.contact}
                  onChange={e => set("contact", e.target.value)}
                  className="w-full px-3.5 py-3 bg-[#0B1F3A] border border-[#243a5e] rounded-xl text-sm text-white placeholder:text-[#8899aa] outline-none focus:border-[#00A86B]/60"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#00A86B] hover:bg-[#009060] disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm"
                >
                  {loading ? "Отправляем…" : "Получить аудит бесплатно"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
