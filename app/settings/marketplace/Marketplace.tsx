"use client";
import { useState } from "react";

type ModuleStatus = "installed" | "available" | "coming_soon";

interface Module {
  id:          string;
  name:        string;
  description: string;
  icon:        string;
  category:    string;
  status:      ModuleStatus;
  plan:        string[];
}

const MODULES: Module[] = [
  { id: "crm",        name: "CRM",                 description: "Управление лидами, сделками и клиентами",         icon: "👥", category: "Core",         status: "installed",    plan: ["starter","pro","enterprise"] },
  { id: "tracker",    name: "Cargo Tracker",        description: "Real-time отслеживание грузов на карте",           icon: "📍", category: "Logistics",    status: "installed",    plan: ["starter","pro","enterprise"] },
  { id: "docs",       name: "Documents AI",         description: "Автозаполнение CMR, коносаментов, инвойсов",       icon: "📄", category: "Documents",    status: "installed",    plan: ["starter","pro","enterprise"] },
  { id: "calc",       name: "Calculator",           description: "Калькулятор стоимости доставки и растаможки",      icon: "🧮", category: "Finance",      status: "installed",    plan: ["starter","pro","enterprise"] },
  { id: "whatsapp",   name: "WhatsApp Bot",         description: "Уведомления клиентов в WhatsApp",                  icon: "💬", category: "Messaging",    status: "available",    plan: ["pro","enterprise"] },
  { id: "telegram",   name: "Telegram Bot",         description: "Автоматические обновления статусов в Telegram",    icon: "✈️", category: "Messaging",    status: "available",    plan: ["pro","enterprise"] },
  { id: "analytics",  name: "Advanced Analytics",   description: "Детальная аналитика и прогнозирование",            icon: "📊", category: "Analytics",    status: "available",    plan: ["pro","enterprise"] },
  { id: "customs",    name: "Customs AI",           description: "AI-помощник для таможенного декларирования",       icon: "🏛️", category: "Documents",    status: "available",    plan: ["pro","enterprise"] },
  { id: "1c",         name: "1C Integration",       description: "Синхронизация с 1С:Предприятие",                   icon: "🔗", category: "Integrations", status: "available",    plan: ["enterprise"] },
  { id: "bitrix",     name: "Bitrix24",             description: "Двусторонняя интеграция с Bitrix24 CRM",           icon: "🏢", category: "Integrations", status: "available",    plan: ["enterprise"] },
  { id: "maps",       name: "Route Optimizer",      description: "Оптимизация маршрутов и выбор перевозчиков",       icon: "🗺️", category: "Logistics",    status: "coming_soon",  plan: ["enterprise"] },
  { id: "finance",    name: "Finance Module",       description: "Выставление счетов и финансовая отчётность",       icon: "💰", category: "Finance",      status: "coming_soon",  plan: ["pro","enterprise"] },
];

const CATEGORIES = ["Все", "Core", "Logistics", "Documents", "Finance", "Messaging", "Analytics", "Integrations"];

export default function Marketplace() {
  const [filter,    setFilter]    = useState("Все");
  const [installed, setInstalled] = useState<Set<string>>(
    new Set(MODULES.filter(m => m.status === "installed").map(m => m.id))
  );
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = MODULES.filter(m => filter === "Все" || m.category === filter);

  const toggle = async (id: string) => {
    setLoading(id);
    await new Promise(r => setTimeout(r, 600));
    setInstalled(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setLoading(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">App Marketplace</h1>
        <p className="text-slate-400 text-sm mt-1">Расширяйте возможности AI Company OS</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Установлено",    val: installed.size },
          { label: "Доступно",       val: MODULES.filter(m => m.status === "available").length },
          { label: "Скоро",          val: MODULES.filter(m => m.status === "coming_soon").length },
        ].map(({ label, val }) => (
          <div key={label} className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{val}</div>
            <div className="text-slate-500 text-xs">{label}</div>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === c ? "bg-blue-700 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}>
            {c}
          </button>
        ))}
      </div>

      {/* Modules grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(mod => {
          const isInstalled = installed.has(mod.id);
          const isLoading   = loading === mod.id;
          const isSoon      = mod.status === "coming_soon";
          return (
            <div key={mod.id}
              className={`bg-slate-900 border rounded-2xl p-5 flex flex-col gap-3 transition-colors ${
                isInstalled ? "border-emerald-700/60" : "border-slate-700"
              }`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{mod.icon}</span>
                  <div>
                    <div className="text-white font-semibold text-sm">{mod.name}</div>
                    <div className="text-slate-500 text-xs">{mod.category}</div>
                  </div>
                </div>
                {isInstalled && <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />}
              </div>
              <p className="text-slate-400 text-xs flex-1">{mod.description}</p>
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1 flex-wrap">
                  {mod.plan.map(p => (
                    <span key={p} className="px-1.5 py-0.5 rounded text-xs bg-slate-800 text-slate-500">{p}</span>
                  ))}
                </div>
                {isSoon ? (
                  <span className="px-2 py-1 rounded-lg text-xs bg-slate-800 text-slate-500">Скоро</span>
                ) : (
                  <button onClick={() => toggle(mod.id)} disabled={isLoading}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isInstalled
                        ? "bg-red-900/40 border border-red-700 text-red-300 hover:bg-red-900/60"
                        : "bg-emerald-700 hover:bg-emerald-600 text-white"
                    }`}>
                    {isLoading ? "..." : isInstalled ? "Удалить" : "Установить"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
