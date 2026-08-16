"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const NAV_TABS = [
  { id: "dashboard", label: "Дашборд", icon: "📊", href: "/admin/sales" },
  { id: "chat",      label: "AI Chat",  icon: "🤖", href: "/admin/sales/chat" },
  { id: "companies", label: "Компании", icon: "🏢", href: "/admin/sales/companies" },
  { id: "pipeline",  label: "Pipeline", icon: "🗂",  href: "/admin/pipeline" },
  { id: "tasks",     label: "Задачи",   icon: "✅", href: "/admin/sales/tasks" },
  { id: "proposals", label: "КП",       icon: "📋", href: "/admin/proposals" },
];

interface Task {
  id: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
  type: "CALL" | "MESSAGE" | "PROPOSAL" | "FOLLOWUP" | "RESEARCH";
  title: string;
  description: string;
  lead: string;
}

interface Stats {
  total_crm: number;
  hot_crm: number;
  total_companies: number;
  hot_companies: number;
  proposals_sent: number;
  deals_closed: number;
  unanswered: number;
}

const PRIORITY_STYLE = {
  HIGH:   "border-red-700 bg-red-900/20",
  MEDIUM: "border-amber-700 bg-amber-900/10",
  LOW:    "border-slate-700 bg-slate-800/30",
};

const TYPE_ICON = {
  CALL:     "📞",
  MESSAGE:  "💬",
  PROPOSAL: "📋",
  FOLLOWUP: "🔄",
  RESEARCH: "🔍",
};

const PRIORITY_BADGE = {
  HIGH:   "bg-red-900/50 text-red-300 border-red-700",
  MEDIUM: "bg-amber-900/50 text-amber-300 border-amber-700",
  LOW:    "bg-slate-700/50 text-slate-400 border-slate-600",
};

