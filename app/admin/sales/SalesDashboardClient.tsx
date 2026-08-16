"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const NAV_TABS = [
  { id: "dashboard", label: "Дашборд", icon: "📊", href: "/admin/sales" },
  { id: "chat",      label: "AI Chat",  icon: "🤖", href: "/admin/sales/chat" },
  { id: "companies", label: "Компании", icon: "🏢", href: "/admin/sales/companies" },
  { id: "pipeline",  label: "Pipeline", icon: "🗂",  href: "/admin/pipeline" },
  { id: "proposals", label: "КП",       icon: "📋", href: "/admin/proposals" },
];

interface OfferResult {
  product: string;
  product_label: string;
  confidence: number;
  why: string;
  pain: string;
  value_prop: string;
  first_message: string;
  score: number;
  potential: string;
}

interface HotCompany {
  lead_id: string;
  company: string;
  category: string;
  city: string;
  website: string;
  score: number;
  score_stars: string;
  phone?: string;
  email?: string;
  offer: OfferResult | null;
}

interface Task {
  id: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
  type: "CALL" | "MESSAGE" | "PROPOSAL" | "FOLLOWUP" | "RESEARCH";
  title: string;
  description: string;
  lead: string;
}

interface CrmStats {
  total: number;
  hot: number;
  unanswered: number;
  negotiation: number;
  offer_sent: number;
}

const SCORE_COLOR: Record<number, string> = {
  5: "text-red-400", 4: "text-orange-400", 3: "text-amber-400", 2: "text-slate-400", 1: "text-slate-600",
};

const PRIORITY_STYLE = {
  HIGH:   "border-red-700 bg-red-900/20",
  MEDIUM: "border-amber-700 bg-amber-900/10",
  LOW:    "border-slate-700 bg-slate-800/30",
};

const TYPE_ICON = { CALL: "📞", MESSAGE: "💬", PROPOSAL: "📋", FOLLOWUP: "🔄", RESEARCH: "🔍" };

const PRIORITY_BADGE = {
  HIGH:   "bg-red-900/50 text-red-300 border-red-700",
  MEDIUM: "bg-amber-900/50 text-amber-300 border-amber-700",
  LOW:    "bg-slate-700/50 text-slate-400 border-slate-600",
};

