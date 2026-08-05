import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import FinanceDashboard from "./FinanceDashboard";
import { fetchFinanceData } from "@/lib/ai-company/finance/data";
import { generateFinanceDirectorReport } from "@/lib/ai-company/finance/director";

export const dynamic = "force-dynamic";

async function loadReport() {
  try {
    const { revenue, costs, profit, unitEconomics, forecast, saas, health } =
      await fetchFinanceData();
    return generateFinanceDirectorReport(
      health, revenue, costs, profit, unitEconomics, forecast, saas,
    );
  } catch {
    return null;
  }
}

export default async function FinancePage() {
  const cookieStore = await cookies();
  if (!cookieStore.get("cb_admin")?.value) redirect("/admin/login");

  const report = await loadReport();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AdminNav />
      <FinanceDashboard initialReport={report} />
    </div>
  );
}
