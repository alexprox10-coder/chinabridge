"use client";
import { useState, useEffect, useCallback } from "react";
import type { DocumentMeta, DocumentType } from "@/lib/documents/types";
import {
  DOC_TYPE_LABELS,
  DOC_TYPE_ICONS,
  DOC_STATUS_LABELS,
  DOC_STATUS_COLORS,
} from "@/lib/documents/types";

const ALL_TYPES: DocumentType[] = [
  "invoice",
  "contract",
  "act",
  "invoice_import",
  "packing_list",
  "power_attorney",
];

interface Props {
  leadId: string;
  leadName: string;
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}

export function DocumentsTab({ leadId, leadName }: Props) {
  const [docs, setDocs]       = useState<DocumentMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<DocumentType | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/documents?lead_id=${leadId}`);
      const data = await res.json();
      setDocs(data.documents ?? []);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => { load(); }, [load]);

  async function generate(type: DocumentType) {
    setGenerating(type);
    try {
      const res = await fetch("/api/admin/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId, document_type: type }),
      });
      if (res.ok) await load();
    } finally {
      setGenerating(null);
    }
  }

  async function changeStatus(id: number, status: string) {
    await fetch(`/api/admin/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  if (loading) return (
    <div className="text-slate-500 text-sm text-center py-12">Загрузка документов...</div>
  );

  // Group existing docs by type
  const byType: Record<string, DocumentMeta[]> = {};
  docs.forEach((d) => {
    if (!byType[d.document_type]) byType[d.document_type] = [];
    byType[d.document_type].push(d);
  });

  return (
    <div className="space-y-6">
      {/* Quick-generate buttons */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Создать документ</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ALL_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => generate(type)}
              disabled={generating === type}
              className="flex items-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 text-slate-200 text-sm rounded-xl transition disabled:opacity-50 text-left"
            >
              <span className="text-lg leading-none">{DOC_TYPE_ICONS[type]}</span>
              <span className="text-xs font-medium leading-tight">
                {generating === type ? "Создаём..." : DOC_TYPE_LABELS[type]}
              </span>
            </button>
          ))}
        </div>
        <p className="text-slate-600 text-xs mt-3">
          Документы автоматически заполняются данными из CRM и финансовой карточки сделки.
        </p>
      </div>

      {/* Documents list */}
      {docs.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          <p className="text-2xl mb-2">📄</p>
          <p>Документы ещё не созданы</p>
          <p className="text-xs mt-1 text-slate-600">Нажмите кнопку выше для генерации</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Созданные документы</h4>
          {ALL_TYPES.filter((t) => byType[t]?.length).map((type) => (
            <div key={type}>
              <p className="text-xs text-slate-500 mb-2">{DOC_TYPE_ICONS[type]} {DOC_TYPE_LABELS[type]}</p>
              {byType[type].map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-3 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 mb-2"
                >
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{doc.document_number}</p>
                    <p className="text-slate-500 text-xs">{fmtDate(doc.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={doc.status}
                      onChange={(e) => doc.id && changeStatus(doc.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-lg border bg-transparent focus:outline-none ${DOC_STATUS_COLORS[doc.status]}`}
                    >
                      <option value="draft">Создан</option>
                      <option value="sent">Отправлен</option>
                      <option value="signed">Подписан</option>
                    </select>
                    {doc.file_url && (
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 text-xs font-medium rounded-lg transition"
                      >
                        📄 PDF
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Hint */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
        <p className="text-blue-400 text-xs font-medium mb-1">💡 Автозаполнение</p>
        <p className="text-slate-500 text-xs">
          Для корректного заполнения документов создайте финансовую карточку сделки во вкладке «💰 Финансы» и заполните реквизиты ИП в{" "}
          <a href="/admin/settings/company" className="text-blue-400 underline hover:text-blue-300">Настройках компании</a>.
        </p>
      </div>
    </div>
  );
}
