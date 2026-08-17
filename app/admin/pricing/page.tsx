"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import type { PricingRule, RuleType, CustomerType, TransportType } from "@/lib/rate-engine/types";
import { calculateMargin } from "@/lib/rate-engine/margin-calculator";

interface MpRate {
  id: string; label: string; icon: string;
  commission_pct: number; default_pct: number;
  commission_note: string; updated_at: string | null; is_overridden: boolean;
}

interface FxRate { value: number; updated_at: string | null; }

function ExchangeRatesPanel() {
  const [cny, setCny] = useState<FxRate | null>(null);
  const [usd, setUsd] = useState<FxRate | null>(null);
  const [cbr, setCbr] = useState<{ cny: number; usd: number } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/finance/rates/sync")
      .then(r => r.json())
      .then(d => {
        if (d.stored?.cny_rate) setCny(d.stored.cny_rate);
        if (d.stored?.usd_rate) setUsd(d.stored.usd_rate);
        if (d.cbr) setCbr(d.cbr);
      })
      .catch(() => {});
  }, []);

  async function syncNow() {
    setSyncing(true); setMsg("");
    const r = await fetch("/api/admin/finance/rates/sync", { method: "POST" }).then(r => r.json()).catch(() => ({ ok: false }));
    if (r.ok) {
      setCny({ value: r.rates.cny, updated_at: r.synced_at });
      setUsd({ value: r.rates.usd, updated_at: r.synced_at });
      setCbr(r.rates);
      setMsg("Курсы обновлены из ЦБ РФ");
    } else {
      setMsg("Ошибка синхронизации с ЦБ РФ");
    }
    setSyncing(false);
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold text-sm">Курсы валют (ЦБ РФ)</h3>
          <p className="text-slate-500 text-xs mt-0.5">Используются во всех калькуляторах. Обновляются автоматически в 07:00 UTC.</p>
        </div>
        <button
          onClick={syncNow} disabled={syncing}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition flex items-center gap-1.5"
        >
          {syncing ? "⏳" : "🔄"} Синхронизировать
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "🇨🇳 CNY / RUB", stored: cny, cbr_val: cbr?.cny },
          { label: "🇺🇸 USD / RUB", stored: usd, cbr_val: cbr?.usd },
        ].map(({ label, stored, cbr_val }) => (
          <div key={label} className="bg-slate-800 rounded-lg p-3">
            <div className="text-slate-400 text-xs mb-1">{label}</div>
            <div className="text-white text-xl font-mono font-bold">
              {stored ? stored.value.toFixed(4) : "—"}
            </div>
            {cbr_val && stored && Math.abs(cbr_val - stored.value) > 0.001 && (
              <div className="text-yellow-400 text-xs mt-1">ЦБ сейчас: {cbr_val.toFixed(4)}</div>
            )}
            {stored?.updated_at && (
              <div className="text-slate-600 text-xs mt-1">
                {new Date(stored.updated_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </div>
            )}
          </div>
        ))}
      </div>
      {msg && <p className={`text-xs mt-2 ${msg.includes("Ошибка") ? "text-red-400" : "text-green-400"}`}>{msg}</p>}
    </div>
  );
}

