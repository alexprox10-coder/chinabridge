import { Suspense } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { VkAdsDashboard } from "./VkAdsDashboard";

export default function VkAdsPage() {
  return (
    <>
      <AdminNav />
      <Suspense fallback={<div className="px-4 py-6 text-sm text-slate-500">Загрузка VK Рекламы…</div>}>
        <VkAdsDashboard />
      </Suspense>
    </>
  );
}
