import { AdminNav } from "@/components/admin/AdminNav";
import { SalesCompaniesClient } from "./SalesCompaniesClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function SalesCompaniesPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <div className="lg:pl-64">
        <SalesCompaniesClient />
      </div>
    </div>
  );
}
