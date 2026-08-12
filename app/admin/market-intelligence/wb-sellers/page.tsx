import { AdminNav } from "@/components/admin/AdminNav";
import WbSellersClient from "./WbSellersClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "WB Продавцы — AI Лид Finder | ChinaBridge CRM",
};

export default function WbSellersPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <WbSellersClient />
    </div>
  );
}
