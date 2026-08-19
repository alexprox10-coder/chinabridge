"use client";
import { useEffect, useState, useCallback } from "react";
import { AdminNav } from "@/components/admin/AdminNav";

// ── Types ─────────────────────────────────────────────────────────────────────

type IntelDepartment = "IMPORT" | "WB" | "OZON" | "COMPETITOR" | "LOGISTICS" | "GENERAL";
type Confidence      = "HIGH" | "MEDIUM" | "LOW";
type ImpactLevel     = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
type ChangeStatus    = "PENDING" | "APPROVED" | "REJECTED" | "APPLIED";

interface IntelFact {
  id: number;
  fact_key: string;
  department: IntelDepartment;
  category: string;
  entity: string;
  metric: string;
  current_value: string;
  unit: string | null;
  valid_from: string;
  source_url: string | null;
  confidence: Confidence;
  impact_level: ImpactLevel;
  label: string;
  notes: string | null;
  requires_approval: boolean;
  updated_at: string;
}

interface IntelChange {
  id: number;
  change_code: string;
  fact_key: string;
  department: string;
  entity: string;
  metric: string;
  old_value: string | null;
  new_value: string;
  difference: string | null;
  unit: string | null;
  change_type: string;
  effective_from: string | null;
  detected_at: string;
  confidence: Confidence;
  impact: ImpactLevel;
  impact_summary: string | null;
  affected_systems: string[];
  status: ChangeStatus;
}

interface IntelSource {
  id: number;
  name: string;
  url: string;
  department: string;
  source_type: string;
  priority: number;
  active: boolean;
  crawl_frequency: string;
  last_checked: string | null;
  last_success: string | null;
  error_count: number;
  notes: string | null;
}

interface IntelStats {
  sources_total: number;
  sources_active: number;
  facts_total: number;
  facts_critical: number;
  changes_pending: number;
  changes_applied: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const IMPACT_STYLES: Record<ImpactLevel, string> = {
  CRITICAL: "bg-red-500/20 text-red-400 border border-red-500/30",
  HIGH:     "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  MEDIUM:   "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  LOW:      "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  INFO:     "bg-slate-500/20 text-slate-400 border border-slate-500/30",
};

const IMPACT_LABELS: Record<ImpactLevel, string> = {
  CRITICAL: "КРИТИЧНО", HIGH: "ВЫСОКИЙ", MEDIUM: "СРЕДНИЙ", LOW: "НИЗКИЙ", INFO: "ИНФО",
};

const CONFIDENCE_COLORS: Record<Confidence, string> = {
  HIGH:   "text-green-400",
  MEDIUM: "text-yellow-400",
  LOW:    "text-red-400",
};

const DEPT_LABELS: Record<string, string> = {
  IMPORT:     "Импорт",
  WB:         "Wildberries",
  OZON:       "Ozon",
  COMPETITOR: "Конкуренты",
  LOGISTICS:  "Логистика",
  GENERAL:    "Общее",
};

const DEPT_COLORS: Record<string, string> = {
  IMPORT:     "bg-purple-500/20 text-purple-400",
  WB:         "bg-pink-500/20 text-pink-400",
  OZON:       "bg-blue-500/20 text-blue-400",
  COMPETITOR: "bg-orange-500/20 text-orange-400",
  LOGISTICS:  "bg-emerald-500/20 text-emerald-400",
  GENERAL:    "bg-slate-500/20 text-slate-400",
};

const STATUS_STYLES: Record<ChangeStatus, string> = {
  PENDING:  "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  APPROVED: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  REJECTED: "bg-red-500/20 text-red-400 border border-red-500/30",
  APPLIED:  "bg-green-500/20 text-green-400 border border-green-500/30",
};

const STATUS_LABELS: Record<ChangeStatus, string> = {
  PENDING: "Ожидает", APPROVED: "Одобрено", REJECTED: "Отклонено", APPLIED: "Применено",
};

// ── Shared Components ─────────────────────────────────────────────────────────

function ImpactBadge({ level }: { level: ImpactLevel }) {
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${IMPACT_STYLES[level]}`}>
      {IMPACT_LABELS[level]}
    </span>
  );
}

function DeptBadge({ dept }: { dept: string }) {
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${DEPT_COLORS[dept] ?? "bg-slate-500/20 text-slate-400"}`}>
      {DEPT_LABELS[dept] ?? dept}
    </span>
  );
}

