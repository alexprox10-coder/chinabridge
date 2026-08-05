"use client";
import { useState, useEffect } from "react";

const PLANS = [
  { id: "trial",      label: "Trial",      price: 0,     features: ["До 3 пользователей", "3 AI-отдела", "100 лидов", "14 дней"] },
  { id: "starter",    label: "Starter",    price: 4900,  features: ["До 5 пользователей", "5 AI-отделов", "500 лидов/мес", "Email поддержка"] },
  { id: "pro",        label: "Pro",        price: 9900,  features: ["До 15 пользователей", "8 AI-отделов", "2000 лидов/мес", "Telegram бот", "Приоритет"] },
  { id: "enterprise", label: "Enterprise", price: 29900, features: ["Безлимит", "Все AI-отделы", "Безлимит лидов", "White Label", "SLA 99.9%"] },
];

const INVOICES = [
  { id: "INV-001", date: "2026-07-01", amount: 9900,  status: "paid",    plan: "Pro" },
  { id: "INV-002", date: "2026-06-01", amount: 9900,  status: "paid",    plan: "Pro" },
  { id: "INV-003", date: "2026-05-01", amount: 4900,  status: "paid",    plan: "Starter" },
];

export default function BillingCenter() {
  const [currentPlan, setCurrentPlan] = useState("trial");
  const [daysLeft, setDaysLeft]       = useState<number | null>(null);
  const [loading, setLoading]         = useState<string | null>(null);

  useEffect(() => {
    const planCookie = document.cookie.match(/cb_plan=([^;]+)/);
    if (planCookie) setCurrentPlan(planCookie[1]);

    const trialCookie = document.cookie.match(/cb_trial_start=([^;]+)/);
    if (trialCookie) {
      const start = new Date(decodeURIComponent(trialCookie[1]));
      const trialEnd = new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);
      const diff = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      setDaysLeft(Math.max(0, diff));
    }
  }, []);

  const handleUpgrade = async (planId: string) => {
    setLoading(planId);
    try {
      const res  = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upgrade", plan: planId }),
      });
      const data = await res.json();
      if (data.ok) {
        setCurrentPlan(planId);
        document.cookie = `cb_plan=${planId}; path=/; max-age=${60*60*24*30}`;
      }
    } finally { setLoading(null); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Billing & Тарифы</h1>
        <p className="text-slate-400 text-sm mt-1">Управляйте подпиской и историей платежей</p>
      </div>

      {/* Current plan */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-slate-400 text-xs mb-1">Текущий тариф</div>
            <div className="text-2xl font-bold text-white capitalize">{currentPlan}</div>
            {daysLeft !== null && currentPlan === "trial" && (
              <div className={`text-sm mt-1 ${daysLeft <= 3 ? "text-red-400" : "text-amber-400"}`}>
                ⏰ Осталось {daysLeft} дней пробного периода
              </div>
            )}
          </div>
          <div className="px-3 py-1.5 rounded-full bg-emerald-900/40 border border-emerald-700 text-emerald-300 text-xs font-medium">
            {currentPlan === "trial" ? "Пробный" : "Активен"}
          </div>
        </div>
      </div>

      {/* Plans grid */}
      <div>
        <h2 className="text-white font-semibold mb-4">Выберите тариф</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map(plan => {
            const isActive = plan.id === currentPlan;
            return (
              <div key={plan.id}
                className={`rounded-2xl p-5 border flex flex-col gap-3 ${
                  isActive
                    ? "border-emerald-600 bg-emerald-900/20"
                    : "border-slate-700 bg-slate-900"
                }`}>
                <div>
                  <div className="text-white font-bold">{plan.label}</div>
                  <div className="text-2xl font-bold text-white mt-1">
                    {plan.price === 0 ? "Бесплатно" : `${plan.price.toLocaleString("ru")}₽`}
                    {plan.price > 0 && <span className="text-slate-400 text-sm font-normal">/мес</span>}
                  </div>
                </div>
                <ul className="space-y-1.5 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-1.5 text-slate-300 text-xs">
                      <span className="text-emerald-400">✓</span>{f}
                    </li>
                  ))}
                </ul>
                {isActive ? (
                  <div className="py-2 text-center text-emerald-400 text-sm font-medium">✓ Текущий план</div>
                ) : (
                  <button onClick={() => handleUpgrade(plan.id)}
                    disabled={loading === plan.id}
                    className="py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium">
                    {loading === plan.id ? "..." : plan.price === 0 ? "Downgrade" : "Выбрать →"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-slate-500 text-xs mt-3">* Оплата через YuKassa. Нажимая «Выбрать», вы будете перенаправлены на страницу оплаты.</p>
      </div>

      {/* Invoice history */}
      <div>
        <h2 className="text-white font-semibold mb-4">История платежей</h2>
        <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden">
          {INVOICES.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">Платежей пока нет</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-700">
                <tr>
                  {["Счёт", "Дата", "Тариф", "Сумма", "Статус"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {INVOICES.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-slate-300 font-mono text-xs">{inv.id}</td>
                    <td className="px-4 py-3 text-slate-400">{new Date(inv.date).toLocaleDateString("ru-RU")}</td>
                    <td className="px-4 py-3 text-slate-300">{inv.plan}</td>
                    <td className="px-4 py-3 text-white font-medium">{inv.amount.toLocaleString("ru")}₽</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs bg-emerald-900/40 text-emerald-300 border border-emerald-700">
                        {inv.status === "paid" ? "Оплачен" : inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
