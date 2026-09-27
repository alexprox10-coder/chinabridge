"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const FREE_LIMIT = 3;
const STORAGE_KEY = "cb_invoice_uses";

function getUsageCount(): number {
  try { return parseInt(localStorage.getItem(STORAGE_KEY) ?? "0", 10) || 0; } catch { return 0; }
}
function incrementUsage(): number {
  try {
    const n = getUsageCount() + 1;
    localStorage.setItem(STORAGE_KEY, String(n));
    return n;
  } catch { return FREE_LIMIT + 1; }
}

// ── Copy helper ──────────────────────────────────────────────────────────────
function CopyBtn({ text, small }: { text: string; small?: boolean }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); }
    catch { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); }
    setDone(true); setTimeout(() => setDone(false), 1800);
  };
  return (
    <button onClick={copy} title="Копировать" style={{
      background: done ? "rgba(0,168,107,0.15)" : "rgba(255,255,255,0.05)",
      border: `1px solid ${done ? "#00A86B55" : "#243a5e"}`,
      borderRadius: "6px", padding: small ? "2px 7px" : "4px 10px",
      color: done ? "#00A86B" : "#64748b", fontSize: small ? "10px" : "11px",
      cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s",
    }}>
      {done ? "✓" : "📋"}
    </button>
  );
}

