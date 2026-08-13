import { Suspense } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { IntegrationsClient } from "./IntegrationsClient";

export default function IntegrationsPage() {
  return (
    <>
      <AdminNav />
      <Suspense fallback={<div className="px-4 py-6 text-sm text-slate-500">Загрузка…</div>}>
        <IntegrationsClient />
      </Suspense>
    </>
  );
}
