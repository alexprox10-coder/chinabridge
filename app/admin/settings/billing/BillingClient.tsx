"use client";
import { useState, useEffect, useRef } from "react";
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

const POLL_INTERVAL = 3000; // 3 seconds
const POLL_TIMEOUT  = 600;  // stop polling after 10 minutes

export default function BillingClient({
  plans, tenantId, currentPlan,
}: { plans: Plan[]; tenantId: string; currentPlan: BillingPlan }) {
  const [loading,  setLoading]  = useState<string | null>(null);
  const [polling,  setPolling]  = useState<string | null>(null);
  const [approved, setApproved] = useState<string | null>(null);
  const [message,  setMessage]  = useState<{ text: string; ok: boolean } | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCount = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => () => { if (pollRef.current) clearTimeout(pollRef.current); }, []);

  function stopPolling() {
    if (pollRef.current) clearTimeout(pollRef.current);
    pollRef.current = null;
    setPolling(null);
    pollCount.current = 0;
  }

  function startPolling(planKey: string, operationId: string) {
    setPolling(planKey);
    pollCount.current = 0;

    async function tick() {
      pollCount.current++;
      if (pollCount.current > POLL_TIMEOUT) {
        stopPolling();
        setMessage({ text: "Время ожидания истекло. Проверьте статус позже.", ok: false });
        return;
      }

      try {
        const res  = await fetch(`/api/payments/tochka?operationId=${encodeURIComponent(operationId)}`);
        const data = await res.json() as { ok: boolean; status?: string; error?: string };

        if (data.ok) {
          if (data.status === "APPROVED") {
            stopPolling();
            setApproved(planKey);
            setMessage({ text: `Оплата прошла ✅ Тариф активирован. Перезагрузите страницу.`, ok: true });
            sessionStorage.removeItem("tochka_op_" + planKey);
            return;
          }
          if (data.status === "EXPIRED" || data.status === "DECLINED") {
            stopPolling();
            setMessage({ text: `❌ Платёж ${data.status === "EXPIRED" ? "истёк" : "отклонён"}. Создайте новый.`, ok: false });
            sessionStorage.removeItem("tochka_op_" + planKey);
            return;
          }
        }
      } catch {
        // network error — continue polling silently
      }

      pollRef.current = setTimeout(tick, POLL_INTERVAL);
    }

    pollRef.current = setTimeout(tick, POLL_INTERVAL);
  }

  async function handlePay(plan: Plan) {
    setLoading(plan.key);
    setMessage(null);
    stopPolling();

    try {
      const res  = await fetch("/api/payments/tochka", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount:  plan.price,
          purpose: `ChinaBridge ${plan.label} — ежемесячная подписка (тенант: ${tenantId})`,
        }),
      });
      const data = await res.json() as { ok: boolean; paymentLink?: string; operationId?: string; error?: string };

      if (!data.ok) throw new Error(data.error ?? "Ошибка создания платежа");

      window.open(data.paymentLink, "_blank");
      sessionStorage.setItem("tochka_op_" + plan.key, data.operationId!);

      setMessage({ text: "Страница оплаты открыта. Ожидаем подтверждения...", ok: true });
      startPolling(plan.key, data.operationId!);
    } catch (e) {
      setMessage({ text: String(e), ok: false });
    } finally {
      setLoading(null);
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

            {approved === plan.key && (
              <span className="absolute top-3 right-3 text-xs bg-green-700/60 text-green-300 px-2 py-0.5 rounded-full">
                Оплачено ✅
              </span>
            )}

            <h3 className="text-white font-bold text-lg mb-1">{plan.label}</h3>
            <div className="text-2xl font-bold text-white mb-0.5">
              {plan.price.toLocaleString("ru-RU")} ₽
            </div>
            <p className="text-slate-500 text-xs mb-4">в месяц</p>

            <ul className="space-y-1.5 mb-6">
              <li className="text-slate-400 text-sm">до {plan.maxUsers} пользователей</li>
              <li className="text-slate-400 text-sm">до {plan.maxLeads.toLocaleString()} лидов</li>
              <li className="text-slate-400 text-sm">{plan.aiDepts} AI-департаментов</li>
              {plan.features.slice(0, 3).map(f => (
                <li key={f} className="text-slate-400 text-sm">✓ {f}</li>
              ))}
            </ul>

            {plan.isCurrent || approved === plan.key ? (
              <div className="w-full py-2 text-center text-sm text-slate-500 border border-slate-700 rounded-xl">
                {approved === plan.key ? "Активируется..." : "Активен"}
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => handlePay(plan)}
                  disabled={!!loading || polling === plan.key}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold text-white transition ${PLAN_BTN[plan.key]} disabled:opacity-50`}>
                  {loading === plan.key
                    ? "Создаём ссылку..."
                    : polling === plan.key
                      ? "Ожидаем оплаты..."
                      : `Оплатить ${plan.price.toLocaleString()} ₽`}
                </button>

                {polling === plan.key && (
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                    <span className="w-3 h-3 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
                    Проверяем каждые 3 с...
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
