import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import CeoDashboard from "./CeoDashboard";

export const dynamic = "force-dynamic";

export default async function CeoPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get("cb_admin")?.value) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <Link href="/admin/ai-company" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm group">
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          <span>AI Кабинет</span>
        </Link>
      </div>
      <CeoDashboard />
    </div>
  );
}
