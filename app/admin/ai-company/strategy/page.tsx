import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
      <StrategyDashboard initialReport={report} />
    </div>
  );
}
