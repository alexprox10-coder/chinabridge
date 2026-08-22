"use client";
import { useState, useRef, useEffect } from "react";
import { analytics } from "@/lib/analytics";
import { MARKETPLACES, detectCommissionPct } from "@/lib/economics/marketplaces";
import type {
  EconomicsResult,
  EconomicsScenario,
  ProductScore,
  SupplierRiskResult,
  TargetPrice,
} from "@/lib/calculator/types";

// ── Types ──────────────────────────────────────────────────────────────────────

// "product" step — fallback only when AI extraction fails
type Step = "input" | "analyzing" | "product" | "marketplace" | "calculating" | "preview" | "contact" | "success";

interface ProductData {
  product_name:   string;
  unit_price_cny: string;
  sale_price:     string;
  quantity:       string;
  weight_kg:      string;
  product_link:   string;
  price_currency: "CNY" | "USD";
}

interface ExtractedProduct {
  product_name:    string;
  product_name_cn?: string;
  product_name_en?: string;
  unit_price_cny:  number | null;
  weight_kg:       number | null;
  moq:             number | null;
  price_currency:  "CNY" | "USD";
  product_link:    string;
  source_platform: string;
  confidence: {
    product_name?: number;
    price?:        number;
    weight?:       number;
    moq?:          number;
    overall?:      "high" | "medium" | "low";
  };
}

interface CorrectionData {
  product_name:   string;
  unit_price_cny: string;
  sale_price:     string;
  weight_kg:      string;
  quantity:       string;
  price_currency: "CNY" | "USD";
}

interface FunnelState {
  step:              Step;
  urlInput:          string;
  descInput:         string;
  // Manual fallback form
  product:           ProductData;
  // AI-extracted data (null = came through manual path)
  extractedData:     ExtractedProduct | null;
  // Sale price shown in marketplace step
  salePrice:         string;
  marketplace:       string;
  city_to:           string;
  // Contact
  name:              string;
  phone:             string;
  telegram:          string;
  whatsapp:          string;
  email:             string;
  // Result
  economics:         EconomicsResult | null;
  delivery:          { hasRate: boolean; deliveryRub: number; daysMin?: number; daysMax?: number; pricingRule?: string } | null;
  marketplace_config: { id: string; label: string; tariff_date: string; commission_note: string } | null;
  leadId:            string | null;
  error:             string | null;
  scrapeError:       string | null; // structured error code from API
  priority:          "HOT" | "WARM" | "COLD" | null;
  activeScenario:    "conservative" | "base" | "optimistic";
  // Correction accordion
  showCorrection:    boolean;
  correction:        CorrectionData;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const CITY_CHIPS = ["Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Алматы", "Астана"];

const QUICK_EXAMPLES = [
  { emoji: "👟", label: "Кроссовки",    product_name: "Кроссовки",          product_name_cn: "运动鞋",   product_name_en: "sneakers",            unit_price_cny: 80,  weight_kg: 0.8,  moq: 10 },
  { emoji: "👗", label: "Одежда",       product_name: "Одежда",              product_name_cn: "服装",     product_name_en: "clothing",            unit_price_cny: 35,  weight_kg: 0.3,  moq: 50 },
  { emoji: "🎧", label: "Наушники TWS", product_name: "Наушники TWS",        product_name_cn: "蓝牙耳机", product_name_en: "bluetooth earphones", unit_price_cny: 45,  weight_kg: 0.15, moq: 20 },
  { emoji: "🧸", label: "Игрушки",      product_name: "Детские игрушки",     product_name_cn: "儿童玩具", product_name_en: "children toys",       unit_price_cny: 25,  weight_kg: 0.4,  moq: 20 },
];

const ANON_LIMIT = 999; // расчёты бесплатны — цель вытянуть на услуги
const REG_LIMIT  = 999;

// Analyzing stages — real stages that match backend process
const ANALYZE_STAGES = [
  { icon: "🔎", text: "Открываем страницу товара..." },
  { icon: "📋", text: "Определяем название и цену..." },
  { icon: "🏭", text: "Анализируем поставщика..." },
  { icon: "⚡", text: "Подготавливаем данные для расчёта..." },
];

// Approximate CNY→RUB for sale price estimation (real rate comes from API)
const EST_CNY_RATE    = 12.5;
const MARKUP_MULTIPLE = 2.5;

function estimateSalePrice(cny: number | null): string {
  if (!cny) return "";
  return String(Math.round(cny * EST_CNY_RATE * MARKUP_MULTIPLE));
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmt = (n: number) => Math.round(n).toLocaleString("ru-RU");
const inp = (err?: boolean) =>
  `w-full px-4 py-3 bg-[#0B1F3A] border rounded-xl text-sm placeholder:text-[#8899aa] outline-none transition-colors text-white ${
    err ? "border-red-500/60" : "border-[#243a5e] focus:border-[#00A86B]/60"
  }`;

function verdictColor(v?: "green" | "yellow" | "red") {
  return v === "green"  ? "text-emerald-400" :
         v === "yellow" ? "text-amber-400"   : "text-red-400";
}
function verdictBg(v?: "green" | "yellow" | "red") {
  return v === "green"  ? "bg-emerald-900/20 border-emerald-700/40" :
         v === "yellow" ? "bg-amber-900/20 border-amber-700/40"     :
                          "bg-red-900/20 border-red-700/40";
}

// ── Sub-components (unchanged from v1.0) ──────────────────────────────────────

function ScoreBar({ label, score, max }: { label: string; score: number; max: number }) {
  const pct   = Math.min(100, (score / max) * 100);
  const color = pct >= 67 ? "#00A86B" : pct >= 34 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 text-[#8899aa] shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-[#243a5e] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="w-10 text-right text-white font-medium">{score.toFixed(1)}/{max}</span>
    </div>
  );
}

function ProductScoreCard({ ps }: { ps: ProductScore }) {
  const color = ps.total >= 7 ? "text-emerald-400" : ps.total >= 4 ? "text-amber-400" : "text-red-400";
  return (
    <div className="rounded-xl border border-[#243a5e] overflow-hidden">
      <div className="px-4 py-3 bg-[#0B1F3A] border-b border-[#243a5e] flex items-center justify-between">
        <p className="text-xs font-semibold text-[#8899aa] uppercase tracking-wide">Product Score</p>
        <span className={`text-xl font-bold ${color}`}>{ps.total.toFixed(1)}<span className="text-sm text-[#8899aa] font-normal"> / 10</span></span>
      </div>
      <div className="px-4 py-3 flex flex-col gap-2">
        <p className="text-xs text-[#8899aa] mb-1">{ps.label} — {ps.explanation}</p>
        <ScoreBar label="Маржа (30%)"     score={ps.margin_score}    max={3}   />
        <ScoreBar label="ROI (20%)"       score={ps.roi_score}       max={2}   />
        <ScoreBar label="Цена (15%)"      score={ps.price_score}     max={1.5} />
        <ScoreBar label="Логистика (15%)" score={ps.logistics_score} max={1.5} />
        <ScoreBar label="Поставщик (10%)" score={ps.supplier_score}  max={1}   />
        <ScoreBar label="MOQ (10%)"       score={ps.moq_score}       max={1}   />
      </div>
    </div>
  );
}

function SupplierRiskBadge({ sr }: { sr: SupplierRiskResult }) {
  const bg = sr.level === "low"    ? "bg-emerald-900/20 border-emerald-700/30 text-emerald-400"
           : sr.level === "medium" ? "bg-amber-900/20 border-amber-700/30 text-amber-400"
                                   : "bg-red-900/20 border-red-700/30 text-red-400";
  return (
    <div className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${bg}`}>
      <span className="text-2xl leading-none">{sr.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">Риск поставщика: {sr.label}</p>
        <ul className="mt-1 space-y-0.5">
          {sr.factors.map((f, i) => <li key={i} className="text-xs opacity-80">• {f}</li>)}
        </ul>
      </div>
    </div>
  );
}

function TargetPriceCard({ tp, currency }: { tp: TargetPrice; currency: "CNY" | "USD" }) {
  return (
    <div className="rounded-xl border border-[#243a5e] overflow-hidden">
      <div className="px-4 py-2 bg-[#0B1F3A] border-b border-[#243a5e]">
        <p className="text-xs font-semibold text-[#8899aa] uppercase tracking-wide">
          Целевые цены <span className="normal-case">(маржа {tp.target_margin_pct}%)</span>
        </p>
      </div>
      <div className="divide-y divide-[#243a5e]/40">
        <div className="flex justify-between px-4 py-2.5 text-sm">
          <span className="text-[#8899aa]">Макс. закупочная цена</span>
          <span className="font-semibold text-white">{tp.max_purchase_price_cny.toFixed(1)} {currency} · {fmt(tp.max_purchase_price_rub)} ₽</span>
        </div>
        <div className="flex justify-between px-4 py-2.5 text-sm">
          <span className="text-[#8899aa]">Мин. цена продажи</span>
          <span className="font-semibold text-white">{fmt(tp.min_sale_price_rub)} ₽</span>
        </div>
        <div className="flex justify-between px-4 py-2.5 text-sm">
          <span className="text-[#8899aa]">Цель достижима?</span>
          <span className={`font-semibold ${tp.current_is_achievable ? "text-emerald-400" : "text-red-400"}`}>
            {tp.current_is_achievable ? "✅ Да" : "❌ Нет — нужна оптимизация"}
          </span>
        </div>
      </div>
    </div>
  );
}

function ScenariosBlock({
  scenarios, active, onSwitch,
}: {
  scenarios: EconomicsScenario[];
  active: "conservative" | "base" | "optimistic";
  onSwitch: (s: "conservative" | "base" | "optimistic") => void;
}) {
  const cur  = scenarios.find(s => s.name === active) ?? scenarios[1];
  const tabs: Array<{ key: EconomicsScenario["name"]; label: string }> = [
    { key: "conservative", label: "Осторожный"    },
    { key: "base",         label: "Базовый"       },
    { key: "optimistic",   label: "Оптимистичный" },
  ];
  return (
    <div className="rounded-xl border border-[#243a5e] overflow-hidden">
      <div className="flex border-b border-[#243a5e]">
        {tabs.map(t => (
          <button key={t.key}
            onClick={() => { onSwitch(t.key); analytics.scenarioSwitched({ scenario: t.key }); }}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              active === t.key ? "bg-[#00A86B]/10 text-[#00A86B] border-b-2 border-[#00A86B]" : "text-[#8899aa] hover:text-white"
            }`}
          >{t.label}</button>
        ))}
      </div>
      <div className="px-4 py-3">
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="text-center">
            <p className="text-[10px] text-[#8899aa] uppercase">Маржа</p>
            <p className={`font-bold text-base ${verdictColor(cur.verdict)}`}>{cur.margin_pct.toFixed(1)}%</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-[#8899aa] uppercase">ROI</p>
            <p className="font-bold text-base text-white">{cur.roi_pct.toFixed(0)}%</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-[#8899aa] uppercase">Прибыль</p>
            <p className={`font-bold text-base ${cur.net_profit_rub >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {cur.net_profit_rub >= 0 ? "+" : ""}{fmt(cur.net_profit_rub)} ₽
            </p>
          </div>
        </div>
        <div className="flex justify-between text-xs text-[#8899aa]">
          <span>Цена продажи: {fmt(cur.sale_price_rub)} ₽</span>
          <span>Себест.: {fmt(cur.unit_cost_rub)} ₽/ед</span>
        </div>
      </div>
    </div>
  );
}

function PnlTable({ ec, delivery, mpLabel, tariffDate, commissionNote, isKZ }: {
  ec: EconomicsResult;
  delivery: FunnelState["delivery"];
  mpLabel?: string;
  tariffDate?: string;
  commissionNote?: string;
  isKZ?: boolean;
}) {
  const deliveryLabel = delivery?.pricingRule === 'estimate_4usd_kg'
    ? `${fmt(ec.delivery_total_rub)} ₽ (~4$/кг)`
    : `${fmt(ec.delivery_total_rub)} ₽`;
  const rows: Array<[string, string, boolean?]> = [
    ["🛍️ Закупочная цена (всего)",     `${fmt(ec.purchase_total_rub)} ₽`],
    ["🚢 Международная доставка",        deliveryLabel],
    ...(isKZ
      ? [] as Array<[string, string, boolean?]>
      : [["🏛️ Таможня (~20% от закупки)", `${fmt(ec.customs_rub)} ₽`] as [string, string]]),
    ["🏪 Логистика МП (FBW/FBO)",        `${fmt(ec.marketplace_logistics_rub)} ₽`],
    [`💳 Комиссия ${mpLabel ?? "МП"}`,   `${fmt(ec.marketplace_fee_rub)} ₽`],
    ["📣 Реклама",                        ec.ad_cost_rub > 0 ? `${fmt(ec.ad_cost_rub)} ₽` : "не задана"],
    ["🧾 Прочие расходы",                 ec.other_costs_rub > 0 ? `${fmt(ec.other_costs_rub)} ₽` : "—"],
    ["📦 Итого себестоимость",            `${fmt(ec.total_cost_rub)} ₽`, true],
    [`💵 Выручка (${ec.quantity} шт)`,   `${fmt(ec.gross_revenue_rub)} ₽`],
  ];
  return (
    <div className="rounded-xl border border-[#243a5e] overflow-hidden text-sm">
      <div className="px-4 py-2 bg-[#0B1F3A] border-b border-[#243a5e] flex items-center justify-between flex-wrap gap-1">
        <p className="text-xs font-semibold text-[#8899aa] uppercase tracking-wide">
          P&amp;L · {ec.quantity} шт · курс {ec.cny_rate.toFixed(1)} ₽/¥
        </p>
        {tariffDate && (
          <span className="text-[10px] text-[#8899aa] border border-[#243a5e] rounded px-1.5 py-0.5">
            тарифы от {tariffDate}
          </span>
        )}
      </div>
      {rows.map(([l, v, bold]) => (
        <div key={l as string} className={`flex justify-between px-4 py-2 border-b border-[#243a5e]/40 last:border-0 ${bold ? "bg-[#0B1F3A]" : ""}`}>
          <span className={bold ? "font-semibold text-white" : "text-[#8899aa]"}>{l}</span>
          <span className={bold ? "font-bold text-white" : "text-white font-medium"}>{v}</span>
        </div>
      ))}
      <div className={`flex justify-between px-4 py-3 font-bold text-sm ${
        ec.net_profit_rub >= 0 ? "bg-emerald-900/20 text-emerald-400" : "bg-red-900/20 text-red-400"
      }`}>
        <span>🎯 Чистая прибыль</span>
        <span>{ec.net_profit_rub >= 0 ? "+" : ""}{fmt(ec.net_profit_rub)} ₽ · {ec.margin_pct.toFixed(1)}%</span>
      </div>
      {commissionNote && (
        <p className="px-4 py-2 text-[10px] text-[#8899aa] border-t border-[#243a5e]/40">ℹ️ {commissionNote}</p>
      )}
    </div>
  );
}

