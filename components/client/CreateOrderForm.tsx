"use client";
import { useState } from "react";

const CITIES = ["Москва", "Санкт-Петербург", "Новосибирск", "Владивосток", "Казань", "Благовещенск", "Хабаровск", "Астана", "Алматы", "Другой город"];

export default function CreateOrderForm() {
  const [open, setOpen] = useState(false);
  const [product, setProduct] = useState("");
  const [city, setCity] = useState("");
  const [weight, setWeight] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product.trim()) return;
    setSending(true);
    setError("");

    const text = [
      `📦 Новая заявка (черновик)`,
      `Товар: ${product.trim()}`,
      city ? `Город доставки: ${city}` : null,
      weight ? `Вес/объём: ${weight}` : null,
    ].filter(Boolean).join("\n");

    try {
      const res = await fetch("/api/client/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        setDone(true);
        setProduct("");
        setCity("");
        setWeight("");
        setTimeout(() => { setDone(false); setOpen(false); }, 4000);
      } else {
        setError("Не удалось отправить заявку. Попробуйте ещё раз.");
      }
    } catch {
      setError("Ошибка соединения");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-700 text-base font-bold">+</span>
          <span className="text-sm font-semibold text-slate-800">Создать заявку</span>
          <span className="text-xs text-slate-400">Опишите товар — менеджер возьмёт в работу</span>
        </div>
        <span className={`text-slate-400 text-lg transition-transform duration-200 ${open ? "rotate-180" : ""}`}>↓</span>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 py-5">
          {done ? (
            <div className="flex items-center gap-3 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <span className="text-xl">✓</span>
              <p className="text-sm font-medium">Заявка отправлена! Менеджер свяжется с вами в ближайшее время.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Что нужно привезти из Китая? <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  rows={3}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  placeholder="Например: Спортивная одежда (куртки, 200 шт), размеры M-XL, синий/чёрный цвет"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Город доставки</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                  >
                    <option value="">Не знаю пока</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Вес / объём</label>
                  <input
                    type="text"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Напр. 200 кг"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={sending || !product.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  {sending ? "Отправляем…" : "Отправить менеджеру"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 text-sm rounded-xl transition-colors"
                >
                  Отмена
                </button>
              </div>
              <p className="text-xs text-slate-400">Менеджер свяжется с вами через Telegram или по телефону в течение 15 минут.</p>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
