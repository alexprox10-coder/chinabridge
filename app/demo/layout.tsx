"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/demo",             label: "Обзор",     icon: "🏠" },
  { href: "/demo/crm",         label: "CRM",       icon: "👥" },
  { href: "/demo/client",      label: "Клиент",    icon: "📦" },
  { href: "/demo/calculator",  label: "Калькулятор", icon: "🧮" },
  { href: "/demo/finance",     label: "Финансы",   icon: "📊" },
  { href: "/demo/documents",   label: "Документы", icon: "📄" },
  { href: "/demo/partner",     label: "Партнёр 🇨🇳", icon: "🤝" },
];

export default function DemoLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* DEMO banner */}
      <div className="bg-amber-500 text-white text-center text-xs font-semibold py-1.5 px-4">
        🎯 ДЕМО-РЕЖИМ · Все данные тестовые · Для реального внедрения:{" "}
        <Link href="/platform" className="underline font-bold">chinabridge.pro/platform</Link>
      </div>

      {/* Top nav */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/demo" className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-slate-900">China</span>
              <span className="text-lg font-bold text-green-600">Bridge</span>
            </Link>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold border border-amber-200">
              DEMO
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ href, label, icon }) => {
              const active = pathname === href || (href !== "/demo" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active ? "bg-green-50 text-green-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className="text-base">{icon}</span>
                  {label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/platform"
            className="hidden md:inline-flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Купить платформу →
          </Link>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden overflow-x-auto border-t border-slate-100">
          <div className="flex items-center gap-1 px-3 py-2 min-w-max">
            {NAV.map(({ href, label, icon }) => {
              const active = pathname === href || (href !== "/demo" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    active ? "bg-green-50 text-green-700" : "text-slate-600"
                  }`}
                >
                  {icon} {label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
