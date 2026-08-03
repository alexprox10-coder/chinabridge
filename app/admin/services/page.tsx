"use client";
import { useState, useEffect, useCallback } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import type { AdditionalService, PriceType, Currency } from "@/lib/rate-engine/types";

const BLANK: Partial<AdditionalService> = {
  name: "", description: "", price_type: "FIXED", price_value: 0, currency: "USD", status: "active",
};
const CURRENCIES: Currency[] = ["USD", "CNY", "RUB", "KZT"];
const PRESETS = ["Инспекция", "Фото-отчёт", "Перепаковка", "Страхование", "Проверка поставщика"];

export default function ServicesPage() {
  const [services, setServices] = useState<AdditionalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdditionalService | null>(null);
  const [form, setForm] = useState<Partial<AdditionalService>>(BLANK);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/rate-services").then(r => r.json()).catch(() => ({ data: [] }));
    setServices(r.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setForm(BLANK); setEditing(null); setShowForm(true); }
  function openEdit(s: AdditionalService) { setForm(s); setEditing(s); setShowForm(true); }

  async function save() {
    setSaving(true);
    try {
      if (editing?.id) {
        await fetch(`/api/rate-services/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      } else {
        await fetch("/api/rate-services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      }
      setShowForm(false); load();
    } finally { setSaving(false); }
  }

  async function remove(id: number) {
    if (!confirm("Удалить услугу?")) return;
    await fetch(`/api/rate-services/${id}`, { method: "DELETE" }); load();
  }

  async function toggleStatus(s: AdditionalService) {
    await fetch(`/api/rate-services/${s.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: s.status === "active" ? "inactive" : "active" }) });
    load();
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Дополнительные услуги</h1>
            <p className="text-slate-500 text-sm mt-1">Инспекция, страхование, перепаковка и др.</p>
          </div>
          <button onClick={openCreate} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition">
            + Добавить услугу
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading && <p className="text-slate-500 col-span-3 py-8 text-center">Загрузка...</p>}
          {!loading && services.length === 0 && (
            <div className="col-span-3 text-center py-12">
              <p className="text-slate-500 mb-4">Услуг нет. Добавьте первую.</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {PRESETS.map(name => (
                  <button key={name} onClick={() => { setForm({ ...BLANK, name }); setEditing(null); setShowForm(true); }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition">
                    + {name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {services.map(svc => (
            <div key={svc.id} className={`bg-slate-900 rounded-xl border p-4 transition ${svc.status === "active" ? "border-slate-700" : "border-slate-800 opacity-60"}`}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-white font-semibold text-sm">{svc.name}</h3>
                <button onClick={() => toggleStatus(svc)}
                  className={`text-xs px-2 py-0.5 rounded ${svc.status === "active" ? "bg-green-900/40 text-green-400" : "bg-slate-800 text-slate-500"}`}>
                  {svc.status === "active" ? "Вкл" : "Выкл"}
                </button>
              </div>
              {svc.description && <p className="text-slate-400 text-xs mb-3">{svc.description}</p>}
              <div className="flex items-center justify-between">
                <span className="text-white font-mono text-sm">
                  {svc.price_value} {svc.price_type === "PERCENT" ? "%" : svc.currency}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(svc)} className="text-slate-400 hover:text-white text-xs transition">Изм.</button>
                  <button onClick={() => remove(svc.id!)} className="text-red-500 hover:text-red-400 text-xs transition">Удал.</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-md">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">{editing ? "Редактировать услугу" : "Новая услуга"}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Название *</label>
                <input value={form.name ?? ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2" placeholder="Инспекция, Страхование..." />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Описание</label>
                <textarea value={form.description ?? ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 resize-none" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Тип цены</label>
                  <select value={form.price_type ?? "FIXED"} onChange={e => setForm(f => ({ ...f, price_type: e.target.value as PriceType }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2">
                    <option value="FIXED">Фиксированная</option>
                    <option value="PERCENT">Процент от стоимости</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    {form.price_type === "PERCENT" ? "Процент (%)" : "Стоимость"}
                  </label>
                  <input type="number" value={form.price_value ?? 0} onChange={e => setForm(f => ({ ...f, price_value: Number(e.target.value) }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2" min={0} step={0.01} />
                </div>
              </div>
              {form.price_type !== "PERCENT" && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Валюта</label>
                  <select value={form.currency ?? "USD"} onChange={e => setForm(f => ({ ...f, currency: e.target.value as Currency }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2">
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm transition">Отмена</button>
              <button onClick={save} disabled={saving} className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition">
                {saving ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