// ── Correction Accordion ──────────────────────────────────────────────────────

function CorrectionAccordion({
  open, correction, onToggle, onChange, onRecalculate,
}: {
  open:          boolean;
  correction:    CorrectionData;
  onToggle:      () => void;
  onChange:      (k: keyof CorrectionData, v: string) => void;
  onRecalculate: () => void;
}) {
  const ci = (err?: boolean) =>
    `w-full px-3 py-2.5 bg-[#060f1e] border rounded-xl text-xs placeholder:text-[#8899aa] outline-none transition-colors text-white ${
      err ? "border-red-500/60" : "border-[#243a5e] focus:border-[#00A86B]/60"
    }`;
  return (
    <div className="rounded-xl border border-[#243a5e] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-[#8899aa] hover:text-white transition-colors"
      >
        <span className="flex items-center gap-2">
          <span>⚙️</span>
          <span>Проверить исходные данные</span>
        </span>
        <span className={`transition-transform text-xs ${open ? "rotate-180" : ""}`}>▼</span>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-[#243a5e]/60">
          <p className="text-xs text-[#8899aa] mt-3 mb-3">Измените параметры и нажмите «Пересчитать»</p>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-[10px] font-medium text-[#8899aa] block mb-1">Название товара</label>
              <input type="text" value={correction.product_name}
                onChange={e => onChange("product_name", e.target.value)} className={ci()} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-medium text-[#8899aa] block mb-1">Закупочная цена</label>
                <div className="flex gap-1">
                  <input type="number" value={correction.unit_price_cny}
                    onChange={e => onChange("unit_price_cny", e.target.value)} placeholder="38" className={`flex-1 ${ci()}`} />
                  <select value={correction.price_currency}
                    onChange={e => onChange("price_currency", e.target.value)}
                    className="px-1.5 py-2 bg-[#060f1e] border border-[#243a5e] rounded-xl text-xs text-white outline-none">
                    <option value="CNY">¥</option>
                    <option value="USD">$</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-medium text-[#8899aa] block mb-1">Цена продажи, ₽</label>
                <input type="number" value={correction.sale_price}
                  onChange={e => onChange("sale_price", e.target.value)} placeholder="1990" className={ci()} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-medium text-[#8899aa] block mb-1">Вес, кг/ед</label>
                <input type="number" value={correction.weight_kg}
                  onChange={e => onChange("weight_kg", e.target.value)} placeholder="0.5" step="0.1" className={ci()} />
              </div>
              <div>
                <label className="text-[10px] font-medium text-[#8899aa] block mb-1">Количество, шт</label>
                <input type="number" value={correction.quantity}
                  onChange={e => onChange("quantity", e.target.value)} placeholder="100" className={ci()} />
              </div>
            </div>
          </div>
          <button
            onClick={onRecalculate}
            className="w-full mt-3 py-2.5 bg-[#00A86B] hover:bg-[#008f59] text-white font-semibold rounded-xl transition-all text-sm"
          >
            🔄 Пересчитать
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

const EMPTY_PRODUCT: ProductData = {
  product_name: "", unit_price_cny: "", sale_price: "", quantity: "1",
  weight_kg: "", product_link: "", price_currency: "CNY",
};

const EMPTY_CORRECTION: CorrectionData = {
  product_name: "", unit_price_cny: "", sale_price: "",
  weight_kg: "", quantity: "1", price_currency: "CNY",
};

export default function AIEconomicsFunnel() {
  const startedRef    = useRef(false);
  const handleCalcRef = useRef<(() => Promise<void>) | null>(null);

  const [s, setS] = useState<FunnelState>({
    step:              "input",
    urlInput:          "",
    descInput:         "",
    product:           EMPTY_PRODUCT,
    extractedData:     null,
    salePrice:         "",
    marketplace:       "wb",
    city_to:           "Москва",
    name:              "",
    phone:             "",
    telegram:          "",
    whatsapp:          "",
    email:             "",
    economics:         null,
    delivery:          null,
    marketplace_config: null,
    leadId:            null,
    error:             null,
    scrapeError:       null,
    priority:          null,
    activeScenario:    "base",
    showCorrection:    false,
    correction:        EMPTY_CORRECTION,
  });

  // UI-only state
  const [stageIdx,       setStageIdx]       = useState(0);
  const [allStagesDone,  setAllStagesDone]  = useState(false);
  const [autoCountdown,  setAutoCountdown]  = useState<number | null>(null);
  const [calcCount,       setCalcCount]       = useState(0);
  const [isRegistered,    setIsRegistered]    = useState(false);
  const [showRegGate,     setShowRegGate]     = useState(false);
  const [showPaywall,     setShowPaywall]     = useState(false);
  const [regName,         setRegName]         = useState("");
  const [regTelegram,     setRegTelegram]     = useState("");
  const [regSubmitting,   setRegSubmitting]   = useState(false);
  const [calcAfterReg,    setCalcAfterReg]    = useState(false);

  // Load usage counters from localStorage on mount (reset=1 clears state)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('reset') === '1') {
      localStorage.removeItem('cb_calc_uses');
      localStorage.removeItem('cb_registered');
      window.history.replaceState({}, '', window.location.pathname);
    }
    // Daily reset: stored as JSON {count, date}
    const today = new Date().toISOString().slice(0, 10);
    try {
      const raw = localStorage.getItem('cb_calc_uses');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.date === today && typeof parsed?.count === 'number') {
          if (parsed.count > 0) setCalcCount(parsed.count);
        } else {
          localStorage.removeItem('cb_calc_uses'); // stale day → reset
        }
      }
    } catch {
      localStorage.removeItem('cb_calc_uses');
    }
    if (localStorage.getItem('cb_registered') === 'true') setIsRegistered(true);
  }, []);

  // After registration — auto-resume pending calculation
  useEffect(() => {
    if (!isRegistered || !calcAfterReg) return;
    setCalcAfterReg(false);
    setShowRegGate(false);
    // handleCalcRef.current is now updated with isRegistered=true
    handleCalcRef.current?.();
  }, [isRegistered, calcAfterReg]);

  // Advance analyzing stages every 2.5s (time-based, not marking done until API responds)
  useEffect(() => {
    if (s.step !== "analyzing") { setStageIdx(0); setAllStagesDone(false); return; }
    const id = setInterval(() => setStageIdx(p => Math.min(p + 1, ANALYZE_STAGES.length - 1)), 2500);
    return () => clearInterval(id);
  }, [s.step]);

  // Track funnel step entry for analytics
  useEffect(() => {
    if (s.step === "preview" && ec) analytics.aiFunnelPreviewShown({ verdict: ec.verdict });
    if (s.step === "contact")      analytics.aiFunnelContactOpen();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.step]);

  const go = (step: Step, extra?: Partial<FunnelState>) =>
    setS(p => ({ ...p, step, error: null, ...extra }));

  const setProduct    = (k: keyof ProductData,    v: string) => setS(p => ({ ...p, product:    { ...p.product,    [k]: v } }));
  const setCorrection = (k: keyof CorrectionData, v: string) => setS(p => ({ ...p, correction: { ...p.correction, [k]: v } }));

  // ── Calculation helper (shared by auto and manual) ─────────────────────────

  async function handleCalculate() {

    const ed = s.extractedData;
    const unitPrice  = ed ? ((ed.unit_price_cny  ?? parseFloat(s.product.unit_price_cny)) || 0)
                           : parseFloat(s.product.unit_price_cny) || 0;
    const salePriceN = parseFloat(s.salePrice) || parseFloat(s.product.sale_price) || 0;
    const currency   = ed ? ed.price_currency         : s.product.price_currency;
    const pName      = ed ? ed.product_name           : s.product.product_name;
    const weightKg   = ed ? (ed.weight_kg ?? undefined) : (s.product.weight_kg ? parseFloat(s.product.weight_kg) : undefined);
    const moq        = ed ? (ed.moq ?? undefined)     : undefined;
    const qty        = parseInt(s.product.quantity) || 1;

    analytics.unitEconomicsAutoStarted();
    analytics.aiFunnelMpSelected({ marketplace: s.marketplace });
    analytics.marketplaceSelected({ marketplace: s.marketplace });
    if (s.city_to) analytics.destinationSelected({ city: s.city_to });
    analytics.fullCalculationStarted();

    go("calculating");

    const commissionPct = detectCommissionPct(
      s.marketplace,
      pName,
      ed?.product_name_en ?? undefined,
      ed?.product_name_cn ?? undefined,
    );

    try {
      const res  = await fetch("/api/ai-funnel/preview", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit_price:     unitPrice,
          price_currency: currency,
          sale_price:     salePriceN,
          quantity:       qty,
          marketplace:    s.marketplace,
          city_to:        s.city_to,
          weight_kg:      weightKg,
          product_name:   pName,
          commission_pct: commissionPct,
          moq,
        }),
      });
      const data = await res.json();

      if (!data.ok) {
        go("preview", { error: data.message ?? "Ошибка расчёта" });
        return;
      }

      analytics.unitEconomicsAutoCompleted({ verdict: data.economics?.verdict, score: data.economics?.product_score?.total });
      analytics.fullCalculationCompleted({ verdict: data.economics?.verdict, score: data.economics?.product_score?.total });

      const corr: CorrectionData = {
        product_name:   pName,
        unit_price_cny: String(unitPrice),
        sale_price:     String(salePriceN),
        weight_kg:      weightKg ? String(weightKg) : "",
        quantity:       String(qty),
        price_currency: currency,
      };

      const newCount = calcCount + 1;
      setCalcCount(newCount);
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem('cb_calc_uses', JSON.stringify({ count: newCount, date: today }));

      go("preview", {
        economics:          data.economics,
        delivery:           data.delivery,
        priority:           data.priority,
        marketplace_config: data.marketplace_config,
        activeScenario:     "base",
        showCorrection:     false,
        correction:         corr,
      });
    } catch {
      go("preview", { error: "Ошибка сети. Попробуйте ещё раз." });
    }
  }

  // Store latest handleCalculate in ref (prevents stale closures in useEffect)
  handleCalcRef.current = handleCalculate;

  // Auto-trigger in marketplace step (2s debounce on marketplace/city/salePrice)
  useEffect(() => {
    if (s.step !== "marketplace") { setAutoCountdown(null); return; }
    const sale = parseFloat(s.salePrice) || parseFloat(s.product.sale_price);
    if (!sale || sale <= 0) { setAutoCountdown(null); return; }

    // Don't auto-trigger when going back from preview — user wants to change marketplace manually
    if (s.economics) { setAutoCountdown(null); return; }

    setAutoCountdown(2);
    const t1 = setTimeout(() => setAutoCountdown(1), 1000);
    const t2 = setTimeout(() => { setAutoCountdown(null); handleCalcRef.current?.(); }, 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); setAutoCountdown(null); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.step, s.marketplace, s.city_to, s.salePrice, s.product.sale_price, calcCount, isRegistered]);

  // ── URL / Description submit ────────────────────────────────────────────────

  async function handleUrlSubmit() {
    if (!startedRef.current) { analytics.aiFunnelStart(); analytics.unitEconomicsOpen(); startedRef.current = true; }
    const url = s.urlInput.trim();

    if (url) {
      analytics.aiFunnelUrlEntered();
      analytics.productUrlEntered();
      analytics.productUrlSubmitted();
      analytics.productScrapeStarted();
      analytics.productAnalysisStarted();
      go("analyzing");

      try {
        const res  = await fetch("/api/ai-funnel/analyze-url", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();

        if (data.ok && data.data) {
          const parsed: ExtractedProduct = {
            product_name:    data.data.product_name   ?? "",
            unit_price_cny:  data.data.unit_price_cny ?? null,
            weight_kg:       data.data.weight_kg       ?? null,
            moq:             data.data.moq             ?? null,
            price_currency:  "CNY",
            product_link:    url,
            source_platform: data.data.source_platform ?? "unknown",
            confidence:      data.data.confidence      ?? {},
          };

          const overall = data.data.confidence?.overall ?? "medium";
          analytics.productScrapeSuccess({ platform: parsed.source_platform });
          analytics.aiFunnelAnalyzed({ confidence: overall });
          analytics.productAnalysisCompleted({ confidence: overall });

          // Determine if extraction is partial (missing price)
          if (!parsed.unit_price_cny) {
            analytics.productExtractionPartial({ missing: "price" });
          } else {
            analytics.productExtractionSuccess({ confidence: overall });
          }

          const estimated = estimateSalePrice(parsed.unit_price_cny);

          // ✅ Skip "product" step — go directly to marketplace
          setAllStagesDone(true);
          setTimeout(() => {
            setAllStagesDone(false);
            go("marketplace", { extractedData: parsed, salePrice: estimated });
          }, 400);

        } else {
          // Firecrawl failed → manual fallback
          analytics.productScrapeFailed({ reason: data.reason ?? "unknown" });
          go("product", {
            product:     { ...EMPTY_PRODUCT, product_link: url },
            scrapeError: data.code ?? data.reason ?? null,
            error:       null,
          });
        }
      } catch {
        analytics.productScrapeFailed({ reason: "network_error" });
        go("product", {
          product:     { ...EMPTY_PRODUCT, product_link: url },
          scrapeError: "NETWORK_ERROR",
          error:       null,
        });
      }
    } else if (s.descInput.trim()) {
      analytics.aiFunnelDescEntered();
      go("analyzing");

      try {
        const res  = await fetch("/api/ai-funnel/analyze-text", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: s.descInput.trim() }),
        });
        const data = await res.json();

        if (data.ok && data.data) {
          const parsed: ExtractedProduct = {
            product_name:    data.data.product_name    ?? s.descInput.trim(),
            product_name_cn: data.data.product_name_cn ?? "",
            product_name_en: data.data.product_name_en ?? "",
            unit_price_cny:  data.data.unit_price_cny  ?? null,
            weight_kg:       data.data.weight_kg        ?? null,
            moq:             data.data.moq              ?? null,
            price_currency:  "CNY",
            product_link:    "",
            source_platform: "description",
            confidence:      data.data.confidence       ?? { overall: "medium" },
          };
          const estimated = estimateSalePrice(parsed.unit_price_cny);
          setAllStagesDone(true);
          setTimeout(() => {
            setAllStagesDone(false);
            go("marketplace", { extractedData: parsed, salePrice: estimated });
          }, 400);
        } else {
          // AI failed → manual fallback with name pre-filled
          go("product", { product: { ...EMPTY_PRODUCT, product_name: s.descInput.trim() } });
        }
      } catch {
        go("product", { product: { ...EMPTY_PRODUCT, product_name: s.descInput.trim() } });
      }
    }
  }

  function handleQuickExample(ex: typeof QUICK_EXAMPLES[number]) {
    if (!startedRef.current) { analytics.aiFunnelStart(); analytics.unitEconomicsOpen(); startedRef.current = true; }
    const parsed: ExtractedProduct = {
      product_name:    ex.product_name,
      product_name_cn: ex.product_name_cn,
      product_name_en: ex.product_name_en,
      unit_price_cny:  ex.unit_price_cny,
      weight_kg:       ex.weight_kg,
      moq:             ex.moq,
      price_currency:  "CNY",
      product_link:    "",
      source_platform: "description",
      confidence:      { overall: "medium" },
    };
    go("marketplace", { extractedData: parsed, salePrice: estimateSalePrice(ex.unit_price_cny) });
  }

  // ── Recalculate (correction accordion) ─────────────────────────────────────

  async function handleRecalculate() {
    analytics.manualCorrectionSaved();
    const unitPrice  = parseFloat(s.correction.unit_price_cny) || 0;
    const salePriceN = parseFloat(s.correction.sale_price)     || 0;

    go("calculating");

    const recalcCommission = detectCommissionPct(
      s.marketplace,
      s.correction.product_name,
      s.extractedData?.product_name_en ?? undefined,
      s.extractedData?.product_name_cn ?? undefined,
    );

    try {
      const res  = await fetch("/api/ai-funnel/preview", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit_price:     unitPrice,
          price_currency: s.correction.price_currency,
          sale_price:     salePriceN,
          quantity:       parseInt(s.correction.quantity) || 1,
          marketplace:    s.marketplace,
          city_to:        s.city_to,
          weight_kg:      s.correction.weight_kg ? parseFloat(s.correction.weight_kg) : undefined,
          product_name:   s.correction.product_name,
          commission_pct: recalcCommission,
          moq:            s.extractedData?.moq ?? undefined,
        }),
      });
      const data = await res.json();

      if (!data.ok) {
        go("preview", { error: data.message ?? "Ошибка расчёта" });
        return;
      }

      analytics.unitEconomicsRecalculated({ verdict: data.economics?.verdict });
      go("preview", {
        economics:          data.economics,
        delivery:           data.delivery,
        priority:           data.priority,
        marketplace_config: data.marketplace_config,
        showCorrection:     false,
      });
    } catch {
      go("preview", { error: "Ошибка сети. Попробуйте ещё раз." });
    }
  }

  // ── Registration gate submit ────────────────────────────────────────────────

  async function handleRegisterSubmit() {
    if (!regTelegram.trim()) return;
    setRegSubmitting(true);

    // Unlock immediately (optimistic) — gate is UX-enforced
    localStorage.setItem('cb_registered', 'true');
    setIsRegistered(true);

    // Best-effort CRM notification
    try {
      await fetch("/api/ai-funnel/submit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:           regName,
          telegram:       regTelegram,
          product_name:   "Регистрация в калькуляторе",
          product_link:   "",
          unit_price:     0,
          price_currency: "CNY",
          sale_price:     0,
          quantity:       1,
          marketplace:    "wb",
          city_to:        "Москва",
        }),
      });
    } catch { /* ignore */ }

    setRegSubmitting(false);
    // showRegGate + calcAfterReg cleared by useEffect after isRegistered → true
    analytics.aiFunnelStart();
  }

  // ── Contact submit ──────────────────────────────────────────────────────────

  async function handleContactSubmit() {
    if (!s.phone.trim() && !s.telegram.trim() && !s.whatsapp.trim()) {
      setS(p => ({ ...p, error: "Укажите Telegram, WhatsApp или телефон" })); return;
    }
    go("calculating");

    try {
      const ed      = s.extractedData;
      const unitPrice = ed ? ((ed.unit_price_cny ?? parseFloat(s.product.unit_price_cny)) || 0)
                           : parseFloat(s.product.unit_price_cny) || 0;
      const res = await fetch("/api/ai-funnel/submit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:           s.name,
          phone:          s.phone,
          telegram:       s.telegram,
          whatsapp:       s.whatsapp,
          email:          s.email,
          product_name:   ed ? ed.product_name          : s.product.product_name,
          product_link:   ed ? ed.product_link          : s.product.product_link,
          unit_price:     unitPrice,
          price_currency: ed ? ed.price_currency        : s.product.price_currency,
          sale_price:     parseFloat(s.salePrice) || parseFloat(s.product.sale_price) || 0,
          quantity:       parseInt(s.product.quantity) || 1,
          marketplace:    s.marketplace,
          city_to:        s.city_to,
          weight_kg:      ed ? (ed.weight_kg ?? undefined) : (s.product.weight_kg ? parseFloat(s.product.weight_kg) : undefined),
        }),
      });
      const data = await res.json();

      if (!data.ok) {
        go("contact", { error: data.error ?? "Ошибка. Попробуйте ещё раз." }); return;
      }

      analytics.aiFunnelLeadCreated({ priority: data.priority });
      analytics.saveAnalysisClicked();
      // Mark as registered when they complete the contact form
      if (!isRegistered) {
        localStorage.setItem('cb_registered', 'true');
        setIsRegistered(true);
      }
      go("success", { leadId: data.lead_id, economics: data.economics, priority: data.priority, marketplace_config: data.marketplace_config });
    } catch {
      go("contact", { error: "Ошибка сети. Попробуйте ещё раз." });
    }
  }

  // ── Share ───────────────────────────────────────────────────────────────────

  const [copied,           setCopied]           = useState(false);
  const [inlineTg,         setInlineTg]         = useState("");
  const [inlineName,       setInlineName]       = useState("");
  const [inlineSubmitting, setInlineSubmitting] = useState(false);
  const [inlineLeadId,     setInlineLeadId]     = useState("");

  async function handleInlineCapture() {
    if (!inlineTg.trim()) return;
    setInlineSubmitting(true);
    localStorage.setItem('cb_registered', 'true');
    setIsRegistered(true);
    try {
      const ed        = s.extractedData;
      const unitPrice = ed
        ? ((ed.unit_price_cny ?? parseFloat(s.product.unit_price_cny)) || 0)
        : parseFloat(s.product.unit_price_cny) || 0;
      const resp = await fetch("/api/ai-funnel/submit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:           inlineName,
          telegram:       inlineTg,
          product_name:   ed ? ed.product_name          : s.product.product_name,
          product_link:   ed ? ed.product_link          : s.product.product_link,
          unit_price:     unitPrice,
          price_currency: ed ? ed.price_currency        : s.product.price_currency,
          sale_price:     parseFloat(s.salePrice) || parseFloat(s.product.sale_price) || 0,
          quantity:       parseInt(s.product.quantity) || 1,
          marketplace:    s.marketplace,
          city_to:        s.city_to,
          weight_kg:      ed
            ? (ed.weight_kg ?? undefined)
            : (s.product.weight_kg ? parseFloat(s.product.weight_kg) : undefined),
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.lead_id) setInlineLeadId(data.lead_id);
      }
    } catch { /* ignore */ }
    setInlineSubmitting(false);
  }

  async function handleShare(ec: EconomicsResult) {
    const mp   = s.marketplace_config?.label ?? s.marketplace.toUpperCase();
    const text = `Проверил товар через AI-калькулятор ChinaBridge:\n${ec.verdict_emoji} ${ec.verdict_label}\nМаржа ${ec.margin_pct.toFixed(1)}% · ROI ${ec.roi_pct.toFixed(0)}% · Прибыль ${Math.round(ec.net_profit_rub / ec.quantity).toLocaleString("ru-RU")} ₽/шт (${mp})\n\nРассчитай свой товар →`;
    const url  = "https://chinabridge.pro/ai-calculator";

    if (navigator.share) {
      try { await navigator.share({ title: "Расчёт товара из Китая", text, url }); return; } catch { /* user cancelled */ }
    }
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* ignore */ }
  }

  function handleTgShare(ec: EconomicsResult) {
    const mp   = s.marketplace_config?.label ?? s.marketplace.toUpperCase();
    const text = `Проверил товар через AI-калькулятор ChinaBridge: ${ec.verdict_emoji} ${ec.verdict_label}, маржа ${ec.margin_pct.toFixed(1)}%, ROI ${ec.roi_pct.toFixed(0)}% (${mp}). Рассчитай свой товар →`;
    const url  = encodeURIComponent("https://chinabridge.pro/ai-calculator");
    window.open(`https://t.me/share/url?url=${url}&text=${encodeURIComponent(text)}`, "_blank");
  }

  // ── Progress bar ────────────────────────────────────────────────────────────

  const ec = s.economics;
  const STEPS_ORDER: Step[] = ["input", "product", "marketplace", "preview", "contact", "success"];
  const progressPct = Math.min(100,
    (STEPS_ORDER.indexOf(["analyzing", "calculating"].includes(s.step) ? "marketplace" : s.step) + 1)
    / STEPS_ORDER.length * 100
  );

  // ── Registration gate ────────────────────────────────────────────────────────

  if (showRegGate) {
    return (
      <div className="card-glass rounded-2xl p-6 md:p-8 flex flex-col gap-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-[#00A86B]/20 border border-[#00A86B]/40 flex items-center justify-center text-2xl mx-auto mb-4">🔓</div>
          <h2 className="text-xl font-bold text-white mb-2">Расчёт готов — куда прислать?</h2>
          <p className="text-sm text-[#8899aa] max-w-xs mx-auto leading-relaxed">
            Зарегистрируйтесь и получите <span className="text-white font-semibold">10 расчётов в день</span> + полный P&amp;L в Telegram.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-[#8899aa] block mb-1.5">
              Telegram <span className="text-[#00A86B]">*</span>
            </label>
            <input
              type="text" value={regTelegram} autoFocus
              onChange={e => setRegTelegram(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !regSubmitting && regTelegram.trim() && handleRegisterSubmit()}
              placeholder="@username" className={inp()} />
          </div>
          <div>
            <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Имя</label>
            <input
              type="text" value={regName}
              onChange={e => setRegName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !regSubmitting && regTelegram.trim() && handleRegisterSubmit()}
              placeholder="Ваше имя" className={inp()} />
          </div>
        </div>

        <button
          onClick={handleRegisterSubmit}
          disabled={!regTelegram.trim() || regSubmitting}
          className="w-full py-3.5 bg-[#00A86B] hover:bg-[#008f59] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
        >
          {regSubmitting ? "Регистрируем..." : "🚀 Получить 3 расчёта бесплатно"}
        </button>

        <div className="flex flex-col gap-2 text-center">
          <p className="text-xs text-[#8899aa]">
            Нажимая кнопку, вы соглашаетесь с{" "}
            <a href="/privacy" className="text-[#00A86B] hover:underline">политикой конфиденциальности</a>
          </p>
          <a
            href="https://t.me/ChinaBridgeLID_bot"
            target="_blank" rel="noopener noreferrer"
            className="text-xs text-[#8899aa] hover:text-white transition-colors"
          >
            Написать менеджеру напрямую →
          </a>
        </div>
      </div>
    );
  }

  // ── Paid plan paywall ─────────────────────────────────────────────────────────

  if (showPaywall) {
    return (
      <div className="card-glass rounded-2xl p-6 md:p-8 flex flex-col items-center gap-6 text-center min-h-[360px] justify-center">
        <div className="w-16 h-16 rounded-full bg-amber-900/30 border border-amber-700/40 flex items-center justify-center text-3xl">
          ⭐
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Бесплатные расчёты использованы</h2>
          <p className="text-sm text-[#8899aa] max-w-xs mx-auto leading-relaxed">
            Вы использовали 10 расчётов сегодня. Для безлимитного доступа станьте клиентом ChinaBridge или свяжитесь с менеджером.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <a
            href="/client/login?plan=calculator"
            className="w-full py-3 bg-[#00A86B] hover:bg-[#008f59] text-white font-semibold rounded-xl transition-all text-sm"
          >
            📊 Выбрать тариф в кабинете
          </a>
          <a
            href="https://t.me/ChinaBridgeLID_bot"
            target="_blank" rel="noopener noreferrer"
            className="w-full py-2.5 border border-[#243a5e] hover:border-[#00A86B]/50 text-[#8899aa] hover:text-white text-sm rounded-xl transition-all"
          >
            Написать менеджеру в Telegram
          </a>
        </div>
        <p className="text-xs text-[#8899aa]">Менеджер свяжется в течение 15 минут</p>
      </div>
    );
  }

  // ── Analyzing loader ────────────────────────────────────────────────────────

  if (s.step === "analyzing") {
    return (
      <div className="card-glass rounded-2xl p-10 flex flex-col items-center gap-6 min-h-[360px] justify-center">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-2 border-[#00A86B]/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#00A86B] animate-spin" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-b-[#00A86B]/40 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
          <div className="absolute inset-3 rounded-full bg-[#00A86B]/10 flex items-center justify-center text-2xl">🤖</div>
        </div>

        <div className="w-full max-w-xs space-y-2.5">
          {ANALYZE_STAGES.map((stage, i) => {
            const done    = allStagesDone;
            const active  = !done && i === stageIdx;
            const past    = !done && i < stageIdx;
            return (
              <div key={i} className={`flex items-center gap-3 transition-all ${active ? "opacity-100" : past || done ? "opacity-60" : "opacity-30"}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 transition-all ${
                  done    ? "bg-[#00A86B] text-white" :
                  active  ? "bg-[#00A86B]/20 text-[#00A86B] ring-1 ring-[#00A86B]" :
                  past    ? "bg-[#243a5e] text-[#8899aa]" :
                            "bg-transparent border border-[#243a5e] text-transparent"
                }`}>
                  {done ? "✓" : active ? "→" : past ? "·" : "·"}
                </div>
                <span className={`text-sm ${active ? "text-white font-medium" : "text-[#8899aa]"}`}>
                  {done ? stage.text.replace("...", " ✓") : stage.text}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-[#8899aa]">Обычно занимает 5–15 секунд</p>
      </div>
    );
  }

  // ── Calculating loader ──────────────────────────────────────────────────────

  if (s.step === "calculating") {
    return (
      <div className="card-glass rounded-2xl p-10 text-center flex flex-col items-center gap-6 min-h-[280px] justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-[#00A86B]/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#00A86B] animate-spin" />
          <div className="absolute inset-3 rounded-full bg-[#00A86B]/10 flex items-center justify-center text-xl">📊</div>
        </div>
        <div>
          <p className="text-white font-semibold">Считаем юнит-экономику...</p>
          <p className="text-xs text-[#8899aa] mt-1">Тарифы WB/Ozon/Kaspi 2026 · курс ЦБ</p>
        </div>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <div className="card-glass rounded-2xl p-6 md:p-8">
      {/* Progress */}
      {s.step !== "success" && (
        <div className="flex items-center gap-3 mb-7">
          <div className="flex-1 h-1 rounded-full bg-[#243a5e] overflow-hidden">
            <div className="h-full bg-[#00A86B] rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="text-xs text-[#8899aa] whitespace-nowrap">AI Unit Economics</span>
        </div>
      )}

      {/* ── INPUT ──────────────────────────────────────────────────────────────── */}
      {s.step === "input" && (
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-[#00A86B] text-xs font-semibold uppercase tracking-widest mb-2">AI-анализ товара</p>
            <h2 className="text-xl font-bold text-white mb-1">Проверьте товар до покупки</h2>
            <p className="text-sm text-[#8899aa]">Вставьте ссылку с 1688 или просто опишите товар — AI рассчитает прибыль за 15 секунд</p>
          </div>

          {/* Quick examples — instant calculation without URL */}
          <div>
            <p className="text-xs text-[#8899aa] mb-2">Или выберите категорию — расчёт мгновенно:</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_EXAMPLES.map(ex => (
                <button
                  key={ex.label}
                  onClick={() => handleQuickExample(ex)}
                  className="flex items-center gap-2 bg-white/5 hover:bg-[#00A86B]/15 border border-white/10 hover:border-[#00A86B]/40 rounded-xl px-3 py-2.5 transition-all text-left"
                >
                  <span className="text-lg leading-none">{ex.emoji}</span>
                  <div>
                    <p className="text-xs font-medium text-white">{ex.label}</p>
                    <p className="text-[10px] text-[#8899aa]">≈ ¥{ex.unit_price_cny}/шт</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#243a5e]" />
            <span className="text-xs text-[#8899aa]">или введите сами</span>
            <div className="flex-1 h-px bg-[#243a5e]" />
          </div>

          <div>
            <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Ссылка на товар</label>
            <input
              type="url" autoFocus value={s.urlInput}
              onChange={e => setS(p => ({ ...p, urlInput: e.target.value, descInput: "" }))}
              onKeyDown={e => e.key === "Enter" && (s.urlInput || s.descInput) && handleUrlSubmit()}
              placeholder="https://detail.1688.com/offer/..." className={inp()}
            />
            <p className="text-[11px] text-[#8899aa] mt-1">Поддерживаются: 1688.com · Alibaba.com · Taobao.com</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#243a5e]" />
            <span className="text-xs text-[#8899aa]">или опишите текстом</span>
            <div className="flex-1 h-px bg-[#243a5e]" />
          </div>

          <div>
            <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Опишите товар текстом</label>
            <input
              type="text" value={s.descInput}
              onChange={e => setS(p => ({ ...p, descInput: e.target.value, urlInput: "" }))}
              onKeyDown={e => e.key === "Enter" && (s.urlInput || s.descInput) && handleUrlSubmit()}
              placeholder='Например: «Наушники TWS» или «Детская одежда 500 шт»' className={inp()}
            />
          </div>

          <button
            onClick={handleUrlSubmit}
            disabled={!s.urlInput.trim() && !s.descInput.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#00A86B] hover:bg-[#008f59] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
          >
            🚀 Рассчитать прибыль
          </button>

          <p className="text-center text-xs text-[#8899aa]">Бесплатно · результат за 15 сек · AI-анализ GPT-4o</p>
        </div>
      )}

      {/* ── PRODUCT (manual fallback only) ─────────────────────────────────────── */}
      {s.step === "product" && (
        <div className="flex flex-col gap-5">
          <div>
            <button onClick={() => go("input")} className="text-xs text-[#8899aa] hover:text-white flex items-center gap-1 mb-3">
              ← Назад
            </button>
            {s.scrapeError ? (
              <div className="flex items-start gap-3 mb-2">
                <span className="text-xl">⚠️</span>
                <div>
                  <h2 className="text-lg font-bold text-white">Введите данные вручную</h2>
                  <p className="text-xs text-amber-400/80 mt-0.5">
                    {s.scrapeError === "FIRECRAWL_NOT_CONFIGURED"
                      ? "Автоматический анализ временно недоступен"
                      : s.scrapeError === "SCRAPE_FAILED"
                      ? "Страница защищена от парсинга (CAPTCHA)"
                      : "Не удалось автоматически получить данные товара"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-2">
                <h2 className="text-lg font-bold text-white">Параметры товара</h2>
                <p className="text-xs text-[#8899aa] mt-0.5">Укажите примерные цены — рассчитаем маржу за 15 секунд</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Название товара *</label>
              <input type="text" value={s.product.product_name}
                autoFocus
                onChange={e => setProduct("product_name", e.target.value)}
                placeholder="Например: Органайзер для кухни" className={inp(!s.product.product_name)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Закупочная цена *</label>
                <div className="flex gap-2">
                  <input type="number" value={s.product.unit_price_cny}
                    onChange={e => setProduct("unit_price_cny", e.target.value)}
                    placeholder="38" className={`flex-1 ${inp(!s.product.unit_price_cny)}`} />
                  <select value={s.product.price_currency}
                    onChange={e => setProduct("price_currency", e.target.value as "CNY" | "USD")}
                    className="px-2 py-3 bg-[#0B1F3A] border border-[#243a5e] rounded-xl text-xs text-white outline-none">
                    <option value="CNY">¥ CNY</option>
                    <option value="USD">$ USD</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Цена продажи, ₽ *</label>
                <input type="number" value={s.product.sale_price}
                  onChange={e => setProduct("sale_price", e.target.value)}
                  placeholder="1990" className={inp(!s.product.sale_price)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Количество, шт</label>
                <input type="number" value={s.product.quantity}
                  onChange={e => setProduct("quantity", e.target.value)}
                  placeholder="100" className={inp()} />
              </div>
              <div>
                <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Вес, кг/ед</label>
                <input type="number" value={s.product.weight_kg}
                  onChange={e => setProduct("weight_kg", e.target.value)}
                  placeholder="0.5" step="0.1" className={inp()} />
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (!s.product.product_name || !s.product.unit_price_cny || !s.product.sale_price) {
                setS(p => ({ ...p, error: "Заполните обязательные поля (*)" })); return;
              }
              go("marketplace", { salePrice: s.product.sale_price });
            }}
            className="w-full py-3.5 bg-[#00A86B] hover:bg-[#008f59] text-white font-semibold rounded-xl transition-all"
          >
            Далее → Выбрать маркетплейс
          </button>
          {s.error
            ? <p className="text-red-400 text-xs text-center">{s.error}</p>
            : (!s.product.product_name || !s.product.unit_price_cny || !s.product.sale_price) && (
                <p className="text-[#8899aa] text-xs text-center">Заполните поля выше — это займёт 30 секунд</p>
              )
          }
        </div>
      )}

      {/* ── MARKETPLACE ────────────────────────────────────────────────────────── */}
      {s.step === "marketplace" && (
        <div className="flex flex-col gap-5">
          {/* Back */}
          <button onClick={() => go(s.extractedData ? "input" : "product")}
            className="text-xs text-[#8899aa] hover:text-white flex items-center gap-1 -mb-1">
            ← Назад
          </button>

          {/* Product summary (AI path) */}
          {s.extractedData && (
            <div className="rounded-xl border border-[#243a5e] bg-[#0B1F3A]/50 px-4 py-3">
              <p className="text-xs text-[#8899aa] mb-0.5">Товар распознан</p>
              <p className="text-sm font-semibold text-white truncate">{s.extractedData.product_name || "—"}</p>
              <div className="flex gap-3 mt-1 text-xs text-[#8899aa]">
                {s.extractedData.unit_price_cny && (
                  <span>¥{s.extractedData.unit_price_cny} / ед</span>
                )}
                {s.extractedData.weight_kg && (
                  <span>{s.extractedData.weight_kg} кг</span>
                )}
                {s.extractedData.moq && (
                  <span>MOQ: {s.extractedData.moq} шт</span>
                )}
                <span className={`ml-auto ${
                  (s.extractedData.confidence.overall ?? "low") === "high"   ? "text-emerald-400" :
                  (s.extractedData.confidence.overall ?? "low") === "medium" ? "text-amber-400"   : "text-[#8899aa]"
                }`}>
                  {s.extractedData.confidence.overall === "high"   ? "🟢 Высокая точность" :
                   s.extractedData.confidence.overall === "medium" ? "🟡 Средняя точность" : ""}
                </span>
              </div>
            </div>
          )}

          {/* Marketplace */}
          <div>
            <label className="text-xs font-medium text-[#8899aa] block mb-2">Где продаёте?</label>
            <div className="grid grid-cols-3 gap-2">
              {MARKETPLACES.map(mp => (
                <button key={mp.id}
                  onClick={() => setS(p => ({ ...p, marketplace: mp.id }))}
                  className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl border text-xs font-medium transition-all ${
                    s.marketplace === mp.id
                      ? "border-[#00A86B] bg-[#00A86B]/15 text-[#00A86B]"
                      : "border-[#243a5e] text-[#8899aa] hover:border-[#00A86B]/40 hover:text-white"
                  }`}
                >
                  <span className="text-lg">{mp.icon}</span>
                  <span>{mp.label}</span>
                  {mp.commission_pct > 0 && (() => {
                    const detected = detectCommissionPct(
                      mp.id,
                      s.extractedData?.product_name ?? s.product.product_name,
                      s.extractedData?.product_name_en ?? undefined,
                      s.extractedData?.product_name_cn ?? undefined,
                    );
                    return (
                      <span className="text-[10px] opacity-70">
                        {detected !== mp.commission_pct ? `${detected}%` : `${mp.commission_pct}%`}
                      </span>
                    );
                  })()}
                </button>
              ))}
            </div>
          </div>

          {/* City */}
          <div>
            <label className="text-xs font-medium text-[#8899aa] block mb-2">Куда доставлять?</label>
            <div className="flex flex-wrap gap-2">
              {CITY_CHIPS.map(city => (
                <button key={city}
                  onClick={() => setS(p => ({ ...p, city_to: city }))}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    s.city_to === city
                      ? "border-[#00A86B] bg-[#00A86B]/15 text-[#00A86B]"
                      : "border-[#243a5e] text-[#8899aa] hover:border-[#00A86B]/40 hover:text-white"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Sale price field (AI path: always shown; manual path: pre-filled) */}
          <div>
            <label className="text-xs font-medium text-[#8899aa] block mb-1.5">
              Планируемая цена продажи, ₽
              {s.extractedData && s.salePrice && (
                <span className="ml-2 text-amber-400/80 font-normal">расчётная — можно изменить</span>
              )}
            </label>
            <input
              type="number"
              value={s.salePrice}
              onChange={e => setS(p => ({ ...p, salePrice: e.target.value }))}
              placeholder="1990"
              className={inp(!s.salePrice && !s.product.sale_price)}
            />
            <p className="text-[11px] text-[#8899aa] mt-1">Сколько планируете брать с покупателей на маркетплейсе</p>
          </div>

          {/* Calculate button with auto-countdown */}
          <button
            onClick={() => { setAutoCountdown(null); handleCalcRef.current?.(); }}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#00A86B] hover:bg-[#008f59] text-white font-semibold rounded-xl transition-all"
          >
            {autoCountdown !== null
              ? `⏳ Рассчитываем через ${autoCountdown} с...`
              : "🤖 Рассчитать Unit Economics"}
          </button>
          {!(parseFloat(s.salePrice) > 0) && !(parseFloat(s.product.sale_price) > 0) && (
            <p className="text-amber-400 text-xs text-center -mt-2">Укажите планируемую цену продажи для расчёта</p>
          )}
        </div>
      )}

      {/* ── PREVIEW ────────────────────────────────────────────────────────────── */}
      {s.step === "preview" && ec && (
        <div className="flex flex-col gap-5">
          {/* Back to marketplace */}
          <button onClick={() => go("marketplace")} className="text-xs text-[#8899aa] hover:text-white flex items-center gap-1 -mb-2">
            ← Изменить маркетплейс
          </button>

          {/* Verdict */}
          <div className={`rounded-xl p-4 text-center border ${verdictBg(ec.verdict)}`}>
            <p className="text-3xl mb-1">{ec.verdict_emoji}</p>
            <p className={`font-bold text-lg mb-1 ${verdictColor(ec.verdict)}`}>{ec.verdict_label}</p>
            <p className="text-sm text-[#8899aa]">
              {ec.verdict === "green"  ? "Товар имеет хороший потенциал для продажи" :
               ec.verdict === "yellow" ? "Возможна прибыль, но требует оптимизации"  :
                                         "При текущих ценах рентабельность под вопросом"}
            </p>
          </div>

          {/* Supplier links — shown when user typed product name (no URL) */}
          {s.extractedData?.source_platform === "description" && s.extractedData.product_name && (() => {
            const cn = encodeURIComponent(s.extractedData!.product_name_cn || s.extractedData!.product_name);
            const en = encodeURIComponent(s.extractedData!.product_name_en || s.extractedData!.product_name);
            return (
              <div className="rounded-xl border border-[#243a5e] bg-[#0B1F3A] p-4">
                <p className="text-xs font-semibold text-[#8899aa] uppercase tracking-wide mb-3">
                  🔍 Найти поставщиков на
                </p>
                <div className="flex flex-col gap-2">
                  <a
                    href={`https://s.1688.com/selloffer/offerlist.htm?keywords=${cn}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 bg-orange-500/10 border border-orange-500/25 rounded-lg px-3 py-2.5 hover:bg-orange-500/20 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">🇨🇳</span>
                      <div>
                        <p className="text-xs font-semibold text-orange-400">1688.com</p>
                        <p className="text-[10px] text-[#8899aa]">Оптовые цены фабрик{s.extractedData!.product_name_cn ? ` · ${s.extractedData!.product_name_cn}` : ""}</p>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-[#8899aa]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                  <a
                    href={`https://www.alibaba.com/trade/search?SearchText=${en}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 bg-yellow-500/10 border border-yellow-500/25 rounded-lg px-3 py-2.5 hover:bg-yellow-500/20 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">🌐</span>
                      <div>
                        <p className="text-xs font-semibold text-yellow-400">Alibaba.com</p>
                        <p className="text-[10px] text-[#8899aa]">Международные поставщики</p>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-[#8899aa]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                </div>
                <p className="text-[10px] text-[#556677] mt-2">
                  Нашли товар? Вставьте ссылку — пересчитаем с реальной ценой поставщика
                </p>
              </div>
            );
          })()}

          {/* Key metrics */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Маржа",       value: `${ec.margin_pct.toFixed(1)}%`,              hi: ec.verdict === "green" },
              { label: "ROI",         value: `${ec.roi_pct.toFixed(0)}%`,                 hi: false },
              { label: "Прибыль/шт", value: `${fmt(ec.net_profit_rub / ec.quantity)} ₽`, hi: false },
            ].map(m => (
              <div key={m.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-[10px] text-[#8899aa] mb-1 uppercase tracking-wide">{m.label}</p>
                <p className={`text-lg font-bold ${m.hi ? "text-[#00A86B]" : "text-white"}`}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Full analytics: always free, no gate */}
          <>
            {inlineLeadId && (
              <a
                href={`https://t.me/ChinaBridgeLID_bot?start=${inlineLeadId.replace(/-/g, '_')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 bg-[#229ED9]/10 border border-[#229ED9]/30 rounded-xl px-4 py-3 mb-1 hover:bg-[#229ED9]/20 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-white">✅ Расчёт сохранён — открыть в Telegram</p>
                  <p className="text-xs text-[#8899aa] mt-0.5">Нажмите — расчёт придёт прямо в бот</p>
                </div>
                <svg className="w-5 h-5 text-[#229ED9] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            )}
            {ec.scenarios && ec.scenarios.length > 0 && (
              <ScenariosBlock
                scenarios={ec.scenarios}
                active={s.activeScenario}
                onSwitch={sc => setS(p => ({ ...p, activeScenario: sc }))}
              />
            )}
            <PnlTable ec={ec} delivery={s.delivery}
              mpLabel={s.marketplace_config?.label}
              tariffDate={s.marketplace_config?.tariff_date}
              commissionNote={s.marketplace_config?.commission_note}
              isKZ={s.marketplace === "kaspi"}
            />
            {ec.product_score && <ProductScoreCard ps={ec.product_score} />}
            {ec.supplier_risk && <SupplierRiskBadge sr={ec.supplier_risk} />}
            {ec.target_price && (
              <div onClick={() => analytics.targetPriceViewed()}>
                <TargetPriceCard tp={ec.target_price}
                  currency={s.extractedData?.price_currency ?? s.product.price_currency} />
              </div>
            )}
            {!s.delivery?.hasRate && (
              <p className="text-xs text-amber-400/80 bg-amber-900/10 border border-amber-700/20 rounded-xl px-4 py-2">
                ⚠️ Стоимость международной доставки уточняется менеджером
              </p>
            )}
            <CorrectionAccordion
              open={s.showCorrection}
              correction={s.correction}
              onToggle={() => {
                if (!s.showCorrection) analytics.manualCorrectionOpened();
                setS(p => ({ ...p, showCorrection: !p.showCorrection }));
              }}
              onChange={setCorrection}
              onRecalculate={handleRecalculate}
            />
            {/* Soft TG CTA — not a gate, just a suggestion */}
            {!inlineLeadId && (
              <div className="bg-[#00A86B]/5 border border-[#00A86B]/30 rounded-xl p-4">
                <p className="text-sm font-semibold text-white mb-1">📩 Сохранить расчёт в Telegram</p>
                <p className="text-xs text-[#8899aa] mb-3">
                  Пришлём P&amp;L таблицу и план оптимизации — бесплатно
                </p>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={inlineTg}
                    onChange={e => setInlineTg(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && inlineTg.trim() && handleInlineCapture()}
                    placeholder="@username"
                    className={inp()}
                  />
                  <input
                    type="text"
                    value={inlineName}
                    onChange={e => setInlineName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && inlineTg.trim() && handleInlineCapture()}
                    placeholder="Ваше имя (необязательно)"
                    className={inp()}
                  />
                  <button
                    onClick={handleInlineCapture}
                    disabled={!inlineTg.trim() || inlineSubmitting}
                    className="w-full py-3 bg-[#00A86B] hover:bg-[#008f59] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm"
                  >
                    {inlineSubmitting ? "Отправляем..." : "📩 Получить расчёт в Telegram"}
                  </button>
                </div>
                <p className="text-xs text-[#8899aa] mt-2 text-center">
                  Бесплатно · без спама · ответим в течение дня
                </p>
              </div>
            )}
          </>

          {/* CTA */}
          <div className="bg-[#00A86B]/5 border border-[#00A86B]/20 rounded-xl p-4">
            {ec.verdict === "red" ? (
              <>
                <p className="text-sm font-semibold text-white mb-1">Маржа {ec.margin_pct.toFixed(1)}% — найдём поставщика дешевле</p>
                <p className="text-xs text-[#8899aa] mb-3">Подберём 3 альтернативы с ценой на 15–30% ниже и пересчитаем маржу</p>
              </>
            ) : ec.verdict === "yellow" ? (
              <>
                <p className="text-sm font-semibold text-white mb-1">Маржа {ec.margin_pct.toFixed(1)}% — есть потенциал до 25%+</p>
                <p className="text-xs text-[#8899aa] mb-3">Покажем, где снизить логистику или комиссию, чтобы выйти на цель</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-white mb-1">Маржа {ec.margin_pct.toFixed(1)}% — товар готов к запуску</p>
                <p className="text-xs text-[#8899aa] mb-3">Зафиксируем расчёт и предложим схему доставки с точными ценами</p>
              </>
            )}
            <button
              onClick={() => { analytics.aiFunnelFullCalc({ verdict: ec.verdict }); go("contact"); }}
              className="w-full py-3 bg-[#00A86B] hover:bg-[#008f59] text-white font-semibold rounded-xl transition-all text-sm"
            >
              {ec.verdict === "red" ? "📩 Получить решение от менеджера" : ec.verdict === "yellow" ? "📩 Получить план оптимизации" : "📩 Запустить импорт — получить расчёт в TG"}
            </button>
          </div>

          {ec.verdict === "red" && (
            <a
              href="https://t.me/ChinaBridgeLID_bot"
              target="_blank" rel="noopener noreferrer"
              className="w-full py-2.5 border border-[#243a5e] hover:border-[#229ED9]/50 text-[#8899aa] hover:text-white text-sm rounded-xl transition-all flex items-center justify-center gap-2"
            >
              ✈️ Написать менеджеру напрямую в Telegram
            </a>
          )}

          <button onClick={() => go("input")} className="text-xs text-[#8899aa] hover:text-white text-center underline">
            Рассчитать другой товар
          </button>
        </div>
      )}

      {/* Preview error state */}
      {s.step === "preview" && !ec && s.error && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-red-700/40 bg-red-900/20 px-4 py-4 text-center">
            <p className="text-red-400 font-semibold mb-1">Ошибка расчёта</p>
            <p className="text-xs text-[#8899aa]">{s.error}</p>
          </div>
          <button onClick={() => go("marketplace")}
            className="w-full py-3 bg-[#00A86B] hover:bg-[#008f59] text-white font-semibold rounded-xl transition-all">
            ← Попробовать ещё раз
          </button>
        </div>
      )}

      {/* ── CONTACT ────────────────────────────────────────────────────────────── */}
      {s.step === "contact" && (
        <div className="flex flex-col gap-5">
          <div>
            <button onClick={() => go("preview")} className="text-xs text-[#8899aa] hover:text-white flex items-center gap-1 mb-3">
              ← К результату
            </button>
            <h2 className="text-xl font-bold text-white mb-1">Как с вами связаться?</h2>
            <p className="text-sm text-[#8899aa]">Пришлём полный расчёт и свяжемся за 15 минут</p>
          </div>

          <div>
            <label className="text-xs font-medium text-[#8899aa] block mb-1.5">
              Telegram <span className="text-[#00A86B]">*</span>
            </label>
            <input type="text" value={s.telegram} onChange={e => setS(p => ({ ...p, telegram: e.target.value }))}
              placeholder="@username" autoFocus className={inp()} />
          </div>
          <div>
            <label className="text-xs font-medium text-[#8899aa] block mb-1.5">WhatsApp</label>
            <input type="tel" value={s.whatsapp} onChange={e => setS(p => ({ ...p, whatsapp: e.target.value }))}
              placeholder="+7 (999) 000-00-00" className={inp()} />
          </div>
          <div>
            <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Телефон</label>
            <input type="tel" value={s.phone} onChange={e => setS(p => ({ ...p, phone: e.target.value }))}
              placeholder="+7 (999) 000-00-00" className={inp()} />
            <p className="text-[11px] text-[#8899aa] mt-1">* Telegram, WhatsApp или телефон — что удобнее</p>
          </div>
          <div>
            <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Имя</label>
            <input type="text" value={s.name} onChange={e => setS(p => ({ ...p, name: e.target.value }))}
              placeholder="Как вас зовут?" className={inp()} />
          </div>

          {s.error && <p className="text-red-400 text-xs">{s.error}</p>}

          <button onClick={handleContactSubmit}
            className="w-full py-3.5 bg-[#00A86B] hover:bg-[#008f59] text-white font-semibold rounded-xl transition-all">
            Отправить и получить расчёт
          </button>
          <p className="text-center text-xs text-[#8899aa]">
            Нажимая кнопку, вы соглашаетесь с{" "}
            <a href="/privacy" className="text-[#00A86B] hover:underline">политикой конфиденциальности</a>
          </p>
        </div>
      )}

      {/* ── SUCCESS ────────────────────────────────────────────────────────────── */}
      {s.step === "success" && ec && (
        <div className="flex flex-col gap-5 text-center">
          <div className="w-16 h-16 rounded-full bg-[#00A86B]/20 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-[#00A86B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Менеджер уже видит ваш расчёт</h2>
            <p className="text-sm text-[#8899aa]">Свяжемся в течение 15 минут и уточним детали</p>
          </div>

          <div className={`rounded-xl p-4 border ${verdictBg(ec.verdict)}`}>
            <p className="text-2xl mb-1">{ec.verdict_emoji}</p>
            <p className={`font-bold text-lg ${verdictColor(ec.verdict)}`}>{ec.verdict_label}</p>
            <p className="text-white font-semibold mt-1">Маржа {ec.margin_pct.toFixed(1)}% · ROI {ec.roi_pct.toFixed(0)}%</p>
            {ec.product_score && (
              <p className="text-sm text-[#8899aa] mt-1">
                Product Score: <span className="text-white font-semibold">{ec.product_score.total.toFixed(1)}/10</span>
                {" "}— {ec.product_score.label}
              </p>
            )}
            {ec.ai_analysis && (
              <p className="text-xs text-[#8899aa] mt-2 leading-relaxed text-left">{ec.ai_analysis}</p>
            )}
          </div>

          {ec.target_price && (
            <div className="text-left bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm">
              <p className="text-[#8899aa] mb-1 text-xs uppercase font-semibold">Целевые цены (маржа 25%)</p>
              <p className="text-white">
                Макс. закупочная: <span className="font-semibold text-[#00A86B]">{ec.target_price.max_purchase_price_cny.toFixed(1)} ¥</span>
                {" · "}Мин. продажная: <span className="font-semibold">{fmt(ec.target_price.min_sale_price_rub)} ₽</span>
              </p>
            </div>
          )}

          {/* OTO — следующий шаг по вердикту */}
          <div className="bg-[#0d2035] border border-[#1a3050] rounded-xl p-4 text-left">
            <p className="text-[10px] text-[#8899aa] uppercase font-semibold tracking-wide mb-2">Что дальше</p>
            {ec.verdict === "red" ? (
              <>
                <p className="text-sm text-white mb-3">Товар убыточен при текущей цене закупки. Менеджер подберёт 3 альтернативных поставщика — чтобы выйти на маржу 20%+</p>
                <button
                  onClick={() => { analytics.aiFunnelSupplierClick(); analytics.supplierSearchClicked(); window.location.href = "/supplier-finder"; }}
                  className="w-full py-3 bg-[#00A86B] hover:bg-[#008f59] text-white font-semibold rounded-xl transition-all text-sm"
                >
                  🔍 Найти поставщика с ценой ниже
                </button>
              </>
            ) : ec.verdict === "yellow" ? (
              <>
                <p className="text-sm text-white mb-3">Потенциал есть — маржа вырастет до 25%+. Менеджер покажет, где снизить логистику или комиссию маркетплейса</p>
                <button
                  onClick={() => { analytics.aiFunnelImportClick(); analytics.importStarted({ priority: s.priority ?? undefined }); window.location.href = "/#launch-package"; }}
                  className="w-full py-3 bg-[#00A86B] hover:bg-[#008f59] text-white font-semibold rounded-xl transition-all text-sm"
                >
                  📊 Оптимизировать структуру затрат
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-white mb-3">Отличный товар! Следующий шаг — найти поставщика и запустить первую партию. Менеджер готов к работе</p>
                <button
                  onClick={() => { analytics.aiFunnelImportClick(); analytics.importStarted({ priority: s.priority ?? undefined }); window.location.href = "/#launch-package"; }}
                  className="w-full py-3 bg-[#00A86B] hover:bg-[#008f59] text-white font-semibold rounded-xl transition-all text-sm"
                >
                  🚀 Запустить импорт
                </button>
              </>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            {/* Telegram channel — точка входа в follow-up серию */}
            <a href="https://t.me/chinabridgeline" target="_blank" rel="noopener noreferrer"
              onClick={() => analytics.telegramClick()}
              className="flex items-center justify-between w-full px-4 py-3 border border-[#1a3050] hover:border-[#229ED9]/50 hover:bg-white/5 text-sm rounded-xl transition-all"
            >
              <span className="flex items-center gap-2 text-white">
                <svg className="w-4 h-4 text-[#229ED9] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.247l-2.02 9.52c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.4 14.382l-2.95-.924c-.641-.2-.654-.641.136-.948l11.527-4.445c.537-.194 1.006.131.449.182z"/>
                </svg>
                Telegram-канал ChinaBridge
              </span>
              <span className="text-xs text-[#8899aa]">Кейсы и советы →</span>
            </a>

            <a href="https://t.me/ChinaBridgeLID_bot" target="_blank" rel="noopener noreferrer"
              onClick={() => analytics.telegramClick()}
              className="w-full py-2.5 border border-[#243a5e] hover:border-[#00A86B]/50 text-[#8899aa] hover:text-white text-sm rounded-xl transition-all block"
            >
              Написать менеджеру в Telegram
            </a>

            {/* Share block */}
            <div className="pt-1 border-t border-[#243a5e]/60">
              <p className="text-[10px] text-[#8899aa] text-center mb-2 uppercase tracking-wide">Поделиться расчётом</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleShare(ec)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-[#243a5e] hover:border-[#00A86B]/40 text-[#8899aa] hover:text-white text-xs rounded-xl transition-all"
                >
                  {copied ? "✅ Скопировано!" : "🔗 Скопировать ссылку"}
                </button>
                <button
                  onClick={() => handleTgShare(ec)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-[#243a5e] hover:border-[#229ED9]/50 text-[#8899aa] hover:text-[#229ED9] text-xs rounded-xl transition-all"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.247l-2.02 9.52c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.4 14.382l-2.95-.924c-.641-.2-.654-.641.136-.948l11.527-4.445c.537-.194 1.006.131.449.182z"/>
                  </svg>
                  Telegram
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setS(p => ({
                ...p, step: "input", economics: null, delivery: null, marketplace_config: null,
                leadId: null, error: null, scrapeError: null, extractedData: null,
                urlInput: "", descInput: "", salePrice: "", activeScenario: "base",
                showCorrection: false, correction: EMPTY_CORRECTION, product: EMPTY_PRODUCT,
              }));
              startedRef.current = false;
            }}
            className="text-xs text-[#8899aa] hover:text-white underline"
          >
            Рассчитать другой товар
          </button>
        </div>
      )}
    </div>
  );
}
