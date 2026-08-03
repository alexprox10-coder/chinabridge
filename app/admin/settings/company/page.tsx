import { getCompanySettings } from "@/lib/documents/api";
import { CompanySettingsForm } from "@/components/admin/settings/CompanySettingsForm";

export const dynamic = "force-dynamic";

export default async function CompanySettingsPage() {
  const settings = await getCompanySettings();
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <p className="text-slate-500 text-sm mb-1">Настройки</p>
        <h1 className="text-2xl font-bold text-white">🏢 Реквизиты компании</h1>
        <p className="text-slate-400 text-sm mt-1">
          Данные автоматически подставляются во все генерируемые документы
        </p>
      </div>
      <CompanySettingsForm initial={settings} />
    </main>
  );
}
