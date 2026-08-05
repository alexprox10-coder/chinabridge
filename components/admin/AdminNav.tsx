"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/admin/dashboard", label: "📊 Дашборд" },
  { href: "/admin/pipeline",  label: "🗂 Воронка" },
  { href: "/admin/leads", label: "Лиды" },
  { href: "/admin/proposals", label: "Расчеты" },
  { href: "/admin/rates", label: "Тарифы" },
  { href: "/admin/routes", label: "Маршруты" },
  { href: "/admin/services", label: "Услуги" },
  { href: "/admin/pricing", label: "Наценки" },
  { href: "/admin/finance",     label: "💰 Финансы" },
  { href: "/admin/market-intelligence", label: "🧠 Intelligence" },
  { href: "/admin/import-leads", label: "🎯 Лид-поиск" },
  { href: "/admin/ai-company",   label: "🤖 AI Кабинет" },
  { href: "/admin/tenants",      label: "🏢 Клиенты" },
  { href: "/admin/platform",     label: "🚀 Платформа" },
  { href: "/admin/settings",     label: "⚙️ Настройки" },
  { href: "/admin/blog",         label: "Блог" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  return (
    <nav className="bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
        <span className="font-bold text-white text-sm">🇨🇳 ChinaBridge CRM</span>
        <div className="flex items-center gap-1 flex-1">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${
                pathname.startsWith(href)
                  ? "bg-red-600/20 text-red-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <button
          onClick={logout}
          className="text-slate-500 hover:text-slate-300 text-sm transition"
        >
          Выйти
        </button>
      </div>
    </nav>
  );
}
