"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin/finance",          label: "📊 Обзор",  exact: true },
  { href: "/admin/finance/orders",   label: "📋 Сделки" },
  { href: "/admin/finance/payments", label: "💳 Платежи" },
  { href: "/admin/finance/expenses", label: "💸 Расходы" },
  { href: "/admin/finance/reports",  label: "📈 Отчёты" },
  { href: "/admin/finance/settings", label: "⚙️ Настройки" },
];

export function FinanceNav() {
  const path = usePathname();
  return (
    <div className="flex flex-wrap gap-1 mb-6 bg-slate-900 border border-slate-800 rounded-xl p-2">
      {LINKS.map(({ href, label, exact }) => {
        const active = exact ? path === href : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              active
                ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
