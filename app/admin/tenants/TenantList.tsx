"use client";
import { useState, useEffect, useCallback } from "react";
import type { Tenant, BillingPlan } from "@/lib/multitenant/types";

const PLAN_BADGE: Record<BillingPlan, string> = {
  trial:      "bg-slate-800 text-slate-300 border-slate-600",
  starter:    "bg-blue-900/40 text-blue-300 border-blue-700",
  pro:        "bg-purple-900/40 text-purple-300 border-purple-700",
  enterprise: "bg-amber-900/40 text-amber-300 border-amber-700",
};

const COUNTRY_FLAG: Record<string, string> = {
  RU: "🇷🇺", KZ: "🇰🇿", BY: "🇧🇾", UZ: "🇺🇿", KG: "🇰🇬", AE: "🇦🇪", CN: "🇨🇳", OTHER: "🌍",
};

export default function TenantList() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [search,  setSearch]  = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting,  setDeleting]  = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/platform/tenants");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Ошибка");
      setTenants(data.tenants);
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res  = await fetch(`/api/platform/tenants/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({ ok: false }));
      if (data.ok) setTenants(prev => prev.filter(t => t.id !== id));
    } finally { setDeleting(null); setConfirmId(null); }
  };

  const filtered = tenants.filter(t => {
    const q = search.toLowerCase();
    return !q || t.companyName.toLowerCase().includes(q) || t.slug.includes(q);
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <a href="/admin/platform" className="hover:text-slate-200">Platform</a>
            <span>›</span>
            <span className="text-slate-200">Компании</span>
          </div>
          <h1 className="text-2xl font-bold text-white">🏢 Все компании</h1>
          <p className="text-slate-400 text-sm mt-1">{tenants.length} арендаторов зарегистрировано</p>
        </div>
        <a href="/admin/tenants/create"
          className="flex-shrink-0 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">
          + Создать компанию
        </a>
      </div>

      {error && <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm">{error}</div>}

      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Поиск по названию или slug..."
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500" />

      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <span className="animate-spin mr-2 text-xl">⟳</span> Загрузка...
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(t => (
          <div key={t.id} className="bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-xl p-5 flex flex-col gap-3 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: t.brandColor }}>
                  {t.companyName[0]}
                </div>
                <div>
                  <div className="text-white font-semibold">{t.companyName}</div>
                  <div className="text-slate-500 text-xs">{t.slug} · {COUNTRY_FLAG[t.country]}</div>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded border text-xs font-medium flex-shrink-0 ${PLAN_BADGE[t.plan]}`}>
                {t.plan}
              </span>
            </div>

            {t.description && (
              <p className="text-slate-400 text-xs line-clamp-2">{t.description}</p>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800/50 rounded px-2 py-1">
                <div className="text-slate-500">Статус</div>
                <div className="text-slate-200 font-medium capitalize">{t.status}</div>
              </div>
              <div className="bg-slate-800/50 rounded px-2 py-1">
                <div className="text-slate-500">MRR</div>
                <div className="text-slate-200 font-medium">{t.mrr > 0 ? `${t.mrr.toLocaleString("ru")}₽` : "—"}</div>
              </div>
              <div className="bg-slate-800/50 rounded px-2 py-1">
                <div className="text-slate-500">Пользователей</div>
                <div className="text-slate-200 font-medium">{t.usersCount}</div>
              </div>
              <div className="bg-slate-800/50 rounded px-2 py-1">
                <div className="text-slate-500">AI</div>
                <div className={`font-medium ${t.aiEnabled ? "text-emerald-400" : "text-slate-500"}`}>
                  {t.aiEnabled ? "✓ Включён" : "Откл."}
                </div>
              </div>
            </div>

            {t.trialEnds && t.status === "trial" && (
              <div className="text-xs text-amber-400 bg-amber-900/20 border border-amber-800/40 rounded px-2 py-1">
                ⏳ Trial до {new Date(t.trialEnds).toLocaleDateString("ru-RU")}
              </div>
            )}

            {confirmId === t.id ? (
              <div className="border-t border-slate-800 pt-3 space-y-2">
                <p className="text-xs text-red-300 text-center">Удалить компанию без возможности восстановления?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={deleting === t.id}
                    className="flex-1 py-1.5 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white rounded text-xs transition-colors">
                    {deleting === t.id ? "⏳ Удаление..." : "✓ Да, удалить"}
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs transition-colors">
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 border-t border-slate-800 pt-3">
                <a href={`/admin/tenants/${t.id}`}
                  className="flex-1 text-center py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors">
                  Управление
                </a>
                {t.aiEnabled && (
                  <a href={`/admin/ai-company?tenant=${t.id}`}
                    className="flex-1 text-center py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs transition-colors">
                    AI Company →
                  </a>
                )}
                <button
                  onClick={() => setConfirmId(t.id)}
                  title="Удалить компанию"
                  className="p-1.5 rounded text-slate-600 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                  🗑
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Add new card */}
        <a href="/admin/tenants/create"
          className="bg-slate-900/50 border border-dashed border-slate-700 hover:border-emerald-600 rounded-xl p-5 flex flex-col items-center justify-center gap-3 text-center transition-colors group min-h-[200px]">
          <div className="w-12 h-12 rounded-xl bg-slate-800 group-hover:bg-emerald-900/30 flex items-center justify-center text-2xl transition-colors">➕</div>
          <div>
            <div className="text-slate-300 font-medium text-sm">Добавить компанию</div>
            <div className="text-slate-600 text-xs mt-0.5">Мастер создания за 4 шага</div>
          </div>
        </a>
      </div>
    </div>
  );
}
