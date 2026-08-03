import { notFound } from "next/navigation";
import { getLead } from "@/lib/crm/client";
import { AdminNav } from "@/components/admin/AdminNav";
import { LeadDetail } from "@/components/admin/LeadDetail";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await getLead(Number(id));
  if (!lead) notFound();
  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <LeadDetail lead={lead} />
    </div>
  );
}
