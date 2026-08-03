"use client";
import { useState, useEffect, useCallback } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import type { Route, TransportType } from "@/lib/rate-engine/types";
import { TRANSPORT_LABELS } from "@/lib/rate-engine/types";

const BLANK: Partial<Route> = {
  country_from: "China", city_from: "", country_to: "Russia", city_to: "",
  transport_type: "truck", status: "active",
};
const TRANSPORT_TYPES: TransportType[] = ["air", "rail", "truck", "sea", "express"];

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Route | null>(null);
  const [form, setForm] = useState<Partial<Route>>(BLANK);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/rate-routes").then(r => r.json()).catch(() => ({ data: [] }));
    setRoutes(r.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setForm(BLANK); setEditing(null); setShowForm(true); }
  function openEdit(route: Route) { setForm(route); setEditing(route); setShowForm(true); }

  async function save() {
    setSaving(true);
    try {
      if (editing?.id) {
        await fetch(`/api/rate-routes/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      } else {
        await fetch("/api/rate-routes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, created_at: new Date().toISOString() }) });
      }
      setShowForm(false); load();
    } finally { setSaving(false); }
  }

  async function remove(id: number) {
    if (!confirm("Удалить маршрут?")) return;
    await fetch(`/api/rate-routes/${id}`, { method: "DELETE" }); load();
  }

  async function toggleStatus(r: Route) {
    await fetch(`/api/rate-routes/${r.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: r.status === "active" ? "inactive" : "active" }) });
    load();
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Маршруты</h1>
            <p className="text-slate-500 text-sm mt-1">Направления доставки</p>
          </div>
          <button onClick={openCreate} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition">
            + Добавить маршрут
          </button>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-800">
                <tr className="text-slate-400 text-left">
                  <th className="px-4 py-3 font-medium">Откуда</th>
                  <th className="px-4 py-3 font-medium">Куда</th>
                  <th className="px-4 py-3 font-medium">Транспорт</th>
                  <th className="px-4 py-3 font-medium">Сроки</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Загрузка...</td></tr>}
                {!loading && routes.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Маршрутов нет. Добавьте первый.</td></tr>}
                {routes.map(route => (
                  <tr key={route.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 text-white">{route.city_from}, {route.country_from}</td>
                    <td className="px-4 py-3 text-white">{route.city_to}, {route.country_to}</td>
                    <td className="px-4 py-3 text-slate-300">{TRANSPORT_LABELS[route.transport_type]}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {route.delivery_days_min && route.delivery_days_max ? `${route.delivery_days_min}–${route.delivery_days_max} дн.` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleStatus(route)}
                        className={`px-2 py-0.5 rounded text-xs font-medium ${route.status === "active" ? "bg-green-900/40 text-green-400" : "bg-slate-800 text-slate-500"}`}>
                        {route.status === "active" ? "Активен" : "Отключён"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(route)} className="text-slate-400 hover:text-white text-xs transition">Изм.</button>
                        <button onClick={() => remove(route.id!)} className="text-red-500 hover:text-red-400 text-xs transition">Удал.</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-lg">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">{editing ? "Редактировать маршрут" : "Новый маршрут"}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Страна отправления</label>
                  <input value={form.country_from ?? ""} onChange={e => setForm(f => ({ ...f, country_from: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Город отправления *</label>
                  <input value={form.city_from ?? ""} onChange={e => setForm(f => ({ ...f, city_from: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2" placeholder="Иу, Гуанчжоу..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Страна назначения</label>
                  <input value={form.country_to ?? ""} onChange={e => setForm(f => ({ ...f, country_to: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Город назначения *</label>
                  <input value={form.city_to ?? ""} onChange={e => setForm(f => ({ ...f, city_to: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2" placeholder="Москва, Алматы..." />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Тип транспорта</label>
                <select value={form.transport_type ?? "truck"} onChange={e => setForm(f => ({ ...f, transport_type: e.target.value as TransportType }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2">
                  {TRANSPORT_TYPES.map(t => <option key={t} value={t}>{TRANSPORT_LABELS[t]}</option>)}
                </select>
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
