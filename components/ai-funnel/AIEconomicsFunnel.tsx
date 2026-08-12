"use client";
import { useState, useRef, useEffect } from "react";
import { analytics } from "@/lib/analytics";
import { MARKETPLACES } from "@/lib/economics/marketplaces";
import type { EconomicsResult } from "@/lib/calculator/types";

// ── Types ─────────────────────────────────────────────────────────────────────

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

interface FunnelState {
  step:        Step;
  product:     ProductData;
  marketplace: string;
  city_to:     string;
  name:        string;
  phone:       string;
  telegram:    string;
  email:       string;
  urlInput:    string;
  descInput:   string;
  economics:   EconomicsResult | null;
  delivery:    { hasRate: boolean; deliveryRub: number; daysMin?: number; daysMax?: number } | null;
  leadId:      string | null;
  error:       string | null;
  priority:    "HOT" | "WARM" | "COLD" | null;
}

const CITY_CHIPS = ["Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Алматы", "Астана"];

const AI_ANALYZE_STEPS = [
  "🔎 Анализируем товар...",
  "🏭 Проверяем поставщика...",
  "🚚 Рассчитываем логистику...",
  "📊 Считаем себестоимость...",
  "💰 Оцениваем потенциал...",
];

const AI_CALC_STEPS = [
  "📊 Считаем себестоимость...",
  "🏛️ Таможенный контур...",
  "🏪 Комиссия маркетплейса...",
  "💰 Финальная юнит-экономика...",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt  = (n: number) => Math.round(n).toLocaleString("ru-RU");
const inp  = (err?: boolean) =>
  `w-full px-4 py-3 bg-[#0B1F3A] border rounded-xl text-sm placeholder:text-[#8899aa] outline-none transition-colors text-white ${
    err ? "border-red-500/60" : "border-[#243a5e] focus:border-[#00A86B]/60"
  }`;

// ── Component ─────────────────────────────────────────────────────────────────

export default function AIEconomicsFunnel() {
  const startedRef = useRef(false);
  const [aiMsgIdx, setAiMsgIdx] = useState(0);
  const [aiMessages, setAiMessages] = useState<string[]>(AI_ANALYZE_STEPS);

  const [s, setS] = useState<FunnelState>({
    step:        "input",
    product:     { product_name: "", unit_price_cny: "", sale_price: "", quantity: "1", weight_kg: "", product_link: "", price_currency: "CNY" },
    marketplace: "wb",
    city_to:     "",
    name:        "",
    phone:       "",
    telegram:    "",
    email:       "",
    urlInput:    "",
    descInput:   "",
    economics:   null,
    delivery:    null,
    leadId:      null,
    error:       null,
    priority:    null,
  });

  // AI message cycling
  useEffect(() => {
    if (s.step !== "analyzing" && s.step !== "calculating") { setAiMsgIdx(0); return; }
    const id = setInterval(() => setAiMsgIdx(p => (p + 1) % aiMessages.length), 1100);
    return () => clearInterval(id);
  }, [s.step, aiMessages.length]);

  const go = (step: Step, extra?: Partial<FunnelState>) =>
    setS(p => ({ ...p, step, error: null, ...extra }));

  const setProduct = (k: keyof ProductData, v: string) =>
    setS(p => ({ ...p, product: { ...p.product, [k]: v } }));

  // ── Step: INPUT ─────────────────────────────────────────────────────────────

  async function handleUrlSubmit() {
    if (!startedRef.current) { analytics.aiFunnelStart(); startedRef.current = true; }
    const url = s.urlInput.trim();

    if (url) {
      analytics.aiFunnelUrlEntered();
      setAiMessages(AI_ANALYZE_STEPS);
      go("analyzing");

      try {
        const res  = await fetch("/api/ai-funnel/analyze-url", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ url }),
        });
        const data = await res.json();

        if (data.ok && data.data) {
          analytics.aiFunnelAnalyzed({ confidence: data.data.confidence });
          go("product", {
            product: {
              product_name:   data.data.product_name   ?? "",
              unit_price_cny: data.data.unit_price_cny ? String(data.data.unit_price_cny) : "",
              weight_kg:      data.data.weight_kg       ? String(data.data.weight_kg)      : "",
              sale_price:     "",
              quantity:       "1",
              product_link:   url,
              price_currency: "CNY",
            },
          });
        } else {
          // Fallback: manual input с URL
          go("product", {
            product: { product_name: "", unit_price_cny: "", sale_price: "", quantity: "1", weight_kg: "", product_link: url, price_currency: "CNY" },
            error:   data.reason === "rate_limit" ? data.message : "Введите данные о товаре вручную",
          });
        }
      } catch {
        go("product", {
          product: { product_name: "", unit_price_cny: "", sale_price: "", quantity: "1", weight_kg: "", product_link: url, price_currency: "CNY" },
          error: "Не удалось проанализировать ссылку. Введите данные вручную.",
        });
      }
    } else if (s.descInput.trim()) {
      analytics.aiFunnelDescEntered();
      go("product", {
        product: { product_name: s.descInput.trim(), unit_price_cny: "", sale_price: "", quantity: "1", weight_kg: "", product_link: "", price_currency: "CNY" },
      });
    }
  }

  // ── Step: MARKETPLACE → preview call ───────────────────────────────────────

  async function handleMarketplaceSubmit() {
    analytics.aiFunnelMpSelected({ marketplace: s.marketplace });
    setAiMessages(AI_CALC_STEPS);
    go("calculating");

    try {
      const res  = await fetch("/api/ai-funnel/preview", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit_price:     parseFloat(s.product.unit_price_cny) || 0,
          price_currency: s.product.price_currency,
          sale_price:     parseFloat(s.product.sale_price)     || 0,
          quantity:       parseInt(s.product.quantity)          || 1,
          marketplace:    s.marketplace,
          city_to:        s.city_to,
          weight_kg:      s.product.weight_kg ? parseFloat(s.product.weight_kg) : undefined,
          product_name:   s.product.product_name,
        }),
      });
      const data = await res.json();

      if (!data.ok) {
        go("preview", { error: data.message ?? "Ошибка расчёта" });
        return;
      }

      analytics.aiFunnelPreviewShown({ verdict: data.economics?.verdict });
      go("preview", { economics: data.economics, delivery: data.delivery, priority: data.priority });
    } catch {
      go("preview", { error: "Ошибка сети. Попробуйте ещё раз." });
    }
  }

  // ── Step: SUBMIT ────────────────────────────────────────────────────────────

  async function handleContactSubmit() {
    if (!s.phone.trim() && !s.telegram.trim()) {
      setS(p => ({ ...p, error: "Укажите телефон или Telegram" }));
      return;
    }

    analytics.aiFunnelContactOpen();
    go("calculating");
    setAiMessages(["💾 Сохраняем расчёт...", "📬 Уведомляем менеджера..."]);

    try {
      const res  = await fetch("/api/ai-funnel/submit", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:           s.name,
          phone:          s.phone,
          telegram:       s.telegram,
          email:          s.email,
          product_name:   s.product.product_name,
          product_link:   s.product.product_link,
          unit_price:     parseFloat(s.product.unit_price_cny) || 0,
          price_currency: s.product.price_currency,
          sale_price:     parseFloat(s.product.sale_price)     || 0,
          quantity:       parseInt(s.product.quantity)          || 1,
          marketplace:    s.marketplace,
          city_to:        s.city_to,
          weight_kg:      s.product.weight_kg ? parseFloat(s.product.weight_kg) : undefined,
        }),
      });
      const data = await res.json();

      if (!data.ok) {
        go("contact", { error: data.error ?? "Ошибка. Попробуйте ещё раз." });
        return;
      }

      analytics.aiFunnelLeadCreated({ priority: data.priority });
      go("success", { leadId: data.lead_id, economics: data.economics, priority: data.priority });
    } catch {
      go("contact", { error: "Ошибка сети. Попробуйте ещё раз." });
    }
  }

  // ── RENDERS ───────────────────────────────────────────────────────────────

  const ec = s.economics;

  // Progress bar
  const STEPS_ORDER: Step[] = ["input", "product", "marketplace", "preview", "contact", "success"];
  const progressPct = Math.min(
    100,
    (STEPS_ORDER.indexOf(s.step === "analyzing" || s.step === "calculating" ? "product" : s.step) + 1)
    / STEPS_ORDER.length * 100
  );

  // ── AI LOADER ────────────────────────────────────────────────────────────────
  if (s.step === "analyzing" || s.step === "calculating") {
    return (
      <div className="card-glass rounded-2xl p-10 text-center flex flex-col items-center gap-6 min-h-[320px] justify-center">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-2 border-[#00A86B]/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#00A86B] animate-spin" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-b-[#00A86B]/40 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
          <div className="absolute inset-3 rounded-full bg-[#00A86B]/10 flex items-center justify-center text-2xl">🤖</div>
        </div>
        <div>
          <p className="text-white font-semibold mb-3">{aiMessages[aiMsgIdx]}</p>
          <div className="flex gap-1.5 justify-center">
            {aiMessages.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === aiMsgIdx ? "w-6 bg-[#00A86B]" : "w-1.5 bg-[#243a5e]"}`} />
            ))}
          </div>
        </div>
        <p className="text-xs text-[#8899aa]">Обычно занимает 5–15 секунд</p>
      </div>
    );
  }

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

      {/* ── STEP: INPUT ─────────────────────────────────────────────────────── */}
      {s.step === "input" && (
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-[#00A86B] text-xs font-semibold uppercase tracking-widest mb-2">AI-анализ товара</p>
            <h2 className="text-xl font-bold text-white mb-1">Проверьте товар из Китая</h2>
            <p className="text-sm text-[#8899aa]">Вставьте ссылку 1688 / Alibaba — AI сразу рассчитает экономику</p>
          </div>

          {/* URL input */}
          <div>
            <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Вариант А — ссылка на товар</label>
            <input
              type="url"
              autoFocus
              value={s.urlInput}
              onChange={e => setS(p => ({ ...p, urlInput: e.target.value, descInput: "" }))}
              onKeyDown={e => e.key === "Enter" && (s.urlInput || s.descInput) && handleUrlSubmit()}
              placeholder="https://detail.1688.com/offer/..."
              className={inp()}
            />
            <p className="text-[11px] text-[#8899aa] mt-1">Поддерживаются: 1688.com, Alibaba.com, Taobao.com</p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#243a5e]" />
            <span className="text-xs text-[#8899aa]">или</span>
            <div className="flex-1 h-px bg-[#243a5e]" />
          </div>

          {/* Description input */}
          <div>
            <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Вариант Б — опишите товар</label>
            <input
              type="text"
              value={s.descInput}
              onChange={e => setS(p => ({ ...p, descInput: e.target.value, urlInput: "" }))}
              onKeyDown={e => e.key === "Enter" && (s.urlInput || s.descInput) && handleUrlSubmit()}
              placeholder='Например: «Органайзер для кухни, Wildberries»'
              className={inp()}
            />
          </div>

          <button
            onClick={handleUrlSubmit}
            disabled={!s.urlInput.trim() && !s.descInput.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#00A86B] hover:bg-[#008f59] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
          >
            🚀 Рассчитать экономику
          </button>

          <p className="text-center text-xs text-[#8899aa]">Результат бесплатно — без регистрации</p>
        </div>
      )}

      {/* ── STEP: PRODUCT ───────────────────────────────────────────────────── */}
      {s.step === "product" && (
        <div className="flex flex-col gap-5">
          <div>
            <button onClick={() => go("input")} className="text-xs text-[#8899aa] hover:text-white flex items-center gap-1 mb-3">
              ← Назад
            </button>
            <h2 className="text-xl font-bold text-white mb-1">Параметры товара</h2>
            <p className="text-sm text-[#8899aa]">
              {s.error
                ? <span className="text-amber-400">{s.error}</span>
                : "Проверьте и при необходимости скорректируйте данные"}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Название товара *</label>
              <input type="text" value={s.product.product_name} onChange={e => setProduct("product_name", e.target.value)}
                placeholder='Например: Органайзер для кухни' className={inp(!s.product.product_name)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#8899aa] block mb-1.5">
                  Цена закупки *
                </label>
                <div className="flex gap-2">
                  <input type="number" value={s.product.unit_price_cny} onChange={e => setProduct("unit_price_cny", e.target.value)}
                    placeholder="38" className={`flex-1 ${inp(!s.product.unit_price_cny)}`} />
                  <select
                    value={s.product.price_currency}
                    onChange={e => setProduct("price_currency", e.target.value as "CNY" | "USD")}
                    className="px-2 py-3 bg-[#0B1F3A] border border-[#243a5e] rounded-xl text-xs text-white outline-none"
                  >
                    <option value="CNY">¥ CNY</option>
                    <option value="USD">$ USD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Цена продажи, ₽ *</label>
                <input type="number" value={s.product.sale_price} onChange={e => setProduct("sale_price", e.target.value)}
                  placeholder="1990" className={inp(!s.product.sale_price)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Количество, шт</label>
                <input type="number" value={s.product.quantity} onChange={e => setProduct("quantity", e.target.value)}
                  placeholder="100" className={inp()} />
              </div>
              <div>
                <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Вес, кг/ед</label>
                <input type="number" value={s.product.weight_kg} onChange={e => setProduct("weight_kg", e.target.value)}
                  placeholder="0.5" step="0.1" className={inp()} />
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (!s.product.product_name || !s.product.unit_price_cny || !s.product.sale_price) {
                setS(p => ({ ...p, error: "Заполните обязательные поля (*)" }));
                return;
              }
              go("marketplace");
            }}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#00A86B] hover:bg-[#008f59] text-white font-semibold rounded-xl transition-all"
          >
            Далее → Выбрать маркетплейс
          </button>
          {s.error && <p className="text-red-400 text-xs text-center">{s.error}</p>}
        </div>
      )}

      {/* ── STEP: MARKETPLACE ───────────────────────────────────────────────── */}
      {s.step === "marketplace" && (
        <div className="flex flex-col gap-5">
          <div>
            <button onClick={() => go("product")} className="text-xs text-[#8899aa] hover:text-white flex items-center gap-1 mb-3">
              ← Назад
            </button>
            <h2 className="text-xl font-bold text-white mb-1">Уточните параметры</h2>
            <p className="text-sm text-[#8899aa]">Нужны для точного расчёта комиссии и доставки</p>
          </div>

          {/* Marketplace chips */}
          <div>
            <label className="text-xs font-medium text-[#8899aa] block mb-2">Где продаёте?</label>
            <div className="grid grid-cols-3 gap-2">
              {MARKETPLACES.map(mp => (
                <button
                  key={mp.id}
                  onClick={() => setS(p => ({ ...p, marketplace: mp.id }))}
                  className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl border text-xs font-medium transition-all ${
                    s.marketplace === mp.id
                      ? "border-[#00A86B] bg-[#00A86B]/15 text-[#00A86B]"
                      : "border-[#243a5e] text-[#8899aa] hover:border-[#00A86B]/40 hover:text-white"
                  }`}
                >
                  <span className="text-lg">{mp.icon}</span>
                  <span>{mp.label}</span>
                  {mp.commission > 0 && <span className="text-[10px] opacity-70">{mp.commission}%</span>}
                </button>
              ))}
            </div>
          </div>

          {/* City */}
          <div>
            <label className="text-xs font-medium text-[#8899aa] block mb-2">Куда доставить?</label>
            <input
              type="text"
              value={s.city_to}
              onChange={e => setS(p => ({ ...p, city_to: e.target.value }))}
              placeholder="Город назначения"
              className={inp()}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {CITY_CHIPS.map(city => (
                <button
                  key={city}
                  onClick={() => setS(p => ({ ...p, city_to: city }))}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
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

          <button
            onClick={handleMarketplaceSubmit}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#00A86B] hover:bg-[#008f59] text-white font-semibold rounded-xl transition-all"
          >
            🤖 Рассчитать Unit Economics
          </button>
        </div>
      )}

      {/* ── STEP: PREVIEW (результат без контакта) ──────────────────────────── */}
      {s.step === "preview" && ec && (
        <div className="flex flex-col gap-5">
          {/* Verdict */}
          <div className={`rounded-xl p-4 text-center border ${
            ec.verdict === "green"  ? "bg-emerald-900/20 border-emerald-700/40" :
            ec.verdict === "yellow" ? "bg-amber-900/20 border-amber-700/40" :
                                      "bg-red-900/20 border-red-700/40"
          }`}>
            <p className="text-3xl mb-1">{ec.verdict_emoji}</p>
            <p className={`font-bold text-lg mb-1 ${
              ec.verdict === "green" ? "text-emerald-400" : ec.verdict === "yellow" ? "text-amber-400" : "text-red-400"
            }`}>{ec.verdict_label}</p>
            <p className="text-sm text-[#8899aa]">
              {ec.verdict === "green"  ? "Товар имеет хороший потенциал для продажи" :
               ec.verdict === "yellow" ? "Возможна прибыль, но требует оптимизации" :
                                         "При текущих ценах рентабельность под вопросом"}
            </p>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Маржа",       value: `${ec.margin_pct.toFixed(1)}%`,          highlight: ec.verdict === "green" },
              { label: "ROI",         value: `${ec.roi_pct.toFixed(0)}%`,              highlight: false },
              { label: "Прибыль/шт", value: `${fmt(ec.net_profit_rub / ec.quantity)} ₽`, highlight: false },
            ].map(m => (
              <div key={m.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-[10px] text-[#8899aa] mb-1 uppercase tracking-wide">{m.label}</p>
                <p className={`text-lg font-bold ${m.highlight ? "text-[#00A86B]" : "text-white"}`}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* P&L preview */}
          <div className="rounded-xl border border-[#243a5e] overflow-hidden text-sm">
            <div className="px-4 py-2 bg-[#0B1F3A] border-b border-[#243a5e]">
              <p className="text-xs font-semibold text-[#8899aa] uppercase tracking-wide">
                Предварительный расчёт · {ec.quantity} шт · ориентировочно
              </p>
            </div>
            {[
              ["🛍️ Закупка",             `${fmt(ec.purchase_total_rub)} ₽`],
              ["🚚 Доставка",             s.delivery?.hasRate ? `${fmt(ec.delivery_total_rub)} ₽` : "уточняется"],
              ["🏛️ Таможня (~20%)",      `${fmt(ec.customs_rub)} ₽`],
              ["🏪 Комиссия площадки",    `${fmt(ec.marketplace_fee_rub)} ₽`],
              ["💰 Полная себестоимость", `${fmt(ec.total_cost_rub)} ₽`],
              ["💵 Выручка",             `${fmt(ec.gross_revenue_rub)} ₽`],
            ].map(([l, v]) => (
              <div key={l as string} className="flex justify-between px-4 py-2 border-b border-[#243a5e]/40 last:border-0">
                <span className="text-[#8899aa]">{l}</span>
                <span className="text-white font-medium">{v}</span>
              </div>
            ))}
            <div className={`flex justify-between px-4 py-3 font-bold text-sm ${
              ec.net_profit_rub >= 0 ? "bg-emerald-900/20 text-emerald-400" : "bg-red-900/20 text-red-400"
            }`}>
              <span>🎯 Чистая прибыль</span>
              <span>{ec.net_profit_rub >= 0 ? "+" : ""}{fmt(ec.net_profit_rub)} ₽ · {ec.margin_pct.toFixed(1)}%</span>
            </div>
          </div>

          {!s.delivery?.hasRate && (
            <p className="text-xs text-amber-400/80 bg-amber-900/10 border border-amber-700/20 rounded-xl px-4 py-2">
              ⚠️ Стоимость доставки в расчёт не включена — уточняется менеджером
            </p>
          )}

          {/* CTA to get full result + contact */}
          <div className="bg-[#00A86B]/5 border border-[#00A86B]/20 rounded-xl p-4">
            <p className="text-sm font-semibold text-white mb-1">Получить полный расчёт и сохранить анализ</p>
            <p className="text-xs text-[#8899aa] mb-3">Менеджер свяжется и подберёт точную стоимость доставки</p>
            <button
              onClick={() => { analytics.aiFunnelFullCalc({ verdict: ec.verdict }); go("contact"); }}
              className="w-full py-3 bg-[#00A86B] hover:bg-[#008f59] text-white font-semibold rounded-xl transition-all text-sm"
            >
              📩 Получить полный расчёт
            </button>
          </div>

          {/* Bad economy: supplier finder CTA */}
          {ec.verdict === "red" && (
            <button
              onClick={() => { analytics.aiFunnelSupplierClick(); window.location.href = "/supplier-finder"; }}
              className="w-full py-2.5 border border-[#243a5e] hover:border-[#00A86B]/50 text-[#8899aa] hover:text-white text-sm rounded-xl transition-all"
            >
              🔍 Найти поставщика дешевле →
            </button>
          )}

          <button onClick={() => go("input")} className="text-xs text-[#8899aa] hover:text-white text-center underline">
            Рассчитать другой товар
          </button>
        </div>
      )}

      {/* ── STEP: CONTACT ───────────────────────────────────────────────────── */}
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
            <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Телефон</label>
            <input type="tel" value={s.phone} onChange={e => setS(p => ({ ...p, phone: e.target.value }))}
              placeholder="+7 (999) 000-00-00" className={inp()} />
            <p className="text-[11px] text-[#8899aa] mt-1">* Укажите Telegram или телефон — что удобнее</p>
          </div>
          <div>
            <label className="text-xs font-medium text-[#8899aa] block mb-1.5">Имя</label>
            <input type="text" value={s.name} onChange={e => setS(p => ({ ...p, name: e.target.value }))}
              placeholder="Как вас зовут?" className={inp()} />
          </div>

          {s.error && <p className="text-red-400 text-xs">{s.error}</p>}

          <button
            onClick={handleContactSubmit}
            className="w-full py-3.5 bg-[#00A86B] hover:bg-[#008f59] text-white font-semibold rounded-xl transition-all"
          >
            Отправить и получить расчёт
          </button>
          <p className="text-center text-xs text-[#8899aa]">
            Нажимая кнопку, вы соглашаетесь с{" "}
            <a href="/privacy" className="text-[#00A86B] hover:underline">политикой конфиденциальности</a>
          </p>
        </div>
      )}

      {/* ── STEP: SUCCESS ───────────────────────────────────────────────────── */}
      {s.step === "success" && ec && (
        <div className="flex flex-col gap-5 text-center">
          <div className="w-16 h-16 rounded-full bg-[#00A86B]/20 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-[#00A86B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-1">Анализ сохранён!</h2>
            <p className="text-sm text-[#8899aa]">Менеджер ChinaBridge свяжется с вами в течение 15 минут</p>
          </div>

          {/* Final P&L */}
          <div className={`rounded-xl p-4 border ${
            ec.verdict === "green"  ? "bg-emerald-900/20 border-emerald-700/40" :
            ec.verdict === "yellow" ? "bg-amber-900/20 border-amber-700/40" :
                                      "bg-red-900/20 border-red-700/40"
          }`}>
            <p className="text-2xl mb-1">{ec.verdict_emoji}</p>
            <p className={`font-bold text-lg ${
              ec.verdict === "green" ? "text-emerald-400" : ec.verdict === "yellow" ? "text-amber-400" : "text-red-400"
            }`}>{ec.verdict_label}</p>
            <p className="text-white font-semibold mt-1">Маржа {ec.margin_pct.toFixed(1)}% · ROI {ec.roi_pct.toFixed(0)}%</p>
            {ec.ai_analysis && (
              <p className="text-xs text-[#8899aa] mt-2 leading-relaxed">{ec.ai_analysis}</p>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            {ec.verdict !== "red" ? (
              <button
                onClick={() => { analytics.aiFunnelImportClick(); window.location.href = "/"; }}
                className="w-full py-3 bg-[#00A86B] hover:bg-[#008f59] text-white font-semibold rounded-xl transition-all"
              >
                🚀 Запустить импорт
              </button>
            ) : (
              <button
                onClick={() => { analytics.aiFunnelSupplierClick(); window.location.href = "/supplier-finder"; }}
                className="w-full py-3 bg-[#00A86B] hover:bg-[#008f59] text-white font-semibold rounded-xl transition-all"
              >
                🔍 Найти поставщика дешевле
              </button>
            )}
            <a
              href="https://t.me/ChinaBridgeLID_bot"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => analytics.telegramClick()}
              className="w-full py-2.5 border border-[#243a5e] hover:border-[#00A86B]/50 text-white hover:bg-white/5 text-sm rounded-xl transition-all"
            >
              Написать менеджеру в Telegram
            </a>
          </div>

          <button
            onClick={() => { setS(p => ({ ...p, step: "input", economics: null, delivery: null, leadId: null, error: null, urlInput: "", descInput: "" })); startedRef.current = false; }}
            className="text-xs text-[#8899aa] hover:text-white underline"
          >
            Рассчитать другой товар
          </button>
        </div>
      )}
    </div>
  );
}
