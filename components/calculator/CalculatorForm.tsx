"use client";
import { useState, useEffect, useRef } from "react";
import type {
  CalculatorFormData,
  CalculatorResult,
  CargoType,
} from "@/lib/calculator/types";
import {
  CARGO_TYPE_LABELS,
  CARGO_TYPE_ICONS,
} from "@/lib/calculator/types";
import { CheckCircle2, ChevronRight, ChevronLeft, Download } from "lucide-react";
import { analytics } from "@/lib/analytics";

const AI_STEPS = [
  "AI анализирует параметры груза...",
  "Подбирает оптимальный маршрут...",
  "Рассчитывает стоимость доставки...",
  "Готовит предложение...",
];

const CITY_CHIPS = ["Москва", "Санкт-Петербург", "Новосибирск", "Алматы", "Астана"];

const initialFormData: CalculatorFormData = {
  product_name: "",
  category: "",
  product_link: "",
  quantity: "",
  weight_kg: "",
  volume_m3: "",
  packages_count: "",
  country_from: "China",
  city_from: "",
  country_to: "Russia",
  city_to: "",
  service_type: "delivery_only",
  name: "",
  phone: "",
  telegram: "",
  email: "",
};

const inp = (error?: boolean) =>
  `w-full px-3.5 py-3 bg-[#0B1F3A] border rounded-xl text-sm placeholder:text-[#8899aa] outline-none transition-colors text-white ${
    error
      ? "border-red-500/60 focus:border-red-400"
      : "border-[#243a5e] focus:border-[#00A86B]/60"
  }`;

