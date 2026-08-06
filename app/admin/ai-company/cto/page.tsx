import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { getLatestCtoReport } from "@/lib/ai-cto/db";
import CtoDashboard from "./CtoDashboard";

export const dynamic  = "force-dynamic";
export const metadata = { title: "AI CTO — ChinaBridge Platform" };

export default async function CtoPage() {
  const store   = await cookies();
  const isAdmin = store.get("cb_admin")?.value;
  if (!isAdmin) redirect("/admin/login");

  const report = await getLatestCtoReport().catch(() => null);

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/admin/ai-company"
            className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-4 transition">
            ← AI Company OS
          </Link>
        </div>
        <CtoDashboard initialReport={report} />
      </main>
    </div>
  );
}
