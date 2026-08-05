import { AdminNav } from "@/components/admin/AdminNav";
import LeadFinderClient from "./LeadFinderClient";

export const dynamic = "force-dynamic";

export default function LeadFinderPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <LeadFinderClient />
    </div>
  );
}
