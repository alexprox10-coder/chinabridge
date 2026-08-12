import { AdminNav } from "@/components/admin/AdminNav";
import HhLeadsClient from "./HhLeadsClient";

export const dynamic = "force-dynamic";

export default function HhLeadsPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <div className="lg:pl-64">
        <HhLeadsClient />
      </div>
    </div>
  );
}
