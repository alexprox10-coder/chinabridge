import { Suspense } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import KonturLeadsClient from "./KonturLeadsClient";

export const metadata = { title: "Контур Лиды — ChinaBridge Admin" };

export default function KonturLeadsPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <Suspense fallback={<div className="p-8 text-slate-400">Загрузка...</div>}>
        <KonturLeadsClient />
      </Suspense>
    </div>
  );
}
