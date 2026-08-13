import { AdminNav } from "@/components/admin/AdminNav";
import AiSalesAgentClient from "./AiSalesAgentClient";

export const dynamic = "force-dynamic";

export default function AiSalesAgentPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <div className="lg:pl-64">
        <AiSalesAgentClient />
      </div>
    </div>
  );
}