function MarketplaceRatesPanel() {
  const [rates, setRates] = useState<MpRate[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/finance/marketplace-rates").then(r => r.json()).catch(() => ({ data: [] }));
    setRates(r.data ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(id: string) {
    const v = parseFloat(editVal);
    if (isNaN(v) || v < 0 || v > 100) return;
    setSaving(true);
    await fetch("/api/admin/finance/marketplace-rates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, commission_pct: v }),
    });
    setSaving(false);
    setEditing(null);
    load();
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 mb-6">
      <div className="mb-4">
        <h3 className="text-white font-semibold text-sm">Комиссии маркетплейсов</h3>
        <p className="text-slate-500 text-xs mt-0.5">Изменения применяются в калькуляторе мгновенно, без деплоя.</p>
      </div>
      <div className="space-y-2">
        {rates.map(mp => (
          <div key={mp.id} className="flex items-center gap-3 bg-slate-800 rounded-lg px-4 py-2.5">
            <span className="text-lg w-7 shrink-0">{mp.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium">{mp.label}</div>
              <div className="text-slate-500 text-xs truncate">{mp.commission_note}</div>
            </div>
            {editing === mp.id ? (
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number" value={editVal} onChange={e => setEditVal(e.target.value)}
                  className="w-20 bg-slate-700 border border-slate-600 text-white text-sm rounded px-2 py-1 text-right"
                  min={0} max={100} step={0.1} autoFocus
                />
                <span className="text-slate-400 text-sm">%</span>
                <button onClick={() => save(mp.id)} disabled={saving}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-medium rounded transition">
                  {saving ? "..." : "✓"}
                </button>
                <button onClick={() => setEditing(null)} className="px-2 py-1 text-slate-400 hover:text-white text-xs transition">✕</button>
              </div>
            ) : (
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-white font-mono font-semibold">{mp.commission_pct}%</div>
                  {mp.is_overridden && (
                    <div className="text-slate-500 text-xs">по умолч. {mp.default_pct}%</div>
                  )}
                </div>
                {mp.is_overridden && (
                  <span className="px-1.5 py-0.5 bg-amber-900/40 text-amber-400 text-xs rounded">изм.</span>
                )}
                <button onClick={() => { setEditing(mp.id); setEditVal(String(mp.commission_pct)); }}
                  className="text-slate-400 hover:text-white text-xs transition">
                  Изм.
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const BLANK: Partial<PricingRule> = {
  name: "", rule_type: "markup", value: 25, status: "active", priority: 99,
};

const RULE_LABELS: Record<RuleType, { label: string; color: string }> = {
  margin:   { label: "Маржа",   color: "text-blue-400" },
  markup:   { label: "Наценка", color: "text-green-400" },
  discount: { label: "Скидка",  color: "text-yellow-400" },
};

const CUSTOMER_LABELS: Record<CustomerType, string> = {
  B2C:            "B2C",
  SMALL_BUSINESS: "Малый бизнес",
  BUSINESS:       "Бизнес",
  VIP:            "VIP",
};

const CUSTOMER_COLORS: Record<CustomerType, string> = {
  B2C:            "bg-slate-700 text-slate-300",
  SMALL_BUSINESS: "bg-blue-900/40 text-blue-300",
  BUSINESS:       "bg-purple-900/40 text-purple-300",
  VIP:            "bg-yellow-900/40 text-yellow-300",
};

const TRANSPORT_OPTIONS: TransportType[] = ["truck", "rail", "air", "sea", "express"];

type FilterKey = "all" | CustomerType;

export default function PricingPage() {
  const [rules, setRules]         = useState<PricingRule[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<PricingRule | null>(null);
  const [form, setForm]           = useState<Partial<PricingRule>>(BLANK);
  const [saving, setSaving]       = useState(false);
  const [filterKey, setFilterKey] = useState<FilterKey>("all");
  const [costPrice, setCostPrice] = useState(1000);
  const [salePrice, setSalePrice] = useState(1250);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/rate-rules").then(r => r.json()).catch(() => ({ data: [] }));
    const sorted = (r.data ?? []).sort(
      (a: PricingRule, b: PricingRule) => (a.priority ?? 99) - (b.priority ?? 99),
    );
    setRules(sorted);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setForm(BLANK); setEditing(null); setShowForm(true); }
  function openEdit(r: PricingRule) { setForm({ ...r }); setEditing(r); setShowForm(true); }

  async function save() {
    setSaving(true);
    try {
      const payload = { ...form };
      if (editing?.id) {
        await fetch(`/api/rate-rules/${editing.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/rate-rules", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
      }
      setShowForm(false); load();
    } finally { setSaving(false); }
  }

  async function remove(id: number) {
    if (!confirm("Удалить правило?")) return;
    await fetch(`/api/rate-rules/${id}`, { method: "DELETE" }); load();
  }

  async function toggleStatus(r: PricingRule) {
    await fetch(`/api/rate-rules/${r.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: r.status === "active" ? "inactive" : "active" }),
    });
    load();
  }

  const filtered = useMemo(() =>
    filterKey === "all" ? rules : rules.filter(r => r.customer_type === filterKey),
    [rules, filterKey]);

  const marginResult = calculateMargin(salePrice, costPrice);

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { all: rules.length };
    for (const ct of Object.keys(CUSTOMER_LABELS) as CustomerType[]) {
      counts[ct] = rules.filter(r => r.customer_type === ct).length;
    }
    return counts;
  }, [rules]);

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <main className="max-w-6xl mx-auto px-4 py-8">

        <ExchangeRatesPanel />
        <MarketplaceRatesPanel />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Smart Pricing</h1>
            <p className="text-slate-500 text-sm mt-1">Умное ценообразование по весу, типу клиента и транспорту</p>
          </div>
          <button onClick={openCreate}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition">
            + Добавить правило
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto">
          {(["all", ...Object.keys(CUSTOMER_LABELS)] as FilterKey[]).map(key => (
            <button key={key} onClick={() => setFilterKey(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                filterKey === key
                  ? "bg-red-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}>
              {key === "all" ? "Все" : CUSTOMER_LABELS[key as CustomerType]}
              <span className="ml-1.5 opacity-60">({filterCounts[key] ?? 0})</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Rules table */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-800 bg-slate-900/80">
                  <tr className="text-slate-400 text-left">
                    <th className="px-4 py-3 font-medium">№</th>
                    <th className="px-4 py-3 font-medium">Правило</th>
                    <th className="px-4 py-3 font-medium">Тип / %</th>
                    <th className="px-4 py-3 font-medium">Вес (кг)</th>
                    <th className="px-4 py-3 font-medium">Клиент</th>
                    <th className="px-4 py-3 font-medium">Статус</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Загрузка...</td></tr>
                  )}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Правил нет</td></tr>
                  )}
                  {filtered.map(rule => {
                    const info = RULE_LABELS[rule.rule_type];
                    const ct = rule.customer_type as CustomerType | undefined;
                    return (
                      <tr key={rule.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                        <td className="px-4 py-3 text-slate-500 font-mono text-xs">{rule.priority ?? "—"}</td>
                        <td className="px-4 py-3 text-white font-medium">{rule.name}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium ${info.color}`}>{info.label}</span>
                          <span className="ml-2 font-mono text-white">{rule.value}%</span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs font-mono">
                          {rule.min_weight !== undefined && rule.min_weight !== null
                            ? `${rule.min_weight}–${rule.max_weight ?? "∞"}`
                            : "любой"}
                        </td>
                        <td className="px-4 py-3">
                          {ct ? (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${CUSTOMER_COLORS[ct]}`}>
                              {CUSTOMER_LABELS[ct]}
                            </span>
                          ) : (
                            <span className="text-slate-600 text-xs">любой</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleStatus(rule)}
                            className={`px-2 py-0.5 rounded text-xs font-medium transition ${
                              rule.status === "active"
                                ? "bg-green-900/40 text-green-400 hover:bg-green-900/60"
                                : "bg-slate-800 text-slate-500 hover:text-slate-300"
                            }`}>
                            {rule.status === "active" ? "Активно" : "Выкл"}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => openEdit(rule)} className="text-slate-400 hover:text-white text-xs transition">Изм.</button>
                            <button onClick={() => remove(rule.id!)} className="text-red-500 hover:text-red-400 text-xs transition">Удал.</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pricing examples */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { w: 50,   ct: "B2C",            cost: 1000, rule: "Small Order",         pct: 35 },
                { w: 500,  ct: "SMALL_BUSINESS",  cost: 1100, rule: "Standard",            pct: 25 },
                { w: 2000, ct: "BUSINESS",         cost: 5000, rule: "B2B Volume",          pct: 18 },
              ].map(ex => {
                const sale   = Math.round(ex.cost * (1 + ex.pct / 100));
                const profit = sale - ex.cost;
                return (
                  <div key={ex.w} className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                    <div className="text-slate-500 text-xs mb-1">{ex.w} кг · {ex.ct}</div>
                    <div className="text-white text-xs font-semibold mb-2">{ex.rule} +{ex.pct}%</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between"><span className="text-slate-400">Себест.</span><span className="font-mono text-slate-300">${ex.cost}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Цена</span><span className="font-mono text-white font-semibold">${sale}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Прибыль</span><span className="font-mono text-green-400">+${profit}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Margin calculator */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
            <h3 className="text-white font-semibold mb-4 text-sm">Калькулятор маржи</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Себестоимость</label>
                <input type="number" value={costPrice} onChange={e => setCostPrice(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2" min={0} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Цена продажи</label>
                <input type="number" value={salePrice} onChange={e => setSalePrice(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2" min={0} />
              </div>
              <div className="mt-4 space-y-2 pt-4 border-t border-slate-800">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Прибыль</span>
                  <span className={`font-mono font-semibold ${marginResult.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {marginResult.profit.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Маржа</span>
                  <span className={`font-mono font-semibold text-lg ${marginResult.margin_percent >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {marginResult.margin_percent.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Quick markup preview */}
              <div className="pt-4 border-t border-slate-800">
                <div className="text-xs text-slate-500 mb-2">Наценки от себестоимости</div>
                {[12, 18, 25, 35].map(pct => {
                  const sale = Math.round(costPrice * (1 + pct / 100));
                  return (
                    <div key={pct} className="flex justify-between text-xs py-1">
                      <span className="text-slate-500">+{pct}%</span>
                      <span className="font-mono text-slate-300">{sale.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Edit / Create modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">
                {editing ? "Редактировать правило" : "Новое правило"}
              </h2>
            </div>
            <div className="p-6 space-y-4">

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">Название *</label>
                  <input value={form.name ?? ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2"
                    placeholder="Standard Consolidation" />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Тип правила</label>
                  <select value={form.rule_type ?? "markup"} onChange={e => setForm(f => ({ ...f, rule_type: e.target.value as RuleType }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2">
                    {(Object.keys(RULE_LABELS) as RuleType[]).map(t => (
                      <option key={t} value={t}>{RULE_LABELS[t].label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Значение (%)</label>
                  <input type="number" value={form.value ?? 0}
                    onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2"
                    min={0} max={99} step={0.1} />
                </div>
              </div>

              {/* Weight range */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Диапазон веса (кг)</label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="Мин. кг"
                    value={form.min_weight ?? ""}
                    onChange={e => setForm(f => ({ ...f, min_weight: e.target.value === "" ? undefined : Number(e.target.value) }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2" min={0} />
                  <input type="number" placeholder="Макс. кг"
                    value={form.max_weight ?? ""}
                    onChange={e => setForm(f => ({ ...f, max_weight: e.target.value === "" ? undefined : Number(e.target.value) }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2" min={0} />
                </div>
                <p className="text-slate-600 text-xs mt-1">Пусто = любой вес</p>
              </div>

              {/* Customer type */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Тип клиента</label>
                <select value={form.customer_type ?? ""}
                  onChange={e => setForm(f => ({ ...f, customer_type: e.target.value as CustomerType || undefined }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2">
                  <option value="">Любой тип</option>
                  {(Object.keys(CUSTOMER_LABELS) as CustomerType[]).map(ct => (
                    <option key={ct} value={ct}>{CUSTOMER_LABELS[ct]}</option>
                  ))}
                </select>
              </div>

              {/* Transport type */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Тип транспорта</label>
                <select value={form.transport_type ?? ""}
                  onChange={e => setForm(f => ({ ...f, transport_type: e.target.value as TransportType || undefined }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2">
                  <option value="">Любой транспорт</option>
                  {TRANSPORT_OPTIONS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Приоритет (1 = высший)</label>
                  <input type="number" value={form.priority ?? ""}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value === "" ? undefined : Number(e.target.value) }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2"
                    min={1} max={99} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Статус</label>
                  <select value={form.status ?? "active"}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as "active" | "inactive" }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2">
                    <option value="active">Активно</option>
                    <option value="inactive">Выключено</option>
                  </select>
                </div>
              </div>

              {/* Preview */}
              {(form.value ?? 0) > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-3 text-xs">
                  <div className="text-slate-400 mb-1">Пример: себестоимость $1000</div>
                  <div className="text-white font-semibold">
                    Цена: ${Math.round(1000 * (1 + (form.value ?? 0) / 100))} · Прибыль: +${Math.round(1000 * (form.value ?? 0) / 100)}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm transition">
                Отмена
              </button>
              <button onClick={save} disabled={saving}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition">
                {saving ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
