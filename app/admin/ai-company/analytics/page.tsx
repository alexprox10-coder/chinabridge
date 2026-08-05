import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import AnalyticsDashboard from "./AnalyticsDashboard";
import { fetchAnalyticsData } from "@/lib/ai-company/analytics/data";
import { generateAnalyticsDirectorReport } from "@/lib/ai-company/analytics/director";

export const dynamic = "force-dynamic";

async function loadReport() {
  try {
    const { sales, marketing, content, finance, health, insights } = await fetchAnalyticsData();
    const report = await generateAnalyticsDirectorReport(health, sales, marketing, content, finance, insights);
    return report;
  } catch {
    return null;
  }
}

export default async function AnalyticsPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get("cb_admin")?.value) redirect("/admin/login");

  const report = await loadReport();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AdminNav />
      <AnalyticsDashboard initialReport={report} />
    </div>
  );
}
