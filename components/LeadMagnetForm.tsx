"use client";

import { useState } from "react";
import { trackGAEvent } from "@/lib/analytics/ga";

interface FormState {
  name: string;
  telegram: string;
  product: string;
  country: string;
  volume: string;
  agree: boolean;
}

const VOLUMES = [
  { value: "under_1000", label: "До $1 000 в месяц" },
  { value: "1000_10000", label: "$1 000 – $10 000 в месяц" },
  { value: "over_10000", label: "Более $10 000 в месяц" },
];

const COUNTRIES = [
  { value: "", label: "Выберите страну (необязательно)" },
  { value: "russia", label: "Россия" },
  { value: "kazakhstan", label: "Казахстан" },
  { value: "other", label: "Другая" },
];

export default function LeadMagnetForm() {
  const [form, setForm] = useState<FormState>({
    name: "",
    telegram: "",
    product: "",
    country: "",
    volume: "",
    agree: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  function set(field: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) newErrors.name = "Введите ваше имя";
    if (!form.telegram.trim()) newErrors.telegram = "Введите Telegram";
    if (!form.product.trim()) newErrors.product = "Укажите товар";
    if (!form.agree) newErrors.agree = "Необходимо согласие";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    trackGAEvent("leadMagnetStart", { source: "LEAD_MAGNET_FREE" });
    setStatus("loading");

    try {
      const res = await fetch("/api/free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          telegram: form.telegram,
          product: form.product,
          country: form.country || undefined,
          volume: form.volume || undefined,
        }),
      });

      if (!res.ok) {
        setStatus("error");
        return;
      }

      trackGAEvent("leadMagnetSubmit", { source: "LEAD_MAGNET_FREE", volume: form.volume });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-full bg-[#00A86B]/20 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-[#00A86B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Готово! Скачайте руководство</h3>
        <p className="text-slate-400 text-sm mb-6">
          Мы также свяжемся с вами в Telegram в течение рабочего дня
        </p>

        <a
          href="/api/free/pdf"
          download="china-import-calculator-guide.pdf"
          onClick={() => trackGAEvent("guideDownload", { source: "LEAD_MAGNET_FREE" })}
          className="inline-flex items-center gap-2 bg-[#00A86B] hover:bg-[#009060] text-white font-semibold px-6 py-3 rounded-xl transition-colors mb-4 w-full justify-center"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Скачать PDF-руководство
        </a>

        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <a
            href="/delivery-calculator"
            onClick={() => trackGAEvent("calculatorFromFree")}
            className="flex-1 border border-[#00A86B] text-[#00A86B] hover:bg-[#00A86B]/10 font-medium px-4 py-2.5 rounded-xl transition-colors text-sm text-center"
          >
            Рассчитать доставку
          </a>
          <a
            href="https://t.me/ChinaBridgeLID_bot"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackGAEvent("telegramFromFree")}
            className="flex-1 border border-slate-600 text-slate-300 hover:border-slate-400 font-medium px-4 py-2.5 rounded-xl transition-colors text-sm text-center"
          >
            Написать менеджеру
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Имя <span className="text-[#00A86B]">*</span>
        </label>
        <input
          type="text"
          autoComplete="given-name"
          placeholder="Как вас зовут?"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          className={`w-full bg-[#0d1f3c] border rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A86B] transition-colors ${
            errors.name ? "border-red-500" : "border-slate-700"
          }`}
        />
        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
      </div>

      {/* Telegram */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Telegram <span className="text-[#00A86B]">*</span>
        </label>
        <input
          type="text"
          autoComplete="off"
          placeholder="@username"
          value={form.telegram}
          onChange={(e) => set("telegram", e.target.value)}
          className={`w-full bg-[#0d1f3c] border rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A86B] transition-colors ${
            errors.telegram ? "border-red-500" : "border-slate-700"
          }`}
        />
        {errors.telegram && <p className="text-red-400 text-xs mt-1">{errors.telegram}</p>}
      </div>

      {/* Product */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Что планируете везти из Китая? <span className="text-[#00A86B]">*</span>
        </label>
        <input
          type="text"
          placeholder="Например: электроника, одежда, запчасти"
          value={form.product}
          onChange={(e) => set("product", e.target.value)}
          className={`w-full bg-[#0d1f3c] border rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A86B] transition-colors ${
            errors.product ? "border-red-500" : "border-slate-700"
          }`}
        />
        {errors.product && <p className="text-red-400 text-xs mt-1">{errors.product}</p>}
      </div>

      {/* Volume */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Планируемый объём закупок
        </label>
        <div className="grid grid-cols-1 gap-2">
          {VOLUMES.map((v) => (
            <label
              key={v.value}
              className={`flex items-center gap-3 cursor-pointer border rounded-xl px-4 py-3 transition-colors ${
                form.volume === v.value
                  ? "border-[#00A86B] bg-[#00A86B]/10"
                  : "border-slate-700 bg-[#0d1f3c] hover:border-slate-500"
              }`}
            >
              <input
                type="radio"
                name="volume"
                value={v.value}
                checked={form.volume === v.value}
                onChange={() => set("volume", v.value)}
                className="accent-[#00A86B]"
              />
              <span className="text-sm text-slate-200">{v.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Country */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Страна доставки</label>
        <select
          value={form.country}
          onChange={(e) => set("country", e.target.value)}
          className="w-full bg-[#0d1f3c] border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A86B] transition-colors text-slate-200"
        >
          {COUNTRIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Agree */}
      <div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.agree}
            onChange={(e) => set("agree", e.target.checked)}
            className="mt-0.5 accent-[#00A86B] w-4 h-4 flex-shrink-0"
          />
          <span className="text-xs text-slate-400 leading-relaxed">
            Нажимая кнопку, я соглашаюсь с{" "}
            <a href="/privacy" className="text-[#00A86B] hover:underline">
              политикой конфиденциальности
            </a>{" "}
            и на получение сообщений в Telegram
          </span>
        </label>
        {errors.agree && <p className="text-red-400 text-xs mt-1">{errors.agree}</p>}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-[#00A86B] hover:bg-[#009060] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-6 py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {status === "loading" ? (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Отправляем...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Получить руководство бесплатно
          </>
        )}
      </button>

      {status === "error" && (
        <p className="text-red-400 text-sm text-center">
          Что-то пошло не так. Попробуйте позже или напишите нам{" "}
          <a href="https://t.me/ChinaBridgeLID_bot" className="underline">
            в Telegram
          </a>
          .
        </p>
      )}
    </form>
  );
}
