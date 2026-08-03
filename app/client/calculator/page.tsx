"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "Оборудование", "Автозапчасти", "Электроника", "Одежда",
  "Мебель", "Товары для дома", "Игрушки", "Другое",
];

const CITIES_FROM = [
  { value: "Yiwu",      label: "Иу (Yiwu)" },
  { value: "Guangzhou", label: "Гуанчжоу (Guangzhou)" },
  { value: "Shenzhen",  label: "Шэньчжэнь (Shenzhen)" },
  { value: "Shanghai",  label: "Шанхай (Shanghai)" },
  { value: "Qingdao",   label: "Циндао (Qingdao)" },
  { value: "other",     label: "Другой город" },
];

const SERVICE_OPTIONS = [
  { value: "delivery_only",   label: "Только доставка",        desc: "Транспортировка вашего груза" },
  { value: "supplier_search", label: "Поиск поставщика",       desc: "Найдём надёжного производителя" },
  { value: "buyout",          label: "Выкуп с 1688/Alibaba",   desc: "Закупим товар от вашего имени" },
  { value: "inspection",      label: "Инспекция качества",     desc: "Проверим товар перед отправкой" },
  { value: "full_service",    label: "Под ключ",               desc: "Поиск → Закупка → Доставка" },
];

const AI_STEPS = [
  "AI анализирует параметры груза...",
  "Подбирает оптимальный маршрут...",
  "Рассчитывает стоимость доставки...",
  "Готовит предложение...",
];

const STEP_LABELS = ["Товар", "Груз", "Маршрут", "Услуга"];

const TRANSPORT_VARIANTS: Array<{
  key: "truck" | "air" | "sea";
  icon: string;
  label: string;
  tag: string;
}> = [
  { key: "truck", icon: "🚛", label: "Автодоставка",   tag: "Оптимально" },
  { key: "air",   icon: "✈️", label: "Авиадоставка",   tag: "Быстрее" },
  { key: "sea",   icon: "🚢", label: "Морская",         tag: "Экономично" },
];

// ── Types ────────────────────────────────────────────────────────────────────

interface CalcVariant {
  transport_cost: number;
  additional_cost: number;
  total_cost: number;
  currency: string;
  delivery_days_min?: number;
  delivery_days_max?: number;
}

interface Results {
  calc_id: string;
  truck: CalcVariant | null;
  air:   CalcVariant | null;
  sea:   CalcVariant | null;
  ai_recommendation: string;
}

// ── Styles ───────────────────────────────────────────────────────────────────

const inp = (error?: boolean) =>
  `w-full px-3.5 py-2.5 bg-[#0B1F3A] border rounded-xl text-sm placeholder:text-[#8899aa] outline-none transition-colors text-white ${
    error ? "border-red-500/60 focus:border-red-400" : "border-[#243a5e] focus:border-[#00A86B]/60"
  }`;

