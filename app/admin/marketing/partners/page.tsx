"use client";
import { useState, useEffect } from "react";
import { AdminNav } from "@/components/admin/AdminNav";

interface Partner {
  id: number;
  name: string;
  url: string | null;
  platform: string;
  audience_size: number | null;
  er: number | null;
  ad_price: number | null;
  contact: string | null;
  status: string;
  score: number | null;
  notes: string | null;
}

const STATUSES = [
  { id: "",           label: "Все" },
  { id: "found",      label: "Найден" },
  { id: "verified",   label: "Проверен" },
  { id: "contact",    label: "Контакт" },
  { id: "negotiation",label: "Переговоры" },
  { id: "partner",    label: "Партнёр" },
  { id: "rejected",   label: "Отказ" },
];

const STATUS_COLORS: Record<string, string> = {
  found:       "bg-slate-700 text-slate-200",
  verified:    "bg-blue-900/50 text-blue-300 border border-blue-700/40",
  contact:     "bg-amber-900/40 text-amber-300 border border-amber-700/40",
  negotiation: "bg-orange-900/40 text-orange-300 border border-orange-700/40",
  partner:     "bg-green-900/40 text-green-300 border border-green-700/40",
  rejected:    "bg-red-900/30 text-red-400 border border-red-700/30",
};

const PLATFORMS = ["telegram", "vk", "youtube", "website", "other"];

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", url: "", platform: "telegram", audience_size: "",
    ad_price: "", contact: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  function loadPartners(s: string) {
    setLoading(true);
    const qs = s ? `?status=${s}` : "";
    fetch(`/api/marketing/partners${qs}`)
      .then((r) => r.json())
      .then((d: Partner[]) => Array.isArray(d) && setPartners(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadPartners(status);
  }, [status]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/marketing/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          audience_size: form.audience_size ? parseInt(form.audience_size) : null,
          ad_price: form.ad_price ? parseInt(form.ad_price) : null,
        }),
      });
      setForm({ name: "", url: "", platform: "telegram", audience_size: "", ad_price: "", contact: "", notes: "" });
      setShowForm(false);
      loadPartners(status);
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: number, newStatus: string) {
    await fetch(`/api/marketing/partners?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    loadPartners(status);
  }

  const platformIcon: Record<string, string> = {
    telegram: "✈️", vk: "💙", youtube: "▶️", website: "🌐", other: "🔗",
  };

  return (
    <>
      <AdminNav />
      <div className="px-4 lg:px-8 py-6 max-w-5xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-100">Партнёры и площадки</h1>
            <p className="text-sm text-slate-500 mt-0.5">CRM рекламных партнёров ChinaBridge</p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="text-sm px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold transition-colors"
          >
            + Добавить
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <form onSubmit={handleAdd} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-300">Новый партнёр</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Название *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-600/50"
                  placeholder="Канал / сайт / агентство" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">URL</label>
                <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-600/50"
                  placeholder="https://t.me/..." />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Платформа</label>
                <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-600/50">
                  {PLATFORMS.map((p) => <option key={p} value={p}>{platformIcon[p]} {p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Аудитория</label>
                <input type="number" value={form.audience_size} onChange={(e) => setForm({ ...form, audience_size: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-600/50"
                  placeholder="15000" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Цена рекламы (₽)</label>
                <input type="number" value={form.ad_price} onChange={(e) => setForm({ ...form, ad_price: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-600/50"
                  placeholder="5000" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Контакт</label>
                <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-600/50"
                  placeholder="@username или email" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-500 mb-1 block">Заметки</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-600/50 resize-none"
                  placeholder="Ниша, условия, опыт..." />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
                {saving ? "Добавляем…" : "Добавить"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-xl transition-colors">
                Отмена
              </button>
            </div>
          </form>
        )}

        {/* Status filter */}
        <div className="flex gap-1.5 flex-wrap">
          {STATUSES.map((s) => (
            <button key={s.id} onClick={() => setStatus(s.id)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                status === s.id
                  ? "bg-red-600/20 text-red-400 border-red-600/40"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600"
              }`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Partners list */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : partners.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p className="text-3xl mb-3">🔍</p>
            <p className="text-sm">Партнёров нет. Добавьте первого или попросите Marketing AI найти площадки.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {partners.map((p) => (
              <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-100">{p.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        {platformIcon[p.platform] ?? "🔗"} {p.platform}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status] ?? "bg-slate-800 text-slate-400"}`}>
                        {STATUSES.find((s) => s.id === p.status)?.label ?? p.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                      {p.audience_size && <span>👥 {p.audience_size.toLocaleString("ru-RU")}</span>}
                      {p.ad_price && <span>💰 {p.ad_price.toLocaleString("ru-RU")} ₽</span>}
                      {p.er && <span>ER {p.er}%</span>}
                      {p.contact && <span>📱 {p.contact}</span>}
                    </div>
                    {p.notes && <p className="text-xs text-slate-600 mt-1">{p.notes}</p>}
                    {p.score !== null && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden max-w-[120px]">
                          <div className="h-full bg-red-600/70 rounded-full" style={{ width: `${p.score}%` }} />
                        </div>
                        <span className="text-xs text-slate-600">скоринг {p.score}/100</span>
                      </div>
                    )}
                  </div>
                  <select
                    value={p.status}
                    onChange={(e) => updateStatus(p.id, e.target.value)}
                    className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 focus:outline-none shrink-0"
                  >
                    {STATUSES.filter((s) => s.id).map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
                {p.url && (
                  <a href={p.url} target="_blank" rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-400 transition-colors">
                    🔗 {p.url.length > 50 ? p.url.slice(0, 50) + "…" : p.url}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
