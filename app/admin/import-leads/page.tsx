import { getAllLeads } from "@/lib/import-leads/crm";
import ImportLeadsDashboard from "./ImportLeadsDashboard";

export const metadata = {
  title: "Import Client Finder | ChinaBridge Admin",
  description: "AI-агент поиска потенциальных клиентов на импорт из Китая",
};

export const dynamic = "force-dynamic";

export default async function ImportLeadsPage() {
  const tableConfigured = !!process.env.N8N_IMPORT_LEADS_TABLE_ID;
  const leads = await getAllLeads("chinabridge");

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <ImportLeadsDashboard
        initialLeads={leads}
        isTableConfigured={tableConfigured}
      />
    </div>
  );
}