const sel =
  "w-full px-3.5 py-2.5 bg-[#0B1F3A] border border-[#243a5e] rounded-xl text-sm text-white outline-none focus:border-[#00A86B]/60 transition-colors";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDays(r?: CalcVariant | null) {
  if (!r) return null;
  const { delivery_days_min: mn, delivery_days_max: mx } = r;
  if (mn && mx) return `${mn}–${mx} дн.`;
  if (mn) return `от ${mn} дн.`;
  if (mx) return `до ${mx} дн.`;
  return null;
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepBar({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3, 4].map((n) => (
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
          {n < 4 && (
            <div
              className={`w-6 sm:w-8 h-0.5 mb-4 ${n < step ? "bg-[#00A86B]" : "bg-[#243a5e]"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── AI loader ─────────────────────────────────────────────────────────────────

function AILoader({ aiStep }: { aiStep: number }) {
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

// ── Result screen ─────────────────────────────────────────────────────────────

function ResultScreen({
  results,
  cityFrom,
  cityTo,
  onReset,
}: {
  results: Results;
  cityFrom: string;
  cityTo: string;
  onReset: () => void;
}) {
  const [selected, setSelected] = useState<"truck" | "air" | "sea">(
    results.truck?.total_cost ? "truck" : results.air?.total_cost ? "air" : "sea"
  );
  const [showTable, setShowTable] = useState(false);

  const selResult = results[selected];
  const currencySymbol: Record<string, string> = { USD: "$", CNY: "¥", RUB: "₽", KZT: "₸" };

  return (
    <div className="card-glass rounded-2xl p-7 glow-green">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-full bg-[#00A86B]/20 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-6 h-6 text-[#00A86B]" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white leading-tight">Расчёт готов!</h3>
          <p className="text-xs text-[#8899aa]">Выберите оптимальный вариант доставки</p>
        </div>
      </div>

      {/* Route */}
      <div className="grid grid-cols-3 gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-5 text-center">
        <div>
          <p className="text-[10px] text-[#8899aa] mb-0.5 uppercase tracking-wide">Откуда</p>
          <p className="text-sm font-semibold text-white truncate">{cityFrom || "Китай"}</p>
        </div>
        <div className="flex items-center justify-center text-[#00A86B] font-bold text-lg">→</div>
        <div>
          <p className="text-[10px] text-[#8899aa] mb-0.5 uppercase tracking-wide">Куда</p>
          <p className="text-sm font-semibold text-white truncate">{cityTo || "—"}</p>
        </div>
      </div>

      {/* 3 variant cards */}
      <div className="flex gap-2 mb-4 flex-wrap sm:flex-nowrap">
        {TRANSPORT_VARIANTS.map(({ key, icon, label, tag }) => {
          const r = results[key];
          const has = r && r.total_cost > 0;
          const sym = has ? (currencySymbol[r!.currency] ?? r!.currency) : "";
          return (
            <button
              key={key}
              type="button"
              onClick={() => has && setSelected(key)}
              className={`flex-1 min-w-[90px] p-3 rounded-xl border text-left transition-all ${
                !has
                  ? "border-[#243a5e] opacity-40 cursor-default"
                  : selected === key
                  ? "border-[#00A86B] bg-[#00A86B]/10"
                  : "border-[#243a5e] hover:border-[#00A86B]/40 hover:bg-white/5 cursor-pointer"
              }`}
            >
              <div className="text-xl mb-1">{icon}</div>
              <p className="text-[11px] font-semibold text-white mb-0.5">{label}</p>
              <p className="text-[10px] text-[#00A86B] mb-1">{tag}</p>
              {has ? (
                <>
                  <p className="text-base font-bold text-white">
                    {sym}{r!.total_cost.toLocaleString()}
                  </p>
                  {fmtDays(r) && (
                    <p className="text-[10px] text-[#8899aa] mt-0.5">{fmtDays(r)}</p>
                  )}
                </>
              ) : (
                <p className="text-[10px] text-[#8899aa]">нет данных</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected variant detail */}
      {selResult && selResult.total_cost > 0 && (
        <div className="bg-[#00A86B]/10 border border-[#00A86B]/30 rounded-xl p-4 mb-4 text-center">
          <p className="text-xs text-[#8899aa] mb-1 uppercase tracking-widest">
            {TRANSPORT_VARIANTS.find((v) => v.key === selected)?.label}
          </p>
          <p className="text-4xl font-bold text-white mb-1">
            {currencySymbol[selResult.currency] ?? selResult.currency}
            {selResult.total_cost.toLocaleString("ru-RU")}
          </p>
          <p className="text-sm text-[#8899aa]">
            {selResult.currency}
            {fmtDays(selResult) ? ` · ${fmtDays(selResult)}` : ""}
          </p>
          <p className="text-[10px] text-[#8899aa] mt-2 italic">
            * Окончательная стоимость уточняется менеджером
          </p>
        </div>
      )}

      {/* Comparison table toggle */}
      <button
        onClick={() => setShowTable((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 mb-3 text-sm text-[#8899aa] hover:text-white border border-[#243a5e] hover:border-[#00A86B]/40 rounded-xl transition-all"
      >
        <span>📊 Сравнительная таблица</span>
        <span className="text-xs">{showTable ? "▲" : "▼"}</span>
      </button>
      {showTable && (
        <div className="mb-4 overflow-x-auto">
          <table className="w-full text-xs border border-[#243a5e] rounded-xl overflow-hidden">
            <thead className="bg-[#0B1F3A]">
              <tr>
                <th className="px-3 py-2 text-left text-[#8899aa]">Параметр</th>
                <th className="px-3 py-2 text-center text-[#8899aa]">🚛 Авто</th>
                <th className="px-3 py-2 text-center text-[#8899aa]">✈️ Авиа</th>
                <th className="px-3 py-2 text-center text-[#8899aa]">🚢 Море</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-[#243a5e]">
                <td className="px-3 py-2 text-[#8899aa]">Стоимость</td>
                {(["truck", "air", "sea"] as const).map((k) => (
                  <td key={k} className="px-3 py-2 text-center font-semibold text-white">
                    {results[k]?.total_cost ? `${currencySymbol[results[k]!.currency] ?? ""}${results[k]!.total_cost.toLocaleString()}` : "—"}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-[#243a5e]">
                <td className="px-3 py-2 text-[#8899aa]">Срок</td>
                {(["truck", "air", "sea"] as const).map((k) => (
                  <td key={k} className="px-3 py-2 text-center text-white">{fmtDays(results[k]) ?? "—"}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* AI recommendation */}
      {results.ai_recommendation && (
        <div className="bg-white/5 border border-[#243a5e] rounded-xl px-4 py-3 mb-4">
          <p className="text-xs text-[#00A86B] font-semibold mb-1.5">🤖 Рекомендация AI-аналитика</p>
          <p className="text-xs text-[#8899aa] leading-relaxed">{results.ai_recommendation}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2.5">
        <Link
          href="/client/messages"
          className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-[#00A86B] hover:bg-[#008f59] text-white text-sm font-semibold rounded-xl transition-all"
        >
          💬 Написать менеджеру
        </Link>
        <a
          href="/contacts"
          className="flex items-center justify-center gap-2 w-full px-5 py-3 border border-[#243a5e] hover:border-[#00A86B]/50 text-white text-sm font-semibold rounded-xl transition-all hover:bg-white/5"
        >
          📋 Получить коммерческое предложение
        </a>
        <Link
          href="/client/calculations"
          className="text-sm text-[#8899aa] hover:text-white text-center mt-1 transition"
        >
          📋 История расчётов →
        </Link>
      </div>

      <button
        onClick={onReset}
        className="text-sm text-[#8899aa] hover:text-white underline w-full text-center block mt-3"
      >
        Сделать новый расчёт
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

interface FormData {
  product_name: string;
  category: string;
  product_link: string;
  quantity: string;
  weight_kg: string;
  volume_m3: string;
  packages_count: string;
  country_from: string;
  city_from: string;
  country_to: string;
  city_to: string;
  service_type: string;
}

const INITIAL: FormData = {
  product_name: "", category: "", product_link: "", quantity: "",
  weight_kg: "", volume_m3: "", packages_count: "",
  country_from: "China", city_from: "",
  country_to: "Russia", city_to: "",
  service_type: "delivery_only",
};

const CITY_COUNTRIES: Record<string, string> = {
  Москва: "Russia", "Санкт-Петербург": "Russia", Новосибирск: "Russia",
  Екатеринбург: "Russia", Благовещенск: "Russia", Хабаровск: "Russia",
  Алматы: "Kazakhstan", Астана: "Kazakhstan",
};

export default function CalculatorPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [aiStep, setAiStep] = useState(0);
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) { setAiStep(0); return; }
    const id = setInterval(() => setAiStep((p) => (p + 1) % AI_STEPS.length), 950);
    return () => clearInterval(id);
  }, [loading]);

  function set(field: keyof FormData, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(s: number): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (s === 1 && !form.product_name.trim()) e.product_name = "Укажите название товара";
    if (s === 3 && !form.city_to.trim()) e.city_to = "Укажите город назначения";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() { if (validate(step)) setStep((s) => s + 1); }
  function back() { setStep((s) => s - 1); }

  async function calculate() {
    if (!validate(4)) return;
    setLoading(true);
    setError(null);
    try {
      const cityFromLabel = CITIES_FROM.find((c) => c.value === form.city_from)?.value ?? form.city_from;
      const countryTo = CITY_COUNTRIES[form.city_to] ?? form.country_to;
      const res = await fetch("/api/client/calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city_from: cityFromLabel,
          city_to: form.city_to,
          product_name: form.product_name,
          product_category: form.category || form.product_name,
          weight: parseFloat(form.weight_kg) || 0,
          volume: parseFloat(form.volume_m3) || 0,
          packages: parseInt(form.packages_count) || 1,
        }),
      });
      if (!res.ok) throw new Error();
      setResults(await res.json() as Results);
    } catch {
      setError("Ошибка расчёта. Попробуйте ещё раз или обратитесь к менеджеру.");
    } finally {
      setLoading(false);
    }
  }

  const cityFromLabel = CITIES_FROM.find((c) => c.value === form.city_from)?.label ?? form.city_from;

  if (loading) return (
    <div className="min-h-screen -m-4 sm:-m-6 lg:-m-8 bg-[#060f1e] flex flex-col">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-12 w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Калькулятор <span className="text-gradient">доставки</span>
          </h1>
        </div>
        <AILoader aiStep={aiStep} />
      </div>
    </div>
  );

  if (results) return (
    <div className="min-h-screen -m-4 sm:-m-6 lg:-m-8 bg-[#060f1e] flex flex-col">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-12 w-full">
        <div className="text-center mb-8">
          <p className="text-[#00A86B] text-sm font-semibold uppercase tracking-widest mb-2">
            Бесплатный расчёт
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Калькулятор <span className="text-gradient">доставки</span>
          </h1>
        </div>
        <ResultScreen
          results={results}
          cityFrom={cityFromLabel}
          cityTo={form.city_to}
          onReset={() => { setResults(null); setStep(1); setForm(INITIAL); }}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen -m-4 sm:-m-6 lg:-m-8 bg-[#060f1e] flex flex-col">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-12 w-full">
        <div className="text-center mb-12">
          <p className="text-[#00A86B] text-sm font-semibold uppercase tracking-widest mb-3">
            Бесплатный расчёт
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Калькулятор <span className="text-gradient">доставки</span>
            <br className="hidden sm:block" /> из Китая
          </h1>
          <p className="text-[#8899aa] text-lg">
            Укажите параметры груза — AI подберёт оптимальный способ доставки
          </p>
        </div>

        <div className="card-glass rounded-2xl p-6 md:p-8">
          <StepBar step={step} />

          <div className="mb-8">
            {/* Step 1 — Product */}
            {step === 1 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-white mb-1">Шаг 1 — Товар</h2>
                <div>
                  <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Название товара *</label>
                  <input
                    type="text"
                    value={form.product_name}
                    onChange={(e) => set("product_name", e.target.value)}
                    placeholder='Например: велосипеды горные 26"'
                    className={inp(!!errors.product_name)}
                  />
                  {errors.product_name && <p className="text-xs text-red-400 mt-1">{errors.product_name}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Категория</label>
                  <select value={form.category} onChange={(e) => set("category", e.target.value)} className={sel}>
                    <option value="">Выберите категорию</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Ссылка на товар</label>
                  <input
                    type="url"
                    value={form.product_link}
                    onChange={(e) => set("product_link", e.target.value)}
                    placeholder="Ссылка с 1688, Alibaba или Taobao"
                    className={inp()}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Количество</label>
                  <input
                    type="text"
                    value={form.quantity}
                    onChange={(e) => set("quantity", e.target.value)}
                    placeholder="100 шт."
                    className={inp()}
                  />
                </div>
              </div>
            )}

            {/* Step 2 — Cargo */}
            {step === 2 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-white mb-1">Шаг 2 — Параметры груза</h2>
                {[
                  { field: "weight_kg", label: "Вес", unit: "кг", placeholder: "300" },
                  { field: "volume_m3", label: "Объём", unit: "м³", placeholder: "1.5" },
                  { field: "packages_count", label: "Количество мест", unit: "мест", placeholder: "10" },
                ].map(({ field, label, unit, placeholder }) => (
                  <div key={field}>
                    <label className="text-xs font-medium text-[#8899aa] block mb-1.5">{label}</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={form[field as keyof FormData]}
                        onChange={(e) => set(field as keyof FormData, e.target.value)}
                        placeholder={placeholder}
                        step="0.01"
                        className={`w-full px-3.5 py-2.5 pr-16 bg-[#0B1F3A] border border-[#243a5e] rounded-xl text-sm text-white placeholder:text-[#8899aa] outline-none focus:border-[#00A86B]/60 transition-colors`}
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8899aa] text-sm">{unit}</span>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-[#8899aa]">💡 Укажите хотя бы один параметр для точного расчёта</p>
              </div>
            )}

            {/* Step 3 — Route */}
            {step === 3 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-white mb-1">Шаг 3 — Маршрут</h2>
                <div>
                  <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Страна отправления</label>
                  <div className="w-full px-3.5 py-2.5 bg-[#0B1F3A]/60 border border-[#243a5e]/50 rounded-xl text-sm text-[#8899aa]">
                    Китай 🇨🇳
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Город отправления</label>
                  <select value={form.city_from} onChange={(e) => set("city_from", e.target.value)} className={sel}>
                    <option value="">Выберите город</option>
                    {CITIES_FROM.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Страна назначения</label>
                  <select value={form.country_to} onChange={(e) => set("country_to", e.target.value)} className={sel}>
                    <option value="Russia">Россия 🇷🇺</option>
                    <option value="Kazakhstan">Казахстан 🇰🇿</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Город назначения *</label>
                  <input
                    type="text"
                    value={form.city_to}
                    onChange={(e) => set("city_to", e.target.value)}
                    placeholder="Москва"
                    className={inp(!!errors.city_to)}
                  />
                  {errors.city_to && <p className="text-xs text-red-400 mt-1">{errors.city_to}</p>}
                </div>
              </div>
            )}

            {/* Step 4 — Service */}
            {step === 4 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-white mb-1">Шаг 4 — Услуга</h2>
                <p className="text-sm text-[#8899aa]">Выберите нужную услугу:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SERVICE_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => set("service_type", s.value)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        form.service_type === s.value
                          ? "border-[#00A86B] bg-[#00A86B]/10"
                          : "border-[#243a5e] hover:border-[#00A86B]/40 hover:bg-white/5"
                      }`}
                    >
                      <div className="font-semibold text-white text-sm mb-1">{s.label}</div>
                      <div className="text-[#8899aa] text-xs">{s.desc}</div>
                    </button>
                  ))}
                </div>
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                onClick={back}
                className="flex items-center gap-2 px-5 py-2.5 border border-[#243a5e] hover:border-[#00A86B]/50 text-white text-sm font-semibold rounded-xl transition-all hover:bg-white/5"
              >
                <ChevronLeft className="w-4 h-4" /> Назад
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={step < 4 ? next : calculate}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#00A86B] hover:bg-[#008f59] disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all"
            >
              {step < 4 ? (
                <>Далее <ChevronRight className="w-4 h-4" /></>
              ) : (
                <>Получить расчёт <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link href="/client/calculations" className="text-sm text-[#8899aa] hover:text-white transition">
            📋 История расчётов →
          </Link>
        </div>
      </div>
    </div>
  );
}
