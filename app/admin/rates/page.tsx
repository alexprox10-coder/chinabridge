"use client";
import { useState, useEffect, useCallback } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import type { ShippingRate, TransportType, CargoType, RateType, Currency, RateSource } from "@/lib/rate-engine/types";
import { TRANSPORT_LABELS, CARGO_LABELS, RATE_TYPE_LABELS } from "@/lib/rate-engine/types";

const SOURCE_BADGE: Record<RateSource, { label: string; cls: string }> = {
  MARKET: { label: "MARKET", cls: "bg-slate-700 text-slate-300" },
  PARTNER: { label: "PARTNER", cls: "bg-blue-900/50 text-blue-400" },
  MANUAL: { label: "MANUAL", cls: "bg-yellow-900/50 text-yellow-400" },
};

const BLANK: Partial<ShippingRate> = {
  carrier_name: "", transport_type: "truck", cargo_type: "general",
  rate_type: "KG", price_value: 0, currency: "USD", status: "active",
};

const CURRENCIES: Currency[] = ["USD", "CNY", "RUB", "KZT"];
const TRANSPORT_TYPES: TransportType[] = ["air", "rail", "truck", "sea", "express"];
const CARGO_TYPES: CargoType[] = ["general", "fragile", "dangerous", "oversized"];
const RATE_TYPES: RateType[] = ["KG", "CBM", "BOX", "FIXED"];

