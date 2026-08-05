import { AdminNav } from "@/components/admin/AdminNav";
import DealIntelligenceClient from "./DealIntelligenceClient";

export const dynamic = "force-dynamic";

export default function DealIntelligencePage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <DealIntelligenceClient />
    </div>
  );
}
