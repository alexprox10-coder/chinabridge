import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { ContentPageClient } from "@/components/admin/content/ContentPageClient";

export const metadata = { title: "Content AI — ChinaBridge CRM" };

export default async function ContentPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get("cb_admin")?.value) redirect("/admin/login");
  return (
    <>
      <AdminNav />
      <ContentPageClient />
    </>
  );
}
