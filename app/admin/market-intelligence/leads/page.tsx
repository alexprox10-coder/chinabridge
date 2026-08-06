import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function LeadFinderPage() {
  redirect("/admin/import-leads");
}