export default function RatesPage() {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ShippingRate | null>(null);
  const [form, setForm] = useState<Partial<ShippingRate>>(BLANK);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<{ transport?: string; status?: string; source?: string }>({});

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/rates").then(r => r.json()).catch(() => ({ data: [] }));
    setRates(r.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setForm(BLANK); setEditing(null); setShowForm(true); }
  function openEdit(rate: ShippingRate) { setForm(rate); setEditing(rate); setShowForm(true); }

  async function save() {
    setSaving(true);
    try {
      if (editing?.id) {
        await fetch(`/api/rates/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      } else {
        await fetch("/api/rates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      }
      setShowForm(false);
      load();
    } finally { setSaving(false); }
  }

  async function remove(id: number) {
    if (!confirm("Удалить тариф?")) return;
    await fetch(`/api/rates/${id}`, { method: "DELETE" });
    load();
  }

  async function toggleStatus(rate: ShippingRate) {
    await fetch(`/api/rates/${rate.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: rate.status === "active" ? "inactive" : "active" }) });
    load();
  }

  const filtered = rates.filter(r => {
    if (filter.transport && r.transport_type !== filter.transport) return false;
    if (filter.status && r.status !== filter.status) return false;
    if (filter.source && (r.rate_source ?? 'MANUAL') !== filter.source) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Тарифы доставки</h1>
            <p className="text-slate-500 text-sm mt-1">Управление ставками перевозчиков</p>
          </div>
          <button onClick={openCreate} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition">
            + Добавить тариф
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <select value={filter.transport ?? ""} onChange={e => setFilter(f => ({ ...f, transport: e.target.value || undefined }))}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-1.5">
            <option value="">Все типы</option>
            {TRANSPORT_TYPES.map(t => <option key={t} value={t}>{TRANSPORT_LABELS[t]}</option>)}
          </select>
          <select value={filter.status ?? ""} onChange={e => setFilter(f => ({ ...f, status: e.target.value || undefined }))}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-1.5">
            <option value="">Все статусы</option>
            <option value="active">Активные</option>
            <option value="inactive">Отключённые</option>
          </select>
          <select value={filter.source ?? ""} onChange={e => setFilter(f => ({ ...f, source: e.target.value || undefined }))}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-1.5">
            <option value="">Все источники</option>
            <option value="MARKET">MARKET</option>
            <option value="PARTNER">PARTNER</option>
            <option value="MANUAL">MANUAL</option>
          </select>
          <span className="text-slate-500 text-sm self-center">{filtered.length} тарифов</span>
        </div>

        {/* Table */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-800">
                <tr className="text-slate-400 text-left">
                  <th className="px-4 py-3 font-medium">Перевозчик</th>
                  <th className="px-4 py-3 font-medium">Транспорт</th>
                  <th className="px-4 py-3 font-medium">Груз</th>
                  <th className="px-4 py-3 font-medium">Тариф</th>
                  <th className="px-4 py-3 font-medium">Цена</th>
                  <th className="px-4 py-3 font-medium">Сроки</th>
                  <th className="px-4 py-3 font-medium">Источник</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500">Загрузка...</td></tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500">Тарифов нет. Добавьте первый.</td></tr>
                )}
                {filtered.map(rate => (
                  <tr key={rate.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 text-white font-medium">{rate.carrier_name}</td>
                    <td className="px-4 py-3 text-slate-300">{TRANSPORT_LABELS[rate.transport_type]}</td>
                    <td className="px-4 py-3 text-slate-300">{CARGO_LABELS[rate.cargo_type]}</td>
                    <td className="px-4 py-3 text-slate-300">{RATE_TYPE_LABELS[rate.rate_type]}</td>
                    <td className="px-4 py-3 text-white font-mono">
                      {rate.price_value} {rate.currency}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {rate.delivery_days_min && rate.delivery_days_max
                        ? `${rate.delivery_days_min}–${rate.delivery_days_max} дн.`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const src = (rate.rate_source ?? 'MANUAL') as RateSource;
                        const badge = SOURCE_BADGE[src] ?? SOURCE_BADGE.MANUAL;
                        return (
                          <span className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${badge.cls}`}>
                            {badge.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleStatus(rate)}
                        className={`px-2 py-0.5 rounded text-xs font-medium ${rate.status === "active" ? "bg-green-900/40 text-green-400" : "bg-slate-800 text-slate-500"}`}>
                        {rate.status === "active" ? "Активен" : "Отключён"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(rate)} className="text-slate-400 hover:text-white text-xs transition">Изм.</button>
                        <button onClick={() => remove(rate.id!)} className="text-red-500 hover:text-red-400 text-xs transition">Удал.</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">{editing ? "Редактировать тариф" : "Новый тариф"}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Перевозчик *</label>
                <input value={form.carrier_name ?? ""} onChange={e => setForm(f => ({ ...f, carrier_name: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2" placeholder="China Post, DHL, FESCO..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Транспорт *</label>
                  <select value={form.transport_type ?? "truck"} onChange={e => setForm(f => ({ ...f, transport_type: e.target.value as TransportType }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2">
                    {TRANSPORT_TYPES.map(t => <option key={t} value={t}>{TRANSPORT_LABELS[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Тип груза *</label>
                  <select value={form.cargo_type ?? "general"} onChange={e => setForm(f => ({ ...f, cargo_type: e.target.value as CargoType }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2">
                    {CARGO_TYPES.map(t => <option key={t} value={t}>{CARGO_LABELS[t]}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Тип тарифа *</label>
                  <select value={form.rate_type ?? "KG"} onChange={e => setForm(f => ({ ...f, rate_type: e.target.value as RateType }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2">
                    {RATE_TYPES.map(t => <option key={t} value={t}>{RATE_TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Валюта *</label>
                  <select value={form.currency ?? "USD"} onChange={e => setForm(f => ({ ...f, currency: e.target.value as Currency }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2">
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Цена *</label>
                <input type="number" value={form.price_value ?? 0} onChange={e => setForm(f => ({ ...f, price_value: Number(e.target.value) }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2" min={0} step={0.01} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Мин. вес (кг)</label>
                  <input type="number" value={form.min_weight ?? ""} onChange={e => setForm(f => ({ ...f, min_weight: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2" min={0} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Макс. вес (кг)</label>
                  <input type="number" value={form.max_weight ?? ""} onChange={e => setForm(f => ({ ...f, max_weight: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2" min={0} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Срок мин. (дней)</label>
                  <input type="number" value={form.delivery_days_min ?? ""} onChange={e => setForm(f => ({ ...f, delivery_days_min: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2" min={0} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Срок макс. (дней)</label>
                  <input type="number" value={form.delivery_days_max ?? ""} onChange={e => setForm(f => ({ ...f, delivery_days_max: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2" min={0} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Статус</label>
                <select value={form.status ?? "active"} onChange={e => setForm(f => ({ ...f, status: e.target.value as "active" | "inactive" }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2">
                  <option value="active">Активен</option>
                  <option value="inactive">Отключён</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm transition">Отмена</button>
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
