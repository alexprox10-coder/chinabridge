import { notFound } from "next/navigation";
import Link from "next/link";
import { getLead } from "@/lib/crm/client";
import { AdminNav } from "@/components/admin/AdminNav";
import { LeadDetail } from "@/components/admin/LeadDetail";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let lead = null;
  try { lead = await getLead(Number(id), "tenant-chinabridge"); } catch (e) {
    console.error("[LeadDetail] getLead failed:", e);
  }
  if (!lead) notFound();
  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <Link href="/admin/leads" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm group">
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          <span>Все лиды</span>
        </Link>
      </div>
      <LeadDetail lead={lead} />
    </div>
  );
}