export function SalesDashboardClient() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [done, setDone] = useState<Set<number>>(new Set());

  const fetchStats = useCallback(async () => {
    try {
      const [crmRes, importRes] = await Promise.all([
        fetch("/api/admin/leads?limit=200"),
        fetch("/api/admin/ai-sales-agent"),
      ]);
      const crm = crmRes.ok ? await crmRes.json() : {};
      const imp = importRes.ok ? await importRes.json() : {};
      const leads: Array<{ status: string; priority: string; created_at: string }> = crm.leads ?? [];
      const now = Date.now();
      setStats({
        total_crm: leads.length,
        hot_crm: leads.filter(l => l.priority === "HOT").length,
        total_companies: imp.stats?.total ?? 0,
        hot_companies: imp.stats?.hot ?? 0,
        proposals_sent: leads.filter(l => l.status === "OFFER_SENT").length,
        deals_closed: leads.filter(l => l.status === "SUCCESS").length,
        unanswered: leads.filter(l => l.status === "NEW" && now - new Date(l.created_at).getTime() > 86400000).length,
      });
    } catch {}
  }, []);

  const generateTasks = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const res = await fetch("/api/admin/sales/tasks");
      const data = res.ok ? await res.json() : {};
      setTasks(data.tasks ?? []);
    } catch {}
    setLoadingTasks(false);
  }, []);

  useEffect(() => {
    fetchStats();
    generateTasks();
  }, [fetchStats, generateTasks]);

  const toggleDone = (id: number) => {
    setDone(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🤖 AI Sales Department
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Автоматизация 80% работы отдела продаж</p>
        </div>
        <Link href="/admin/sales/chat"
          className="bg-red-600 hover:bg-red-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition flex items-center gap-2">
          🤖 Открыть AI Chat
        </Link>
      </div>

      {/* Sub-navigation */}
      <div className="flex gap-1 mb-6 bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto">
        {NAV_TABS.map(tab => (
          <Link key={tab.id} href={tab.href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition
              ${tab.id === "dashboard"
                ? "bg-slate-700 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}>
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Компании в базе",   value: stats?.total_companies ?? "—", sub: `${stats?.hot_companies ?? 0} горячих`, color: "text-blue-400", icon: "🏢" },
          { label: "Лидов в CRM",       value: stats?.total_crm ?? "—",       sub: `${stats?.hot_crm ?? 0} горячих`,      color: "text-red-400",  icon: "🔥" },
          { label: "КП отправлено",     value: stats?.proposals_sent ?? "—",   sub: "в работе",                            color: "text-orange-400", icon: "📋" },
          { label: "Сделок закрыто",    value: stats?.deals_closed ?? "—",     sub: "успешно",                             color: "text-green-400", icon: "✅" },
        ].map(card => (
          <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xl mb-1">{card.icon}</div>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-slate-500 text-xs mt-0.5">{card.label}</div>
            <div className="text-slate-600 text-xs">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Alert: unanswered */}
      {stats?.unanswered !== undefined && stats.unanswered > 0 && (
        <div className="mb-6 flex items-center gap-3 bg-amber-900/20 border border-amber-700/50 rounded-xl px-4 py-3">
          <span className="text-amber-400 text-lg">⚠️</span>
          <div>
            <p className="text-amber-300 font-medium text-sm">{stats.unanswered} лидов без ответа более 24 часов</p>
            <Link href="/admin/leads?status=NEW" className="text-amber-500 text-xs hover:text-amber-400">
              Открыть список →
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Daily Tasks */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2 text-sm uppercase tracking-wide">
              ✅ Задачи на сегодня
            </h2>
            <button
              onClick={generateTasks}
              disabled={loadingTasks}
              className="text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-2 py-1 rounded transition disabled:opacity-50"
            >
              {loadingTasks ? "⏳ Генерирую..." : "↻ Обновить"}
            </button>
          </div>

          {loadingTasks && tasks.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">AI анализирует данные...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-slate-600 text-sm">Нет активных задач</div>
          ) : (
            <div className="space-y-2">
              {tasks.map(task => (
                <div key={task.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition ${
                    done.has(task.id)
                      ? "opacity-40 border-slate-800"
                      : PRIORITY_STYLE[task.priority]
                  }`}>
                  <button
                    onClick={() => toggleDone(task.id)}
                    className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 transition ${
                      done.has(task.id)
                        ? "bg-green-600 border-green-500"
                        : "border-slate-500 hover:border-white"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm">{TYPE_ICON[task.type]}</span>
                      <span className="text-white text-sm font-medium truncate">{task.title}</span>
                      <span className={`ml-auto text-xs px-1.5 py-0.5 rounded border flex-shrink-0 ${PRIORITY_BADGE[task.priority]}`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs">{task.description}</p>
                    {task.lead && <p className="text-slate-600 text-xs mt-0.5">👤 {task.lead}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">⚡ Быстрые действия</h2>
            <div className="space-y-2">
              {[
                { label: "AI Chat — спросить что делать",      href: "/admin/sales/chat",    icon: "🤖", color: "bg-red-600 hover:bg-red-500" },
                { label: "Найти горячие компании",             href: "/admin/sales/companies?filter=hot", icon: "🔥", color: "bg-slate-700 hover:bg-slate-600" },
                { label: "Запустить поиск лидов",              href: "/admin/market-intelligence", icon: "🎯", color: "bg-slate-700 hover:bg-slate-600" },
                { label: "Создать КП",                        href: "/admin/leads",           icon: "📋", color: "bg-slate-700 hover:bg-slate-600" },
                { label: "Открыть Pipeline",                   href: "/admin/pipeline",        icon: "🗂",  color: "bg-slate-700 hover:bg-slate-600" },
              ].map(action => (
                <Link key={action.label} href={action.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white transition ${action.color}`}>
                  <span>{action.icon}</span>
                  <span>{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-3 text-sm uppercase tracking-wide">🤖 AI Агенты</h2>
            <div className="space-y-3">
              {[
                { name: "Lead Finder",      status: "Активен",   color: "text-green-400", desc: "Firecrawl + Claude Haiku" },
                { name: "Company Researcher", status: "Активен",  color: "text-green-400", desc: "Анализ сайтов" },
                { name: "Lead Scoring",     status: "Активен",   color: "text-green-400", desc: "Score 1-5 звёзд" },
                { name: "Offer Selector",   status: "Активен",   color: "text-green-400", desc: "Определяет продукт" },
                { name: "Proposal Gen",     status: "Активен",   color: "text-green-400", desc: "PDF + 7 шаблонов" },
                { name: "CEO Report",       status: "Активен",   color: "text-green-400", desc: "Ежедневно в 07:00" },
                { name: "Follow-up",        status: "v1.1",      color: "text-slate-500", desc: "Авторемайндеры" },
                { name: "AI Dialogue",      status: "v1.1",      color: "text-slate-500", desc: "Copilot переписки" },
              ].map(agent => (
                <div key={agent.name} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">{agent.name}</p>
                    <p className="text-xs text-slate-500">{agent.desc}</p>
                  </div>
                  <span className={`text-xs font-medium ${agent.color}`}>{agent.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