export function SalesDashboardClient() {
  const [hotCompanies, setHotCompanies] = useState<HotCompany[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [crmStats, setCrmStats] = useState<CrmStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const loadBriefing = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sales/briefing");
      if (res.ok) {
        const data = await res.json();
        setHotCompanies(data.hot_companies ?? []);
        setCrmStats(data.crm_stats ?? null);
      }
    } catch {}
    setLoading(false);
  }, []);

  const loadTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      const res = await fetch("/api/admin/sales/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks ?? []);
      }
    } catch {}
    setTasksLoading(false);
  }, []);

  useEffect(() => {
    loadBriefing();
    loadTasks();
  }, [loadBriefing, loadTasks]);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleDone = (id: number) => {
    setDone(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">🤖 AI Sales Department</h1>
          <p className="text-slate-500 text-sm mt-0.5">Автоматический брифинг · обновляется при каждом открытии</p>
        </div>
        <button
          onClick={() => { loadBriefing(); loadTasks(); }}
          className="text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition"
        >
          ↻ Обновить
        </button>
      </div>

      {/* Sub-nav */}
      <div className="flex gap-1 mb-6 bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto">
        {NAV_TABS.map(tab => (
          <Link key={tab.id} href={tab.href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition
              ${tab.id === "dashboard" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
            <span>{tab.icon}</span><span>{tab.label}</span>
          </Link>
        ))}
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Горячих",    value: crmStats?.hot ?? "—",        color: "text-red-400",    icon: "🔥" },
          { label: "Всего лидов",value: crmStats?.total ?? "—",       color: "text-blue-400",   icon: "👥" },
          { label: "Без ответа", value: crmStats?.unanswered ?? "—",  color: "text-amber-400",  icon: "⚠️" },
          { label: "Переговоры", value: crmStats?.negotiation ?? "—", color: "text-purple-400", icon: "🤝" },
          { label: "КП отправлено",value: crmStats?.offer_sent ?? "—",color: "text-green-400",  icon: "📋" },
        ].map(card => (
          <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-lg mb-1">{card.icon}</div>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-slate-500 text-xs mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      {crmStats?.unanswered !== undefined && crmStats.unanswered > 0 && (
        <div className="mb-5 flex items-center gap-3 bg-amber-900/20 border border-amber-700/50 rounded-xl px-4 py-3">
          <span className="text-amber-400">⚠️</span>
          <div>
            <p className="text-amber-300 font-medium text-sm">{crmStats.unanswered} лидов без ответа более 24 часов</p>
            <Link href="/admin/leads?status=NEW" className="text-amber-500 text-xs hover:text-amber-400">Открыть →</Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* HOT companies with auto-offers */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold text-sm uppercase tracking-wide">🔥 Горячие лиды — готовые сообщения</h2>
            <Link href="/admin/sales/companies" className="text-red-400 hover:text-red-300 text-xs transition">Все компании →</Link>
          </div>

          {loading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
              <div className="flex gap-1.5 justify-center mb-3">
                {[0,150,300].map(d => (
                  <span key={d} className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
              <p className="text-slate-400 text-sm">AI анализирует горячих лидов и подбирает офферы...</p>
              <p className="text-slate-600 text-xs mt-1">Займёт 10-20 секунд</p>
            </div>
          ) : hotCompanies.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
              <p className="text-slate-500 text-sm">Нет горячих лидов</p>
              <Link href="/admin/market-intelligence" className="text-red-400 text-xs hover:text-red-300 mt-2 block">
                Найти новых →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {hotCompanies.map(c => (
                <div key={c.lead_id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  {/* Company header — always visible */}
                  <button
                    onClick={() => setExpanded(expanded === c.lead_id ? null : c.lead_id)}
                    className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`text-lg font-bold flex-shrink-0 ${SCORE_COLOR[c.score] ?? "text-slate-500"}`}>
                        {c.score_stars || "★".repeat(c.score)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-white font-medium text-sm truncate">{c.company}</p>
                        <p className="text-slate-500 text-xs">
                          {c.category}{c.city ? ` · ${c.city}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      {c.offer && (
                        <span className="text-xs text-slate-400 hidden sm:block">{c.offer.product_label}</span>
                      )}
                      <span className="text-slate-500 text-xs">{expanded === c.lead_id ? "▲" : "▼"}</span>
                    </div>
                  </button>

                  {/* Expanded: offer + message */}
                  {expanded === c.lead_id && c.offer && (
                    <div className="border-t border-slate-800 px-4 py-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-1">
                          <p className="text-slate-500 text-xs mb-1">Оффер</p>
                          <p className="text-white text-sm font-medium">{c.offer.product_label}</p>
                          <p className="text-slate-500 text-xs mt-0.5">
                            Уверен: <span className={c.offer.confidence >= 75 ? "text-green-400" : "text-amber-400"}>{c.offer.confidence}%</span>
                          </p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-slate-500 text-xs mb-1">Боль → Ценность</p>
                          <p className="text-slate-300 text-xs">{c.offer.pain}</p>
                          {c.offer.value_prop && (
                            <p className="text-slate-400 text-xs mt-1">→ {c.offer.value_prop}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-slate-500 text-xs">✉️ Готовое первое сообщение</p>
                          <button
                            onClick={() => copy(c.offer!.first_message, c.lead_id)}
                            className={`text-xs px-2 py-1 rounded transition font-medium ${
                              copied === c.lead_id
                                ? "bg-green-700 text-green-200"
                                : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                            }`}
                          >
                            {copied === c.lead_id ? "✓ Скопировано!" : "📋 Копировать"}
                          </button>
                        </div>
                        <div className="bg-slate-800 rounded-lg p-3">
                          <p className="text-slate-200 text-sm leading-relaxed">{c.offer.first_message}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        {c.phone && <a href={`tel:${c.phone}`} className="text-xs text-blue-400 hover:text-blue-300">📞 {c.phone}</a>}
                        {c.email && <a href={`mailto:${c.email}`} className="text-xs text-blue-400 hover:text-blue-300">✉ {c.email}</a>}
                        {c.website && (
                          <a href={c.website.startsWith("http") ? c.website : `https://${c.website}`}
                            target="_blank" rel="noreferrer"
                            className="text-xs text-slate-500 hover:text-slate-300">🌐 сайт</a>
                        )}
                        <Link
                          href={`/admin/sales/chat?company=${encodeURIComponent(c.company)}`}
                          className="ml-auto text-xs bg-red-600/30 hover:bg-red-600/50 text-red-300 px-2 py-1 rounded transition"
                        >
                          🤖 Спросить AI →
                        </Link>
                      </div>
                    </div>
                  )}

                  {expanded === c.lead_id && !c.offer && (
                    <div className="border-t border-slate-800 px-4 py-3 text-center text-slate-500 text-xs">
                      Не удалось определить оффер
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tasks sidebar */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white text-sm uppercase tracking-wide">✅ Задачи на сегодня</h2>
              <button
                onClick={loadTasks}
                disabled={tasksLoading}
                className="text-xs text-slate-500 hover:text-white transition disabled:opacity-40"
              >
                {tasksLoading ? "⏳" : "↻"}
              </button>
            </div>

            {tasksLoading ? (
              <div className="text-center py-4 text-slate-500 text-xs">AI генерирует задачи...</div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-4 text-slate-600 text-xs">Нет задач</div>
            ) : (
              <div className="space-y-2">
                {tasks.map(task => (
                  <div key={task.id}
                    className={`flex items-start gap-2 p-2.5 rounded-lg border transition ${
                      done.has(task.id) ? "opacity-40 border-slate-800" : PRIORITY_STYLE[task.priority]
                    }`}>
                    <button
                      onClick={() => toggleDone(task.id)}
                      className={`mt-0.5 w-3.5 h-3.5 rounded border flex-shrink-0 transition ${
                        done.has(task.id) ? "bg-green-600 border-green-500" : "border-slate-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-xs">{TYPE_ICON[task.type]}</span>
                        <span className="text-white text-xs font-medium truncate">{task.title}</span>
                        <span className={`ml-auto text-xs px-1 py-0.5 rounded border flex-shrink-0 ${PRIORITY_BADGE[task.priority]}`}>
                          {task.priority[0]}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs leading-snug">{task.description}</p>
                      {task.lead && <p className="text-slate-600 text-xs mt-0.5">👤 {task.lead}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-3 text-sm uppercase tracking-wide">⚡ Быстро</h2>
            <div className="space-y-1.5">
              {[
                { label: "AI Chat",          href: "/admin/sales/chat",         icon: "🤖" },
                { label: "Все компании",     href: "/admin/sales/companies",    icon: "🏢" },
                { label: "Найти новых лидов",href: "/admin/market-intelligence",icon: "🎯" },
                { label: "Pipeline CRM",     href: "/admin/pipeline",           icon: "🗂" },
                { label: "Создать КП",       href: "/admin/leads",              icon: "📋" },
              ].map(a => (
                <Link key={a.label} href={a.href}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition">
                  <span>{a.icon}</span><span>{a.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
