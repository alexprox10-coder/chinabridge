"use client";
import { useState, useCallback, useMemo } from "react";
import type { SalesDirectorReport, ImportLeadEnhanced, PlatformLead, FollowupItem, SalesRecommendation, SalesKPI, PipelineHealth } from "@/lib/ai-company/sales/types";

type Tab = "overview" | "import" | "platform" | "followup" | "recs";
type Priority = "HIGH" | "MEDIUM" | "LOW";

const PRIO: Record<Priority, { cls: string; label: string }> = {
  HIGH:   { cls: "bg-red-900/40 text-red-300 border-red-700",    label: "ВЫСОКИЙ" },
  MEDIUM: { cls: "bg-amber-900/40 text-amber-300 border-amber-700", label: "СРЕДНИЙ" },
  LOW:    { cls: "bg-slate-800 text-slate-400 border-slate-600", label: "НИЗКИЙ" },
};

const TEMP_CFG = {
  HOT:  { dot: "bg-red-400",    badge: "bg-red-900/40 text-red-300 border-red-700",    icon: "🔥" },
  WARM: { dot: "bg-amber-400",  badge: "bg-amber-900/40 text-amber-300 border-amber-700", icon: "🌡️" },
  COLD: { dot: "bg-blue-400",   badge: "bg-blue-900/40 text-blue-300 border-blue-700", icon: "❄️" },
};

function KpiCard({ icon, label, value, sub }: { icon: string; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
      <div className="text-lg mb-1">{icon}</div>
      <div className="text-white text-2xl font-bold">{value === 0 ? <span className="text-slate-500">—</span> : value}</div>
      <div className="text-slate-400 text-xs mt-0.5">{label}</div>
      {sub && <div className="text-slate-600 text-xs mt-0.5">{sub}</div>}
    </div>
  );
}

