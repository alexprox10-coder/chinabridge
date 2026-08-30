"use client";
import { useEffect, useState, useCallback } from "react";
import { AdminNav } from "@/components/admin/AdminNav";

interface TenderOp {
  id: string;
  company_id: string;
  subject: string;
  category: string;
  law_type: string;
  contract_value: number;
  china_import_fit: number;
  opportunity_score: number;
  lead_score: number;
  intent_score: number;
  priority: string;
  status: string;
  stream: string;
  urgency: string;
  repeat_winner: boolean;
  win_count: number;
  delivery_deadline: number | null;
  ai_summary: string | null;
  recommended_offer: string | null;
  next_best_action: string | null;
  estimated_margin_percent: number | null;
  crm_lead_id: string | null;
  source_url: string;
  created_at: string;
}

interface Stats {
  total_procedures: number;
  total_winners: number;
  china_fit_80: number;
  opportunity_80: number;
  hot_count: number;
  repeat_winners: number;
  total_contract_value: number;
}

function rub(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} млрд`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)} млн`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(0)} тыс`;
  return String(n);
}

const PRIORITY_COLOR: Record<string, string> = {
  HIGH:       "text-red-400 border-red-500/40 bg-red-500/10",
  MEDIUM:     "text-yellow-400 border-yellow-500/40 bg-yellow-500/10",
  LOW:        "text-slate-400 border-slate-500/40 bg-slate-700",
  IRRELEVANT: "text-slate-500 border-slate-700 bg-slate-800",
};

const STATUS_COLOR: Record<string, string> = {
  HOT:         "text-red-400 border-red-500/40 bg-red-500/10",
  QUALIFIED:   "text-green-400 border-green-500/40 bg-green-500/10",
  NEW:         "text-blue-400 border-blue-500/40 bg-blue-500/10",
  ANALYZING:   "text-yellow-400 border-yellow-500/40 bg-yellow-500/10",
  CONTACTED:   "text-purple-400 border-purple-500/40 bg-purple-500/10",
  IN_PROGRESS: "text-indigo-400 border-indigo-500/40 bg-indigo-500/10",
  WON:         "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
  LOST:        "text-slate-500 border-slate-600 bg-slate-800",
  IRRELEVANT:  "text-slate-600 border-slate-700 bg-slate-900",
};

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "text-red-400" : score >= 60 ? "text-yellow-400" : score >= 40 ? "text-blue-400" : "text-slate-500";
  return <span className={`font-bold ${color}`}>{score}</span>;
}

function DetailModal({ op, onClose, onFeedback }: {
  op: TenderOp;
  onClose: () => void;
  onFeedback: (id: string, status: string, fb?: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">🏆 Tender Opportunity</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Компания (ИНН)</p>
              <p className="text-sm font-semibold text-white">{op.company_id}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Контракт</p>
              <p className="text-sm font-bold text-emerald-400">{rub(op.contract_value)} ₽</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-500 mb-0.5">Предмет закупки</p>
              <p className="text-sm text-slate-300">{op.subject}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Категория</p>
              <p className="text-sm text-slate-300">{op.category}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Срок поставки</p>
              <p className={`text-sm font-semibold ${op.urgency === "HIGH" ? "text-red-400" : op.urgency === "MEDIUM" ? "text-yellow-400" : "text-slate-400"}`}>
                {op.delivery_deadline ? `${op.delivery_deadline} дней` : "—"}
                {op.urgency === "HIGH" && " 🔥"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 py-3 border-y border-slate-800">
            {[
              { label: "China Fit", val: op.china_import_fit },
              { label: "Opportunity", val: op.opportunity_score },
              { label: "Lead Score", val: op.lead_score },
              { label: "Intent", val: op.intent_score },
            ].map(({ label, val }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-black"><ScoreBadge score={val} /></p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {op.ai_summary && (
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-1.5">AI Summary</p>
              <p className="text-sm text-slate-300 leading-relaxed">{op.ai_summary}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {op.recommended_offer && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-xs text-blue-400 mb-1">Рекомендуемый оффер</p>
                <p className="text-sm text-white font-medium">{op.recommended_offer}</p>
              </div>
            )}
            {op.next_best_action && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <p className="text-xs text-green-400 mb-1">Следующий шаг</p>
                <p className="text-sm text-white">{op.next_best_action}</p>
              </div>
            )}
          </div>

          {op.repeat_winner && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
              <p className="text-sm text-purple-300">🔄 Повторный победитель — {op.win_count} побед за год</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <a href={op.source_url} target="_blank" rel="noopener noreferrer"
              className="flex-1 text-center py-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700">
              Открыть в ЕИС →
            </a>
            {op.crm_lead_id && (
              <a href={`/admin/leads/${op.crm_lead_id}`}
                className="flex-1 text-center py-2 text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg border border-blue-600/30">
                CRM Лид →
              </a>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={() => { onFeedback(op.id, "WON", "good_lead"); onClose(); }}
              className="flex-1 py-2 text-xs bg-green-600/20 hover:bg-green-600/30 text-green-300 rounded-lg border border-green-600/30">
              ✅ Хороший лид
            </button>
            <button onClick={() => { onFeedback(op.id, "IN_PROGRESS", "potential_deal"); onClose(); }}
              className="flex-1 py-2 text-xs bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 rounded-lg border border-yellow-600/30">
              💰 Потенциальная сделка
            </button>
            <button onClick={() => { onFeedback(op.id, "IRRELEVANT", "not_relevant"); onClose(); }}
              className="flex-1 py-2 text-xs bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg border border-red-600/30">
              ❌ Нерелевантно
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TenderDashboard() {
  const [rows, setRows]       = useState<TenderOp[]>([]);
  const [stats, setStats]     = useState<Stats | null>(null);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TenderOp | null>(null);
  const [filters, setFilters] = useState({
    status: "", priority: "", stream: "", min_fit: "", min_score: "", page: 1,
  });
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.status)    params.set("status",    filters.status);
    if (filters.priority)  params.set("priority",  filters.priority);
    if (filters.stream)    params.set("stream",     filters.stream);
    if (filters.min_fit)   params.set("min_fit",   filters.min_fit);
    if (filters.min_score) params.set("min_score", filters.min_score);
    params.set("page", String(filters.page));
    params.set("limit", "50");

    const res  = await fetch(`/api/admin/tender-leads?${params}`);
    const data = await res.json();
    setRows(data.rows ?? []);
    setTotal(data.total ?? 0);
    setStats(data.stats ?? null);
    setLoading(false);
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  async function runCron(mode = "collect", demo = false) {
    setRunning(true);
    const url = `/api/cron/tender-intelligence?mode=${mode}${demo ? "&demo=1" : ""}`;
    const res  = await fetch(url);
    const data = await res.json();
    setRunResult(data);
    setRunning(false);
    load();
  }

  async function handleFeedback(id: string, status: string, fb?: string) {
    await fetch("/api/admin/tender-leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, feedback: fb }),
    });
    load();
  }

  const filter = (key: string, val: string) =>
    setFilters(f => ({ ...f, [key]: val, page: 1 }));

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">🏆 Tender Intelligence</h1>
            <p className="text-slate-400 text-sm mt-0.5">Победители тендеров → B2B лиды</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => runCron("test")} disabled={running}
              className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700">
              Stats
            </button>
            <button onClick={() => runCron("digest")} disabled={running}
              className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700">
              Digest
            </button>
            <button onClick={() => runCron("collect", true)} disabled={running}
              className="px-3 py-1.5 text-xs bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-medium">
              Demo
            </button>
            <button onClick={() => runCron("collect")} disabled={running}
              className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium">
              {running ? "Сбор..." : "Сбор ЕИС"}
            </button>
          </div>
        </div>

        {/* Run result banner */}
        {runResult && (
          <div className="mb-4 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 flex items-start gap-4">
            <div className="flex-1 flex flex-wrap gap-4 text-xs">
              {[
                { label: "Найдено", val: runResult.fetched ?? runResult.pre_filtered },
                { label: "Сохранено", val: runResult.new_saved },
                { label: "AI обработано", val: runResult.ai_processed },
                { label: "🔥 HOT", val: runResult.hot_found },
                { label: "CRM лидов", val: runResult.crm_created },
              ].map(({ label, val }) => (
                <div key={label}>
                  <span className="text-slate-500">{label}: </span>
                  <span className="font-bold text-white">{String(val ?? 0)}</span>
                </div>
              ))}
              {!!runResult.period && (
                <div><span className="text-slate-500">Период: </span><span className="text-slate-300">{String(runResult.period)}</span></div>
              )}
            </div>
            <button onClick={() => setRunResult(null)} className="text-slate-500 hover:text-white text-lg leading-none">×</button>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-7 gap-3 mb-6">
            {[
              { label: "Процедуры", val: stats.total_procedures, color: "text-slate-300" },
              { label: "Победители", val: stats.total_winners, color: "text-slate-300" },
              { label: "China Fit >80", val: stats.china_fit_80, color: "text-blue-400" },
              { label: "Opp >80", val: stats.opportunity_80, color: "text-yellow-400" },
              { label: "🔥 HOT", val: stats.hot_count, color: "text-red-400" },
              { label: "Повторные", val: stats.repeat_winners, color: "text-purple-400" },
              { label: "Сумма", val: rub(stats.total_contract_value) + " ₽", color: "text-emerald-400", isText: true },
            ].map(s => (
              <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.isText ? s.val : s.val.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: "status", options: ["", "HOT", "QUALIFIED", "NEW", "CONTACTED", "WON", "IRRELEVANT"], labels: ["Все статусы", "🔥 HOT", "Qualified", "New", "Contacted", "Won", "Irrelevant"] },
            { key: "priority", options: ["", "HIGH", "MEDIUM", "LOW"], labels: ["Все приоритеты", "HIGH", "MEDIUM", "LOW"] },
            { key: "stream", options: ["", "winners", "repeat_winners", "new_winners"], labels: ["Все потоки", "Победители", "Повторные", "Новые"] },
          ].map(({ key, options, labels }) => (
            <select key={key}
              value={filters[key as keyof typeof filters]}
              onChange={e => filter(key, e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1.5">
              {options.map((o, i) => <option key={o} value={o}>{labels[i]}</option>)}
            </select>
          ))}
          <input type="number" placeholder="Min China Fit" value={filters.min_fit}
            onChange={e => filter("min_fit", e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1.5 w-28" />
          <input type="number" placeholder="Min Opportunity" value={filters.min_score}
            onChange={e => filter("min_score", e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1.5 w-28" />
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-slate-800 text-xs text-slate-500 font-medium">
            <div className="col-span-3">Компания / Предмет</div>
            <div className="col-span-2">Контракт</div>
            <div className="text-center">Fit</div>
            <div className="text-center">Opp</div>
            <div className="text-center">Lead</div>
            <div className="col-span-2">Категория</div>
            <div>Статус</div>
            <div>Срок</div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-sm">Загрузка...</div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-400 text-sm">Нет данных</p>
              <p className="text-slate-600 text-xs mt-1">Запустите сбор для получения тендеров</p>
            </div>
          ) : rows.map(op => (
            <div key={op.id}
              className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/30 cursor-pointer"
              onClick={() => setSelected(op)}
            >
              <div className="col-span-3">
                <p className="text-xs font-medium text-slate-200 truncate">{op.company_id}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{op.subject}</p>
                {op.repeat_winner && <span className="text-xs text-purple-400">🔄 ×{op.win_count}/год</span>}
              </div>
              <div className="col-span-2">
                <p className="text-xs font-bold text-emerald-400">{rub(op.contract_value)} ₽</p>
                <p className="text-xs text-slate-500">{op.law_type}</p>
              </div>
              <div className="text-center"><ScoreBadge score={op.china_import_fit} /></div>
              <div className="text-center"><ScoreBadge score={op.opportunity_score} /></div>
              <div className="text-center"><ScoreBadge score={op.lead_score} /></div>
              <div className="col-span-2">
                <span className={`text-xs px-1.5 py-0.5 rounded border ${PRIORITY_COLOR[op.priority] ?? "text-slate-400 border-slate-700"}`}>
                  {op.priority}
                </span>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{op.category}</p>
              </div>
              <div>
                <span className={`text-xs px-1.5 py-0.5 rounded border ${STATUS_COLOR[op.status] ?? "text-slate-400 border-slate-700"}`}>
                  {op.status}
                </span>
              </div>
              <div className={`text-xs font-medium ${op.urgency === "HIGH" ? "text-red-400" : op.urgency === "MEDIUM" ? "text-yellow-400" : "text-slate-500"}`}>
                {op.delivery_deadline ? `${op.delivery_deadline}д` : "—"}
                {op.urgency === "HIGH" && " 🔥"}
              </div>
            </div>
          ))}
        </div>

        {total > 50 && (
          <div className="flex justify-center gap-2 mt-4">
            <button disabled={filters.page <= 1}
              onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
              className="px-3 py-1 text-xs bg-slate-800 text-slate-300 rounded border border-slate-700 disabled:opacity-40">
              ← Назад
            </button>
            <span className="px-3 py-1 text-xs text-slate-500">
              Стр {filters.page} · всего {total}
            </span>
            <button disabled={rows.length < 50}
              onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
              className="px-3 py-1 text-xs bg-slate-800 text-slate-300 rounded border border-slate-700 disabled:opacity-40">
              Вперёд →
            </button>
          </div>
        )}
      </main>

      {selected && (
        <DetailModal op={selected} onClose={() => setSelected(null)} onFeedback={handleFeedback} />
      )}
    </div>
  );
}
