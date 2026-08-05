import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { buildAllDepartments, buildCompanyMetrics } from "@/lib/ai-company/departments";
import { generateCeoReport } from "@/lib/ai-company/ceo";
import type { CeoReport } from "@/lib/ai-company/types";
import { AdminNav } from "@/components/admin/AdminNav";
import AiOsDashboard from "./AiOsDashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI Company OS — ChinaBridge Admin" };

async function loadInitialReport(): Promise<CeoReport | null> {
  try {
    const departments = await buildAllDepartments();
    const metrics = await buildCompanyMetrics(departments);
    const ceo = await generateCeoReport(departments, metrics);
    return {
      companyHealth: ceo.companyHealth,
      healthScore: ceo.healthScore,
      summary: ceo.summary,
      metrics,
      departments,
      recommendations: ceo.recommendations,
      tasks: ceo.tasks,
      generatedAt: new Date().toISOString(),
      period: "week",
    };
  } catch {
    return null;
  }
}

export default async function AiCompanyPage() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("cb_admin")?.value;
  if (!isAdmin) redirect("/admin/login");

  const report = await loadInitialReport();

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <AiOsDashboard initialReport={report} />
      </main>
    </div>
  );
}
