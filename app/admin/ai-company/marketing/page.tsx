import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { fetchMarketingData } from "@/lib/ai-company/marketing/data";
import { generateMarketingDirectorReport } from "@/lib/ai-company/marketing/director";
import type { MarketingDirectorReport } from "@/lib/ai-company/marketing/types";
import MarketingDashboard from "./MarketingDashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Marketing Department AI — ChinaBridge" };

async function loadReport(): Promise<MarketingDirectorReport | null> {
  try {
    const { kpis, funnel, health, ads, seo, channels } = await fetchMarketingData();
    return generateMarketingDirectorReport(kpis, funnel, health, ads, seo, channels);
  } catch {
    return null;
  }
}

export default async function MarketingPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get("cb_admin")?.value) redirect("/admin/login");

  const report = await loadReport();

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <MarketingDashboard initialReport={report} />
      </main>
    </div>
  );
}
