"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { SessionPayload } from "@/lib/client-portal/types";

const NAV = [
  { href: "/client/dashboard",    label: "Главная",      icon: "🏠" },
  { href: "/client/calculator",   label: "Калькулятор",  icon: "🧮" },
  { href: "/client/orders",       label: "Мои заявки",   icon: "📦" },
  { href: "/client/payments",     label: "Оплаты",       icon: "💱" },
  { href: "/client/documents",    label: "Документы",    icon: "📄" },
  { href: "/client/calculations", label: "История",      icon: "📋" },
  { href: "/client/profile",      label: "Профиль",      icon: "👤" },
];

export default function ClientNav({ session }: { session: SessionPayload }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/client/auth", { method: "DELETE" });
    router.push("/client/login");
    router.refresh();
  }

  return (
    <>
      {/* ── Desktop sidebar ───────────────────────────────── */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex-col z-30">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-200">
          <Link href="/client/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold text-slate-900">China</span>
            <span className="text-xl font-bold text-green-600">Bridge</span>
          </Link>
          <p className="text-xs text-slate-400 mt-0.5">Личный кабинет</p>
        </div>

        {/* Client info */}
        <div className="px-6 py-4 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-800 truncate">{session.name}</p>
          <p className="text-xs text-slate-400 truncate">{session.email}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-green-50 text-green-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="text-base">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* AI для Бизнеса CTA */}
        <div className="px-3 pb-2">
          <Link
            href="/onboarding"
            className="w-full flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all shadow-md shadow-green-200 group"
          >
            <span className="text-base">🤖</span>
            <span className="flex-1">AI для Бизнеса</span>
            <span className="text-xs opacity-75 group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>

        {/* Support */}
        <div className="px-3 pb-2">
          <a
            href="https://t.me/Chinabridge_HELP_24_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          >
            <span>✈️</span> Поддержка
          </a>
        </div>

        {/* Logout */}
        <div className="px-3 pb-4">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <span>🚪</span> Выйти
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between">
        <Link href="/client/dashboard" className="flex items-center gap-1">
          <span className="text-lg font-bold text-slate-900">China</span>
          <span className="text-lg font-bold text-green-600">Bridge</span>
        </Link>
        <span className="text-sm text-slate-500 truncate max-w-[180px]">{session.name}</span>
      </div>

      {/* Mobile spacer */}
      <div className="lg:hidden h-14" />

      {/* ── Mobile bottom bar ─────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 flex">
        {NAV.slice(0, 3).map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2 text-xs transition-colors ${
                active ? "text-green-600" : "text-slate-400"
              }`}
            >
              <span className="text-lg leading-tight">{icon}</span>
              <span className="mt-0.5">{label}</span>
            </Link>
          );
        })}
        <Link
          href="/onboarding"
          className="flex-1 flex flex-col items-center justify-center py-2 text-xs text-green-600 font-semibold"
        >
          <span className="text-lg">🤖</span>
          <span className="mt-0.5">AI Бизнес</span>
        </Link>
        <a
          href="https://t.me/Chinabridge_HELP_24_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex flex-col items-center justify-center py-2 text-xs text-blue-500"
        >
          <span className="text-lg">✈️</span>
          <span className="mt-0.5">Поддержка</span>
        </a>
        <button
          onClick={logout}
          className="flex-1 flex flex-col items-center justify-center py-2 text-xs text-slate-400"
        >
          <span className="text-lg">🚪</span>
          <span className="mt-0.5">Выйти</span>
        </button>
      </nav>

      {/* Mobile bottom padding */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 pointer-events-none" />
    </>
  );
}
