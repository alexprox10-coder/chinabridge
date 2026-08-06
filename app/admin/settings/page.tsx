import Link from "next/link";

export default function SettingsPage() {
  const items = [
    { href: "/admin/settings/billing",  icon: "💳", title: "Подписка и оплата",  desc: "Тариф, оплата через Точка Банк — карта, СБП, Т-Pay" },
    { href: "/admin/settings/company", icon: "🏢", title: "Реквизиты компании", desc: "ИНН, ОГРНИП, банк, адрес — данные для документов" },
    { href: "/admin/finance/settings", icon: "💱", title: "Курсы валют",         desc: "USD, CNY, RUB, KZT — ручные курсы для финансовых расчётов" },
  ];
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">⚙️ Настройки</h1>
      <div className="space-y-3">
        {items.map((item) => (
          <Link key={item.href} href={item.href}
            className="flex items-start gap-4 p-4 bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl transition group">
            <span className="text-2xl mt-0.5">{item.icon}</span>
            <div>
              <p className="text-white font-medium group-hover:text-slate-100">{item.title}</p>
              <p className="text-slate-500 text-sm mt-0.5">{item.desc}</p>
            </div>
            <span className="ml-auto text-slate-600 group-hover:text-slate-400 text-lg mt-1">→</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
