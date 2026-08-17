"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CRMLead, LeadStatus, LeadPriority } from "@/lib/crm/types";

interface AiSummary {
  score: number;
  level: "HOT" | "WARM" | "COLD";
  dealMin: number;
  dealMax: number;
  dealProbability: number;
  nextAction: string;
  contacts: { phones: string[]; emails: string[]; whatsapp: string | null; telegram: string | null };
}

function AiCommandCenter({ ai, leadPhone, leadId, onContactLogged }: {
  ai: AiSummary;
  leadPhone?: string;
  leadId: number;
  onContactLogged?: () => void;
}) {
  const borderMap = { HOT: "border-red-700/50 bg-red-950/10", WARM: "border-amber-700/50 bg-amber-950/10", COLD: "border-blue-700/50 bg-blue-950/10" };
  const scoreMap  = { HOT: "text-red-400", WARM: "text-amber-400", COLD: "text-blue-400" };
  const badgeMap  = { HOT: "bg-red-600", WARM: "bg-amber-600", COLD: "bg-blue-700" };

  async function logContact(channel: string) {
    await fetch(`/api/admin/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact_logged: channel }),
    });
    onContactLogged?.();
  }

  const phone = ai.contacts.phones[0] || leadPhone;
  const whatsapp = ai.contacts.whatsapp;
  const email = ai.contacts.emails[0];

  return (
    <div className={`border rounded-xl p-4 space-y-3 ${borderMap[ai.level]}`}>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className={`text-4xl font-black leading-none ${scoreMap[ai.level]}`}>{ai.score}</span>
          <div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${badgeMap[ai.level]}`}>{ai.level}</span>
            <p className="text-xs text-slate-500 mt-0.5">Lead Score</p>
          </div>
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          {ai.dealMin > 0 && (
            <p className="text-xs text-slate-400">
              Потенциал: <span className="text-white font-medium">${ai.dealMin.toLocaleString()}–${ai.dealMax.toLocaleString()}</span>
              <span className="text-slate-600 ml-1">· AI estimate</span>
            </p>
          )}
          {ai.dealProbability > 0 && (
            <p className="text-xs text-slate-400">
              Вероятность сделки:{" "}
              <span className={`font-medium ${ai.dealProbability >= 50 ? "text-emerald-400" : "text-amber-400"}`}>
                {ai.dealProbability}%
              </span>
            </p>
          )}
          {ai.nextAction && (
            <p className="text-xs text-slate-300">
              <span className="text-slate-500">Цель: </span>{ai.nextAction}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {phone && (
          <a href={`tel:${phone.replace(/\s/g, "")}`} onClick={() => logContact("phone")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 text-green-400 rounded-lg text-xs transition">
            📞 Позвонить
          </a>
        )}
        {whatsapp && (
          <a href={whatsapp} target="_blank" rel="noreferrer" onClick={() => logContact("whatsapp")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/30 text-emerald-400 rounded-lg text-xs transition">
            💬 WhatsApp
          </a>
        )}
        {email && (
          <a href={`mailto:${email}`} onClick={() => logContact("email")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 text-blue-400 rounded-lg text-xs transition">
            ✉ Email
          </a>
        )}
      </div>
    </div>
  );
}
import { ProposalButton } from "@/components/admin/ProposalButton";
import { FinanceTab }    from "@/components/admin/finance/FinanceTab";
import { DocumentsTab } from "@/components/admin/documents/DocumentsTab";
import { PersonalOfferWidget } from "@/components/admin/PersonalOfferWidget";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  PRIORITY_COLORS,
  PRIORITY_EMOJI,
} from "@/lib/crm/types";

const ALL_STATUSES: LeadStatus[] = [
  "NEW","RESEARCHED","CONTACTED","QUALIFICATION","CALCULATION",
  "OFFER_SENT","NEGOTIATION","WAITING_CLIENT","PAYMENT","DELIVERY","SUCCESS","LOST",
];
const ALL_PRIORITIES: LeadPriority[] = ["HOT","WARM","COLD"];

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-slate-200">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

type MainTab = "info" | "finance" | "documents";

export function LeadDetail({ lead }: { lead: CRMLead }) {
  const router = useRouter();
  const [mainTab, setMainTab] = useState<MainTab>("info");
  const [status, setStatus] = useState<LeadStatus>((lead.status ?? "NEW") as LeadStatus);
  const [priority, setPriority] = useState<LeadPriority>((lead.priority ?? "COLD") as LeadPriority);
  const [comment, setComment] = useState(lead.comment ?? "");
  const [manager, setManager] = useState(lead.manager ?? "");
  const [estimatedValue, setEstimatedValue] = useState(lead.estimated_value ?? 0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [aiSummary, setAiSummary] = useState<AiSummary | null>(null);

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, { method: "DELETE" });
      if (res.ok) router.push("/admin/leads");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/admin/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, priority, comment, manager, estimated_value: estimatedValue }),
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); router.refresh(); }, 1500);
    } finally {
      setSaving(false);
    }
  }

  const tgLink = lead.telegram ? `https://t.me/${lead.telegram.replace("@", "")}` : null;
  const callLink = lead.phone ? `tel:${lead.phone.replace(/\s/g, "")}` : null;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-slate-500 text-sm mb-1">#{lead.id} · {(lead.created_at ?? "").slice(0, 10)}</p>
          <h1 className="text-2xl font-bold text-white">{lead.name || "Без имени"}</h1>
          <p className="text-slate-400 mt-0.5">{lead.product || "—"}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button
            onClick={handleDelete}
            disabled={deleting}
            onBlur={() => setConfirmDelete(false)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition disabled:opacity-50 ${
              confirmDelete
                ? "bg-red-700 border-red-600 text-white"
                : "border-slate-700 text-slate-500 hover:border-red-700 hover:text-red-400"
            }`}
          >
            {deleting ? "..." : confirmDelete ? "⚠️ Подтвердить удаление" : "🗑"}
          </button>
          {callLink && (
            <a href={callLink}
              className="flex items-center gap-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 text-green-400 rounded-lg text-sm transition">
              📞 Позвонить
            </a>
          )}
          {tgLink && (
            <a href={tgLink} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 text-blue-400 rounded-lg text-sm transition">
              ✈️ Telegram
            </a>
          )}
          <ProposalButton leadId={lead.id} leadName={lead.name || "Клиент"} />
        </div>
      </div>

      {/* AI Command Center */}
      {aiSummary && (
        <AiCommandCenter
          ai={aiSummary}
          leadPhone={lead.phone}
          leadId={lead.id}
          onContactLogged={() => router.refresh()}
        />
      )}

      {/* Main tabs */}
      <div className="flex gap-1 bg-slate-900/60 border border-slate-800 rounded-xl p-1.5 w-fit">
        {([
          { key: "info",      label: "📋 Заявка" },
          { key: "finance",   label: "💰 Финансы" },
          { key: "documents", label: "📄 Документы" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setMainTab(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              mainTab === key
                ? "bg-slate-700 text-white"
                : "text-slate-500 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Documents tab */}
      {mainTab === "documents" && (
        <DocumentsTab
          leadId={lead.lead_id || String(lead.id)}
          leadName={lead.name || "Клиент"}
        />
      )}

      {/* Finance tab */}
      {mainTab === "finance" && (
        <FinanceTab
          leadId={lead.lead_id || String(lead.id)}
          leadName={lead.name || "Клиент"}
          manager={lead.manager ?? ""}
        />
      )}

      {/* Info tab */}
      {mainTab === "info" && <div className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column: client info */}
        <div className="lg:col-span-2 space-y-5">
          <Section title="Клиент">
            <Field label="Имя" value={lead.name} />
            <Field label="Телефон" value={lead.phone} />
            <Field label="Telegram" value={lead.telegram} />
            <Field label="Email" value={lead.email} />
            <Field label="Компания" value={lead.company} />
          </Section>

          <Section title="Запрос">
            <Field label="Товар" value={lead.product} />
            <Field label="Категория" value={lead.category} />
            <Field label="Количество" value={lead.quantity} />
            <Field label="Вес" value={lead.weight ? `${lead.weight} кг` : undefined} />
            <Field label="Объём" value={lead.volume ? `${lead.volume} м³` : undefined} />
            {lead.product_link && (
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Ссылка</p>
                <a href={lead.product_link} target="_blank" rel="noreferrer"
                  className="text-red-400 hover:text-red-300 text-sm break-all">
                  {lead.product_link}
                </a>
              </div>
            )}
          </Section>

          <Section title="Маршрут">
            <Field label="Страна назначения" value={lead.country_destination} />
            <Field label="Город назначения" value={lead.city_destination} />
            <Field label="Тип доставки" value={lead.delivery_type} />
            <Field label="Услуга" value={lead.service_type} />
          </Section>

          <Section title="Источник">
            <Field label="Источник" value={lead.source} />
            <Field label="UTM source" value={lead.utm_source} />
            <Field label="UTM campaign" value={lead.utm_campaign} />
          </Section>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Аналитика и комментарий</h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={16}
              className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-red-500 resize-y font-mono leading-relaxed"
              placeholder="Аналитика по компании, что предложить, следующие шаги..."
            />
          </div>
        </div>

        {/* Right column: CRM controls */}
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Управление</h3>

            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Статус</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
              <div className={`mt-1 text-xs px-2 py-0.5 rounded-full border inline-block ${STATUS_COLORS[status]}`}>
                {STATUS_LABELS[status]}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Приоритет</label>
              <div className="flex gap-2">
                {ALL_PRIORITIES.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition ${
                      priority === p ? PRIORITY_COLORS[p] : "border-slate-700 text-slate-500 hover:border-slate-500"
                    }`}
                  >
                    {PRIORITY_EMOJI[p]} {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Менеджер</label>
              <input
                value={manager}
                onChange={(e) => setManager(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                placeholder="Имя менеджера"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Сумма сделки ($)</label>
              <input
                type="number"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                placeholder="0"
              />
            </div>

            <button
              onClick={save}
              disabled={saving}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold transition ${
                saved
                  ? "bg-green-600 text-white"
                  : "bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white"
              }`}
            >
              {saved ? "✓ Сохранено" : saving ? "Сохраняем..." : "Сохранить"}
            </button>

          </div>

          {/* Lead ID / Meta */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 text-xs text-slate-500">
            <p>ID: {lead.lead_id || lead.id}</p>
            <p>Создан: {(lead.created_at ?? "").replace("T", " ").slice(0, 16)}</p>
            {lead.updated_at && <p>Обновлён: {lead.updated_at.replace("T", " ").slice(0, 16)}</p>}
          </div>
        </div>
        </div>

        {/* AI analysis — full width below */}
        <PersonalOfferWidget
          leadId={lead.id}
          onAnalysisReady={(summary) => setAiSummary(summary)}
        />
      </div>}
    </main>
  );
}
