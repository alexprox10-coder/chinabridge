import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { getTenantById } from "@/lib/multitenant/store";
import TenantDetail from "./TenantDetail";

export const dynamic = "force-dynamic";

export default async function TenantPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  if (!cookieStore.get("cb_admin")?.value) redirect("/admin/login");
  const { id } = await params;
  const tenant = await getTenantById(id);
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AdminNav />
      <TenantDetail initialTenant={tenant} tenantId={id} />
    </div>
  );
}
