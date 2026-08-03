"use client";
import { useState, useEffect, useRef } from "react";
import type {
  CalculatorFormData,
  CalculatorResult,
  CargoType,
  ServiceType,
} from "@/lib/calculator/types";
import {
  CARGO_TYPE_LABELS,
  CARGO_TYPE_ICONS,
  SERVICE_LABELS,
  SERVICE_DESCRIPTIONS,
} from "@/lib/calculator/types";
import { CheckCircle2, ChevronRight, ChevronLeft, Download } from "lucide-react";
import { analytics } from "@/lib/analytics";

const CATEGORIES = [
  "Оборудование",
  "Автозапчасти",
  "Электроника",
  "Одежда",
  "Мебель",
  "Товары для дома",
  "Другое",
];

const SERVICE_TYPES: ServiceType[] = [
  "delivery_only",
  "supplier_search",
  "buyout",
  "inspection",
  "full_service",
];

const STEP_LABELS = ["Товар", "Груз", "Маршрут", "Услуга", "Контакты"];

const CITIES_FROM = [
  { value: "Yiwu", label: "Иу (Yiwu)" },
  { value: "Guangzhou", label: "Гуанчжоу (Guangzhou)" },
  { value: "Shenzhen", label: "Шэньчжэнь (Shenzhen)" },
  { value: "Beijing", label: "Пекин (Beijing)" },
  { value: "Shanghai", label: "Шанхай (Shanghai)" },
  { value: "other", label: "Другой город" },
];

const AI_STEPS = [
  "AI анализирует параметры груза...",
  "Подбирает оптимальный маршрут...",
  "Рассчитывает стоимость доставки...",
  "Готовит предложение...",
];

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
  `w-full px-3.5 py-2.5 bg-[#0B1F3A] border rounded-xl text-sm placeholder:text-[#8899aa] outline-none transition-colors text-white ${
    error
      ? "border-red-500/60 focus:border-red-400"
      : "border-[#243a5e] focus:border-[#00A86B]/60"
  }`;

const sel =
  "w-full px-3.5 py-2.5 bg-[#0B1F3A] border border-[#243a5e] rounded-xl text-sm text-white outline-none focus:border-[#00A86B]/60 transition-colors";

