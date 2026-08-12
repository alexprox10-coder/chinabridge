"use client";
import { useState } from "react";

type Step = "form" | "submitting" | "success";

const VOLUMES = [
  { value: "less_1m",  label: "< 1 млн ₽/мес" },
  { value: "1_5m",     label: "1–5 млн ₽/мес" },
  { value: "5_20m",    label: "5–20 млн ₽/мес" },
  { value: "over_20m", label: "> 20 млн ₽/мес" },
];

const PROBLEMS = [
  { value: "margin",    label: "Маржа падает или слишком низкая" },
  { value: "supplier",  label: "Поставщик ненадёжный / дорогой" },
  { value: "logistics", label: "Логистика обходится слишком дорого" },
  { value: "customs",   label: "Проблемы с таможней или пошлинами" },
  { value: "all",       label: "Всё сразу — хочу общий аудит" },
];

function cls(...args: (string | boolean | undefined)[]) {
  return args.filter(Boolean).join(" ");
}

export default function ImportAuditForm() {
  const [step, setStep]       = useState<Step>("form");
  const [product, setProduct] = useState("");
  const [volume, setVolume]   = useState("");
  const [problem, setProblem] = useState("");
  const [telegram, setTelegram] = useState("");
  const [phone, setPhone]     = useState("");
  const [name, setName]       = useState("");
  const [error, setError]     = useState("");

  async function handleSubmit() {
    if (!product.trim()) { setError("Укажите, что сейчас возите"); return; }
    if (!volume)         { setError("Выберите ежемесячный объём"); return; }
    if (!problem)        { setError("Выберите основную проблему");  return; }
    if (!telegram.trim() && !phone.trim()) {
      setError("Укажите Telegram или телефон для связи"); return;
    }
    setError("");
    setStep("submitting");
    try {
      const res = await fetch("/api/import-audit/submit", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ product, volume, problem, telegram, phone, name }),
      });
      const data = await res.json();
      if (data.ok) {
        setStep("success");
      } else {
        setStep("form");
        setError("Ошибка отправки. Попробуйте ещё раз.");
      }
    } catch {
      setStep("form");
      setError("Ошибка сети. Попробуйте ещё раз.");
    }
  }

  const inp = cls(
    "w-full bg-[#0d1f35] border border-[#1e3555] rounded-xl px-4 py-3 text-sm text-white",
    "placeholder:text-[#4a6080] focus:outline-none focus:border-[#00A86B]/60 transition-colors",
  );

  if (step === "success") {
    return (
      <div className="flex flex-col gap-5 text-center py-2">
        <div className="w-16 h-16 rounded-full bg-[#00A86B]/20 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-[#00A86B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Заявка принята!</h3>
          <p className="text-sm text-[#8899aa]">Менеджер свяжется в течение 2 часов и назначит 15-минутный разбор</p>
        </div>

        <div className="bg-[#0d2035] border border-[#1a3050] rounded-xl p-4 text-left">
          <p className="text-xs text-[#8899aa] uppercase font-semibold mb-3">Что будет на аудите</p>
          <ul className="flex flex-col gap-2">
            {[
              "Найдём 1–3 конкретные точки утечки прибыли в вашей схеме",
              "Сравним ваши тарифы с benchmarks по аналогичным грузам",
              "Дадим конкретный план действий на следующие 30 дней",
            ].map(t => (
              <li key={t} className="flex items-start gap-2 text-sm text-white">
                <span className="text-[#00A86B] mt-0.5 shrink-0">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <a href="https://t.me/chinabridgeline" target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-between w-full px-4 py-3 border border-[#1a3050] hover:border-[#229ED9]/50 hover:bg-white/5 text-sm rounded-xl transition-all"
        >
          <span className="flex items-center gap-2 text-white">
            <svg className="w-4 h-4 text-[#229ED9] shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.247l-2.02 9.52c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.4 14.382l-2.95-.924c-.641-.2-.654-.641.136-.948l11.527-4.445c.537-.194 1.006.131.449.182z"/>
            </svg>
            Telegram-канал ChinaBridge
          </span>
          <span className="text-xs text-[#8899aa]">Кейсы по импорту →</span>
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Product */}
      <div>
        <label className="text-xs font-medium text-[#8899aa] block mb-1.5">
          Что сейчас возите из Китая? <span className="text-[#00A86B]">*</span>
        </label>
        <input
          type="text"
          value={product}
          onChange={e => setProduct(e.target.value)}
          placeholder="Например: электроника, одежда, запчасти..."
          className={inp}
        />
      </div>

      {/* Volume */}
      <div>
        <label className="text-xs font-medium text-[#8899aa] block mb-1.5">
          Ежемесячный объём закупок <span className="text-[#00A86B]">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {VOLUMES.map(v => (
            <button
              key={v.value}
              type="button"
              onClick={() => setVolume(v.value)}
              className={cls(
                "py-2.5 px-3 rounded-xl border text-sm font-medium transition-all text-left",
                volume === v.value
                  ? "border-[#00A86B] bg-[#00A86B]/10 text-white"
                  : "border-[#1e3555] text-[#8899aa] hover:border-[#00A86B]/40 hover:text-white",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Problem */}
      <div>
        <label className="text-xs font-medium text-[#8899aa] block mb-1.5">
          Главная проблема сейчас <span className="text-[#00A86B]">*</span>
        </label>
        <div className="flex flex-col gap-2">
          {PROBLEMS.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => setProblem(p.value)}
              className={cls(
                "py-2.5 px-3 rounded-xl border text-sm transition-all text-left",
                problem === p.value
                  ? "border-[#00A86B] bg-[#00A86B]/10 text-white"
                  : "border-[#1e3555] text-[#8899aa] hover:border-[#00A86B]/40 hover:text-white",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div>
        <label className="text-xs font-medium text-[#8899aa] block mb-1.5">
          Telegram <span className="text-[#00A86B]">*</span>
        </label>
        <input
          type="text"
          value={telegram}
          onChange={e => setTelegram(e.target.value)}
          placeholder="@username"
          className={inp}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Телефон</label>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+7 (999) 000-00-00"
          className={inp}
        />
        <p className="text-[11px] text-[#8899aa] mt-1">* Telegram или телефон — что удобнее</p>
      </div>
      <div>
        <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Имя</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Как вас зовут?"
          className={inp}
        />
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={step === "submitting"}
        className="w-full py-3.5 bg-[#00A86B] hover:bg-[#008f59] disabled:opacity-60 text-white font-semibold rounded-xl transition-all"
      >
        {step === "submitting" ? "Отправляем..." : "Записаться на аудит"}
      </button>

      <p className="text-center text-xs text-[#8899aa]">
        Нажимая кнопку, вы соглашаетесь с{" "}
        <a href="/privacy" className="text-[#00A86B] hover:underline">политикой конфиденциальности</a>
      </p>
    </div>
  );
}