// ── Stats Panel ───────────────────────────────────────────────────────────────

function StatsPanel({
  stats,
  onInit,
  initLoading,
}: {
  stats: IntelStats | null;
  onInit: () => void;
  initLoading: boolean;
}) {
  const cards = [
    { label: "Источников", value: stats?.sources_total ?? "—", sub: `${stats?.sources_active ?? 0} активных` },
    { label: "Фактов", value: stats?.facts_total ?? "—", sub: `${stats?.facts_critical ?? 0} критических` },
    {
      label: "На согласовании",
      value: stats?.changes_pending ?? "—",
      sub: "ждут проверки",
      hot: (stats?.changes_pending ?? 0) > 0,
    },
    { label: "Применено", value: stats?.changes_applied ?? "—", sub: "изменений всего" },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {cards.map(c => (
        <div
          key={c.label}
          className={`bg-slate-800 rounded-xl px-5 py-4 border min-w-[130px] ${c.hot ? "border-orange-500/40" : "border-slate-700"}`}
        >
          <div className={`text-2xl font-bold ${c.hot ? "text-orange-400" : "text-white"}`}>{c.value}</div>
          <div className="text-slate-400 text-xs mt-0.5">{c.label}</div>
          <div className="text-slate-600 text-xs">{c.sub}</div>
        </div>
      ))}

      {(stats?.facts_total ?? 0) === 0 && (
        <div className="bg-slate-800 border border-blue-500/30 rounded-xl px-5 py-4 flex items-center gap-4">
          <div>
            <div className="text-sm text-white font-medium">База Intelligence пуста</div>
            <div className="text-xs text-slate-400 mt-0.5">Загрузить начальные данные?</div>
          </div>
          <button
            onClick={onInit}
            disabled={initLoading}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition disabled:opacity-50"
          >
            {initLoading ? "Загрузка..." : "Инициализировать"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Facts Tab ─────────────────────────────────────────────────────────────────

function FactsTab({ facts, loading }: { facts: IntelFact[]; loading: boolean }) {
  const [deptFilter, setDeptFilter] = useState("");
  const [search, setSearch] = useState("");

  const depts = [...new Set(facts.map(f => f.department))];

  const filtered = facts.filter(f => {
    if (deptFilter && f.department !== deptFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!f.label.toLowerCase().includes(q) && !f.fact_key.toLowerCase().includes(q) && !f.entity.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск..."
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-600 w-44"
        />
        <button
          onClick={() => setDeptFilter("")}
          className={`px-3 py-1.5 text-xs rounded-lg transition ${!deptFilter ? "bg-slate-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
        >
          Все
        </button>
        {depts.map(d => (
          <button
            key={d}
            onClick={() => setDeptFilter(d === deptFilter ? "" : d)}
            className={`px-3 py-1.5 text-xs rounded-lg transition ${deptFilter === d ? "bg-slate-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
          >
            {DEPT_LABELS[d] ?? d}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(fact => (
          <div
            key={fact.id}
            className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <DeptBadge dept={fact.department} />
                  <ImpactBadge level={fact.impact_level} />
                  {fact.requires_approval && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                      Требует согласования
                    </span>
                  )}
                </div>
                <div className="text-white font-medium text-sm mt-1.5">{fact.label}</div>
                <div className="text-slate-600 text-xs mt-0.5 font-mono">{fact.fact_key}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-white font-bold text-lg leading-tight">
                  {fact.current_value}
                  {fact.unit && <span className="text-slate-400 text-sm ml-1">{fact.unit}</span>}
                </div>
                <div className={`text-xs mt-0.5 ${CONFIDENCE_COLORS[fact.confidence]}`}>
                  {fact.confidence === "HIGH" ? "✓ Высокая" : fact.confidence === "MEDIUM" ? "~ Средняя" : "? Низкая"}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50 gap-2">
              <div className="text-xs text-slate-600">
                с {fact.valid_from} · обновлено {new Date(fact.updated_at).toLocaleDateString("ru-RU")}
              </div>
              {fact.source_url && (
                <a
                  href={fact.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 shrink-0"
                >
                  Источник →
                </a>
              )}
            </div>
            {fact.notes && (
              <div className="text-xs text-slate-500 mt-1.5 italic leading-relaxed">{fact.notes}</div>
            )}
          </div>
        ))}
        {!filtered.length && (
          <Empty text={facts.length ? "Нет фактов по фильтру" : "База пуста — нажмите «Инициализировать»"} />
        )}
      </div>
    </div>
  );
}

// ── Changes Tab ───────────────────────────────────────────────────────────────

function ChangesTab({
  changes,
  onAction,
  loading,
}: {
  changes: IntelChange[];
  onAction: (id: number, action: "approve" | "reject" | "apply") => void;
  loading: boolean;
}) {
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const pending = changes.filter(c => c.status === "PENDING").length;

  const filtered = statusFilter ? changes.filter(c => c.status === statusFilter) : changes;

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["PENDING", "APPROVED", "REJECTED", "APPLIED", ""] as const).map(s => (
          <button
            key={s || "all"}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs rounded-lg transition flex items-center gap-1.5 ${statusFilter === s ? "bg-slate-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
          >
            {s ? STATUS_LABELS[s as ChangeStatus] : "Все"}
            {s === "PENDING" && pending > 0 && (
              <span className="bg-orange-500 text-white text-xs rounded-full px-1.5 py-px leading-none">
                {pending}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(ch => (
          <div
            key={ch.id}
            className={`bg-slate-800 rounded-xl p-4 border ${ch.status === "PENDING" ? "border-orange-500/30" : ch.status === "APPLIED" ? "border-green-500/20" : "border-slate-700"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-slate-500">{ch.change_code}</span>
                  <DeptBadge dept={ch.department} />
                  <ImpactBadge level={ch.impact} />
                  <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_STYLES[ch.status]}`}>
                    {STATUS_LABELS[ch.status]}
                  </span>
                </div>
                <div className="text-white font-medium text-sm mt-1.5">
                  {ch.entity} — {ch.metric}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {ch.old_value !== null && (
                    <span className="text-red-400 text-sm line-through">
                      {ch.old_value}{ch.unit ? " " + ch.unit : ""}
                    </span>
                  )}
                  <span className="text-slate-500 text-xs">→</span>
                  <span className="text-green-400 font-semibold text-sm">
                    {ch.new_value}{ch.unit ? " " + ch.unit : ""}
                  </span>
                  {ch.difference && (
                    <span className="text-xs text-slate-500">({ch.difference})</span>
                  )}
                </div>
                {ch.impact_summary && (
                  <div className="text-xs text-slate-400 mt-1.5">{ch.impact_summary}</div>
                )}
              </div>

              <div className="flex flex-col gap-1.5 shrink-0">
                {ch.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => onAction(ch.id, "approve")}
                      className="px-2.5 py-1 text-xs bg-green-600/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-600/40 transition"
                    >
                      Одобрить
                    </button>
                    <button
                      onClick={() => onAction(ch.id, "reject")}
                      className="px-2.5 py-1 text-xs bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-600/40 transition"
                    >
                      Отклонить
                    </button>
                  </>
                )}
                {ch.status === "APPROVED" && (
                  <button
                    onClick={() => onAction(ch.id, "apply")}
                    className="px-2.5 py-1 text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-600/40 transition"
                  >
                    Применить
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50 gap-2 flex-wrap">
              <div className="text-xs text-slate-500">
                Обнаружено{" "}
                {new Date(ch.detected_at).toLocaleString("ru-RU", {
                  day: "2-digit", month: "2-digit", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
                {ch.effective_from && ` · Вступает ${ch.effective_from}`}
              </div>
              {ch.affected_systems.length > 0 && (
                <div className="text-xs text-slate-600">
                  Системы: {ch.affected_systems.join(", ")}
                </div>
              )}
            </div>
          </div>
        ))}
        {!filtered.length && (
          <Empty text={statusFilter === "PENDING" ? "Нет изменений на согласовании" : "Нет изменений"} />
        )}
      </div>
    </div>
  );
}

// ── Sources Tab ───────────────────────────────────────────────────────────────

function SourcesTab({ sources, loading }: { sources: IntelSource[]; loading: boolean }) {
  const PRIORITY_LABEL: Record<number, string> = {
    1: "Официальный", 2: "Регулятор", 3: "Рыночный", 4: "Агрегатор", 5: "AI-вывод",
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-2">
      {sources.map(src => (
        <div
          key={src.id}
          className={`bg-slate-800 border rounded-xl p-4 ${src.active ? "border-slate-700" : "border-slate-800 opacity-60"}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DeptBadge dept={src.department} />
                <span className="text-xs text-slate-500">{PRIORITY_LABEL[src.priority] ?? `P${src.priority}`}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${src.active ? "bg-green-500" : "bg-slate-600"}`} />
                <span className="text-xs text-slate-600">{src.crawl_frequency}</span>
              </div>
              <div className="text-white font-medium text-sm mt-1.5">{src.name}</div>
              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 break-all mt-0.5 block"
              >
                {src.url}
              </a>
              {src.notes && <div className="text-xs text-slate-600 mt-1 italic">{src.notes}</div>}
            </div>
            <div className="text-right shrink-0 text-xs text-slate-500 space-y-1">
              {src.last_success ? (
                <div>
                  Проверено<br />
                  {new Date(src.last_success).toLocaleDateString("ru-RU")}
                </div>
              ) : (
                <div className="text-slate-700">Не проверялось</div>
              )}
              {src.error_count > 0 && (
                <div className="text-red-400">Ошибок: {src.error_count}</div>
              )}
            </div>
          </div>
        </div>
      ))}
      {!sources.length && <Empty text="Источники не добавлены. Инициализируйте базу." />}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Spinner() {
  return <div className="text-slate-500 text-sm py-10 text-center">Загрузка...</div>;
}
function Empty({ text }: { text: string }) {
  return <div className="text-slate-600 text-sm py-10 text-center">{text}</div>;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = "overview" | "facts" | "changes" | "sources" | "market";

interface MarketWatchItem {
  id:           number;
  watch_key:    string;
  platform:     string;
  query:        string;
  category:     string;
  active:       boolean;
  avg_price:    number | null;
  min_price:    number | null;
  max_price:    number | null;
  item_count:   number | null;
  last_checked: string | null;
}

function MarketTab({ items, loading, onAdd }: { items: MarketWatchItem[]; loading: boolean; onAdd: () => void }) {
  if (loading) return <Spinner />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">Мониторинг средних рыночных цен на WB по категориям. n8n обновляет каждую пятницу.</p>
        <button onClick={onAdd} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg transition">
          + Добавить
        </button>
      </div>
      {items.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
          <div className="text-slate-500 text-sm">Нет отслеживаемых категорий</div>
          <div className="text-slate-600 text-xs mt-1">Добавьте поисковый запрос для мониторинга цен на WB</div>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400">
                      {item.platform.toUpperCase()}
                    </span>
                    {!item.active && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-500">Отключён</span>
                    )}
                    <span className="text-sm font-medium text-white">{item.category}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Запрос: «{item.query}»</div>
                  {item.last_checked && (
                    <div className="text-xs text-slate-600 mt-0.5">
                      Проверено: {new Date(item.last_checked).toLocaleDateString("ru-RU")}
                    </div>
                  )}
                </div>
                {item.avg_price ? (
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-white">{item.avg_price.toLocaleString("ru-RU")} ₽</div>
                    <div className="text-xs text-slate-500">
                      {item.min_price?.toLocaleString("ru-RU")} — {item.max_price?.toLocaleString("ru-RU")} ₽
                    </div>
                    <div className="text-xs text-slate-600">{item.item_count} товаров</div>
                  </div>
                ) : (
                  <div className="text-slate-600 text-xs shrink-0">Нет данных</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function IntelligencePage() {
  const [tab, setTab]             = useState<Tab>("overview");
  const [stats, setStats]         = useState<IntelStats | null>(null);
  const [facts, setFacts]         = useState<IntelFact[]>([]);
  const [changes, setChanges]     = useState<IntelChange[]>([]);
  const [sources, setSources]     = useState<IntelSource[]>([]);
  const [market, setMarket]       = useState<MarketWatchItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [initLoading, setInit]    = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetch("/api/intelligence/init").then(r => r.json()).then(r => { if (r?.stats) setStats(r.stats); }).catch(() => {}),
      fetch("/api/intelligence/facts").then(r => r.json()).then(r => { if (r?.data) setFacts(r.data); }).catch(() => {}),
      fetch("/api/intelligence/changes").then(r => r.json()).then(r => { if (r?.data) setChanges(r.data); }).catch(() => {}),
      fetch("/api/intelligence/sources").then(r => r.json()).then(r => { if (r?.data) setSources(r.data); }).catch(() => {}),
      fetch("/api/intelligence/market-watch").then(r => r.json()).then(r => { if (r?.items) setMarket(r.items); }).catch(() => {}),
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function handleInit() {
    setInit(true);
    await fetch("/api/intelligence/init", { method: "POST" });
    await loadAll();
    setInit(false);
  }

  async function handleChangeAction(id: number, action: "approve" | "reject" | "apply") {
    await fetch(`/api/intelligence/changes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reviewed_by: "admin" }),
    });
    await Promise.all([
      fetch("/api/intelligence/init").then(r => r.json()).then(r => { if (r?.stats) setStats(r.stats); }),
      fetch("/api/intelligence/changes").then(r => r.json()).then(r => { if (r?.data) setChanges(r.data); }),
      fetch("/api/intelligence/facts").then(r => r.json()).then(r => { if (r?.data) setFacts(r.data); }),
    ]);
  }

  const pending = changes.filter(c => c.status === "PENDING").length;

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Обзор" },
    { id: "facts",    label: `Факты${stats ? ` (${stats.facts_total})` : ""}` },
    { id: "changes",  label: pending > 0 ? `Изменения 🔴${pending}` : "Изменения" },
    { id: "sources",  label: "Источники" },
    { id: "market",   label: `Рынок${market.length > 0 ? ` (${market.length})` : ""}` },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AdminNav />
      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>🧠</span> Intelligence Core
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Центральная база знаний — маркетплейсы, таможня, логистика, курсы валют
            </p>
          </div>
          <button
            onClick={loadAll}
            className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded-lg transition shrink-0"
          >
            ↻ Обновить
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-900 p-1 rounded-xl w-fit">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === t.id ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === "overview" && (
          <div className="space-y-8">
            <StatsPanel stats={stats} onInit={handleInit} initLoading={initLoading} />

            {pending > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  🔔 Требуют согласования
                </h2>
                <ChangesTab
                  changes={changes.filter(c => c.status === "PENDING")}
                  onAction={handleChangeAction}
                  loading={false}
                />
              </section>
            )}

            {facts.filter(f => f.impact_level === "CRITICAL").length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  ⚠️ Критические параметры
                </h2>
                <FactsTab facts={facts.filter(f => f.impact_level === "CRITICAL")} loading={false} />
              </section>
            )}

            {facts.length > 0 && pending === 0 && facts.filter(f => f.impact_level === "CRITICAL").length === 0 && (
              <div className="bg-slate-800/50 rounded-xl border border-green-500/20 p-6 text-center">
                <div className="text-green-400 text-2xl mb-2">✓</div>
                <div className="text-white font-medium">Всё в норме</div>
                <div className="text-slate-500 text-sm mt-1">
                  {stats?.facts_total} фактов актуальны · 0 изменений на согласовании
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "facts" && <FactsTab facts={facts} loading={loading} />}
        {tab === "changes" && <ChangesTab changes={changes} onAction={handleChangeAction} loading={loading} />}
        {tab === "sources" && <SourcesTab sources={sources} loading={loading} />}
        {tab === "market" && (
          <MarketTab
            items={market}
            loading={loading}
            onAdd={() => {
              const cat = prompt("Название категории (например: Наушники TWS)");
              const query = prompt("Поисковый запрос на WB (например: наушники tws)");
              if (cat && query) {
                const key = "MARKET_" + query.toUpperCase().replace(/\s+/g, "_").slice(0, 30);
                fetch("/api/intelligence/market-watch", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ watch_key: key, platform: "wb", query, category: cat }),
                }).then(() => loadAll());
              }
            }}
          />
        )}

      </main>
    </div>
  );
}
