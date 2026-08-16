import { AdminNav } from "@/components/admin/AdminNav";
import { SalesChatClient } from "./SalesChatClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function SalesChatPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <div className="lg:pl-64">
        <SalesChatClient />
      </div>
    </div>
  );
}
