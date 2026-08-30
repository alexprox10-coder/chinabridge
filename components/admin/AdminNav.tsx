"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const GROUPS = [
  {
    label: "CRM",
    items: [
      { href: "/admin/dashboard",           label: "Дашборд",        icon: "📊" },
      { href: "/admin/registrations",       label: "Регистрации ЛК", icon: "🆕" },
      { href: "/admin/pipeline",            label: "Воронка",        icon: "🗂" },
      { href: "/admin/leads",               label: "Лиды",           icon: "👥" },
      { href: "/admin/outreach-leads",      label: "Email Outreach", icon: "📧" },
      { href: "/admin/market-intelligence", label: "Поиск лидов",    icon: "🎯" },
      { href: "/admin/market-intelligence/vk-intent", label: "VK Intent Leads", icon: "📡" },
      { href: "/admin/queries",             label: "Запросы",        icon: "🔍" },
      { href: "/admin/proposals",           label: "Расчёты",        icon: "📋" },
      { href: "/admin/messages",            label: "Сообщения",      icon: "💬" },
      { href: "/admin/finance",             label: "Финансы",        icon: "💰" },
    ],
  },
  {
    label: "AI & Аналитика",
    items: [
      { href: "/admin/sales",                       label: "AI Sales",     icon: "🚀" },
      { href: "/admin/intelligence",               label: "Intelligence", icon: "🧠" },
      { href: "/admin/intelligence/tenders",       label: "Тендеры",      icon: "🏆" },
      { href: "/admin/marketing",    label: "Маркетинг AI", icon: "📣" },
      { href: "/admin/content",      label: "Контент AI",   icon: "✍️" },
      { href: "/admin/ai-company",   label: "AI Кабинет",   icon: "🤖" },
    ],
  },
  {
    label: "Конфигурация",
    items: [
      { href: "/admin/rates",    label: "Тарифы",   icon: "💱" },
      { href: "/admin/routes",   label: "Маршруты", icon: "🗺" },
      { href: "/admin/services", label: "Услуги",   icon: "📦" },
      { href: "/admin/pricing",  label: "Наценки",  icon: "🏷" },
    ],
  },
  {
    label: "Платформа",
    items: [
      { href: "/admin/tenants",  label: "Клиенты",   icon: "🏢" },
      { href: "/admin/platform", label: "Платформа", icon: "🚀" },
      { href: "/admin/settings", label: "Настройки", icon: "⚙️" },
      { href: "/admin/blog",     label: "Блог",      icon: "✍️" },
    ],
  },
];

const MOBILE_SHORTCUTS = [
  { href: "/admin/dashboard",          label: "Дашборд",   icon: "📊" },
  { href: "/admin/sales",              label: "AI Sales",  icon: "🚀" },
  { href: "/admin/pipeline",           label: "Воронка",   icon: "🗂" },
  { href: "/admin/leads",              label: "Лиды",      icon: "👥" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      {/* ── Desktop sidebar ───────────────────────────────── */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800 flex-col z-30">

        {/* Logo */}
        <div className="px-5 py-4 border-b border-slate-800">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <span className="text-lg">🇨🇳</span>
            <div>
              <div className="text-white font-bold text-sm leading-tight">ChinaBridge CRM</div>
              <div className="text-slate-500 text-xs">Admin Panel</div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {GROUPS.map(({ label, items }) => (
            <div key={label}>
              <div className="text-slate-600 text-xs font-semibold uppercase tracking-wider px-2 mb-1">
                {label}
              </div>
              <div className="space-y-0.5">
                {items.map(({ href, label: itemLabel, icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(href)
                        ? "bg-red-600/20 text-red-400"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                    }`}
                  >
                    <span className="text-base w-5 text-center shrink-0">{icon}</span>
                    {itemLabel}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4 border-t border-slate-800 pt-3">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-red-900/20 hover:text-red-400 transition-colors"
          >
            <span className="text-base w-5 text-center">🚪</span>
            Выйти
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-slate-900 border-b border-slate-800 px-4 h-12 flex items-center justify-between">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <span className="text-base">🇨🇳</span>
          <span className="text-white font-bold text-sm">ChinaBridge CRM</span>
        </Link>
        <button onClick={logout} className="text-slate-500 hover:text-slate-300 text-xs transition">
          Выйти
        </button>
      </div>

      {/* Mobile top spacer */}
      <div className="lg:hidden h-12" />

      {/* ── Mobile bottom bar ─────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900 border-t border-slate-800 flex">
        {MOBILE_SHORTCUTS.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center py-2 text-xs transition-colors ${
              isActive(href) ? "text-red-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <span className="text-lg leading-tight">{icon}</span>
            <span className="mt-0.5">{label}</span>
          </Link>
        ))}
        <Link
          href="/admin/ai-company"
          className={`flex-1 flex flex-col items-center justify-center py-2 text-xs transition-colors ${
            isActive("/admin/ai-company") ? "text-red-400" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <span className="text-lg leading-tight">🤖</span>
          <span className="mt-0.5">AI</span>
        </Link>
      </nav>
    </>
  );
}
