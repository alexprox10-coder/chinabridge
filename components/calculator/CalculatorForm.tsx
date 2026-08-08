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

const MARKETPLACE_COMMISSIONS: Record<string, string> = {
  Wildberries: "15",
  Ozon: "12",
  Другое: "0",
};

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

const AI_ECO_STEPS = [
  "Рассчитывает себестоимость...",
  "Учитывает доставку и таможню...",
  "Анализирует маржинальность...",
  "Формирует AI-вердикт...",
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

const initialEco = {
  unit_price: "",
  price_currency: "CNY",
  sale_price: "",
  marketplace: "Wildberries",
  commission: "15",
  ad_spend: "",
  other_costs: "",
};

const inp = (error?: boolean) =>
  `w-full px-3.5 py-2.5 bg-[#0B1F3A] border rounded-xl text-sm placeholder:text-[#8899aa] outline-none transition-colors text-white ${
    error
      ? "border-red-500/60 focus:border-red-400"
      : "border-[#243a5e] focus:border-[#00A86B]/60"
  }`;

const sel =
  "w-full px-3.5 py-2.5 bg-[#0B1F3A] border border-[#243a5e] rounded-xl text-sm text-white outline-none focus:border-[#00A86B]/60 transition-colors";

const fmt = (n: number) => Math.round(n).toLocaleString("ru-RU");

export function CalculatorForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CalculatorFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof CalculatorFormData, string>>>({});
  const [aiStep, setAiStep] = useState(0);
  const [proposalLoading, setProposalLoading] = useState(false);
  const [ecoOpen, setEcoOpen] = useState(false);
  const [eco, setEco] = useState(initialEco);
  const [ecoError, setEcoError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const hasEco =
    ecoOpen &&
    eco.unit_price.trim() !== "" &&
    eco.sale_price.trim() !== "";

  const activeSteps = hasEco ? AI_ECO_STEPS : AI_STEPS;

  useEffect(() => {
    if (!loading) { setAiStep(0); return; }
    const id = setInterval(() => setAiStep(p => (p + 1) % activeSteps.length), 950);
    return () => clearInterval(id);
  }, [loading, activeSteps.length]);

  const set = (field: keyof CalculatorFormData, value: string) => {
    setFormData(p => ({ ...p, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }));
  };

  const setE = (k: keyof typeof initialEco, v: string) =>
    setEco(e => ({ ...e, [k]: v }));

  const validateStep = (s: number): boolean => {
    const newErrors: Partial<Record<keyof CalculatorFormData, string>> = {};
    if (s === 1 && !formData.product_name.trim())
      newErrors.product_name = "Укажите название товара";
    if (s === 3 && !formData.city_to.trim())
      newErrors.city_to = "Укажите город назначения";
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
      setStep(s => s + 1);
    }
  };

  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!validateStep(5)) return;
    setLoading(true);
    setEcoError(null);
    analytics.formSubmit({ form_id: "calculator" });

    const baseBody = {
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
    };

    try {
      let data: CalculatorResult;

      if (hasEco) {
        const res = await fetch("/api/calculator/economics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...baseBody,
            unit_price: eco.unit_price,
            price_currency: eco.price_currency,
            sale_price: eco.sale_price,
            marketplace: eco.marketplace,
            marketplace_commission: eco.commission,
            ad_spend: eco.ad_spend || "0",
            other_costs: eco.other_costs || "0",
          }),
        });
        const ecoData = await res.json();
        if (res.status === 429) {
          setEcoError(ecoData.reason ?? "Лимит AI-расчётов исчерпан");
          // Fall back to regular delivery calc
          const fb = await fetch("/api/calculator/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(baseBody),
          });
          data = await fb.json();
        } else {
          data = ecoData;
        }
      } else {
        const res = await fetch("/api/calculator/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(baseBody),
        });
        data = await res.json();
      }

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
            {activeSteps[aiStep]}
          </p>
          <div className="flex gap-1.5 justify-center">
            {activeSteps.map((_, i) => (
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
    const cityFrom =
      formData.city_from && formData.city_from !== "other"
        ? CITIES_FROM.find(c => c.value === formData.city_from)?.label ?? formData.city_from
        : "Китай";
    const cityTo = formData.city_to || "—";
    const ec = result.economics;

    return (
      <div className="card-glass rounded-2xl p-7 glow-green">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full bg-[#00A86B]/20 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-[#00A86B]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">Расчёт готов!</h3>
            <p className="text-xs text-[#8899aa]">Предварительная оценка вашего груза</p>
          </div>
        </div>

        {/* Rate-limit notice */}
        {ecoError && (
          <div className="mb-4 bg-amber-900/20 border border-amber-700/40 rounded-xl p-3 text-xs text-amber-300">
            ⚠️ {ecoError}
          </div>
        )}

        {/* AI Economics verdict */}
        {ec && (
          <div
            className={`rounded-xl p-4 mb-4 text-center border ${
              ec.verdict === "green"
                ? "bg-emerald-900/20 border-emerald-700/40"
                : ec.verdict === "yellow"
                ? "bg-amber-900/20 border-amber-700/40"
                : "bg-red-900/20 border-red-700/40"
            }`}
          >
            <p className="text-2xl mb-1">{ec.verdict_emoji}</p>
            <p
              className={`font-bold text-base mb-1 ${
                ec.verdict === "green"
                  ? "text-emerald-400"
                  : ec.verdict === "yellow"
                  ? "text-amber-400"
                  : "text-red-400"
              }`}
            >
              {ec.verdict_label}
            </p>
            {ec.ai_analysis && (
              <p className="text-[11px] text-[#8899aa] mt-1 leading-relaxed">{ec.ai_analysis}</p>
            )}
          </div>
        )}

        {/* Route */}
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
            <span className="text-xs text-[#8899aa] ml-auto text-right leading-tight max-w-[55%]">
              {result.reason}
            </span>
          )}
        </div>

        {/* Delivery cost */}
        {hasCost ? (
          <div className="bg-[#00A86B]/10 border border-[#00A86B]/30 rounded-xl p-5 mb-4 text-center">
            <p className="text-xs text-[#8899aa] mb-1 uppercase tracking-widest">Стоимость доставки</p>
            <p className="text-4xl font-bold text-white mb-1">
              {sym}
              {result.delivery_cost!.toLocaleString("ru-RU")}
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
        ) : !ec ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 text-center">
            <p className="text-2xl mb-1">📋</p>
            <p className="text-sm text-[#8899aa]">
              Стоимость рассчитает менеджер индивидуально
            </p>
          </div>
        ) : null}

        {/* P&L table */}
        {ec && (
          <div className="mb-4 rounded-xl border border-[#243a5e] overflow-hidden">
            <div className="px-4 py-2 bg-[#0B1F3A] border-b border-[#243a5e]">
              <p className="text-xs font-semibold text-[#8899aa] uppercase tracking-wide">
                Юнит-экономика · {ec.quantity} шт
              </p>
            </div>
            {(
              [
                ["🛍️ Закупка",          `${fmt(ec.purchase_total_rub)} ₽`],
                ["🚢 Доставка",          ec.delivery_total_rub > 0 ? `${fmt(ec.delivery_total_rub)} ₽` : "Уточняется"],
                ["🏛️ Таможня (~20%)",   `${fmt(ec.customs_rub)} ₽`],
                ec.other_costs_rub > 0
                  ? (["📦 Прочие расходы",  `${fmt(ec.other_costs_rub)} ₽`] as [string, string])
                  : null,
                ["💰 Себестоимость",    `${fmt(ec.total_cost_rub)} ₽`],
                ["🏷️ Цена ед. затрат", `${fmt(ec.unit_cost_rub)} ₽/шт`],
                ["💵 Цена продажи",    `${fmt(ec.sale_price_rub)} ₽/шт`],
                ["🏪 Комиссия",        ec.marketplace_fee_rub > 0 ? `−${fmt(ec.marketplace_fee_rub)} ₽` : "0 ₽"],
                ec.ad_cost_rub > 0
                  ? (["📣 Реклама", `−${fmt(ec.ad_cost_rub)} ₽`] as [string, string])
                  : null,
              ] as ([string, string] | null)[]
            )
              .filter((r): r is [string, string] => r !== null)
              .map(([l, v]) => (
                <div
                  key={l}
                  className="flex justify-between px-4 py-2 text-sm border-b border-[#243a5e]/50 last:border-0"
                >
                  <span className="text-[#8899aa]">{l}</span>
                  <span className="text-white font-medium">{v}</span>
                </div>
              ))}
            <div
              className={`flex justify-between px-4 py-3 text-sm font-bold ${
                ec.net_profit_rub >= 0
                  ? "bg-emerald-900/20 text-emerald-400"
                  : "bg-red-900/20 text-red-400"
              }`}
            >
              <span>🎯 Чистая прибыль</span>
              <span>
                {ec.net_profit_rub >= 0 ? "+" : ""}
                {fmt(ec.net_profit_rub)} ₽ · {ec.margin_pct.toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* CTAs */}
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
            setEco(initialEco);
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

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="card-glass rounded-2xl p-6 md:p-8">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3, 4, 5].map(n => (
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
                className={`w-6 sm:w-8 h-0.5 mb-4 ${n < step ? "bg-[#00A86B]" : "bg-[#243a5e]"}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="mb-8">

        {/* ── Step 1: Товар ── */}
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
                onChange={e => set("product_name", e.target.value)}
                placeholder='Например: велосипеды горные 26"'
                className={inp(!!errors.product_name)}
              />
              {errors.product_name && (
                <p className="text-xs text-red-400 mt-1">{errors.product_name}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Категория</label>
              <select
                value={formData.category}
                onChange={e => set("category", e.target.value)}
                className={sel}
              >
                <option value="">Выберите категорию</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
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
                onChange={e => set("product_link", e.target.value)}
                placeholder="Ссылка с 1688, Alibaba или Taobao"
                className={inp()}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Количество</label>
              <input
                type="text"
                value={formData.quantity}
                onChange={e => set("quantity", e.target.value)}
                placeholder="100 шт."
                className={inp()}
              />
            </div>

            {/* ── Юнит-экономика (optional) ── */}
            <div className="border border-[#243a5e] rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setEcoOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">📊</span>
                  <span className="text-white font-medium">Юнит-экономика</span>
                  <span className="text-[10px] px-2 py-0.5 bg-[#00A86B]/20 text-[#00A86B] rounded-full font-medium">
                    AI анализ
                  </span>
                </div>
                <span className="text-[#8899aa] text-xs">
                  {ecoOpen ? "▲ скрыть" : "▼ развернуть"}
                </span>
              </button>

              {ecoOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-[#243a5e]">
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
                    <p className="text-[#8899aa] text-[11px]">
                      🆓 <span className="text-white font-medium">2 AI-расчёта в день</span> бесплатно ·{" "}
                      <a href="/signup" className="text-[#00A86B] hover:underline">
                        Зарегистрируйтесь
                      </a>{" "}
                      для неограниченного доступа
                    </p>
                    <a
                      href="/#services"
                      className="text-[11px] px-2.5 py-1 bg-[#00A86B]/10 border border-[#00A86B]/30 text-[#00A86B] rounded-lg hover:bg-[#00A86B]/20 transition-all whitespace-nowrap"
                    >
                      Заказать расчёт у менеджера →
                    </a>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#8899aa] block mb-1.5">
                      Цена закупки за единицу *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={eco.unit_price}
                        onChange={e => setE("unit_price", e.target.value)}
                        placeholder="15.5"
                        className="flex-1 px-3.5 py-2.5 bg-[#0B1F3A] border border-[#243a5e] rounded-xl text-sm text-white placeholder:text-[#8899aa] outline-none focus:border-[#00A86B]/60 transition-colors"
                      />
                      <select
                        value={eco.price_currency}
                        onChange={e => setE("price_currency", e.target.value)}
                        className="px-3 py-2.5 bg-[#0B1F3A] border border-[#243a5e] rounded-xl text-sm text-white outline-none focus:border-[#00A86B]/60"
                      >
                        <option value="CNY">CNY ¥</option>
                        <option value="USD">USD $</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#8899aa] block mb-1.5">
                      Цена продажи, ₽/шт *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={eco.sale_price}
                        onChange={e => setE("sale_price", e.target.value)}
                        placeholder="2500"
                        className="w-full px-3.5 py-2.5 pr-8 bg-[#0B1F3A] border border-[#243a5e] rounded-xl text-sm text-white placeholder:text-[#8899aa] outline-none focus:border-[#00A86B]/60 transition-colors"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8899aa] text-sm">
                        ₽
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#8899aa] block mb-1.5">
                      Площадка продаж
                    </label>
                    <select
                      value={eco.marketplace}
                      onChange={e => {
                        const mp = e.target.value;
                        setEco(prev => ({
                          ...prev,
                          marketplace: mp,
                          commission: MARKETPLACE_COMMISSIONS[mp] ?? prev.commission,
                        }));
                      }}
                      className={sel}
                    >
                      <option>Wildberries</option>
                      <option>Ozon</option>
                      <option>Другое</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#8899aa] block mb-1.5">
                      Комиссия маркетплейса, %
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={eco.commission}
                        onChange={e => setE("commission", e.target.value)}
                        placeholder="15"
                        className="w-full px-3.5 py-2.5 pr-8 bg-[#0B1F3A] border border-[#243a5e] rounded-xl text-sm text-white placeholder:text-[#8899aa] outline-none focus:border-[#00A86B]/60 transition-colors"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8899aa] text-sm">
                        %
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#8899aa] block mb-1.5">
                      Рекламный бюджет, ₽ (необязательно)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={eco.ad_spend}
                        onChange={e => setE("ad_spend", e.target.value)}
                        placeholder="5000"
                        className="w-full px-3.5 py-2.5 pr-8 bg-[#0B1F3A] border border-[#243a5e] rounded-xl text-sm text-white placeholder:text-[#8899aa] outline-none focus:border-[#00A86B]/60 transition-colors"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8899aa] text-sm">
                        ₽
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 2: Груз ── */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white mb-1">Шаг 2 — Параметры груза</h2>
            <div>
              <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Вес</label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.weight_kg}
                  onChange={e => set("weight_kg", e.target.value)}
                  placeholder="300"
                  className="w-full px-3.5 py-2.5 pr-12 bg-[#0B1F3A] border border-[#243a5e] rounded-xl text-sm text-white placeholder:text-[#8899aa] outline-none focus:border-[#00A86B]/60 transition-colors"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8899aa] text-sm">кг</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Объём</label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.volume_m3}
                  onChange={e => set("volume_m3", e.target.value)}
                  placeholder="1.5"
                  step="0.1"
                  className="w-full px-3.5 py-2.5 pr-12 bg-[#0B1F3A] border border-[#243a5e] rounded-xl text-sm text-white placeholder:text-[#8899aa] outline-none focus:border-[#00A86B]/60 transition-colors"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8899aa] text-sm">м³</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Количество мест</label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.packages_count}
                  onChange={e => set("packages_count", e.target.value)}
                  placeholder="10"
                  className="w-full px-3.5 py-2.5 pr-16 bg-[#0B1F3A] border border-[#243a5e] rounded-xl text-sm text-white placeholder:text-[#8899aa] outline-none focus:border-[#00A86B]/60 transition-colors"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8899aa] text-sm">мест</span>
              </div>
            </div>
            <p className="text-xs text-[#8899aa]">
              💡 Укажите хотя бы один параметр для точного расчёта
            </p>
          </div>
        )}

        {/* ── Step 3: Маршрут ── */}
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
              <select
                value={formData.city_from}
                onChange={e => set("city_from", e.target.value)}
                className={sel}
              >
                <option value="">Выберите город</option>
                {CITIES_FROM.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Страна назначения</label>
              <select
                value={formData.country_to}
                onChange={e => set("country_to", e.target.value)}
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
                onChange={e => set("city_to", e.target.value)}
                placeholder="Москва"
                className={inp(!!errors.city_to)}
              />
              {errors.city_to && (
                <p className="text-xs text-red-400 mt-1">{errors.city_to}</p>
              )}
            </div>
          </div>
        )}

        {/* ── Step 4: Услуга ── */}
        {step === 4 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white mb-1">Шаг 4 — Услуга</h2>
            <p className="text-sm text-[#8899aa]">Выберите нужную услугу:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SERVICE_TYPES.map(st => (
                <button
                  key={st}
                  onClick={() => set("service_type", st)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    formData.service_type === st
                      ? "border-[#00A86B] bg-[#00A86B]/10"
                      : "border-[#243a5e] hover:border-[#00A86B]/40 hover:bg-white/5"
                  }`}
                >
                  <div className="font-semibold text-white text-sm mb-1">{SERVICE_LABELS[st]}</div>
                  <div className="text-[#8899aa] text-xs">{SERVICE_DESCRIPTIONS[st]}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 5: Контакты ── */}
        {step === 5 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white mb-1">Шаг 5 — Контакты</h2>
            <div>
              <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Имя *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => set("name", e.target.value)}
                placeholder="Ваше имя"
                className={inp(!!errors.name)}
              />
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Телефон *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => set("phone", e.target.value)}
                placeholder="+7 (777) 000-00-00"
                className={inp(!!errors.phone)}
              />
              {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Telegram</label>
              <input
                type="text"
                value={formData.telegram}
                onChange={e => set("telegram", e.target.value)}
                placeholder="@username"
                className={inp()}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => set("email", e.target.value)}
                placeholder="email@example.com"
                className={inp()}
              />
            </div>
            {hasEco && (
              <div className="bg-[#00A86B]/10 border border-[#00A86B]/30 rounded-xl p-3 text-xs text-[#00A86B]">
                🤖 AI рассчитает юнит-экономику для «{formData.product_name}»
              </div>
            )}
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
          ) : hasEco ? (
            <>🤖 AI Расчёт <ChevronRight className="w-4 h-4" /></>
          ) : (
            <>Получить расчёт <ChevronRight className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </div>
  );
}
