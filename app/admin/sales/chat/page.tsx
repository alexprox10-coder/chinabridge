import { AdminNav } from "@/components/admin/AdminNav";
import { SalesChatClient } from "./SalesChatClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SalesChatPage({ searchParams }: { searchParams: Promise<{ lead?: string }> }) {
  const params = await searchParams;
  const leadId = params.lead ?? null;
  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <div className="lg:pl-64">
        <SalesChatClient initialLeadId={leadId} />
      </div>
    </div>
  );
}
