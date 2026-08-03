"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ClipboardList, User, LogOut, Menu, X, Globe } from "lucide-react";
import { useI18n } from "@/lib/partner-portal/i18n";
import type { PartnerSession } from "@/lib/partner-portal/types";

const navItems = [
  { key: "dashboard" as const, href: "/partner/dashboard", icon: LayoutDashboard },
  { key: "tasks"     as const, href: "/partner/tasks",     icon: ClipboardList },
  { key: "profile"   as const, href: "/partner/profile",   icon: User },
];

export default function PartnerNav({ session }: { session: PartnerSession }) {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, setLang, t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/partner/auth", { method: "DELETE" });
    router.push("/partner/login");
    router.refresh();
  }

  const displayName = lang === "zh" ? session.name : session.name;

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-slate-200 z-40">
        {/* Logo + lang */}
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">CB</div>
              <span className="font-bold text-slate-800 text-sm leading-tight">
                China<span className="text-blue-600">Bridge</span>
              </span>
            </div>
            {/* Language switcher */}
            <div className="flex items-center gap-1 text-xs font-medium">
              <button onClick={() => setLang("ru")}
                className={`px-1.5 py-0.5 rounded transition ${lang === "ru" ? "text-blue-600 bg-blue-50" : "text-slate-400 hover:text-slate-700"}`}>
                RU
              </button>
              <span className="text-slate-300">|</span>
              <button onClick={() => setLang("zh")}
                className={`px-1.5 py-0.5 rounded transition ${lang === "zh" ? "text-blue-600 bg-blue-50" : "text-slate-400 hover:text-slate-700"}`}>
                中文
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">{t("partner_portal")}</p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ key, href, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {t(key)}
              </Link>
            );
          })}
        </nav>

        {/* Partner info + logout */}
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{displayName}</p>
              <p className="text-xs text-slate-400 truncate">{session.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
            <LogOut className="w-4 h-4" />
            {t("logout")}
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ─────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">CB</div>
          <span className="font-bold text-slate-800 text-sm">China<span className="text-blue-600">Bridge</span></span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs font-medium">
            <button onClick={() => setLang("ru")}
              className={`px-1.5 py-0.5 rounded ${lang === "ru" ? "text-blue-600 bg-blue-50" : "text-slate-400"}`}>RU</button>
            <span className="text-slate-300">|</span>
            <button onClick={() => setLang("zh")}
              className={`px-1.5 py-0.5 rounded ${lang === "zh" ? "text-blue-600 bg-blue-50" : "text-slate-400"}`}>中文</button>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1.5 rounded-lg hover:bg-slate-100">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div className="md:hidden fixed top-14 left-0 right-0 bg-white border-b border-slate-200 z-30 shadow-lg">
          <nav className="px-4 py-3 space-y-1">
            {navItems.map(({ key, href, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition ${
                  pathname.startsWith(href) ? "bg-blue-50 text-blue-700" : "text-slate-600"
                }`}>
                <Icon className="w-4 h-4" />{t(key)}
              </Link>
            ))}
            <button onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-3 text-sm text-red-500 rounded-xl">
              <LogOut className="w-4 h-4" />{t("logout")}
            </button>
          </nav>
        </div>
      )}

      {/* ── Mobile bottom tabs ─────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 flex">
        {navItems.map(({ key, href, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition ${
                active ? "text-blue-600" : "text-slate-400"
              }`}>
              <Icon className="w-5 h-5" />
              <span>{t(key)}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
