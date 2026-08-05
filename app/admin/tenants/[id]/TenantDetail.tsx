"use client";
import { useState } from "react";
import type { Tenant } from "@/lib/multitenant/types";
import { PLAN_CONFIG } from "@/lib/multitenant/types";

const AI_LINKS = [
  { id: "sales",      icon: "💼", label: "Продажи AI",    href: "/admin/ai-company/sales" },
  { id: "marketing",  icon: "📢", label: "Маркетинг AI",  href: "/admin/ai-company/marketing" },
  { id: "content",    icon: "✍️", label: "Контент AI",    href: "/admin/ai-company/content" },
  { id: "analytics",  icon: "📊", label: "Аналитика AI",  href: "/admin/ai-company/analytics" },
  { id: "operations", icon: "⚙️", label: "Операции AI",   href: "/admin/ai-company/operations" },
  { id: "finance",    icon: "💰", label: "Финансы AI",    href: "/admin/ai-company/finance" },
  { id: "strategy",   icon: "🎯", label: "Стратегия AI",  href: "/admin/ai-company/strategy" },
  { id: "ceo",        icon: "👑", label: "CEO Центр",     href: "/admin/ai-company/ceo" },
];

export default function TenantDetail({ initialTenant, tenantId }: { initialTenant: Tenant | null; tenantId: string }) {
  const [tenant, setTenant] = useState<Tenant | null>(initialTenant);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [tab,     setTab]     = useState<"overview" | "ai" | "billing" | "settings">("overview");

  if (!tenant) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">❓</div>
        <div className="text-slate-400">Компания #{tenantId} не найдена.</div>
        <a href="/admin/tenants" className="text-blue-400 hover:text-blue-300 text-sm mt-4 inline-block">← Все компании</a>
      </div>
    );
  }

  const cfg = PLAN_CONFIG[tenant.plan];

  const save = async (patch: Partial<Tenant>) => {
    setSaving(true);
    try {
      const res  = await fetch(`/api/platform/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (data.ok) { setTenant(data.tenant); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
            style={{ backgroundColor: tenant.brandColor }}>
            {tenant.companyName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-0.5">
              <a href="/admin/tenants" className="hover:text-slate-200">Компании</a>
              <span>›</span>
              <span className="text-slate-200">{tenant.slug}</span>
            </div>
            <h1 className="text-2xl font-bold text-white">{tenant.companyName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-slate-500 text-sm">{tenant.slug}</span>
              <span className="text-slate-700">·</span>
              <span className={`px-2 py-0.5 rounded border text-xs font-medium ${tenant.status === "active" ? "bg-emerald-900/40 text-emerald-300 border-emerald-700" : "bg-amber-900/40 text-amber-300 border-amber-700"}`}>
                {tenant.status}
              </span>
              <span className="px-2 py-0.5 rounded border text-xs bg-slate-800 text-slate-400 border-slate-600">
                {cfg.label}
              </span>
            </div>
          </div>
        </div>
        {saved && <span className="text-emerald-400 text-sm">✓ Сохранено</span>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800">
        {[
          { id: "overview", label: "Обзор",    icon: "📋" },
          { id: "ai",       label: "AI Company",icon: "🤖" },
          { id: "billing",  label: "Billing",  icon: "💳" },
          { id: "settings", label: "Настройки",icon: "⚙️" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-t transition-colors ${tab === t.id ? "bg-slate-800 text-white border-b-2 border-blue-500" : "text-slate-400 hover:text-slate-200"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Пользователей", val: tenant.usersCount },
              { label: "MRR",           val: tenant.mrr > 0 ? `${tenant.mrr.toLocaleString("ru")}₽` : "—" },
              { label: "AI-отделов",    val: cfg.aiDepts },
              { label: "AI включён",    val: tenant.aiEnabled ? "✅ Да" : "❌ Нет" },
            ].map(({ label, val }) => (
              <div key={label} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-center">
                <div className="text-white font-bold text-lg">{val}</div>
                <div className="text-slate-500 text-xs">{label}</div>
              </div>
            ))}
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3 text-sm">
            {[
              ["🏭 Отрасль",   tenant.industry],
              ["🌍 Страна",    tenant.country],
              ["💱 Валюта",    tenant.currency],
              ["🕐 Тайм-зона", tenant.timezone],
              ["📧 Владелец",  tenant.owner],
              ["🌐 Сайт",      tenant.website ?? "—"],
              ["📱 Telegram",  tenant.contactTelegram ?? "—"],
              ["📅 Создан",    new Date(tenant.createdAt).toLocaleDateString("ru-RU")],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between">
                <span className="text-slate-400">{label}</span>
                <span className="text-slate-200">{val}</span>
              </div>
            ))}
          </div>
          {tenant.description && (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
              <div className="text-slate-400 text-xs mb-1">Описание</div>
              <div className="text-slate-200 text-sm">{tenant.description}</div>
            </div>
          )}
        </div>
      )}

      {/* AI Company */}
      {tab === "ai" && (
        <div className="space-y-4">
          <div className="bg-blue-900/20 border border-blue-800/40 rounded-xl p-4">
            <div className="text-blue-300 font-medium mb-1">🤖 AI Company OS — {tenant.companyName}</div>
            <div className="text-slate-400 text-sm">Все AI-отделы работают в контексте этой компании.</div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {AI_LINKS.map(link => (
              <a key={link.id} href={link.href}
                className="bg-slate-900 border border-slate-700 hover:border-blue-600 rounded-xl p-3 flex flex-col items-center gap-2 text-center transition-colors">
                <span className="text-2xl">{link.icon}</span>
                <span className="text-slate-300 text-xs font-medium">{link.label}</span>
              </a>
            ))}
          </div>
          <div className="flex gap-2">
            <a href="/admin/ai-company"
              className="flex-1 text-center py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
              🤖 Открыть AI Company OS →
            </a>
          </div>
        </div>
      )}

      {/* Billing */}
      {tab === "billing" && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 space-y-4">
            <div className="text-white font-bold">Текущий план: {cfg.label}</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-slate-500 text-xs">Стоимость</div>
                <div className="text-white font-medium">{tenant.plan === "trial" ? "Бесплатно" : `${cfg.price.toLocaleString("ru")}₽/мес`}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Статус</div>
                <div className="text-white font-medium capitalize">{tenant.status}</div>
              </div>
              {tenant.trialEnds && (
                <div>
                  <div className="text-slate-500 text-xs">Trial до</div>
                  <div className="text-amber-300 font-medium">{new Date(tenant.trialEnds).toLocaleDateString("ru-RU")}</div>
                </div>
              )}
              <div>
                <div className="text-slate-500 text-xs">MRR</div>
                <div className="text-white font-medium">{tenant.mrr > 0 ? `${tenant.mrr.toLocaleString("ru")}₽` : "—"}</div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["trial","starter","pro","enterprise"] as const).filter(p => p !== tenant.plan).map(p => (
              <button key={p} onClick={() => save({ plan: p, mrr: PLAN_CONFIG[p].price })}
                disabled={saving}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm">
                Перейти на {PLAN_CONFIG[p].label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Settings */}
      {tab === "settings" && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 space-y-4">
            <div className="text-white font-semibold">White Label настройки</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Сайт",      key: "website",          type: "url",   placeholder: "https://company.ru" },
                { label: "Email",     key: "contactEmail",     type: "email",  placeholder: "info@company.ru" },
                { label: "Телефон",   key: "contactPhone",     type: "text",   placeholder: "+7 (XXX) XXX-XX-XX" },
                { label: "Telegram",  key: "contactTelegram",  type: "text",   placeholder: "@company" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="text-slate-400 text-xs block mb-1">{label}</label>
                  <input type={type}
                    defaultValue={(tenant as unknown as Record<string, unknown>)[key] as string ?? ""}
                    onBlur={e => save({ [key]: e.target.value || null } as Partial<Tenant>)}
                    className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    placeholder={placeholder} />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div>
                <div className="text-slate-300 text-sm">AI Company OS</div>
                <div className="text-slate-500 text-xs">Включает все AI-отделы для компании</div>
              </div>
              <button onClick={() => save({ aiEnabled: !tenant.aiEnabled })}
                className={`w-12 h-6 rounded-full transition-colors relative ${tenant.aiEnabled ? "bg-emerald-600" : "bg-slate-700"}`}>
                <span className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-all ${tenant.aiEnabled ? "right-1" : "left-1"}`} />
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => save({ status: tenant.status === "active" ? "suspended" : "active" })}
              disabled={saving}
              className={`px-4 py-2 rounded-lg text-sm ${tenant.status === "active" ? "bg-red-900/40 text-red-300 border border-red-700" : "bg-emerald-900/40 text-emerald-300 border border-emerald-700"}`}>
              {tenant.status === "active" ? "Приостановить" : "Активировать"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