function ScoreBar({ score, temperature }: { score: number; temperature: string }) {
  const color = temperature === "HOT" ? "bg-red-500" : temperature === "WARM" ? "bg-amber-500" : "bg-blue-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold text-slate-300 w-8 text-right">{score}</span>
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────
function OverviewTab({ kpis, pipeline }: { kpis: SalesKPI; pipeline: PipelineHealth }) {
  const byStatus = pipeline.byStatus ?? {};
  const stages = [
    { key: "NEW", label: "Новые", color: "bg-blue-500" },
    { key: "CONTACTED", label: "Связались", color: "bg-cyan-500" },
    { key: "CALCULATION", label: "Расчёт", color: "bg-yellow-500" },
    { key: "OFFER_SENT", label: "КП отправлено", color: "bg-orange-500" },
    { key: "NEGOTIATION", label: "Переговоры", color: "bg-indigo-500" },
    { key: "SUCCESS", label: "Сделки", color: "bg-emerald-500" },
  ];
  const maxVal = Math.max(1, ...stages.map(s => byStatus[s.key] ?? 0));

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div>
        <div className="text-slate-400 text-xs uppercase tracking-wider mb-3">Ключевые показатели</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <KpiCard icon="🎯" label="Новых заявок" value={kpis.newLeads} />
          <KpiCard icon="🔥" label="Горячих лидов" value={kpis.hotLeads} />
          <KpiCard icon="📞" label="Связались" value={kpis.contacted} />
          <KpiCard icon="🤝" label="Переговоры" value={kpis.negotiation} />
          <KpiCard icon="📄" label="КП отправлено" value={kpis.proposals} />
          <KpiCard icon="✅" label="Сделок" value={kpis.deals} />
          <KpiCard icon="💰" label="Выручка" value={kpis.revenue > 0 ? `₽${(kpis.revenue/1000).toFixed(0)}K` : 0} />
          <KpiCard icon="📊" label="Конверсия" value={kpis.conversion > 0 ? `${kpis.conversion}%` : 0} />
        </div>
      </div>

      {/* Import Finder + Pipeline in row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Finder stats */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-4">Import Client Finder</div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{kpis.importLeadsTotal}</div>
              <div className="text-slate-500 text-xs">Всего лидов</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{kpis.importLeadsHot}</div>
              <div className="text-slate-500 text-xs">HOT 🔥</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{kpis.platformLeadsTotal}</div>
              <div className="text-slate-500 text-xs">Platform Leads</div>
            </div>
          </div>
          {pipeline.problems.length > 0 && (
            <div className="space-y-2">
              {pipeline.problems.map((p, i) => (
                <div key={i} className="bg-red-900/20 border border-red-800 rounded-lg px-3 py-2 text-red-300 text-xs">
                  ⚠ {p}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pipeline funnel */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-4">Воронка продаж</div>
          <div className="space-y-2">
            {stages.map(s => {
              const n = byStatus[s.key] ?? 0;
              const pct = Math.round((n / maxVal) * 100);
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <span className="text-slate-400 text-xs w-24 shrink-0">{s.label}</span>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-white text-xs font-bold w-4 text-right">{n}</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-4 pt-4 border-t border-slate-800">
            <div className="text-center flex-1">
              <div className="text-amber-400 font-bold">{pipeline.stale7d}</div>
              <div className="text-slate-500 text-xs">Зависших</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-white font-bold">{pipeline.active}</div>
              <div className="text-slate-500 text-xs">Активных</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-slate-400 font-bold">{pipeline.avgDealDays}</div>
              <div className="text-slate-500 text-xs">Дней / сделка</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Import Leads Tab ─────────────────────────────────────────────────────────
function ImportLeadsTab({ leads, onNotify, onDelete }: { leads: ImportLeadEnhanced[]; onNotify: () => void; onDelete: (leadId: string) => void }) {
  const [filter, setFilter] = useState<"ALL" | "HOT" | "WARM" | "COLD">("ALL");
  const [notifying, setNotifying] = useState(false);
  const [notified, setNotified] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = filter === "ALL" ? leads : leads.filter(l => l.temperature === filter);
  const hotCount = leads.filter(l => l.temperature === "HOT").length;

  const handleDelete = async (lead: ImportLeadEnhanced) => {
    if (deleting) return;
    setDeleting(lead.lead_id);
    try {
      const params = new URLSearchParams({ system: "import" });
      params.set("lead_id", lead.lead_id);
      if (lead.id) params.set("n8n_id", String(lead.id));
      const res  = await fetch(`/api/admin/leads?${params}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({ ok: false }));
      if (data.ok) {
        onDelete(lead.lead_id);
        setToast("Лид удалён");
        setTimeout(() => setToast(null), 3000);
      }
    } finally { setDeleting(null); }
  };

  const handleNotify = async () => {
    setNotifying(true);
    try {
      const res = await fetch("/api/ai-company/sales/notify-hot", { method: "POST" });
      const data = await res.json();
      if (data.ok) setNotified(data.sent);
      onNotify();
    } catch { /* ignore */ } finally {
      setNotifying(false);
    }
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-xl border bg-green-900/90 border-green-700 text-green-200">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2">
          {(["ALL","HOT","WARM","COLD"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === f ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
            >
              {f === "ALL" ? `Все (${localLeads.length})` : f === "HOT" ? `🔥 HOT (${hotCount})` : f === "WARM" ? `🌡️ WARM` : `❄️ COLD`}
            </button>
          ))}
        </div>
        {hotCount > 0 && (
          <button
            onClick={handleNotify}
            disabled={notifying}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition"
          >
            {notifying ? "⟳ Отправка..." : `📩 Уведомить HOT (${hotCount})`}
          </button>
        )}
      </div>

      {notified !== null && (
        <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg px-4 py-2 text-emerald-300 text-sm">
          ✓ Отправлено {notified} уведомлений в Telegram
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">Нет лидов с этим фильтром</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((lead, i) => {
            const tc = TEMP_CFG[lead.temperature];
            return (
              <div key={i} className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded border text-xs font-bold ${tc.badge}`}>
                        {tc.icon} {lead.temperature}
                      </span>
                      <span className="text-white font-semibold">{lead.company}</span>
                      <span className="text-slate-500 text-xs">{lead.category}</span>
                      {lead.city && <span className="text-slate-600 text-xs">{lead.city}</span>}
                    </div>
                    <ScoreBar score={lead.score100} temperature={lead.temperature} />
                    <div className="mt-2 text-slate-400 text-xs line-clamp-2">{lead.why}</div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      <span className="text-emerald-400 font-medium">→ {lead.nextAction}</span>
                      <span className="text-slate-500">Вероятность: {lead.probability}%</span>
                      <span className="text-slate-500">~₽{(lead.potentialValue/1000).toFixed(0)}K</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    {lead.phone && <div className="text-slate-300 text-xs">📞 {lead.phone}</div>}
                    {lead.telegram && <div className="text-blue-400 text-xs">✈️ {lead.telegram}</div>}
                    {lead.website && (
                      <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer" className="text-slate-500 text-xs hover:text-slate-300 block truncate max-w-[140px]">
                        🌐 {lead.website.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(lead)}
                      disabled={deleting === lead.lead_id}
                      title="Удалить лид"
                      className="mt-1 p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-900/20 transition disabled:opacity-40">
                      {deleting === lead.lead_id ? "⏳" : "🗑"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Platform Leads Tab ───────────────────────────────────────────────────────
function PlatformLeadsTab({ leads, onAdd }: { leads: PlatformLead[]; onAdd: (l: PlatformLead) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ company: "", website: "", city: "", business_type: "Карго", contact_name: "", phone: "", telegram: "", lead_score: 50, ai_comment: "" });

  const handleAdd = async () => {
    if (!form.company) return;
    setSaving(true);
    try {
      const res = await fetch("/api/ai-company/sales/platform-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, opportunity: form.lead_score >= 70 ? "HIGH" : form.lead_score >= 40 ? "MEDIUM" : "LOW" }),
      });
      const data = await res.json();
      if (data.ok) { onAdd(data.lead); setShowForm(false); setForm({ company: "", website: "", city: "", business_type: "Карго", contact_name: "", phone: "", telegram: "", lead_score: 50, ai_comment: "" }); }
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const oppColor = (o: string) => o === "HIGH" ? "text-emerald-400" : o === "MEDIUM" ? "text-amber-400" : "text-slate-400";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-slate-400 text-sm">{leads.length} компаний в базе Platform Leads</div>
        <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition">
          + Добавить лид
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-900 border border-slate-600 rounded-xl p-5 space-y-4">
          <div className="text-slate-200 font-medium text-sm">Новый Platform Lead</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Компания *", "company", "text"],
              ["Сайт", "website", "text"],
              ["Город", "city", "text"],
              ["Контакт", "contact_name", "text"],
              ["Телефон", "phone", "text"],
              ["Telegram", "telegram", "text"],
            ].map(([label, key, type]) => (
              <div key={key}>
                <label className="text-slate-400 text-xs block mb-1">{label}</label>
                <input type={type} value={(form as Record<string, unknown>)[key] as string} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs block mb-1">Тип бизнеса</label>
              <select value={form.business_type} onChange={e => setForm(f => ({ ...f, business_type: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none">
                {["Карго","Логистика","ВЭД","Другое"].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Lead Score: {form.lead_score}</label>
              <input type="range" min={0} max={100} value={form.lead_score} onChange={e => setForm(f => ({ ...f, lead_score: Number(e.target.value) }))} className="w-full mt-2" />
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-xs block mb-1">AI комментарий</label>
            <textarea value={form.ai_comment} onChange={e => setForm(f => ({ ...f, ai_comment: e.target.value }))} rows={2}
              className="w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleAdd} disabled={saving || !form.company}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition">
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition">Отмена</button>
          </div>
        </div>
      )}

      {leads.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <div className="text-4xl mb-3">🏢</div>
          <div className="font-medium mb-1">База Platform Leads пуста</div>
          <div className="text-xs">Добавьте карго-компании, которые могут стать клиентами платформы</div>
        </div>
      ) : (
        <div className="space-y-2">
          {leads.map((lead, i) => (
            <div key={i} className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-medium">{lead.company}</span>
                  <span className="text-slate-500 text-xs">{lead.business_type}</span>
                  <span className="text-slate-600 text-xs">{lead.city}</span>
                </div>
                {lead.ai_comment && <div className="text-slate-400 text-xs">{lead.ai_comment}</div>}
                {lead.ai_offer && <div className="text-emerald-400 text-xs mt-0.5">→ {lead.ai_offer}</div>}
              </div>
              <div className="text-right shrink-0">
                <div className={`font-bold text-sm ${oppColor(lead.opportunity)}`}>{lead.opportunity}</div>
                <div className="text-slate-500 text-xs">{lead.lead_score}/100</div>
                <div className="text-slate-600 text-xs mt-1">{lead.status}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Followup Tab ─────────────────────────────────────────────────────────────
function FollowupTab({ items, onDelete }: { items: FollowupItem[]; onDelete: (id: number) => void }) {
  const [deleting, setDeleting] = useState<number | null>(null);
  const [toast, setToast]       = useState<string | null>(null);

  const handleDelete = async (item: FollowupItem) => {
    if (deleting || !item.id) return;
    setDeleting(item.id);
    try {
      const res  = await fetch(`/api/admin/leads/${item.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({ ok: false }));
      if (data.ok) {
        onDelete(item.id);
        setToast("Лид удалён");
        setTimeout(() => setToast(null), 3000);
      }
    } finally { setDeleting(null); }
  };

  const priorityDot = (p: string) => p === "HOT" ? "bg-red-400" : p === "WARM" ? "bg-amber-400" : "bg-slate-500";
  return (
    <div className="space-y-2">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-xl border bg-green-900/90 border-green-700 text-green-200">
          {toast}
        </div>
      )}
      {items.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <div className="text-4xl mb-3">✅</div>
          <div>Follow-up очередь пуста</div>
        </div>
      ) : (
        items.map((item) => (
          <div key={item.id} className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex items-center gap-4">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${priorityDot(item.priority)}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-sm">{item.company}</span>
                {item.name && item.name !== "—" && <span className="text-slate-500 text-xs">{item.name}</span>}
              </div>
              <div className="text-emerald-400 text-xs mt-0.5">→ {item.nextAction}</div>
            </div>
            <div className="text-right shrink-0 space-y-0.5">
              <div className={`text-xs font-bold ${item.daysSince >= 7 ? "text-red-400" : item.daysSince >= 3 ? "text-amber-400" : "text-slate-400"}`}>
                {item.daysSince > 0 ? `${item.daysSince} дн.` : "Сегодня"}
              </div>
              <div className="text-slate-500 text-xs">{item.status}</div>
              {item.phone && <div className="text-slate-400 text-xs">📞 {item.phone}</div>}
              {item.telegram && <div className="text-blue-400 text-xs">✈️ {item.telegram}</div>}
              <button
                onClick={() => handleDelete(item)}
                disabled={deleting === item.id}
                title="Удалить лид"
                className="mt-1 p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-900/20 transition disabled:opacity-40">
                {deleting === item.id ? "⏳" : "🗑"}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Recommendations Tab ──────────────────────────────────────────────────────
function RecsTab({ summary, recs, tasks }: { summary: string; recs: SalesRecommendation[]; tasks: import("@/lib/ai-company/sales/types").SalesTask[] }) {
  return (
    <div className="space-y-6">
      {summary && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-slate-300 text-sm leading-relaxed">
          🤖 {summary}
        </div>
      )}
      {recs.length > 0 && (
        <div>
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-3">Рекомендации</div>
          <div className="space-y-3">
            {recs.map(rec => {
              const p = PRIO[rec.priority as Priority] ?? PRIO.LOW;
              return (
                <div key={rec.id} className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded border text-xs font-bold ${p.cls}`}>{p.label}</span>
                    <span className="text-slate-100 font-semibold text-sm">{rec.problem}</span>
                  </div>
                  <div className="text-slate-400 text-xs leading-relaxed">{rec.analysis}</div>
                  <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
                    <div className="text-emerald-400 text-xs font-medium mb-0.5">Действие:</div>
                    <div className="text-slate-200 text-sm">{rec.action}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {tasks.length > 0 && (
        <div>
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-3">Задачи</div>
          <div className="bg-slate-900 border border-slate-700 rounded-xl divide-y divide-slate-800">
            {tasks.map(task => {
              const p = PRIO[task.priority as Priority] ?? PRIO.LOW;
              return (
                <div key={task.id} className="flex items-start gap-3 p-4">
                  <span className={`mt-0.5 px-2 py-0.5 rounded border text-xs font-bold shrink-0 ${p.cls}`}>{task.priority}</span>
                  <div className="flex-1">
                    <div className="text-slate-100 text-sm font-medium">{task.title}</div>
                    <div className="text-slate-400 text-xs mt-0.5">{task.description}</div>
                  </div>
                  <div className="text-slate-400 text-xs shrink-0">{task.deadline}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function SalesDashboard({ initialReport }: { initialReport: SalesDirectorReport | null }) {
  const [report, setReport] = useState<SalesDirectorReport | null>(initialReport);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [platformLeads, setPlatformLeads] = useState<PlatformLead[]>(initialReport?.platformLeads ?? []);
  const [deletedImportIds, setDeletedImportIds] = useState<Set<string>>(new Set());
  const [deletedCrmIds, setDeletedCrmIds] = useState<Set<number>>(new Set());

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/ai-company/sales/report");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Ошибка");
      setReport(data.report);
      setPlatformLeads(data.report.platformLeads ?? []);
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  }, []);

  const handleDeleteImport = useCallback((leadId: string) => {
    setDeletedImportIds(prev => new Set([...prev, leadId]));
  }, []);

  const handleDeleteCrm = useCallback((id: number) => {
    setDeletedCrmIds(prev => new Set([...prev, id]));
  }, []);

  const visibleImportLeads = useMemo(
    () => report ? report.importLeads.filter(l => !deletedImportIds.has(l.lead_id)) : [],
    [report, deletedImportIds]
  );
  const visibleFollowup = useMemo(
    () => report ? report.followupQueue.filter(i => !deletedCrmIds.has(i.id)) : [],
    [report, deletedCrmIds]
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview",  label: "📊 Обзор" },
    { id: "import",    label: `🎯 Импорт лиды${report ? ` (${visibleImportLeads.length})` : ""}` },
    { id: "platform",  label: `🏢 Платформа${platformLeads.length > 0 ? ` (${platformLeads.length})` : ""}` },
    { id: "followup",  label: `⏰ Дожим${report ? ` (${visibleFollowup.length})` : ""}` },
    { id: "recs",      label: "🤖 AI Директор" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <a href="/admin/ai-company" className="hover:text-white transition">🤖 AI Company OS</a>
            <span>/</span>
            <span className="text-white">💼 Sales Department</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Sales Director AI</h1>
          <p className="text-slate-400 text-sm mt-0.5">Управление продажами · Import &amp; Platform Leads · Follow-up</p>
        </div>
        <button onClick={refresh} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:text-blue-400 text-white rounded-lg text-sm font-medium transition shrink-0">
          {loading ? <><span className="animate-spin">⟳</span> Загрузка...</> : <>🔄 Обновить</>}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm">⚠ {error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm whitespace-nowrap transition border-b-2 -mb-px ${tab === t.id ? "border-blue-500 text-white font-medium" : "border-transparent text-slate-400 hover:text-slate-200"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* No data */}
      {!report && !loading ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">💼</div>
          <div className="text-slate-300 font-medium mb-2">Sales Department не загружен</div>
          <button onClick={refresh} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition">
            🚀 Загрузить данные
          </button>
        </div>
      ) : loading && !report ? (
        <div className="text-center py-20">
          <div className="text-4xl animate-spin mb-4">⟳</div>
          <div className="text-slate-400 text-sm">Sales Director AI анализирует данные...</div>
        </div>
      ) : report ? (
        <>
          {tab === "overview"  && <OverviewTab kpis={report.kpis} pipeline={report.pipelineHealth} />}
          {tab === "import"    && <ImportLeadsTab leads={visibleImportLeads} onNotify={refresh} onDelete={handleDeleteImport} />}
          {tab === "platform"  && <PlatformLeadsTab leads={platformLeads} onAdd={l => setPlatformLeads(prev => [l, ...prev])} />}
          {tab === "followup"  && <FollowupTab items={visibleFollowup} onDelete={handleDeleteCrm} />}
          {tab === "recs"      && <RecsTab summary={report.summary} recs={report.recommendations} tasks={report.tasks} />}
        </>
      ) : null}
    </div>
  );
}
