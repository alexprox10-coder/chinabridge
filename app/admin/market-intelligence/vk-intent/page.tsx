import { AdminNav } from "@/components/admin/AdminNav";
import VkIntentClient from "./VkIntentClient";

export const dynamic = "force-dynamic";

export default function VkIntentPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">📡</span>
            <h1 className="text-3xl font-bold text-white">VK Intent Leads</h1>
          </div>
          <p className="text-slate-400 ml-12 mt-1">
            Поиск пользователей ВКонтакте, которые прямо сейчас ищут карго из Китая или поставщиков на 1688
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-500 flex flex-wrap gap-6">
          <span>⏱ Крон: ежедневно 11:00 UTC</span>
          <span>🔍 14 интент-запросов (4 случайных за запуск)</span>
          <span>🤖 Классификатор: Claude Haiku · score 0–100</span>
          <span>🔥 HOT ≥ 70 · 🟡 WARM 40–69</span>
        </div>

        <VkIntentClient />

      </main>
    </div>
  );
}
