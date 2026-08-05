"use client";
import { useState, useEffect, useCallback } from "react";
import type { Tenant, PlatformMetrics, BillingPlan } from "@/lib/multitenant/types";

const PLAN_BADGE: Record<BillingPlan, string> = {
  trial:      "bg-slate-800 text-slate-400 border-slate-600",
  starter:    "bg-blue-900/40 text-blue-300 border-blue-700",
  pro:        "bg-purple-900/40 text-purple-300 border-purple-700",
  enterprise: "bg-amber-900/40 text-amber-300 border-amber-700",
};

const STATUS_DOT: Record<string, string> = {
  active:    "bg-emerald-400",
  trial:     "bg-blue-400 animate-pulse",
  suspended: "bg-red-400",
  cancelled: "bg-slate-500",
};

const COUNTRY_FLAG: Record<string, string> = {
  RU: "🇷🇺", KZ: "🇰🇿", BY: "🇧🇾", UZ: "🇺🇿", KG: "🇰🇬", AE: "🇦🇪", CN: "🇨🇳", OTHER: "🌍",
};

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}М₽`;
  if (n >= 1_000)     return `${Math.round(n / 1_000)}К₽`;
  return `${n}₽`;
}

function KpiCard({ icon, label, value, sub }: { icon: string; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-white text-xl font-bold">{value}</div>
      <div className="text-slate-400 text-xs mt-0.5">{label}</div>
      {sub && <div className="text-slate-600 text-xs mt-0.5">{sub}</div>}
    </div>
  );
}

export default function PlatformDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [search,  setSearch]  = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | BillingPlan>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/platform/metrics");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Ошибка");
      setTenants(data.tenants);
      setMetrics(data.metrics);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = tenants.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.companyName.toLowerCase().includes(q) || t.slug.includes(q) || t.owner.toLowerCase().includes(q);
    const matchPlan   = planFilter === "all" || t.plan === planFilter;
    return matchSearch && matchPlan;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <a href="/admin" className="hover:text-slate-200">Admin</a>
            <span>›</span>
            <span className="text-slate-200">Platform Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold text-white">🚀 Platform SaaS Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Super Admin · Управление всеми компаниями</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm">
            🔄 Обновить
          </button>
          <a href="/admin/tenants/create"
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">
            + Новая компания
          </a>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm">{error}</div>
      )}

      {/* KPI Grid */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <KpiCard icon="🏢" label="Всего компаний"   value={metrics.totalTenants} />
          <KpiCard icon="✅" label="Активных"          value={metrics.activeTenants} />
          <KpiCard icon="⏳" label="Trial"             value={metrics.trialTenants} />
          <KpiCard icon="💳" label="Платных"           value={metrics.paidTenants} />
          <KpiCard icon="💰" label="MRR"               value={fmtMoney(metrics.mrr)} />
          <KpiCard icon="📅" label="ARR"               value={fmtMoney(metrics.arr)} />
          <KpiCard icon="📈" label="Новых / мес"       value={metrics.newThisMonth} />
          <KpiCard icon="💎" label="Avg LTV"           value={fmtMoney(metrics.avgLtv)} />
        </div>
      )}

      {/* Plan breakdown */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["trial", "starter", "pro", "enterprise"] as BillingPlan[]).map(plan => (
            <div key={plan} className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${plan === "trial" ? "bg-slate-400" : plan === "starter" ? "bg-blue-400" : plan === "pro" ? "bg-purple-400" : "bg-amber-400"}`} />
              <div>
                <div className="text-white font-semibold capitalize">{plan}</div>
                <div className="text-slate-400 text-sm">{metrics.byPlan[plan]} компаний</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tenant Table */}
      <div>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск компании..."
            className="flex-1 min-w-[200px] bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          />
          <div className="flex gap-1">
            {(["all", "trial", "starter", "pro", "enterprise"] as const).map(p => (
              <button key={p} onClick={() => setPlanFilter(p)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${planFilter === p ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"}`}>
                {p === "all" ? "Все" : p}
              </button>
            ))}
          </div>
          <span className="text-slate-500 text-sm">{filtered.length} компаний</span>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <span className="animate-spin mr-2 text-xl">⟳</span> Загрузка...
          </div>
        )}

        {!loading && (
          <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {["Компания", "Страна", "План", "Статус", "Пользователи", "MRR", "Последняя активность", ""].map(h => (
                    <th key={h} className="text-left text-slate-500 text-xs px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: t.brandColor }}>
                          {t.companyName[0]}
                        </div>
                        <div>
                          <div className="text-slate-100 font-medium">{t.companyName}</div>
                          <div className="text-slate-500 text-xs">{t.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-base" title={t.country}>{COUNTRY_FLAG[t.country] ?? "🌍"}</span>
                      <span className="text-slate-400 text-xs ml-1">{t.country}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded border text-xs font-medium ${PLAN_BADGE[t.plan]}`}>
                        {t.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[t.status] ?? "bg-slate-500"}`} />
                        <span className="text-slate-300 text-xs">{t.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-center">{t.usersCount}</td>
                    <td className="px-4 py-3 text-slate-200 font-medium">{t.mrr > 0 ? fmtMoney(t.mrr) : "—"}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {t.lastActiveAt ? new Date(t.lastActiveAt).toLocaleDateString("ru-RU") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <a href={`/admin/tenants/${t.id}`}
                        className="text-xs text-blue-400 hover:text-blue-300 whitespace-nowrap">
                        Открыть →
                      </a>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">Компании не найдены</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: "/admin/tenants",        icon: "🏢", title: "Все компании",    sub: "Управление арендаторами" },
          { href: "/admin/tenants/create", icon: "➕", title: "Новая компания",  sub: "Мастер создания за 4 шага" },
          { href: "/admin/ai-company",     icon: "🤖", title: "AI Company OS",   sub: "AI-система ChinaBridge" },
        ].map(link => (
          <a key={link.href} href={link.href}
            className="bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-xl p-4 flex items-center gap-3 transition-colors">
            <span className="text-2xl">{link.icon}</span>
            <div>
              <div className="text-slate-100 font-semibold text-sm">{link.title}</div>
              <div className="text-slate-500 text-xs">{link.sub}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
