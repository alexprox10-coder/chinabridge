"use client";
import { useState } from "react";
import type { BillingPlan } from "@/lib/multitenant/types";

interface Plan {
  key: BillingPlan;
  label: string;
  price: number;
  currency: string;
  maxUsers: number;
  maxLeads: number;
  aiDepts: number;
  features: string[];
  isCurrent: boolean;
}

const PLAN_COLOR: Record<string, string> = {
  starter:    "border-blue-600/40 from-blue-900/20",
  pro:        "border-purple-600/40 from-purple-900/20",
  enterprise: "border-amber-600/40 from-amber-900/20",
};

const PLAN_BTN: Record<string, string> = {
  starter:    "bg-blue-600 hover:bg-blue-700",
  pro:        "bg-purple-600 hover:bg-purple-700",
  enterprise: "bg-amber-600 hover:bg-amber-700",
};

export default function BillingClient({
  plans, tenantId, currentPlan,
}: { plans: Plan[]; tenantId: string; currentPlan: BillingPlan }) {
  const [loading, setLoading]     = useState<string | null>(null);
  const [checking, setChecking]   = useState<string | null>(null);
  const [message, setMessage]     = useState<{ text: string; ok: boolean } | null>(null);

  async function handlePay(plan: Plan) {
    setLoading(plan.key);
    setMessage(null);
    try {
      const res  = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.key, tenantId }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Ошибка создания платежа");

      // Open payment page in new tab
      window.open(data.paymentLink, "_blank");

      // Store operationId for checking
      sessionStorage.setItem("tochka_op_" + plan.key, data.operationId);
      setMessage({ text: "Страница оплаты открыта в новой вкладке. После оплаты нажмите «Проверить».", ok: true });
    } catch (e) {
      setMessage({ text: String(e), ok: false });
    } finally {
      setLoading(null);
    }
  }

  async function handleCheck(planKey: BillingPlan) {
    const operationId = sessionStorage.getItem("tochka_op_" + planKey);
    if (!operationId) {
      setMessage({ text: "Сначала создайте платёж через кнопку «Оплатить»", ok: false });
      return;
    }
    setChecking(planKey);
    setMessage(null);
    try {
      const res  = await fetch(`/api/payments/check?operationId=${operationId}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Ошибка проверки");
      if (data.status === "APPROVED") {
        setMessage({ text: `✅ Оплачено! Тариф ${data.plan} активирован. Перезагрузите страницу.`, ok: true });
        sessionStorage.removeItem("tochka_op_" + planKey);
      } else if (data.status === "EXPIRED") {
        setMessage({ text: "❌ Ссылка истекла. Создайте новый платёж.", ok: false });
      } else {
        setMessage({ text: `Статус: ${data.status} — платёж ещё не подтверждён.`, ok: true });
      }
    } catch (e) {
      setMessage({ text: String(e), ok: false });
    } finally {
      setChecking(null);
    }
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className={`p-4 rounded-xl border text-sm ${message.ok ? "bg-green-900/20 border-green-700 text-green-300" : "bg-red-900/20 border-red-700 text-red-300"}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map(plan => (
          <div key={plan.key}
            className={`bg-gradient-to-b ${PLAN_COLOR[plan.key]} to-transparent border rounded-2xl p-6 relative ${plan.isCurrent ? "ring-2 ring-white/20" : ""}`}>

            {plan.isCurrent && (
              <span className="absolute top-3 right-3 text-xs bg-white/10 text-white px-2 py-0.5 rounded-full">
                Текущий
              </span>
            )}

            <h3 className="text-white font-bold text-lg mb-1">{plan.label}</h3>
            <div className="text-2xl font-bold text-white mb-0.5">
              {plan.price.toLocaleString("ru-RU")} ₽
            </div>
            <p className="text-slate-500 text-xs mb-4">в месяц</p>

            <ul className="space-y-1.5 mb-6">
              <li className="text-slate-400 text-sm">👤 до {plan.maxUsers} пользователей</li>
              <li className="text-slate-400 text-sm">🎯 до {plan.maxLeads.toLocaleString()} лидов</li>
              <li className="text-slate-400 text-sm">🤖 {plan.aiDepts} AI-департаментов</li>
              {plan.features.slice(0, 3).map(f => (
                <li key={f} className="text-slate-400 text-sm">✓ {f}</li>
              ))}
            </ul>

            {plan.isCurrent ? (
              <div className="w-full py-2 text-center text-sm text-slate-500 border border-slate-700 rounded-xl">
                Активен
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => handlePay(plan)}
                  disabled={!!loading}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold text-white transition ${PLAN_BTN[plan.key]} disabled:opacity-50`}>
                  {loading === plan.key ? "Создаём ссылку..." : `Оплатить ${plan.price.toLocaleString()} ₽`}
                </button>
                <button
                  onClick={() => handleCheck(plan.key)}
                  disabled={!!checking}
                  className="w-full py-1.5 rounded-xl text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 transition">
                  {checking === plan.key ? "Проверяем..." : "Проверить оплату"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
