import { AdminNav } from "@/components/admin/AdminNav";
import { SalesDashboardClient } from "./SalesDashboardClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function SalesDepartmentPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <div className="lg:pl-64">
        <SalesDashboardClient />
      </div>
    </div>
  );
}
