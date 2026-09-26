"use client";
import { useState, useEffect, useCallback } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import type { Route, TransportType } from "@/lib/rate-engine/types";
import { TRANSPORT_LABELS } from "@/lib/rate-engine/types";

const BLANK: Partial<Route> = {
  country_from: "China", city_from: "", country_to: "Russia", city_to: "",
  transport_type: "truck", status: "active",
  partner_id: "", transit_city: "", customs_model: "partner_declarant",
};
const TRANSPORT_TYPES: TransportType[] = ["air", "rail", "truck", "sea", "express"];
const CUSTOMS_MODELS = [
  { v: "partner_declarant", l: "Декларант партнёра" },
  { v: "client_declarant",  l: "Декларант клиента" },
  { v: "tbd",               l: "Уточняется" },
];

function calcMargin(r: Partial<Route>): string {
  const cost = (r.china_leg_usd ?? 0) + (r.border_leg_usd ?? 0) + (r.russia_leg_usd ?? 0);
  const price = r.customer_price_per_kg ?? 0;
  if (!cost || !price) return "—";
  return ((price - cost) / price * 100).toFixed(1) + "%";
}

function inp(label: string, field: keyof Route, form: Partial<Route>, setForm: (f: Partial<Route>) => void, type = "text", placeholder = "") {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <input
        type={type}
        value={(form[field] as string | number | undefined) ?? ""}
        onChange={e => setForm({ ...form, [field]: type === "number" ? (e.target.value ? Number(e.target.value) : undefined) : e.target.value })}
        placeholder={placeholder}
        className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2"
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "any" : undefined}
      />
    </div>
  );
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Route | null>(null);
  const [form, setForm] = useState<Partial<Route>>(BLANK);
  const [saving, setSaving] = useState(false);
  const [showEconomics, setShowEconomics] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/rate-routes").then(r => r.json()).catch(() => ({ data: [] }));
    setRoutes(r.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setForm(BLANK); setEditing(null); setShowForm(true); setShowEconomics(false); }
  function openEdit(route: Route) { setForm(route); setEditing(route); setShowForm(true); setShowEconomics(false); }

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

  const setF = (patch: Partial<Route>) => setForm(f => ({ ...f, ...patch }));

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Маршруты</h1>
            <p className="text-slate-500 text-sm mt-1">Направления доставки · Партнёры · Экономика плеч</p>
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
                  <th className="px-4 py-3 font-medium">Маршрут</th>
                  <th className="px-4 py-3 font-medium">Транзит</th>
                  <th className="px-4 py-3 font-medium">Партнёр</th>
                  <th className="px-4 py-3 font-medium">Мин. кг</th>
                  <th className="px-4 py-3 font-medium">Транспорт</th>
                  <th className="px-4 py-3 font-medium">Сроки</th>
                  <th className="px-4 py-3 font-medium">$/кг клиент</th>
                  <th className="px-4 py-3 font-medium">Маржа</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-500">Загрузка...</td></tr>}
                {!loading && routes.length === 0 && <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-500">Маршрутов нет. Добавьте первый.</td></tr>}
                {routes.map(route => (
                  <tr key={route.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 text-white whitespace-nowrap">
                      {route.city_from}, {route.country_from} → {route.city_to}, {route.country_to}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{route.transit_city || "—"}</td>
                    <td className="px-4 py-3">
                      {route.partner_id
                        ? <span className="px-2 py-0.5 bg-blue-900/40 text-blue-300 rounded text-xs font-medium">{route.partner_id}</span>
                        : <span className="text-slate-600 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-xs">
                      {route.min_weight ? `${route.min_weight} кг` : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{TRANSPORT_LABELS[route.transport_type]}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {route.delivery_days_min && route.delivery_days_max ? `${route.delivery_days_min}–${route.delivery_days_max} дн.` : "—"}
                    </td>
                    <td className="px-4 py-3 text-white text-xs font-mono">
                      {route.customer_price_per_kg ? `$${route.customer_price_per_kg}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {calcMargin(route) !== "—"
                        ? <span className="text-green-400 font-semibold">{calcMargin(route)}</span>
                        : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleStatus(route)}
                        className={`px-2 py-0.5 rounded text-xs font-medium ${route.status === "active" ? "bg-green-900/40 text-green-400" : "bg-slate-800 text-slate-500"}`}>
                        {route.status === "active" ? "Активен" : "Откл."}
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
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-2xl my-8">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">{editing ? "Редактировать маршрут" : "Новый маршрут"}</h2>
            </div>

            <div className="p-6 space-y-5">
              {/* Geography */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">География</p>
                <div className="grid grid-cols-2 gap-3">
                  {inp("Страна отправления", "country_from", form, setF)}
                  {inp("Город отправления *", "city_from", form, setF, "text", "Иу, Гуанчжоу...")}
                  {inp("Транзитный город", "transit_city", form, setF, "text", "Хэйхэ...")}
                  {inp("Страна назначения", "country_to", form, setF)}
                  {inp("Город назначения *", "city_to", form, setF, "text", "Москва, Алматы...")}
                </div>
              </div>

              {/* Transport & Terms */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Транспорт и сроки</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Транспорт</label>
                    <select value={form.transport_type ?? "truck"} onChange={e => setF({ transport_type: e.target.value as TransportType })}
                      className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2">
                      {TRANSPORT_TYPES.map(t => <option key={t} value={t}>{TRANSPORT_LABELS[t]}</option>)}
                    </select>
                  </div>
                  {inp("Срок мин. (дней)", "delivery_days_min", form, setF, "number")}
                  {inp("Срок макс. (дней)", "delivery_days_max", form, setF, "number")}
                </div>
              </div>

              {/* Partner */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Партнёр</p>
                <div className="grid grid-cols-3 gap-3">
                  {inp("ID партнёра", "partner_id", form, setF, "text", "TPT, 97kapro...")}
                  {inp("Мин. вес (кг)", "min_weight", form, setF, "number", "100")}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Модель таможни</label>
                    <select value={form.customs_model ?? "tbd"} onChange={e => setF({ customs_model: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2">
                      {CUSTOMS_MODELS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Economics */}
              <div className="border border-slate-700 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowEconomics(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/60 text-left hover:bg-slate-800"
                >
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">§23 Экономика маршрута (плечи)</p>
                  <span className="text-slate-500 text-xs">{showEconomics ? "▲ скрыть" : "▼ показать"}</span>
                </button>

                {showEconomics && (
                  <div className="p-4 space-y-4">
                    <p className="text-xs text-slate-500">Внутренние данные — не показываются клиенту.</p>
                    <div className="grid grid-cols-2 gap-3">
                      {inp("Плечо Китай ($/кг)", "china_leg_usd", form, setF, "number", "5.00")}
                      {inp("Плечо Граница ($/кг)", "border_leg_usd", form, setF, "number", "1.00")}
                      {inp("Таможня ($/партия)", "customs_usd", form, setF, "number", "300")}
                      {inp("Плечо Россия/КЗ ($/кг)", "russia_leg_usd", form, setF, "number", "0.50")}
                    </div>
                    <div className="border-t border-slate-700 pt-3">
                      <div className="grid grid-cols-2 gap-3">
                        {inp("Цена клиенту ($/кг)", "customer_price_per_kg", form, setF, "number", "3.00")}
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Расчётная маржа</label>
                          <div className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-green-400">
                            {calcMargin(form)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
