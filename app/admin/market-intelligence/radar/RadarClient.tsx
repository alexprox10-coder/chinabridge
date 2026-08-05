"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { MIRadarSignal, RadarType } from "@/lib/market-intelligence/types";
import { RADAR_TYPE_LABELS } from "@/lib/market-intelligence/types";

type Tab = "all" | RadarType;

const TAB_DEFS: { id: Tab; icon: string; label: string }[] = [
  { id: "all",              icon: "📡", label: "Все" },
  { id: "telegram_channel", icon: "✈️", label: "Telegram" },
  { id: "vk_community",    icon: "💬", label: "VK" },
  { id: "competitor",      icon: "🏴", label: "Конкуренты" },
  { id: "supplier",        icon: "🏭", label: "Поставщики" },
  { id: "trend",           icon: "📈", label: "Тренды" },
  { id: "opportunity",     icon: "💡", label: "Возможности" },
];

const TYPE_COLOR: Partial<Record<RadarType, string>> = {
  telegram_channel: "bg-blue-900/30 border-blue-700/40 text-blue-300",
  telegram_group:   "bg-blue-900/30 border-blue-700/40 text-blue-300",
  vk_community:     "bg-indigo-900/30 border-indigo-700/40 text-indigo-300",
  competitor:       "bg-red-900/30 border-red-700/40 text-red-300",
  trend:            "bg-amber-900/30 border-amber-700/40 text-amber-300",
  supplier:         "bg-emerald-900/30 border-emerald-700/40 text-emerald-300",
  opportunity:      "bg-purple-900/30 border-purple-700/40 text-purple-300",
};

function OpportunityBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-green-500" : score >= 45 ? "bg-yellow-500" : "bg-slate-600";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold text-white w-6 text-right">{score}</span>
    </div>
  );
}

const DEMO_SIGNALS: MIRadarSignal[] = [
  { signalId:"demo-1", tenantId:"", type:"telegram_channel", name:"@chinaimport_pro", description:"Канал про импорт из Китая — товары, фабрики, логистика", url:"https://t.me/chinaimport_pro", subscribers:12400, growth:18, activity:"высокая", country:"RU", opportunityScore:82, aiAnalysis:"Активный канал с аудиторией импортёров. Хорошая точка для контента и продвижения.", createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() },
  { signalId:"demo-2", tenantId:"", type:"telegram_channel", name:"@wb_suppliers", description:"WB поставщики — обсуждение фабрик и логистики", url:"https://t.me/wb_suppliers", subscribers:8900, growth:12, activity:"средняя", country:"RU", opportunityScore:74, aiAnalysis:"Активные продавцы WB ищут поставщиков. Потенциальные клиенты для карго и ВЭД.", createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() },
  { signalId:"demo-3", tenantId:"", type:"competitor", name:"b2bchina.ru", description:"Крупный конкурент — импорт под ключ из Китая", url:"https://b2bchina.ru", opportunityScore:65, aiAnalysis:"Добавили новую услугу сертификации. Стоит проверить их цены и предложить более выгодные условия.", createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() },
  { signalId:"demo-4", tenantId:"", type:"trend", name:"Солнечные панели Китай 2025", description:"Рост интереса к солнечным панелям из Китая +48% за 3 месяца", url:"", growth:48, opportunityScore:78, aiAnalysis:"Высокий рост запросов. Подготовить специальное предложение по логистике и сертификации панелей.", createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() },
  { signalId:"demo-5", tenantId:"", type:"opportunity", name:"ООО МегаШоп — ищет поставщика", description:"Обсуждение в Telegram: ищем производителя электроники в Китае для WB", url:"https://t.me/wb_suppliers/14238", opportunityScore:91, aiAnalysis:"Горячая возможность! Компания активно ищет поставщика прямо сейчас. Связаться в течение 24ч.", createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() },
  { signalId:"demo-6", tenantId:"", type:"vk_community", name:"Импорт из Китая | Оптом", description:"Сообщество 15K участников — обсуждения поставок из Китая", url:"https://vk.com/chinaimport", subscribers:15200, growth:7, activity:"средняя", country:"RU", opportunityScore:60, aiAnalysis:"Активное VK-сообщество с потенциальными клиентами. Можно использовать для таргета.", createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() },
];

