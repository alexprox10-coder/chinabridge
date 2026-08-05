import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
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
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <Link href="/admin/ai-company" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm group">
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          <span>AI Кабинет</span>
        </Link>
      </div>
      <AnalyticsDashboard initialReport={report} />
    </div>
  );
}
