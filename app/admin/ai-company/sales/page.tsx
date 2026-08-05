import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { fetchAllSalesData } from "@/lib/ai-company/sales/data";
import { generateSalesDirectorReport } from "@/lib/ai-company/sales/director";
import type { SalesDirectorReport } from "@/lib/ai-company/sales/types";
import SalesDashboard from "./SalesDashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sales Department AI — ChinaBridge" };

async function loadReport(): Promise<SalesDirectorReport | null> {
  try {
    const { importLeads, platformLeads, pipelineHealth, followupQueue, kpis } = await fetchAllSalesData();
    const director = await generateSalesDirectorReport(kpis, pipelineHealth, importLeads, platformLeads, followupQueue);
    return {
      summary: director.summary,
      kpis,
      pipelineHealth,
      importLeads,
      platformLeads,
      followupQueue,
      recommendations: director.recommendations,
      tasks: director.tasks,
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export default async function SalesPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get("cb_admin")?.value) redirect("/admin/login");

  const report = await loadReport();

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <SalesDashboard initialReport={report} />
      </main>
    </div>
  );
}
