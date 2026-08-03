import { redirect } from "next/navigation";
import { getSession } from "@/lib/client-portal/auth";
import { getClientDocuments } from "@/lib/client-portal/api";
import { DOC_TYPE_LABELS } from "@/lib/client-portal/types";
import type { DocumentType } from "@/lib/client-portal/types";

export default async function DocumentsPage() {
  const session = await getSession();
  if (!session) redirect("/client/login");

  const docs = await getClientDocuments(session.clientId);

  const byType = docs.reduce<Record<string, typeof docs>>((acc, doc) => {
    const key = doc.doc_type;
    (acc[key] ??= []).push(doc);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Документы</h1>
        <p className="text-slate-500 text-sm mt-1">Все ваши файлы в одном месте</p>
      </div>

      {docs.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl px-6 py-16 text-center">
          <div className="text-5xl mb-4">📂</div>
          <p className="text-slate-600 font-medium">Документов пока нет</p>
          <p className="text-slate-400 text-sm mt-1">Документы появятся после оформления заявки</p>
        </div>
      ) : (
        Object.entries(byType).map(([type, items]) => (
          <div key={type} className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">
              {DOC_TYPE_LABELS[type as DocumentType] ?? type}
            </h2>
            <div className="space-y-2">
              {items.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <span className="text-2xl">
                    {type === "CONTRACT" ? "📋" :
                     type === "INVOICE"  ? "🧾" :
                     type === "CUSTOMS"  ? "🛃" :
                     type === "INSPECTION" ? "🔍" : "📄"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{doc.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Заявка {doc.order_id} · {new Date(doc.created_at).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                  <span className="text-xs text-green-600 font-medium group-hover:underline shrink-0">↓ Скачать</span>
                </a>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
