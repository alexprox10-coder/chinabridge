"use client";
import { useState, useEffect } from "react";
import { AdminNav } from "@/components/admin/AdminNav";

interface Campaign {
  id: number;
  name: string;
  goal: string | null;
  channel: string;
  budget_rub: number;
  start_date: string | null;
  end_date: string | null;
  status: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  notes: string | null;
  spend_rub?: number;
  leads?: number;
  payments?: number;
}

const CHANNELS = ["telegram", "vk", "yandex", "google", "avito", "seo", "partner", "other"];

const STATUS_COLORS: Record<string, string> = {
  draft:     "bg-slate-800 text-slate-400",
  active:    "bg-green-900/40 text-green-300 border border-green-700/40",
  paused:    "bg-amber-900/30 text-amber-300 border border-amber-700/30",
  completed: "bg-blue-900/30 text-blue-300 border border-blue-700/30",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Черновик", active: "Активна", paused: "Пауза", completed: "Завершена",
};

const CHANNEL_ICONS: Record<string, string> = {
  telegram: "✈️", vk: "💙", yandex: "🟡", google: "🔵",
  avito: "🟢", seo: "🌿", partner: "🤝", other: "📡",
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[а-яёА-ЯЁ]/g, (c) => {
      const map: Record<string, string> = {
        а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"yo",ж:"zh",з:"z",и:"i",
        й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",
        у:"u",ф:"f",х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",
        э:"e",ю:"yu",я:"ya",
      };
      return map[c] ?? c;
    })
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

function buildUtm(name: string, channel: string) {
  const medium = ["telegram","vk"].includes(channel) ? "social" : ["yandex","google"].includes(channel) ? "cpc" : "other";
  const date = new Date().toISOString().slice(0, 7).replace("-", "");
  return {
    utm_source: channel,
    utm_medium: medium,
    utm_campaign: `${slugify(name)}-${date}`,
  };
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", goal: "", channel: "telegram", budget_rub: "",
    start_date: "", end_date: "", notes: "",
  });
  const [preview, setPreview] = useState<{ utm_source: string; utm_medium: string; utm_campaign: string } | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/marketing/campaigns")
      .then((r) => r.json())
      .then((d: Campaign[]) => Array.isArray(d) && setCampaigns(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (form.name.trim()) {
      setPreview(buildUtm(form.name, form.channel));
    } else {
      setPreview(null);
    }
  }, [form.name, form.channel]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const utm = buildUtm(form.name, form.channel);
    try {
      await fetch("/api/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          goal: form.goal.trim() || null,
          channel: form.channel,
          budget_rub: form.budget_rub ? parseInt(form.budget_rub) : 0,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          notes: form.notes.trim() || null,
          ...utm,
        }),
      });
      setForm({ name: "", goal: "", channel: "telegram", budget_rub: "", start_date: "", end_date: "", notes: "" });
      setPreview(null);
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/marketing/campaigns?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  const utmUrl = preview
    ? `https://chinabridge.pro/?utm_source=${preview.utm_source}&utm_medium=${preview.utm_medium}&utm_campaign=${preview.utm_campaign}`
    : null;

  return (
    <>
      <AdminNav />
      <div className="px-4 lg:px-8 py-6 max-w-4xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-100">Кампании</h1>
            <p className="text-sm text-slate-500 mt-0.5">Рекламные кампании + UTM-генератор</p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="text-sm px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold transition-colors"
          >
            + Создать
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-300">Новая кампания</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-500 mb-1 block">Название *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-600/50"
                  placeholder="Например: Telegram август WB-аудитория" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Канал</label>
                <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-600/50">
                  {CHANNELS.map((c) => <option key={c} value={c}>{CHANNEL_ICONS[c]} {c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Бюджет (₽)</label>
                <input type="number" value={form.budget_rub} onChange={(e) => setForm({ ...form, budget_rub: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-600/50"
                  placeholder="50000" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Начало</label>
                <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-600/50" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Конец</label>
                <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-600/50" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-500 mb-1 block">Цель</label>
                <input value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-600/50"
                  placeholder="Например: 50 лидов, CPL < 800 ₽" />
              </div>
            </div>

            {/* UTM preview */}
            {utmUrl && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1.5 font-medium">UTM-ссылка (сгенерирована автоматически)</p>
                <div className="flex gap-1.5 mb-2 flex-wrap">
                  {preview && Object.entries(preview).map(([k, v]) => (
                    <span key={k} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                      {k}=<span className="text-red-400">{v}</span>
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-600 break-all font-mono">{utmUrl}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={saving || !form.name.trim()}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
                {saving ? "Создаём…" : "Создать кампанию"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-xl transition-colors">
                Отмена
              </button>
            </div>
          </form>
        )}

        {/* Campaigns list */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-28 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p className="text-3xl mb-3">📣</p>
            <p className="text-sm">Кампаний нет. Создайте первую или попросите Marketing AI составить медиаплан.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((c) => {
              const utmCampaignUrl = c.utm_campaign
                ? `https://chinabridge.pro/?utm_source=${c.utm_source ?? c.channel}&utm_medium=${c.utm_medium ?? "other"}&utm_campaign=${c.utm_campaign}`
                : null;
              const spent = c.spend_rub ?? 0;
              const budget = c.budget_rub ?? 0;
              const spentPct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

              return (
                <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-100">{c.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                          {CHANNEL_ICONS[c.channel] ?? "📡"} {c.channel}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status] ?? "bg-slate-800 text-slate-400"}`}>
                          {STATUS_LABELS[c.status] ?? c.status}
                        </span>
                      </div>
                      {c.goal && <p className="text-xs text-slate-500 mt-1">🎯 {c.goal}</p>}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                        <span>💰 бюджет {budget.toLocaleString("ru-RU")} ₽</span>
                        {spent > 0 && <span>расход {spent.toLocaleString("ru-RU")} ₽</span>}
                        {c.leads ? <span>📊 {c.leads} лид.</span> : null}
                        {c.payments ? <span>✅ {c.payments} оплат</span> : null}
                        {c.start_date && <span>📅 {c.start_date} → {c.end_date ?? "…"}</span>}
                      </div>
                      {budget > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden max-w-[160px]">
                            <div className="h-full bg-red-600/70 rounded-full" style={{ width: `${spentPct}%` }} />
                          </div>
                          <span className="text-xs text-slate-600">{spentPct}% бюджета</span>
                        </div>
                      )}
                      {utmCampaignUrl && (
                        <div className="mt-2 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-1.5">
                          <p className="text-xs text-slate-500 mb-0.5">UTM</p>
                          <p className="text-xs text-slate-600 font-mono break-all">{utmCampaignUrl}</p>
                        </div>
                      )}
                    </div>
                    <select
                      value={c.status}
                      onChange={(e) => updateStatus(c.id, e.target.value)}
                      className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 focus:outline-none shrink-0"
                    >
                      {["draft","active","paused","completed"].map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
