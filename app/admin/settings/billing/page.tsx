import Link from "next/link";
import { cookies } from "next/headers";
import { AdminNav } from "@/components/admin/AdminNav";
import { getTenantById } from "@/lib/multitenant/store";
import { PLAN_CONFIG } from "@/lib/multitenant/types";
import type { BillingPlan } from "@/lib/multitenant/types";
import BillingClient from "./BillingClient";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const store    = await cookies();
  const tenantId = store.get("cb_tenant_id")?.value ?? "tenant-chinabridge";

  const tenant = await getTenantById(tenantId).catch(() => null);
  const currentPlan = (tenant?.plan ?? "trial") as BillingPlan;

  const plans = (["starter", "pro", "enterprise"] as BillingPlan[]).map(key => ({
    key,
    ...PLAN_CONFIG[key],
    isCurrent: key === currentPlan,
  }));

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/admin/settings" className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-4 transition">
            ← Настройки
          </Link>
          <h1 className="text-2xl font-bold text-white">💳 Подписка и оплата</h1>
          <p className="text-slate-400 text-sm mt-1">
            Текущий тариф:{" "}
            <span className="text-white font-semibold">{PLAN_CONFIG[currentPlan].label}</span>
            {currentPlan === "trial" && (
              <span className="ml-2 text-amber-400 text-xs">— пробный период</span>
            )}
          </p>
        </div>

        <BillingClient plans={plans} tenantId={tenantId} currentPlan={currentPlan} />

        {/* Payment details */}
        <div className="mt-8 p-4 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-500 space-y-1">
          <p>🔒 Оплата через Точка Банк — карта, СБП, Т-Pay. Комиссия 2.8% на стороне банка.</p>
          <p>📄 Чек отправляется автоматически через цифровую кассу Точки.</p>
          <p>🔄 После оплаты тариф активируется в течение нескольких секунд.</p>
        </div>
      </main>
    </div>
  );
}
