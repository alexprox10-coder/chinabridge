import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function ImportLeadsPage() {
  redirect("/admin/market-intelligence");
}
