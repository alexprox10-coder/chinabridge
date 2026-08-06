import { AdminNav } from "@/components/admin/AdminNav";
import UnifiedLeadsDashboard from "./UnifiedLeadsDashboard";

export const metadata = {
  title: "Поиск клиентов | ChinaBridge",
  description: "AI-поиск клиентов через Google, Telegram, VK + анализ импортёров",
};

export const dynamic = "force-dynamic";

export default function LeadsSearchPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <UnifiedLeadsDashboard />
    </div>
  );
}
