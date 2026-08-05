import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { fetchContentData } from "@/lib/ai-company/content/data";
import { generateContentDirectorReport } from "@/lib/ai-company/content/director";
import type { ContentDirectorReport } from "@/lib/ai-company/content/types";
import ContentDashboard from "./ContentDashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Content Department AI — ChinaBridge" };

async function loadReport(): Promise<ContentDirectorReport | null> {
  try {
    const { kpis, health, seo, telegram, youtube, shorts, imageAI } = await fetchContentData();
    return await generateContentDirectorReport(kpis, health, seo, telegram, youtube, shorts, imageAI);
  } catch {
    return null;
  }
}

export default async function ContentPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get("cb_admin")?.value) redirect("/admin/login");

  const report = await loadReport();

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/admin/ai-company" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm mb-4 group">
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          <span>AI Кабинет</span>
        </Link>
        <ContentDashboard initialReport={report} />
      </main>
    </div>
  );
}