export function CalculatorForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CalculatorFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof CalculatorFormData, string>>>({});
  const [aiStep, setAiStep] = useState(0);
  const [proposalLoading, setProposalLoading] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!loading) { setAiStep(0); return; }
    const id = setInterval(() => setAiStep(p => (p + 1) % AI_STEPS.length), 950);
    return () => clearInterval(id);
  }, [loading]);

  const set = (field: keyof CalculatorFormData, value: string) => {
    setFormData((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validateStep = (s: number): boolean => {
    const newErrors: Partial<Record<keyof CalculatorFormData, string>> = {};
    if (s === 1) {
      if (!formData.product_name.trim())
        newErrors.product_name = "Укажите название товара";
    }
    if (s === 3) {
      if (!formData.city_to.trim())
        newErrors.city_to = "Укажите город назначения";
    }
    if (s === 5) {
      if (!formData.name.trim()) newErrors.name = "Укажите имя";
      if (!formData.phone.trim()) newErrors.phone = "Укажите телефон";
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
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    if (!validateStep(5)) return;
    setLoading(true);
    analytics.formSubmit({ form_id: "calculator" });
    try {
      const res = await fetch("/api/calculator/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          telegram: formData.telegram,
          email: formData.email,
          product_name: formData.product_name,
          category: formData.category,
          product_link: formData.product_link,
          quantity: formData.quantity,
          weight_kg: formData.weight_kg,
          volume_m3: formData.volume_m3,
          packages_count: formData.packages_count,
          country_from: formData.country_from,
          city_from: formData.city_from,
          country_to: formData.country_to,
          city_to: formData.city_to,
          service_type: formData.service_type,
        }),
      });
      const data: CalculatorResult = await res.json();
      setResult(data);
      if (data.ok) {
        analytics.calculatorComplete({
          route: `${formData.city_from || "China"} → ${formData.city_to}`,
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
        const msg = data?.error === "lead_not_found"
          ? "Заявка не найдена в CRM. Напишите нам в Telegram — пришлём КП вручную."
          : "Не удалось создать КП. Попробуйте ещё раз или напишите в Telegram.";
        alert(msg);
        return;
      }
      // If PDF bytes returned inline — download via Blob (no popup blocker)
      if (data.pdfBase64) {
        const bytes = Uint8Array.from(atob(data.pdfBase64), (c) => c.charCodeAt(0));
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
        // Fallback to download URL
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

  // ── AI loader ──
  if (loading) {
    return (
      <div className="card-glass rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-6 min-h-[320px]">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-2 border-[#00A86B]/20"/>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#00A86B] animate-spin"/>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-b-[#00A86B]/40 animate-spin" style={{animationDirection:"reverse",animationDuration:"1.5s"}}/>
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

  // ── Result screen ──
  if (result?.ok) {
    const cargoType = (result.cargo_type ?? "consolidation") as CargoType;
    const hasCost = result.delivery_cost && result.delivery_cost > 0;
    const currency = result.rate_currency ?? "USD";
    const currencySymbol: Record<string, string> = { USD: "$", CNY: "¥", RUB: "₽", KZT: "₸" };
    const sym = currencySymbol[currency] ?? currency;
    const cityFrom = formData.city_from && formData.city_from !== "other"
      ? CITIES_FROM.find(c => c.value === formData.city_from)?.label ?? formData.city_from
      : "Китай";
    const cityTo = formData.city_to || "—";

    return (
      <div className="card-glass rounded-2xl p-7 glow-green">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full bg-[#00A86B]/20 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-[#00A86B]"/>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">Расчёт готов!</h3>
            <p className="text-xs text-[#8899aa]">Предварительная оценка вашего груза</p>
          </div>
        </div>

        {/* Route + cargo */}
        <div className="grid grid-cols-3 gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-4 text-center">
          <div>
            <p className="text-[10px] text-[#8899aa] mb-0.5 uppercase tracking-wide">Откуда</p>
            <p className="text-sm font-semibold text-white truncate">{cityFrom}</p>
          </div>
          <div className="flex items-center justify-center text-[#00A86B] font-bold text-lg">→</div>
          <div>
            <p className="text-[10px] text-[#8899aa] mb-0.5 uppercase tracking-wide">Куда</p>
            <p className="text-sm font-semibold text-white truncate">{cityTo}</p>
          </div>
        </div>

        {/* Cargo type */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">{CARGO_TYPE_ICONS[cargoType]}</span>
          <span className="text-sm font-semibold text-[#00A86B]">{CARGO_TYPE_LABELS[cargoType]}</span>
          {result.reason && (
            <span className="text-xs text-[#8899aa] ml-auto text-right leading-tight max-w-[55%]">{result.reason}</span>
          )}
        </div>

        {/* Cost */}
        {hasCost ? (
          <div className="bg-[#00A86B]/10 border border-[#00A86B]/30 rounded-xl p-5 mb-4 text-center">
            <p className="text-xs text-[#8899aa] mb-1 uppercase tracking-widest">Стоимость доставки</p>
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
            <p className="text-sm text-[#8899aa]">
              Стоимость рассчитает менеджер индивидуально
            </p>
          </div>
        )}

        {/* CTA row */}
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
            Связаться с логистом в Telegram
          </a>
        </div>

        <button
          onClick={() => {
            setResult(null);
            setStep(1);
            setFormData(initialFormData);
            setErrors({});
            startedRef.current = false;
          }}
          className="text-sm text-[#8899aa] hover:text-white underline w-full text-center block mt-3"
        >
          Отправить новую заявку
        </button>
      </div>
    );
  }

  return (
    <div className="card-glass rounded-2xl p-6 md:p-8">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  n < step
                    ? "bg-[#00A86B] text-white"
                    : n === step
                    ? "bg-[#00A86B] text-white ring-2 ring-[#00A86B]/30"
                    : "bg-[#243a5e] text-[#8899aa]"
                }`}
              >
                {n < step ? "✓" : n}
              </div>
              <span className="text-[10px] text-[#8899aa] hidden sm:block">
                {STEP_LABELS[n - 1]}
              </span>
            </div>
            {n < 5 && (
              <div
                className={`w-6 sm:w-8 h-0.5 mb-4 ${
                  n < step ? "bg-[#00A86B]" : "bg-[#243a5e]"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="mb-8">
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white mb-1">Шаг 1 — Товар</h2>
            <div>
              <label className="text-xs font-medium text-[#8899aa] block mb-1.5">
                Название товара *
              </label>
              <input
                type="text"
                value={formData.product_name}
                onChange={(e) => set("product_name", e.target.value)}
                placeholder="Например: велосипеды горные 26&quot;"
                className={inp(!!errors.product_name)}
              />
              {errors.product_name && (
                <p className="text-xs text-red-400 mt-1">{errors.product_name}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-[#8899aa] block mb-1.5">
                Категория *
              </label>
              <select
                value={formData.category}
                onChange={(e) => set("category", e.target.value)}
                className={sel}
              >
                <option value="">Выберите категорию</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#8899aa] block mb-1.5">
                Ссылка на товар
              </label>
              <input
                type="url"
                value={formData.product_link}
                onChange={(e) => set("product_link", e.target.value)}
                placeholder="Ссылка с 1688, Alibaba или Taobao"
                className={inp()}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#8899aa] block mb-1.5">
                Количество
              </label>
              <input
                type="text"
                value={formData.quantity}
                onChange={(e) => set("quantity", e.target.value)}
                placeholder="100 шт."
                className={inp()}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white mb-1">Шаг 2 — Параметры груза</h2>
            <div>
              <label className="text-xs font-medium text-[#8899aa] block mb-1.5">
                Вес
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.weight_kg}
                  onChange={(e) => set("weight_kg", e.target.value)}
                  placeholder="300"
                  className="w-full px-3.5 py-2.5 pr-12 bg-[#0B1F3A] border border-[#243a5e] rounded-xl text-sm text-white placeholder:text-[#8899aa] outline-none focus:border-[#00A86B]/60 transition-colors"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8899aa] text-sm">
                  кг
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[#8899aa] block mb-1.5">
                Объём
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.volume_m3}
                  onChange={(e) => set("volume_m3", e.target.value)}
                  placeholder="1.5"
                  step="0.1"
                  className="w-full px-3.5 py-2.5 pr-12 bg-[#0B1F3A] border border-[#243a5e] rounded-xl text-sm text-white placeholder:text-[#8899aa] outline-none focus:border-[#00A86B]/60 transition-colors"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8899aa] text-sm">
                  м³
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[#8899aa] block mb-1.5">
                Количество мест
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.packages_count}
                  onChange={(e) => set("packages_count", e.target.value)}
                  placeholder="10"
                  className="w-full px-3.5 py-2.5 pr-16 bg-[#0B1F3A] border border-[#243a5e] rounded-xl text-sm text-white placeholder:text-[#8899aa] outline-none focus:border-[#00A86B]/60 transition-colors"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8899aa] text-sm">
                  мест
                </span>
              </div>
            </div>
            <p className="text-xs text-[#8899aa]">
              💡 Укажите хотя бы один параметр для точного расчёта
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white mb-1">Шаг 3 — Маршрут</h2>
            <div>
              <label className="text-xs font-medium text-[#8899aa] block mb-1.5">
                Страна отправления
              </label>
              <div className="w-full px-3.5 py-2.5 bg-[#0B1F3A]/60 border border-[#243a5e]/50 rounded-xl text-sm text-[#8899aa]">
                Китай 🇨🇳
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[#8899aa] block mb-1.5">
                Город отправления
              </label>
              <select
                value={formData.city_from}
                onChange={(e) => set("city_from", e.target.value)}
                className={sel}
              >
                <option value="">Выберите город</option>
                {CITIES_FROM.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#8899aa] block mb-1.5">
                Страна назначения
              </label>
              <select
                value={formData.country_to}
                onChange={(e) => set("country_to", e.target.value)}
                className={sel}
              >
                <option value="Russia">Россия 🇷🇺</option>
                <option value="Kazakhstan">Казахстан 🇰🇿</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#8899aa] block mb-1.5">
                Город назначения *
              </label>
              <input
                type="text"
                value={formData.city_to}
                onChange={(e) => set("city_to", e.target.value)}
                placeholder="Москва"
                className={inp(!!errors.city_to)}
              />
              {errors.city_to && (
                <p className="text-xs text-red-400 mt-1">{errors.city_to}</p>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white mb-1">Шаг 4 — Услуга</h2>
            <p className="text-sm text-[#8899aa]">Выберите нужную услугу:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SERVICE_TYPES.map((st) => (
                <button
                  key={st}
                  onClick={() => set("service_type", st)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    formData.service_type === st
                      ? "border-[#00A86B] bg-[#00A86B]/10"
                      : "border-[#243a5e] hover:border-[#00A86B]/40 hover:bg-white/5"
                  }`}
                >
                  <div className="font-semibold text-white text-sm mb-1">
                    {SERVICE_LABELS[st]}
                  </div>
                  <div className="text-[#8899aa] text-xs">
                    {SERVICE_DESCRIPTIONS[st]}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white mb-1">Шаг 5 — Контакты</h2>
            <div>
              <label className="text-xs font-medium text-[#8899aa] block mb-1.5">
                Имя *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Ваше имя"
                className={inp(!!errors.name)}
              />
              {errors.name && (
                <p className="text-xs text-red-400 mt-1">{errors.name}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-[#8899aa] block mb-1.5">
                Телефон *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+7 (777) 000-00-00"
                className={inp(!!errors.phone)}
              />
              {errors.phone && (
                <p className="text-xs text-red-400 mt-1">{errors.phone}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-[#8899aa] block mb-1.5">
                Telegram
              </label>
              <input
                type="text"
                value={formData.telegram}
                onChange={(e) => set("telegram", e.target.value)}
                placeholder="@username"
                className={inp()}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#8899aa] block mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="email@example.com"
                className={inp()}
              />
            </div>
            <p className="text-xs text-[#8899aa]">
              Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        {step > 1 ? (
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-5 py-2.5 border border-[#243a5e] hover:border-[#00A86B]/50 text-white text-sm font-semibold rounded-xl transition-all hover:bg-white/5"
          >
            <ChevronLeft className="w-4 h-4" /> Назад
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={step < 5 ? handleNext : handleSubmit}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#00A86B] hover:bg-[#008f59] text-white text-sm font-semibold rounded-xl transition-all"
        >
          {step < 5 ? (
            <>Далее <ChevronRight className="w-4 h-4" /></>
          ) : (
            <>Получить расчёт <ChevronRight className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </div>
  );
}