export default function RadarClient() {
  const [tab,     setTab]     = useState<Tab>("all");
  const [signals, setSignals] = useState<MIRadarSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runMsg,  setRunMsg]  = useState("");

  const loadSignals = useCallback(async () => {
    setLoading(true);
    try {
      const type = tab === "all" ? "" : `?type=${tab}`;
      const res  = await fetch(`/api/market-intelligence/radar${type}`);
      const data: MIRadarSignal[] = await res.json();
      setSignals(data.length > 0 ? data : DEMO_SIGNALS.filter(s => tab === "all" || s.type === tab));
    } catch {
      setSignals(DEMO_SIGNALS.filter(s => tab === "all" || s.type === tab));
    }
    setLoading(false);
  }, [tab]);

  useEffect(() => { loadSignals(); }, [loadSignals]);

  async function runRadar() {
    setRunning(true); setRunMsg("");
    try {
      const res  = await fetch("/api/market-intelligence/radar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const data = await res.json();
      setRunMsg(`✅ Telegram: ${data.telegram} | Конкуренты: ${data.competitors} | Тренды: ${data.trends} | Возможности: ${data.opportunities}`);
      await loadSignals();
    } catch { setRunMsg("⚠️ Ошибка сканирования"); }
    setRunning(false);
  }

  const displayed = tab === "all" ? signals : signals.filter(s => s.type === tab);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/market-intelligence" className="text-slate-500 text-sm hover:text-slate-300 flex items-center gap-1 mb-1">← Market Intelligence</Link>
          <h1 className="text-2xl font-bold text-white">📡 Market Radar AI</h1>
          <p className="text-slate-500 text-sm mt-0.5">Мониторинг рынка, конкурентов, Telegram-каналов и трендов</p>
        </div>
        <button onClick={runRadar} disabled={running}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition">
          {running ? "⏳ Сканируем..." : "📡 Запустить сканирование"}
        </button>
      </div>

      {runMsg && (
        <div className="mb-4 px-4 py-2.5 bg-purple-900/20 border border-purple-700/40 rounded-xl text-purple-300 text-sm">
          {runMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TAB_DEFS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border flex items-center gap-1.5 ${tab === t.id ? "bg-purple-600 border-purple-600 text-white" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Signals */}
      {loading ? (
        <div className="text-center py-16 text-slate-600">Загрузка...</div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📡</div>
          <p className="text-slate-500">Нет сигналов. Запустите сканирование →</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayed.map(signal => (
            <div key={signal.signalId} className={`border rounded-2xl p-5 ${TYPE_COLOR[signal.type] ?? "bg-slate-900 border-slate-800"} hover:brightness-110 transition`}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-white font-semibold text-sm truncate">{signal.name}</span>
                  </div>
                  <span className="text-xs opacity-60 mt-0.5 block">{RADAR_TYPE_LABELS[signal.type]}</span>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xl font-black text-white">{signal.opportunityScore}</div>
                  <div className="text-[10px] opacity-50">Score</div>
                </div>
              </div>

              <p className="text-sm opacity-70 mb-3 line-clamp-2">{signal.description}</p>

              <div className="space-y-1.5 text-xs opacity-60 mb-3">
                {signal.subscribers && signal.subscribers > 0 && (
                  <div className="flex justify-between"><span>Подписчиков</span><span className="font-medium opacity-100">{signal.subscribers.toLocaleString("ru")}</span></div>
                )}
                {signal.growth && signal.growth > 0 && (
                  <div className="flex justify-between"><span>Рост</span><span className="font-medium text-green-400">+{signal.growth}%</span></div>
                )}
                {signal.activity && (
                  <div className="flex justify-between"><span>Активность</span><span className="font-medium opacity-100">{signal.activity}</span></div>
                )}
              </div>

              <OpportunityBar score={signal.opportunityScore} />

              {signal.aiAnalysis && (
                <p className="text-xs opacity-60 mt-3 italic line-clamp-2">{signal.aiAnalysis}</p>
              )}

              {signal.url && (
                <a href={signal.url} target="_blank" rel="noopener noreferrer"
                  className="mt-3 text-xs opacity-50 hover:opacity-100 transition block truncate">
                  {signal.url}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
