import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import FinanceDashboard from "./FinanceDashboard";
import { fetchFinanceData } from "@/lib/ai-company/finance/data";
import { generateFinanceDirectorReport } from "@/lib/ai-company/finance/director";

export const dynamic = "force-dynamic";

async function loadReport() {
  try {
    const { revenue, costs, profit, unitEconomics, forecast, saas, health, isDemo } =
      await fetchFinanceData();
    const report = await generateFinanceDirectorReport(
      health, revenue, costs, profit, unitEconomics, forecast, saas,
    );
    return { report, isDemo };
  } catch {
    return null;
  }
}

export default async function FinancePage() {
  const cookieStore = await cookies();
  if (!cookieStore.get("cb_admin")?.value) redirect("/admin/login");

  const loaded = await loadReport();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <Link href="/admin/ai-company" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm group">
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          <span>AI Кабинет</span>
        </Link>
      </div>
      {loaded?.isDemo && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
            <span className="text-base">⚠️</span>
            <span>
              <strong>Демо-данные.</strong> N8N_API_KEY не задан — Finance Module показывает смоделированные цифры, а не реальную выручку.
              Подключите n8n finance_orders для точных данных.
            </span>
          </div>
        </div>
      )}
      <FinanceDashboard initialReport={loaded?.report ?? null} />
    </div>
  );
}
