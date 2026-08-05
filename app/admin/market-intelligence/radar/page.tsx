import { AdminNav } from "@/components/admin/AdminNav";
import RadarClient from "./RadarClient";

export const dynamic = "force-dynamic";

export default function RadarPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <RadarClient />
    </div>
  );
}
