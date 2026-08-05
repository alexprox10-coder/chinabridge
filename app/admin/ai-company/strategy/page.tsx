import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import StrategyDashboard from "./StrategyDashboard";
import { fetchStrategyData } from "@/lib/ai-company/strategy/data";
import { generateStrategyDirectorReport } from "@/lib/ai-company/strategy/director";

export const dynamic = "force-dynamic";

async function loadReport() {
  try {
    const data = fetchStrategyData();
    return await generateStrategyDirectorReport(data);
  } catch {
    return null;
  }
}

export default async function StrategyPage() {
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
      <StrategyDashboard initialReport={report} />
    </div>
  );
}
