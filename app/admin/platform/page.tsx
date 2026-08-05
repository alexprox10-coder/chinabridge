import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import PlatformDashboard from "./PlatformDashboard";

export const dynamic = "force-dynamic";

export default async function PlatformPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get("cb_admin")?.value) redirect("/admin/login");
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AdminNav />
      <PlatformDashboard />
    </div>
  );
}
