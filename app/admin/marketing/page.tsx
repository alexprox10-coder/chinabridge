import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { MarketingPageClient } from "@/components/admin/marketing/MarketingPageClient";

export const metadata = { title: "Marketing AI — ChinaBridge CRM" };

export default async function MarketingPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get("cb_admin")?.value) redirect("/admin/login");

  return (
    <>
      <AdminNav />
      <MarketingPageClient />
    </>
  );
}
