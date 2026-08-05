import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import OperationsDashboard from "./OperationsDashboard";
import { fetchOperationsData } from "@/lib/ai-company/operations/data";
import { generateOperationsDirectorReport } from "@/lib/ai-company/operations/director";

export const dynamic = "force-dynamic";

async function loadReport() {
  try {
    const { deals, partners, cargos, documents, clients, kpis, health, risks } =
      await fetchOperationsData();
    return await generateOperationsDirectorReport(
      health, kpis, deals, partners, cargos, documents, clients, risks,
    );
  } catch {
    return null;
  }
}

export default async function OperationsPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get("cb_admin")?.value) redirect("/admin/login");

  const report = await loadReport();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AdminNav />
      <OperationsDashboard initialReport={report} />
    </div>
  );
}
