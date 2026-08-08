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
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-blue-100 rounded-2xl px-6 py-12 text-center">
          <div className="text-5xl mb-4">📂</div>
          <p className="text-slate-700 font-semibold text-lg mb-2">Документов пока нет</p>
          <p className="text-slate-500 text-sm mb-5 leading-relaxed max-w-sm mx-auto">
            Договоры, инвойсы, таможенные декларации и акты — всё будет здесь после оформления первой поставки.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://t.me/ChinaBridgeLID_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              ✈️ Начать первую поставку
            </a>
            <a
              href="/knowledge"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-200 hover:border-slate-400 text-slate-600 text-sm font-semibold rounded-xl transition-colors bg-white"
            >
              📚 Узнать об импорте
            </a>
          </div>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-md mx-auto text-xs text-slate-400">
            {["📋 Договор", "🧾 Инвойс", "🛃 Декларация", "🔍 Акт"].map(t => (
              <div key={t} className="bg-white border border-dashed border-slate-200 rounded-lg py-2 px-1">{t}</div>
            ))}
          </div>
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