// ── Paywall modal ────────────────────────────────────────────────────────────
function PaywallModal({ onClose }: { onClose: () => void }) {
  const [tg, setTg] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handlePay() {
    setLoading(true); setErr("");
    try {
      const res = await fetch("/api/payments/calculator-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegram: tg.trim().replace(/^@/, ""), from: "invoice" }),
      });
      const data = await res.json() as { ok: boolean; paymentLink?: string; operationId?: string };
      if (data.ok && data.paymentLink) {
        try { localStorage.setItem("cb_pending_op_id", data.operationId ?? ""); } catch { /* ignore */ }
        window.location.href = data.paymentLink;
      } else {
        setErr("Не удалось создать платёж. Попробуйте ещё раз.");
        setLoading(false);
      }
    } catch {
      setErr("Ошибка сети. Попробуйте ещё раз.");
      setLoading(false);
    }
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.80)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "24px", backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#060f1e", border: "1px solid #1e3a5f", borderRadius: "20px", maxWidth: "400px", width: "100%", overflow: "hidden" }}>

        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #1e3a5f", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", color: "#5a7899", fontSize: "20px", cursor: "pointer", lineHeight: 1 }}>×</button>
          <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
            {[0,1,2].map(i => <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#00A86B" }} />)}
          </div>
          <div style={{ fontWeight: 700, fontSize: "17px", marginBottom: "6px" }}>ChinaBridge PRO — Инструменты</div>
          <p style={{ color: "#8899aa", fontSize: "13px", lineHeight: 1.5 }}>
            Вы использовали все 3 бесплатных распознавания. PRO — безлимитно, с историей и поддержкой.{" "}
            <span style={{ color: "#fff", fontWeight: 700 }}>990 ₽/мес</span>
          </p>
        </div>

        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>

          <a href="https://t.me/ChinaBridgeLID_bot?start=pro_invoice"
            target="_blank" rel="noopener noreferrer"
            style={{ display: "block", background: "rgba(0,168,107,0.1)", border: "1px solid rgba(0,168,107,0.4)", borderRadius: "14px", padding: "14px", textDecoration: "none" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "22px" }}>🚢</span>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: "14px", marginBottom: "3px" }}>Нужна поставка из Китая?</div>
                <div style={{ color: "#8899aa", fontSize: "12px", lineHeight: 1.5 }}>Менеджер рассчитает и организует — расчёт за 15 мин, без предоплаты</div>
                <div style={{ color: "#00A86B", fontSize: "12px", fontWeight: 600, marginTop: "8px" }}>→ Написать менеджеру</div>
              </div>
            </div>
          </a>

          <div style={{ background: "rgba(34,158,217,0.08)", border: "1px solid rgba(34,158,217,0.35)", borderRadius: "14px", padding: "14px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "12px" }}>
              <span style={{ fontSize: "22px" }}>📊</span>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: "14px" }}>PRO — <span style={{ color: "#229ED9" }}>490 ₽</span> <span style={{ color: "#5a7899", textDecoration: "line-through", fontWeight: 400, fontSize: "13px" }}>990 ₽</span> <span style={{ color: "#8899aa", fontSize: "11px" }}>первый месяц</span></div>
                <div style={{ color: "#8899aa", fontSize: "12px", marginTop: "2px" }}>Безлимит · Копирование · Скачивание данных</div>
              </div>
            </div>
            <input
              type="text"
              placeholder="Telegram @username (для кода активации)"
              value={tg}
              onChange={e => setTg(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", background: "#0b1a2e", border: "1px solid #243a5e", borderRadius: "10px", color: "#fff", fontSize: "13px", outline: "none", marginBottom: "8px", boxSizing: "border-box" }}
            />
            {err && <p style={{ color: "#f87171", fontSize: "12px", marginBottom: "8px" }}>{err}</p>}
            <button
              onClick={handlePay}
              disabled={loading}
              style={{ width: "100%", background: loading ? "#1e3a5f" : "#229ED9", color: loading ? "#475569" : "#fff", border: "none", borderRadius: "10px", padding: "12px", fontSize: "14px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}
            >
              {loading ? "Переходим к оплате…" : "Оплатить 490 ₽ →"}
            </button>
            <div style={{ textAlign: "center", marginTop: "8px" }}>
              <a href="/client/login?from=/tools/invoice" style={{ color: "#5a7899", fontSize: "11px" }}>Войти в аккаунт</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────
interface InvoiceItem {
  description_zh: string;
  description_ru: string;
  hs_code_hint: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  weight_kg: number;
}

interface Invoice {
  supplier_name: string;
  supplier_name_ru: string;
  invoice_number: string;
  invoice_date: string | null;
  currency: string;
  total_value: number;
  total_weight_kg: number;
  total_pieces: number;
  incoterms: string | null;
  origin_city: string;
  items: InvoiceItem[];
  notes: string;
}

interface Quote {
  id: string;
  label: string;
  flag: string;
  rate_usd_per_kg: number;
  days_min: number;
  days_max: number;
  min_kg: number;
  note: string;
  cost_usd: number;
  billable_kg: number;
  below_min: boolean;
  highlight?: boolean;
  destination?: string;
}

interface CustomsBreakdown {
  duty: number; vat: number; broker: number; fees: number; total: number;
}

interface LandedCost {
  route_id: string;
  goods_usd: number;
  shipping_usd: number;
  customs_usd: number;
  customs_breakdown: CustomsBreakdown;
  total_usd: number;
  per_unit_usd: number;
  per_unit_rub: number;
  pieces: number;
}

interface Result {
  invoice: Invoice;
  quotes: Quote[];
  weight_kg: number;
  landed_costs?: LandedCost[];
  usd_rub?: number;
}

// ── Styles ───────────────────────────────────────────────────────────────────
const S = {
  page: { background: "#0B1F3A", minHeight: "100vh", color: "#fff", fontFamily: "system-ui, -apple-system, sans-serif" } as React.CSSProperties,
  nav: { borderBottom: "1px solid #243a5e", padding: "14px 32px", display: "flex", alignItems: "center", gap: "12px" } as React.CSSProperties,
  section: { maxWidth: "1100px", margin: "0 auto", padding: "0 24px" } as React.CSSProperties,
  label: { color: "#475569", fontSize: "11px", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: "8px" },
  card: { background: "#0f2644", border: "1px solid #243a5e", borderRadius: "14px", padding: "24px" } as React.CSSProperties,
};

// ── Download helpers ─────────────────────────────────────────────────────────
function downloadJSON(result: Result) {
  const blob = new Blob([JSON.stringify({ invoice: result.invoice, quotes: result.quotes }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `invoice-${result.invoice.invoice_number || "export"}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadCSV(result: Result) {
  const inv = result.invoice;
  const cur = inv.currency || "USD";
  const header = ["#", "Товар (RU)", "中文", "Код HS", "Кол-во", "Ед.", `Цена (${cur})`, `Сумма (${cur})`, "Вес кг"];
  const rows = (inv.items || []).map((item, i) => [
    i + 1,
    item.description_ru || "",
    item.description_zh || "",
    item.hs_code_hint || "",
    item.quantity,
    item.unit,
    item.unit_price,
    item.total_price,
    item.weight_kg,
  ]);
  const summary = [
    [],
    ["Поставщик", inv.supplier_name_ru || inv.supplier_name || ""],
    ["Инвойс №", inv.invoice_number || ""],
    ["Дата", inv.invoice_date || ""],
    ["Итого", inv.total_value, cur],
    ["Вес брутто кг", inv.total_weight_kg || result.weight_kg || ""],
    ["Инкотермс", inv.incoterms || ""],
    ["Город отправки", inv.origin_city || ""],
    [],
    ["Маршрут", "Стоимость USD", "Срок (дней)", "Тариф USD/кг"],
    ...result.quotes.map(q => [q.flag + " " + q.label, q.cost_usd, `${q.days_min}–${q.days_max}`, q.rate_usd_per_kg]),
  ];
  const escCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csvRows = [header, ...rows, ...summary].map(r => r.map(escCell).join(","));
  const csv = "﻿" + csvRows.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `invoice-${inv.invoice_number || "export"}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function buildCopyText(result: Result): string {
  const inv = result.invoice;
  const cur = inv.currency || "USD";
  const lines: string[] = [
    `📄 Инвойс ${inv.invoice_number || "—"} от ${inv.invoice_date || "—"}`,
    `Поставщик: ${inv.supplier_name_ru || inv.supplier_name || "—"}`,
    `Сумма: ${cur} ${inv.total_value || "—"}`,
    `Вес: ${inv.total_weight_kg || result.weight_kg || "—"} кг`,
    `Инкотермс: ${inv.incoterms || "—"} · Отправка: ${inv.origin_city || "Китай"}`,
    "",
    "Позиции:",
    ...(inv.items || []).map((item, i) =>
      `  ${i + 1}. ${item.description_ru || item.description_zh || "—"} — ${item.quantity} ${item.unit} × ${cur} ${item.unit_price} = ${cur} ${item.total_price}`
    ),
    "",
    "Доставка:",
    ...result.quotes.map(q => `  ${q.flag} ${q.label}: $${q.cost_usd} (${q.days_min}–${q.days_max} дн.)`),
    ...(result.landed_costs ? [
      "",
      "Себестоимость (Landed Cost):",
      ...result.landed_costs.map(lc => {
        const q = result.quotes.find(q => q.id === lc.route_id);
        return `  ${q?.flag ?? ""} ${q?.label ?? lc.route_id}: ${lc.per_unit_rub.toLocaleString()} ₽/шт · $${lc.per_unit_usd} (${lc.pieces} шт, ИТОГО $${lc.total_usd})`;
      }),
    ] : []),
  ];
  return lines.join("\n");
}

// ── Landed Cost Section ──────────────────────────────────────────────────────
function LandedCostSection({ result }: { result: Result }) {
  const [activeRoute, setActiveRoute] = useState(result.quotes[0]?.id ?? "");
  const [sellPrice, setSellPrice] = useState("");

  const lc = result.landed_costs?.find(l => l.route_id === activeRoute);
  const q  = result.quotes.find(q => q.id === activeRoute);
  const usdRub = result.usd_rub ?? 90;

  if (!lc || !q) return null;

  const sellPriceNum = parseFloat(sellPrice) || 0;
  const margin = sellPriceNum > 0 ? ((sellPriceNum - lc.per_unit_rub) / sellPriceNum * 100) : null;
  const profit = sellPriceNum > 0 ? ((sellPriceNum - lc.per_unit_rub) * lc.pieces) : null;

  const rows = [
    { label: "Стоимость товара", usd: lc.goods_usd, rub: Math.round(lc.goods_usd * usdRub), note: result.invoice.currency !== "USD" ? `${result.invoice.currency} ${result.invoice.total_value}` : "" },
    { label: "Логистика", usd: lc.shipping_usd, rub: Math.round(lc.shipping_usd * usdRub), note: `${q.days_min}–${q.days_max} дн.` },
    { label: "Таможня (оценка)", usd: lc.customs_usd, rub: Math.round(lc.customs_usd * usdRub), note: "пошлина + НДС + брокер" },
  ];

  const tgLink = `https://t.me/ChinaBridgeLID_bot?start=calc_${lc.route_id}_${lc.total_usd}_${encodeURIComponent(result.invoice.supplier_name_ru || result.invoice.supplier_name || "invoice")}`;

  return (
    <div style={{ ...S.card, border: "1px solid #00A86B44", marginTop: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "18px", marginBottom: "4px" }}>Landed Cost — полная себестоимость поставки</div>
          <div style={{ color: "#64748b", fontSize: "13px" }}>Товар + логистика + таможня = реальная цена на складе</div>
        </div>
        <div style={{ background: "rgba(0,168,107,0.1)", border: "1px solid #00A86B44", borderRadius: "10px", padding: "10px 18px", textAlign: "center" }}>
          <div style={{ color: "#64748b", fontSize: "11px", marginBottom: "2px" }}>СЕБЕСТОИМОСТЬ / шт</div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "#00A86B" }}>{lc.per_unit_rub.toLocaleString()} ₽</div>
          <div style={{ color: "#475569", fontSize: "11px" }}>${lc.per_unit_usd} · {lc.pieces} шт.</div>
        </div>
      </div>

      {/* Route tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {result.quotes.map(route => (
          <button
            key={route.id}
            onClick={() => setActiveRoute(route.id)}
            style={{
              padding: "7px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
              background: activeRoute === route.id ? "#00A86B" : "#0B1F3A",
              color: activeRoute === route.id ? "#fff" : "#64748b",
              border: `1px solid ${activeRoute === route.id ? "#00A86B" : "#243a5e"}`,
            }}
          >
            {route.flag} {route.label}
            {route.highlight && activeRoute !== route.id && (
              <span style={{ marginLeft: "6px", background: "#00A86B22", color: "#00A86B", borderRadius: "4px", padding: "1px 5px", fontSize: "10px" }}>NEW</span>
            )}
          </button>
        ))}
      </div>

      {/* Breakdown table */}
      <div style={{ background: "#0B1F3A", borderRadius: "10px", overflow: "hidden", marginBottom: "20px" }}>
        {rows.map((row, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: i < rows.length - 1 ? "1px solid #1e3a5f" : "none" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 500 }}>{row.label}</div>
              {row.note && <div style={{ fontSize: "11px", color: "#475569", marginTop: "2px" }}>{row.note}</div>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 600, fontSize: "14px" }}>{row.rub.toLocaleString()} ₽</div>
              <div style={{ color: "#475569", fontSize: "11px" }}>${row.usd}</div>
            </div>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "#0f2644", borderTop: "2px solid #243a5e" }}>
          <div style={{ fontWeight: 700, fontSize: "15px" }}>ИТОГО на складе РФ/КЗ</div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 800, fontSize: "18px", color: "#fff" }}>{Math.round(lc.total_usd * usdRub).toLocaleString()} ₽</div>
            <div style={{ color: "#64748b", fontSize: "12px" }}>${lc.total_usd} · при курсе {usdRub} ₽/USD</div>
          </div>
        </div>
      </div>

      {/* Customs detail */}
      <details style={{ marginBottom: "20px" }}>
        <summary style={{ cursor: "pointer", color: "#64748b", fontSize: "12px", marginBottom: "8px" }}>▸ Детализация таможни</summary>
        <div style={{ background: "#0B1F3A", borderRadius: "8px", padding: "12px 16px", fontSize: "12px" }}>
          {[
            ["Таможенная пошлина (10% от CIF)", `$${lc.customs_breakdown.duty}`],
            [q.destination === "ru" ? "НДС 20%" : "НДС 12%", `$${lc.customs_breakdown.vat}`],
            ["Таможенный брокер", `$${lc.customs_breakdown.broker}`],
            ["Таможенные сборы", `$${lc.customs_breakdown.fees}`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #1e3a5f" }}>
              <span style={{ color: "#64748b" }}>{k}</span>
              <span>{v}</span>
            </div>
          ))}
          <div style={{ color: "#475569", fontSize: "11px", marginTop: "8px" }}>* Оценочный расчёт. Фактическая ставка пошлины зависит от HS-кода. За точным расчётом обратитесь к брокеру.</div>
        </div>
      </details>

      {/* Margin calculator */}
      <div style={{ background: "#060f1e", border: "1px solid #1e3a5f", borderRadius: "10px", padding: "16px" }}>
        <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "12px" }}>Калькулятор маржи</div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 180px" }}>
            <div style={{ color: "#64748b", fontSize: "11px", marginBottom: "4px" }}>Планируемая цена продажи (₽/шт)</div>
            <input
              type="number"
              placeholder="например 1 290"
              value={sellPrice}
              onChange={e => setSellPrice(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", background: "#0B1F3A", border: "1px solid #243a5e", borderRadius: "8px", color: "#fff", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ flex: "1 1 120px", background: "#0B1F3A", borderRadius: "8px", padding: "10px 14px" }}>
            <div style={{ color: "#64748b", fontSize: "11px", marginBottom: "2px" }}>Себестоимость</div>
            <div style={{ fontWeight: 700 }}>{lc.per_unit_rub.toLocaleString()} ₽</div>
          </div>
          {margin !== null && (
            <>
              <div style={{ flex: "1 1 120px", background: margin >= 25 ? "rgba(0,168,107,0.1)" : margin >= 10 ? "rgba(251,191,36,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${margin >= 25 ? "#00A86B44" : margin >= 10 ? "rgba(251,191,36,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: "8px", padding: "10px 14px" }}>
                <div style={{ color: "#64748b", fontSize: "11px", marginBottom: "2px" }}>Маржа</div>
                <div style={{ fontWeight: 800, fontSize: "18px", color: margin >= 25 ? "#00A86B" : margin >= 10 ? "#fbbf24" : "#ef4444" }}>{margin.toFixed(1)}%</div>
              </div>
              <div style={{ flex: "1 1 140px", background: "#0B1F3A", borderRadius: "8px", padding: "10px 14px" }}>
                <div style={{ color: "#64748b", fontSize: "11px", marginBottom: "2px" }}>Прибыль с партии</div>
                <div style={{ fontWeight: 700, color: profit! >= 0 ? "#00A86B" : "#ef4444" }}>{Math.round(profit!).toLocaleString()} ₽</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* CTA */}
      <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
        <a
          href={tgLink}
          target="_blank" rel="noopener noreferrer"
          style={{ flex: "1 1 200px", display: "block", background: "#00A86B", color: "#fff", borderRadius: "10px", padding: "14px 20px", textAlign: "center", textDecoration: "none", fontWeight: 700, fontSize: "14px" }}
        >
          🚢 Заказать доставку у ChinaBridge
        </a>
        <div style={{ flex: "0 0 auto", background: "rgba(0,168,107,0.08)", border: "1px solid #00A86B33", borderRadius: "10px", padding: "10px 14px", fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center" }}>
          Если оформляете доставку у нас — <span style={{ color: "#00A86B", fontWeight: 600, marginLeft: "4px" }}>Import Passport бесплатно</span>
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function InvoicePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [usesLeft, setUsesLeft] = useState<number>(FREE_LIMIT);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [proUntil, setProUntil] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUsesLeft(Math.max(0, FREE_LIMIT - getUsageCount()));

    // Check PRO status via server (reads httpOnly cookie cb_anon_paid_until)
    fetch("/api/calc/check-paid")
      .then(r => r.json())
      .then((d: { isPaid?: boolean; paidUntil?: string }) => {
        if (d.isPaid) { setIsPro(true); setProUntil(d.paidUntil ?? null); }
      })
      .catch(() => null);

    // Show success toast after redirect from invoice-success
    const params = new URLSearchParams(window.location.search);
    if (params.get("pay") === "success") {
      setSuccessToast(true);
      setIsPro(true);
      setTimeout(() => setSuccessToast(false), 6000);
      // Clean URL
      window.history.replaceState({}, "", "/tools/invoice");
    }
  }, []);

  const handleFile = useCallback((f: File) => {
    setFile(f); setResult(null); setError(null);
    setPreview(URL.createObjectURL(f));
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const analyze = async () => {
    if (!file) return;
    if (!isPro && getUsageCount() >= FREE_LIMIT) { setShowPaywall(true); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const resp = await fetch("/api/tools/invoice", { method: "POST", body: fd });
      const data = await resp.json() as Result & { error?: string };

      // 402 = server-side limit reached (bypassed client check or incognito)
      if (resp.status === 402) {
        setShowPaywall(true);
        return;
      }

      if (!resp.ok || data.error) { setError(data.error ?? "Ошибка распознавания"); }
      else {
        if (!isPro) {
          const newCount = incrementUsage();
          setUsesLeft(Math.max(0, FREE_LIMIT - newCount));
        }
        setResult(data);
      }
    } catch { setError("Нет связи с сервером. Попробуйте ещё раз."); }
    finally { setLoading(false); }
  };

  const reset = () => { setFile(null); setPreview(null); setResult(null); setError(null); };

  const fmt = (n: number | null | undefined, currency = "USD") =>
    !n ? "—" : `${currency} ${n.toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  const scrollToUpload = () => uploadRef.current?.scrollIntoView({ behavior: "smooth" });

  const proExpiry = proUntil ? new Date(proUntil).toLocaleDateString("ru-RU") : null;

  return (
    <main style={S.page}>
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}

      {/* Success toast */}
      {successToast && (
        <div style={{ position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)", background: "#00A86B", color: "#fff", borderRadius: "12px", padding: "12px 24px", fontWeight: 700, fontSize: "15px", zIndex: 2000, boxShadow: "0 8px 32px rgba(0,168,107,0.4)", animation: "slideDown 0.3s ease" }}>
          🎉 PRO активирован! Безлимитные распознавания включены.
        </div>
      )}

      {/* ── Nav ── */}
      <div style={S.nav}>
        <a href="/" style={{ color: "#00A86B", fontSize: "14px", textDecoration: "none" }}>← ChinaBridge</a>
        <span style={{ color: "#243a5e" }}>|</span>
        <a href="/tools" style={{ color: "#94a3b8", fontSize: "14px", textDecoration: "none" }}>Инструменты</a>
        <span style={{ color: "#243a5e" }}>|</span>
        <span style={{ fontSize: "14px" }}>Распознавание инвойса</span>
        {isPro && (
          <span style={{ marginLeft: "auto", background: "rgba(0,168,107,0.15)", border: "1px solid #00A86B44", borderRadius: "20px", padding: "3px 12px", fontSize: "12px", color: "#00A86B", fontWeight: 600 }}>
            ✓ PRO{proExpiry ? ` · до ${proExpiry}` : ""}
          </span>
        )}
      </div>

      {/* ── Hero ── */}
      <div style={{ padding: "64px 24px 0", ...S.section }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "48px", alignItems: "center" }}>

          <div>
            <div style={{ display: "inline-block", background: "#0f2644", border: "1px solid #243a5e", borderRadius: "20px", padding: "5px 14px", fontSize: "13px", color: "#94a3b8", marginBottom: "20px" }}>
              Для импортёров, работающих с Китаем
            </div>
            <h1 style={{ fontSize: "clamp(30px, 4.5vw, 52px)", fontWeight: 800, lineHeight: 1.1, marginBottom: "20px" }}>
              Загрузи инвойс —<br />
              узнай реальную<br />
              <span style={{ color: "#00A86B" }}>себестоимость поставки</span>
            </h1>
            <p style={{ color: "#94a3b8", fontSize: "17px", lineHeight: 1.7, maxWidth: "520px", marginBottom: "32px" }}>
              Товар + доставка + таможня = цена единицы на твоём складе. Загружаешь фото инвойса из WeChat — через 30 секунд видишь сколько реально стоит эта поставка и стоит ли её везти.
            </p>
            <div style={{ display: "flex", gap: "32px" }}>
              {[
                { v: "₽/шт", l: "Себестоимость единицы" },
                { v: "4 маршрута", l: "Хэйхэ, авто, авиа, КЗ" },
                { v: "+ маржа", l: "Введи цену — увидишь прибыль" },
              ].map(({ v, l }) => (
                <div key={l}>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#00A86B" }}>{v}</div>
                  <div style={{ color: "#64748b", fontSize: "12px", marginTop: "2px" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero upload card */}
          <div style={{ background: "#0f2644", border: `1px solid ${isPro ? "#00A86B44" : "#243a5e"}`, borderRadius: "20px", padding: "28px" }}>
            {isPro && (
              <div style={{ background: "rgba(0,168,107,0.12)", borderRadius: "10px", padding: "8px 14px", fontSize: "12px", color: "#00A86B", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                ✓ PRO — безлимитные распознавания{proExpiry ? ` до ${proExpiry}` : ""}
              </div>
            )}
            <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "4px" }}>Загрузить инвойс</div>
            <div style={{ color: "#64748b", fontSize: "13px", marginBottom: "20px" }}>Фото из WeChat, скан, скриншот</div>

            <div
              ref={uploadRef}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => !file && inputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? "#00A86B" : "#243a5e"}`,
                borderRadius: "12px",
                padding: preview ? "16px" : "32px 16px",
                textAlign: "center",
                cursor: file ? "default" : "pointer",
                background: dragging ? "rgba(0,168,107,0.05)" : "#0B1F3A",
                transition: "all 0.2s",
                marginBottom: "16px",
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,.jpg,.jpeg,.png,.webp,.heic"
                style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              {preview ? (
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="preview" style={{ maxHeight: "150px", maxWidth: "100%", borderRadius: "8px", objectFit: "contain", marginBottom: "10px" }} />
                  <div>
                    <button onClick={(e) => { e.stopPropagation(); reset(); }}
                      style={{ background: "none", border: "1px solid #243a5e", color: "#94a3b8", padding: "4px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>
                      Заменить
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: "36px", marginBottom: "10px" }}>📄</div>
                  <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "6px" }}>Перетащи или нажми для выбора</div>
                  <div style={{ color: "#64748b", fontSize: "12px" }}>JPG, PNG, WEBP, HEIC · до 10 MB</div>
                </div>
              )}
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px 14px", color: "#fca5a5", fontSize: "13px", marginBottom: "12px" }}>
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={analyze}
              disabled={!file || loading}
              style={{
                width: "100%", background: !file || loading ? "#1e3a5f" : "#00A86B",
                color: !file || loading ? "#475569" : "#fff",
                border: "none", borderRadius: "10px", padding: "14px",
                fontSize: "15px", fontWeight: 700, cursor: !file || loading ? "not-allowed" : "pointer", transition: "all 0.2s",
              }}
            >
              {loading ? "Считаем себестоимость…" : "Распознать и рассчитать Landed Cost →"}
            </button>

            <p style={{ textAlign: "center", color: "#334155", fontSize: "11px", marginTop: "10px" }}>
              {isPro
                ? <span style={{ color: "#00A86B66" }}>PRO · безлимитно · файл не сохраняется</span>
                : usesLeft > 0
                  ? <>Осталось бесплатно: <span style={{ color: "#64748b", fontWeight: 600 }}>{usesLeft} из {FREE_LIMIT}</span> · Файл не сохраняется</>
                  : <><span style={{ color: "#f59e0b" }}>🔒 Лимит исчерпан — </span><button onClick={() => setShowPaywall(true)} style={{ background: "none", border: "none", color: "#00A86B", fontWeight: 600, cursor: "pointer", fontSize: "11px", padding: 0 }}>Перейти на PRO</button></>
              }
            </p>
          </div>
        </div>
      </div>

      {/* ── Result ── */}
      {result && (
        <div style={{ ...S.section, padding: "48px 24px" }}>

          {/* Action bar */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }}>
            <span style={{ color: "#64748b", fontSize: "13px", marginRight: "4px" }}>Экспорт:</span>
            <button
              onClick={() => downloadCSV(result)}
              style={{ display: "flex", alignItems: "center", gap: "6px", background: "#0f2644", border: "1px solid #243a5e", borderRadius: "8px", padding: "7px 14px", color: "#94a3b8", fontSize: "13px", cursor: "pointer", fontWeight: 500 }}
            >
              📊 Скачать CSV
            </button>
            <button
              onClick={() => downloadJSON(result)}
              style={{ display: "flex", alignItems: "center", gap: "6px", background: "#0f2644", border: "1px solid #243a5e", borderRadius: "8px", padding: "7px 14px", color: "#94a3b8", fontSize: "13px", cursor: "pointer", fontWeight: 500 }}
            >
              { } Скачать JSON
            </button>
            <CopyBtn text={buildCopyText(result)} />
            <span style={{ color: "#334155", fontSize: "12px", marginLeft: "4px" }}>Скопировать всё</span>
            <button onClick={reset} style={{ marginLeft: "auto", background: "transparent", color: "#64748b", border: "1px solid #1e3a5f", borderRadius: "8px", padding: "7px 14px", fontSize: "13px", cursor: "pointer" }}>
              ← Новый инвойс
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" }}>
            <div>
              {/* Summary card */}
              <div style={{ ...S.card, marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                  <div>
                    <div style={{ ...S.label }}>Поставщик</div>
                    <div style={{ fontWeight: 700, fontSize: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
                      {result.invoice.supplier_name_ru || result.invoice.supplier_name || "—"}
                      <CopyBtn text={result.invoice.supplier_name_ru || result.invoice.supplier_name || ""} small />
                    </div>
                    {result.invoice.supplier_name && result.invoice.supplier_name !== result.invoice.supplier_name_ru && (
                      <div style={{ color: "#94a3b8", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                        {result.invoice.supplier_name}
                        <CopyBtn text={result.invoice.supplier_name} small />
                      </div>
                    )}
                  </div>
                  <div style={{ background: "#00A86B22", border: "1px solid #00A86B44", borderRadius: "8px", padding: "6px 14px", color: "#00A86B", fontSize: "13px", fontWeight: 600 }}>✓ Распознано</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "16px" }}>
                  {[
                    { label: "Инвойс №", value: result.invoice.invoice_number || "—", copy: result.invoice.invoice_number },
                    { label: "Дата", value: result.invoice.invoice_date || "—", copy: result.invoice.invoice_date },
                    { label: "Сумма", value: fmt(result.invoice.total_value, result.invoice.currency), copy: `${result.invoice.currency} ${result.invoice.total_value}` },
                    { label: "Вес (брутто)", value: result.weight_kg ? `${result.weight_kg} кг` : "—", copy: result.weight_kg ? `${result.weight_kg} кг` : "" },
                    { label: "Кол-во мест", value: result.invoice.total_pieces ? `${result.invoice.total_pieces}` : "—", copy: String(result.invoice.total_pieces || "") },
                    { label: "Инкотермс", value: result.invoice.incoterms || "—", copy: result.invoice.incoterms || "" },
                    { label: "Город отправки", value: result.invoice.origin_city || "Китай", copy: result.invoice.origin_city || "" },
                  ].map(({ label, value, copy }) => (
                    <div key={label}>
                      <div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>{label}</div>
                      <div style={{ fontWeight: 600, fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                        {value}
                        {copy && <CopyBtn text={copy} small />}
                      </div>
                    </div>
                  ))}
                </div>
                {result.invoice.notes && (
                  <div style={{ marginTop: "16px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "8px", padding: "10px 14px", color: "#fbbf24", fontSize: "13px" }}>
                    💡 {result.invoice.notes}
                  </div>
                )}
              </div>

              {/* Items table */}
              {result.invoice.items?.length > 0 && (
                <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid #243a5e", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontWeight: 600 }}>Позиции инвойса</span>
                    <span style={{ color: "#64748b", fontSize: "13px" }}>{result.invoice.items.length} поз.</span>
                    <div style={{ marginLeft: "auto" }}>
                      <CopyBtn
                        text={result.invoice.items.map((item, i) =>
                          `${i+1}. ${item.description_ru || item.description_zh} — ${item.quantity} ${item.unit} × ${result.invoice.currency} ${item.unit_price} = ${result.invoice.currency} ${item.total_price}`
                        ).join("\n")}
                        small
                      />
                    </div>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ background: "#0B1F3A" }}>
                          {["Товар (RU)", "中文", "Кол-во", "Цена", "Сумма", "Вес", ""].map(h => (
                            <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: 500, whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.invoice.items.map((item, i) => (
                          <tr key={i} style={{ borderTop: "1px solid #1e3a5f" }}>
                            <td style={{ padding: "10px 14px", fontWeight: 500 }}>{item.description_ru || "—"}</td>
                            <td style={{ padding: "10px 14px", color: "#94a3b8", fontFamily: "monospace" }}>{item.description_zh || "—"}</td>
                            <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>{item.quantity} {item.unit}</td>
                            <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>{item.unit_price ? `${result.invoice.currency} ${item.unit_price}` : "—"}</td>
                            <td style={{ padding: "10px 14px", fontWeight: 600, whiteSpace: "nowrap" }}>{item.total_price ? `${result.invoice.currency} ${item.total_price}` : "—"}</td>
                            <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{item.weight_kg ? `${item.weight_kg} кг` : "—"}</td>
                            <td style={{ padding: "10px 8px" }}>
                              <CopyBtn
                                text={`${item.description_ru || item.description_zh} — ${item.quantity} ${item.unit} × ${result.invoice.currency} ${item.unit_price} = ${result.invoice.currency} ${item.total_price}`}
                                small
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {/* Landed Cost */}
              {result.landed_costs && result.landed_costs.length > 0 && (
                <LandedCostSection result={result} />
              )}
            </div>

            {/* Quotes sidebar */}
            <div style={{ position: "sticky", top: "24px" }}>
              <div style={{ ...S.card, border: "1px solid #00A86B44", padding: 0, overflow: "hidden" }}>
                <div style={{ background: "linear-gradient(135deg,#00A86B22,#0f2644)", padding: "20px", borderBottom: "1px solid #243a5e" }}>
                  <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "4px" }}>Стоимость доставки</div>
                  <div style={{ color: "#94a3b8", fontSize: "13px" }}>{result.weight_kg ? `Груз ${result.weight_kg} кг из Китая` : "По данным инвойса"}</div>
                </div>
                <div style={{ padding: "16px" }}>
                  {result.quotes.map((q) => (
                    <div key={q.id} style={{ background: "#0B1F3A", border: "1px solid #243a5e", borderRadius: "10px", padding: "14px", marginBottom: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "14px" }}>{q.flag} {q.label}</div>
                          <div style={{ color: "#64748b", fontSize: "12px" }}>{q.note}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ fontWeight: 700, fontSize: "20px", color: "#00A86B" }}>${q.cost_usd.toLocaleString()}</div>
                            <CopyBtn text={`${q.flag} ${q.label}: $${q.cost_usd} (≈ ${Math.round(q.cost_usd * 90).toLocaleString()} ₽)`} small />
                          </div>
                          <div style={{ color: "#64748b", fontSize: "11px" }}>≈ {Math.round(q.cost_usd * 90).toLocaleString()} ₽</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b" }}>
                        <span>⏱ {q.days_min}–{q.days_max} дней</span>
                        <span>${q.rate_usd_per_kg}/кг</span>
                      </div>
                      {q.below_min && (
                        <div style={{ marginTop: "8px", background: "rgba(251,191,36,0.08)", borderRadius: "6px", padding: "6px 10px", fontSize: "11px", color: "#fbbf24" }}>
                          ⚠️ Минимум {q.min_kg} кг. Расчёт за {q.billable_kg} кг
                        </div>
                      )}
                    </div>
                  ))}
                  <div style={{ color: "#334155", fontSize: "11px", marginBottom: "14px" }}>* Ориентировочная цена. Точный расчёт с учётом объёма и типа груза — по запросу.</div>
                  <a href={`https://t.me/ChinaBridgeLID_bot?start=invoice_weight_${result.weight_kg || 0}_supplier_${encodeURIComponent(result.invoice.supplier_name_ru || result.invoice.supplier_name || "invoice")}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: "block", background: "#00A86B", color: "#fff", borderRadius: "10px", padding: "14px", textAlign: "center", textDecoration: "none", fontWeight: 700, fontSize: "15px", marginBottom: "10px" }}>
                    Запросить точный расчёт
                  </a>

                  {/* Download buttons in sidebar too */}
                  <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                    <button onClick={() => downloadCSV(result)} style={{ flex: 1, background: "#0B1F3A", border: "1px solid #243a5e", borderRadius: "8px", padding: "9px", color: "#94a3b8", fontSize: "12px", cursor: "pointer", fontWeight: 500 }}>
                      📊 CSV
                    </button>
                    <button onClick={() => downloadJSON(result)} style={{ flex: 1, background: "#0B1F3A", border: "1px solid #243a5e", borderRadius: "8px", padding: "9px", color: "#94a3b8", fontSize: "12px", cursor: "pointer", fontWeight: 500 }}>
                      { } JSON
                    </button>
                    <div style={{ flex: 1, display: "flex" }}>
                      <button
                        onClick={async () => {
                          try { await navigator.clipboard.writeText(buildCopyText(result)); }
                          catch { /* ignore */ }
                        }}
                        style={{ flex: 1, background: "#0B1F3A", border: "1px solid #243a5e", borderRadius: "8px", padding: "9px", color: "#94a3b8", fontSize: "12px", cursor: "pointer", fontWeight: 500 }}
                      >
                        📋 Копировать
                      </button>
                    </div>
                  </div>

                  <button onClick={reset}
                    style={{ width: "100%", background: "transparent", color: "#94a3b8", border: "1px solid #243a5e", borderRadius: "10px", padding: "10px", fontSize: "13px", cursor: "pointer" }}>
                    ← Загрузить другой инвойс
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Pain points ── */}
      {!result && (
        <div style={{ ...S.section, padding: "80px 24px 0" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={S.label}>ПРОБЛЕМЫ ИМПОРТЁРА</div>
            <div style={{ fontSize: "24px", fontWeight: 700 }}>Три точки, где поставка из Китая теряет время</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
            {[
              { n: "01", title: "WeChat вместо нормального документа", body: "Поставщик шлёт инвойс картинкой в чат, пакинг — фото с телефона, спецификацию — в нестандартном Excel с иероглифами. Менеджер перепечатывает вручную." },
              { n: "02", title: "Не знаешь сколько стоит доставка", body: "Вес в инвойсе есть, но чтобы узнать цену карго — нужно звонить менеджеру, ждать ответа, считать вручную. Сделка тормозит на самом простом шаге." },
              { n: "03", title: "Рост заказов = рост хаоса", body: "Каждая новая поставка — это +1 час ручной работы. Количество поставщиков растёт, инвойсы копятся, ошибки в данных тиражируются." },
            ].map((p) => (
              <div key={p.n} style={S.card}>
                <div style={{ color: "#00A86B", fontWeight: 700, fontSize: "13px", fontFamily: "monospace", marginBottom: "12px" }}>{p.n}</div>
                <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "10px" }}>{p.title}</div>
                <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.6 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── How it works ── */}
      {!result && (
        <div style={{ ...S.section, padding: "80px 24px 0" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={S.label}>КАК РАБОТАЕТ</div>
            <div style={{ fontSize: "24px", fontWeight: 700 }}>Три шага от фото в WeChat до цены доставки</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
            {[
              { n: "Шаг 01", title: "Загружаешь фото инвойса", body: "Фото из WeChat, скриншот, скан — на китайском, английском или смешанный. Читаем иероглифы (简·繁), печати, рукописные пометки.", result: "Данные без переводчика и без ручного ввода" },
              { n: "Шаг 02", title: "Извлекаем позиции и вес", body: "Позиции товара с переводом на русский, количество, цена, общая сумма, брутто-вес, артикулы, инкотермс — всё из одного документа.", result: "Структура сделки за 30 секунд" },
              { n: "Шаг 03", title: "Считаем полную себестоимость", body: "Товар + логистика (4 маршрута, включая Хэйхэ) + таможня (пошлина + НДС + брокер) = реальная цена единицы на складе. Вводишь цену продажи — видишь маржу.", result: "Решение: везти или не везти этот товар" },
            ].map((step) => (
              <div key={step.n} style={S.card}>
                <div style={{ color: "#00A86B", fontWeight: 700, fontSize: "12px", fontFamily: "monospace", marginBottom: "12px" }}>{step.n}</div>
                <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "10px" }}>{step.title}</div>
                <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.6, marginBottom: "14px" }}>{step.body}</p>
                <div style={{ background: "#0B1F3A", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", color: "#00A86B" }}>ИТОГ · {step.result}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── What client gets ── */}
      {!result && (
        <div style={{ ...S.section, padding: "80px 24px 0" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={S.label}>ЧТО ПОЛУЧАЕШЬ</div>
            <div style={{ fontSize: "24px", fontWeight: 700 }}>Из одного фото инвойса — полный пакет данных</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div style={S.card}>
              <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "20px" }}>📋 Из документа</div>
              {[
                ["Поставщик", "Название компании на китайском и русском"],
                ["Позиции товара", "Название ZH→RU, количество, единица измерения"],
                ["Цены", "За единицу и итого в валюте поставщика (CNY/USD/EUR)"],
                ["Вес брутто", "Общий вес партии в кг"],
                ["Инкотермс", "FOB / EXW / CIF — условия поставки"],
                ["Город отправки", "Откуда везти, для точного расчёта маршрута"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: "12px", paddingBottom: "12px", borderBottom: "1px solid #1e3a5f", marginBottom: "12px" }}>
                  <div style={{ color: "#64748b", fontSize: "13px", minWidth: "130px", flexShrink: 0 }}>{k}</div>
                  <div style={{ fontSize: "13px", color: "#cbd5e1" }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={S.card}>
              <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "20px" }}>🚚 Расчёт доставки + экспорт</div>
              {[
                { flag: "🇷🇺", route: "Авто → Россия", rate: "$3.00/кг", days: "18–28 дней", min: "от 100 кг" },
                { flag: "🇰🇿", route: "Авто → Казахстан", rate: "$2.50/кг", days: "5–8 дней", min: "от 100 кг" },
                { flag: "✈️", route: "Авиа → RU/KZ", rate: "$23/кг", days: "3–7 дней", min: "от 1 кг" },
              ].map((r) => (
                <div key={r.route} style={{ background: "#0B1F3A", border: "1px solid #243a5e", borderRadius: "10px", padding: "14px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "14px" }}>{r.flag} {r.route}</div>
                    <div style={{ color: "#64748b", fontSize: "12px" }}>{r.days} · {r.min}</div>
                  </div>
                  <div style={{ color: "#00A86B", fontWeight: 700, fontSize: "18px" }}>{r.rate}</div>
                </div>
              ))}
              <div style={{ marginTop: "8px", background: "#0B1F3A", border: "1px solid #243a5e", borderRadius: "10px", padding: "12px 14px", display: "flex", gap: "10px" }}>
                <span style={{ fontSize: "13px" }}>📊 CSV</span>
                <span style={{ color: "#243a5e" }}>·</span>
                <span style={{ fontSize: "13px" }}>{ } JSON</span>
                <span style={{ color: "#243a5e" }}>·</span>
                <span style={{ fontSize: "13px" }}>📋 Копирование</span>
                <span style={{ color: "#64748b", fontSize: "12px", marginLeft: "auto" }}>PRO</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Before / After ── */}
      {!result && (
        <div style={{ ...S.section, padding: "80px 24px 0" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={S.label}>ДО / ПОСЛЕ</div>
            <div style={{ fontSize: "24px", fontWeight: 700 }}>Что меняется в работе с поставщиком</div>
          </div>
          <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ background: "#0B1F3A" }}>
                    {["Ситуация", "Сейчас", "С ChinaBridge Docs"].map(h => (
                      <th key={h} style={{ padding: "14px 20px", textAlign: "left", color: "#64748b", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Получил инвойс из WeChat", "Перепечатываю иероглифы вручную", "Загружаю фото — данные готовы за 30 сек"],
                    ["Узнать стоимость доставки", "Звоню менеджеру, жду ответа", "Цена по трём маршрутам — автоматически"],
                    ["Перевести название товара", "Google Translate, потом правлю", "Перевод ZH→RU встроен в распознавание"],
                    ["Посчитать вес для карго", "Считаю вручную по каждой позиции", "Вес извлекается из инвойса автоматически"],
                    ["Передать данные коллеге", "Копирую из документа построчно", "Скачать CSV или скопировать одной кнопкой"],
                  ].map(([s, before, after], i) => (
                    <tr key={i} style={{ borderTop: "1px solid #1e3a5f" }}>
                      <td style={{ padding: "14px 20px", fontWeight: 500 }}>{s}</td>
                      <td style={{ padding: "14px 20px", color: "#94a3b8" }}>{before}</td>
                      <td style={{ padding: "14px 20px", color: "#00A86B", fontWeight: 500 }}>{after}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── CTA ── */}
      {!result && (
        <div style={{ ...S.section, padding: "80px 24px 80px" }}>
          <div style={{ background: "linear-gradient(135deg, #0f2644 0%, #0B1F3A 100%)", border: "1px solid #243a5e", borderRadius: "20px", padding: "48px", textAlign: "center" }}>
            <div style={{ fontSize: "28px", fontWeight: 800, marginBottom: "12px" }}>
              Загрузи инвойс — получи расчёт за 30 секунд
            </div>
            <p style={{ color: "#94a3b8", fontSize: "16px", marginBottom: "28px" }}>
              Без регистрации. Без звонка менеджеру. Фото не сохраняется.
            </p>
            <button
              onClick={scrollToUpload}
              style={{ background: "#00A86B", color: "#fff", border: "none", borderRadius: "12px", padding: "16px 40px", fontSize: "16px", fontWeight: 700, cursor: "pointer" }}
            >
              Загрузить инвойс ↑
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0);     opacity: 1; }
        }
      `}</style>
    </main>
  );
}
