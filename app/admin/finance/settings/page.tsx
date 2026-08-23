import { AdminNav } from "@/components/admin/AdminNav";
import { FinanceNav } from "@/components/admin/finance/FinanceNav";
import { getFinanceSettings } from "@/lib/finance/api";
import { FinanceSettingsForm } from "@/components/admin/finance/FinanceSettingsForm";
import type { FinanceSetting } from "@/lib/finance/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FinanceSettingsPage() {
  let settings: FinanceSetting[] = [];
  try { settings = await getFinanceSettings("tenant-chinabridge"); } catch {}
  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-2">⚙️ Настройки финансов</h1>
        <p className="text-slate-400 text-sm mb-6">Курсы валют и параметры расчётов</p>
        <FinanceNav />
        <FinanceSettingsForm settings={settings} />
      </main>
    </div>
  );
}
