import { AdminNav } from "@/components/admin/AdminNav";
import SeoClustersClient from "./SeoClustersClient";

export const dynamic = "force-dynamic";

export default function SeoClustersPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <div className="lg:pl-64">
        <SeoClustersClient />
      </div>
    </div>
  );
}