export function CalculatorForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CalculatorFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof CalculatorFormData, string>>>({});
  const [aiStep, setAiStep] = useState(0);
  const [proposalLoading, setProposalLoading] = useState(false);
  const [ecoError, setEcoError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!loading) { setAiStep(0); return; }
    const id = setInterval(() => setAiStep(p => (p + 1) % AI_STEPS.length), 950);
    return () => clearInterval(id);
  }, [loading]);

  const set = (field: keyof CalculatorFormData, value: string) => {
    setFormData(p => ({ ...p, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }));
  };

  const validateStep = (s: number): boolean => {
    const newErrors: Partial<Record<keyof CalculatorFormData, string>> = {};
    if (s === 1 && !formData.product_name.trim())
      newErrors.product_name = "Опишите товар или вставьте ссылку";
    if (s === 2) {
      if (!formData.phone.trim() && !formData.telegram.trim())
        newErrors.phone = "Укажите телефон или Telegram";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (!startedRef.current) {
        analytics.calculatorStart();
        startedRef.current = true;
      }
      setStep(2);
    }
  };

  const handleBack = () => setStep(1);

  const handleSubmit = async () => {
    if (!validateStep(2)) return;
    setLoading(true);
    setEcoError(null);
    analytics.formSubmit({ form_id: "calculator" });
    if (formData.product_name) analytics.calculatorProductSearch(formData.product_name);

    const body = {
      name: formData.name || "—",
      phone: formData.phone,
      telegram: formData.telegram,
      email: formData.email,
      product_name: formData.product_name,
      product_link: formData.product_link,
      country_from: formData.country_from,
      country_to: formData.country_to,
      city_to: formData.city_to,
      service_type: "delivery_only",
    };

    try {
      const res = await fetch("/api/calculator/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: CalculatorResult = await res.json();
      setResult(data);
      if (data.ok) {
        analytics.calculatorComplete({
          route: `China → ${formData.city_to || "—"}`,
          cost: data.delivery_cost,
          margin: data.margin_percent,
        });
      }
    } catch {
      setResult({
        ok: true,
        cargo_type: "consolidation",
        priority: "WARM",
        reason: "Заявка принята. Менеджер свяжется с вами для точного расчёта.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadProposal = async (leadId: string) => {
    setProposalLoading(true);
    analytics.proposalDownload({ lead_id: leadId });
    try {
      const res = await fetch("/api/proposals/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg =
          data?.error === "lead_not_found"
            ? "Заявка не найдена в CRM. Напишите нам в Telegram — пришлём КП вручную."
            : "Не удалось создать КП. Попробуйте ещё раз или напишите в Telegram.";
        alert(msg);
        return;
      }
      if (data.pdfBase64) {
        const bytes = Uint8Array.from(atob(data.pdfBase64), c => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename ?? `proposal-${data.proposalId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      } else {
        const url = data.downloadUrl ?? `/api/proposals/download/${data.proposalId}`;
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch {
      alert("Ошибка сети. Напишите нам в Telegram — пришлём КП вручную.");
    } finally {
      setProposalLoading(false);
    }
  };

  // ── AI loader ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="card-glass rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-6 min-h-[320px]">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-2 border-[#00A86B]/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#00A86B] animate-spin" />
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent border-b-[#00A86B]/40 animate-spin"
            style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
          />
          <div className="absolute inset-3 rounded-full bg-[#00A86B]/10 flex items-center justify-center text-2xl">
            🤖
          </div>
        </div>
        <div>
          <p className="text-white font-semibold mb-3 min-h-[1.5rem] transition-all">
            {AI_STEPS[aiStep]}
          </p>
          <div className="flex gap-1.5 justify-center">
            {AI_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-400 ${
                  i === aiStep ? "w-6 bg-[#00A86B]" : "w-1.5 bg-[#243a5e]"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Result screen ──────────────────────────────────────────────────────────
  if (result?.ok) {
    const cargoType = (result.cargo_type ?? "consolidation") as CargoType;
    const hasCost = result.delivery_cost && result.delivery_cost > 0;
    const currency = result.rate_currency ?? "USD";
    const currencySymbol: Record<string, string> = { USD: "$", CNY: "¥", RUB: "₽", KZT: "₸" };
    const sym = currencySymbol[currency] ?? currency;
    const cityTo = formData.city_to || "—";

    return (
      <div className="card-glass rounded-2xl p-7 glow-green">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full bg-[#00A86B]/20 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-[#00A86B]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">Заявка принята!</h3>
            <p className="text-xs text-[#8899aa]">Менеджер свяжется с вами в течение 15 минут</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-4 text-center">
          <div>
            <p className="text-[10px] text-[#8899aa] mb-0.5 uppercase tracking-wide">Откуда</p>
            <p className="text-sm font-semibold text-white">Китай 🇨🇳</p>
          </div>
          <div className="flex items-center justify-center text-[#00A86B] font-bold text-lg">→</div>
          <div>
            <p className="text-[10px] text-[#8899aa] mb-0.5 uppercase tracking-wide">Куда</p>
            <p className="text-sm font-semibold text-white truncate">{cityTo}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">{CARGO_TYPE_ICONS[cargoType]}</span>
          <span className="text-sm font-semibold text-[#00A86B]">{CARGO_TYPE_LABELS[cargoType]}</span>
          {result.reason && (
            <span className="text-xs text-[#8899aa] ml-auto text-right leading-tight max-w-[55%]">
              {result.reason}
            </span>
          )}
        </div>

        {hasCost ? (
          <div className="bg-[#00A86B]/10 border border-[#00A86B]/30 rounded-xl p-5 mb-4 text-center">
            <p className="text-xs text-[#8899aa] mb-1 uppercase tracking-widest">Предварительная стоимость</p>
            <p className="text-4xl font-bold text-white mb-1">
              {sym}{result.delivery_cost!.toLocaleString("ru-RU")}
            </p>
            <p className="text-sm text-[#8899aa]">
              {currency}
              {result.delivery_days_min && result.delivery_days_max
                ? ` · ${result.delivery_days_min}–${result.delivery_days_max} дней`
                : ""}
            </p>
            {result.pricing_rule && (
              <span className="inline-block mt-2 px-2.5 py-0.5 bg-[#00A86B]/20 text-[#00A86B] text-xs rounded-full font-medium">
                {result.pricing_rule}
              </span>
            )}
            <p className="text-[10px] text-[#8899aa] mt-2 italic">
              * Окончательная стоимость уточняется менеджером
            </p>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 text-center">
            <p className="text-2xl mb-1">📋</p>
            <p className="text-sm text-[#8899aa]">Точную стоимость рассчитает менеджер индивидуально</p>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {result.lead_id && (
            <button
              onClick={() => handleDownloadProposal(result.lead_id!)}
              disabled={proposalLoading}
              className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-[#00A86B] hover:bg-[#008f59] disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all"
            >
              <Download className="w-4 h-4" />
              {proposalLoading ? "Создаём КП…" : "Получить коммерческое предложение"}
            </button>
          )}
          <a
            href="https://t.me/ChinaBridgeLID_bot"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => analytics.telegramClick()}
            className={`flex items-center justify-center gap-2 w-full px-5 py-3 font-semibold text-sm rounded-xl transition-all ${
              result.lead_id
                ? "border border-[#243a5e] hover:border-[#00A86B]/50 text-white hover:bg-white/5"
                : "bg-[#00A86B] hover:bg-[#008f59] text-white"
            }`}
          >
            Написать менеджеру в Telegram
          </a>
        </div>

        <button
          onClick={() => {
            setResult(null);
            setStep(1);
            setFormData(initialFormData);
            setErrors({});
            setEcoError(null);
            startedRef.current = false;
          }}
          className="text-sm text-[#8899aa] hover:text-white underline w-full text-center block mt-3"
        >
          Отправить новую заявку
        </button>
      </div>
    );
  }

  // ── Form (2 steps) ─────────────────────────────────────────────────────────
  return (
    <div className="card-glass rounded-2xl p-6 md:p-8">

      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-7">
        <div className="flex-1 h-1.5 rounded-full bg-[#243a5e] overflow-hidden">
          <div
            className="h-full bg-[#00A86B] rounded-full transition-all duration-500"
            style={{ width: step === 1 ? "50%" : "100%" }}
          />
        </div>
        <span className="text-xs text-[#8899aa] whitespace-nowrap">
          {step} / 2
        </span>
      </div>

      {/* ── Step 1: Товар и маршрут ── */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="text-lg font-semibold text-white mb-0.5">Что везёте из Китая?</h2>
            <p className="text-sm text-[#8899aa]">Опишите товар или вставьте ссылку с 1688 / Alibaba</p>
          </div>

          <div>
            <input
              type="text"
              autoFocus
              value={formData.product_name}
              onChange={e => set("product_name", e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleNext()}
              placeholder='Например: велосипеды горные, электроника, одежда...'
              className={inp(!!errors.product_name)}
            />
            {errors.product_name && (
              <p className="text-xs text-red-400 mt-1">{errors.product_name}</p>
            )}
          </div>

          <div>
            <input
              type="url"
              value={formData.product_link}
              onChange={e => set("product_link", e.target.value)}
              placeholder="Ссылка на товар (необязательно)"
              className={inp()}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#8899aa] block mb-2">
              Куда доставить?
            </label>
            <input
              type="text"
              value={formData.city_to}
              onChange={e => set("city_to", e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleNext()}
              placeholder="Город назначения"
              className={inp()}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {CITY_CHIPS.map(city => (
                <button
                  key={city}
                  type="button"
                  onClick={() => set("city_to", city)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    formData.city_to === city
                      ? "border-[#00A86B] bg-[#00A86B]/15 text-[#00A86B]"
                      : "border-[#243a5e] text-[#8899aa] hover:border-[#00A86B]/50 hover:text-white"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleNext}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#00A86B] hover:bg-[#008f59] text-white font-semibold rounded-xl transition-all"
          >
            Далее <ChevronRight className="w-4 h-4" />
          </button>

          <p className="text-center text-xs text-[#8899aa]">
            Нужен точный расчёт?{" "}
            <a href="/delivery-calculator" className="text-[#00A86B] hover:underline">
              Полный калькулятор →
            </a>
          </p>
        </div>
      )}

      {/* ── Step 2: Контакты ── */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div>
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-xs text-[#8899aa] hover:text-white mb-3 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Назад
            </button>
            <h2 className="text-lg font-semibold text-white mb-0.5">Как с вами связаться?</h2>
            <p className="text-sm text-[#8899aa]">Менеджер ответит в течение 15 минут</p>
          </div>

          <div>
            <label className="text-xs font-medium text-[#8899aa] block mb-1.5">
              Телефон <span className="text-[#00A86B]">*</span>
            </label>
            <input
              type="tel"
              autoFocus
              value={formData.phone}
              onChange={e => set("phone", e.target.value)}
              placeholder="+7 (999) 000-00-00"
              className={inp(!!errors.phone)}
            />
            {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-[#8899aa] block mb-1.5">
              Telegram
            </label>
            <input
              type="text"
              value={formData.telegram}
              onChange={e => set("telegram", e.target.value)}
              placeholder="@username"
              className={inp()}
            />
            <p className="text-[11px] text-[#8899aa] mt-1">* Укажите телефон или Telegram — что удобнее</p>
          </div>

          <div>
            <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Имя</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => set("name", e.target.value)}
              placeholder="Как вас зовут?"
              className={inp()}
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#00A86B] hover:bg-[#008f59] text-white font-semibold rounded-xl transition-all"
          >
            Получить расчёт <ChevronRight className="w-4 h-4" />
          </button>

          <p className="text-center text-xs text-[#8899aa]">
            Нажимая кнопку, вы соглашаетесь с{" "}
            <a href="/privacy" className="text-[#00A86B] hover:underline">
              политикой конфиденциальности
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
