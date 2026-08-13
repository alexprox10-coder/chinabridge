"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

interface VkStatus {
  connected: boolean;
  expired?: boolean;
  user_id?: string;
  leads_synced?: number;
}

const STATIC_INTEGRATIONS = [
  { name: "Google Analytics 4", icon: "📊", description: "Отслеживание трафика, конверсий, событий на сайте chinabridge.pro", status: "demo", platform: "google" },
  { name: "Яндекс.Метрика", icon: "🟡", description: "Аналитика для русскоязычной аудитории, вебвизор, карты кликов", status: "inactive", platform: "yandex" },
  { name: "Google Ads", icon: "🔵", description: "Управление контекстной рекламой, автоматический импорт данных кампаний", status: "inactive", platform: "google" },
  { name: "Яндекс Директ", icon: "🟠", description: "Контекстная реклама в Яндексе, РСЯ, ретаргетинг", status: "inactive", platform: "yandex" },
  { name: "Telegram Ads", icon: "✈️", description: "Официальная реклама в Telegram через платформу ads.telegram.org", status: "inactive", platform: "telegram" },
  { name: "Meta Ads", icon: "🔵", description: "Facebook / Instagram реклама (ограниченный доступ из РФ)", status: "inactive", platform: "meta" },
  { name: "Авито", icon: "🟢", description: "Продвижение объявлений и брендирование на Авито", status: "inactive", platform: "avito" },
];

export function IntegrationsClient() {
  const searchParams = useSearchParams();
  const vkResult = searchParams.get("vk_ads");
  const [vkStatus, setVkStatus] = useState<VkStatus | null>(null);
  const [vkLoading, setVkLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadVkStatus = useCallback(async () => {
    setVkLoading(true);
    try {
      const r = await fetch("/api/vk-ads/status");
      if (r.ok) setVkStatus(await r.json());
    } catch {}
    setVkLoading(false);
  }, []);

  useEffect(() => { loadVkStatus(); }, [loadVkStatus]);

  const handleSync = async () => {
    setSyncing(true);
    await fetch("/api/vk-ads/sync").catch(() => {});
    await loadVkStatus();
    setSyncing(false);
  };

  return (
    <div className="px-4 lg:px-8 py-6 max-w-4xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Интеграции</h1>
        <p className="text-sm text-slate-500 mt-0.5">Рекламные кабинеты и аналитика — адаптеры для Marketing AI</p>
      </div>

      {vkResult === "connected" && (
        <div className="bg-green-900/30 border border-green-700/40 rounded-xl px-4 py-3 text-sm text-green-300">
          ✅ VK Реклама успешно подключена
        </div>
      )}
      {vkResult === "error" && (
        <div className="bg-red-900/30 border border-red-700/40 rounded-xl px-4 py-3 text-sm text-red-300">
          ❌ Ошибка подключения VK Рекламы. Попробуйте ещё раз.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* VK Ads — живая карточка */}
        <div className={`bg-slate-900 border rounded-2xl p-5 flex flex-col gap-3 ${vkStatus?.connected ? "border-blue-700/40" : "border-slate-800"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">💙</span>
              <p className="text-sm font-semibold text-slate-100">VK Реклама</p>
            </div>
            {vkLoading ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 animate-pulse">Загрузка…</span>
            ) : vkStatus?.connected ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-300 border border-blue-700/40">Подключено</span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-500">Не подключено</span>
            )}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Таргетированная реклама ВКонтакте, MyTarget — автосинхронизация лидов из lead-форм
          </p>
          {vkStatus?.connected ? (
            <div className="space-y-2">
              <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 flex justify-between items-center">
                <span className="text-xs text-slate-500">Лидов синхронизировано</span>
                <span className="text-sm font-mono text-blue-300">{vkStatus.leads_synced ?? 0}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSync} disabled={syncing} className="flex-1 text-xs py-2 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 border border-blue-700/30 rounded-xl transition-colors disabled:opacity-50">
                  {syncing ? "Синхронизация…" : "Синхронизировать лиды"}
                </button>
                <a href="/api/vk-ads/auth" className="text-xs py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl transition-colors">
                  Переподключить
                </a>
              </div>
            </div>
          ) : (
            <a href="/api/vk-ads/auth" className="w-full text-xs py-2 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 border border-blue-700/30 rounded-xl transition-colors text-center block">
              Подключить VK Рекламу
            </a>
          )}
        </div>

        {/* Статичные карточки */}
        {STATIC_INTEGRATIONS.map((intg) => (
          <div key={intg.name} className={`bg-slate-900 border rounded-2xl p-5 flex flex-col gap-3 ${intg.status === "demo" ? "border-amber-700/30" : "border-slate-800"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{intg.icon}</span>
                <p className="text-sm font-semibold text-slate-100">{intg.name}</p>
              </div>
              {intg.status === "demo" ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-300 border border-amber-700/40">Демо</span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-500">Не подключено</span>
              )}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{intg.description}</p>
            {intg.status === "demo" ? (
              <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                <p className="text-xs text-slate-500 mb-0.5">API Key</p>
                <p className="text-sm font-mono text-slate-400 tracking-widest">●●●●●●●●●●●●</p>
              </div>
            ) : (
              <button disabled className="w-full text-xs py-2 bg-slate-800 text-slate-600 rounded-xl cursor-not-allowed">
                Подключить (скоро)
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">Архитектура адаптеров</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Marketing AI получает данные из рекламных кабинетов через адаптеры. Каждый адаптер нормализует метрики к единому формату и сохраняет их в таблицу{" "}
          <code className="text-red-400 bg-slate-800 px-1 rounded">marketing_channels</code>.
          После подключения — реальные данные автоматически заменяют ДЕМО в правой панели чата.
        </p>
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs px-2.5 py-1 bg-slate-800 text-slate-400 rounded-full">✓ GA4 готов (ДЕМО)</span>
          <span className="text-xs px-2.5 py-1 bg-blue-900/20 text-blue-400 rounded-full">✓ VK Реклама — готов</span>
          <span className="text-xs px-2.5 py-1 bg-slate-800 text-slate-500 rounded-full">○ Метрика — Q3 2026</span>
          <span className="text-xs px-2.5 py-1 bg-slate-800 text-slate-500 rounded-full">○ Директ — Q3 2026</span>
        </div>
      </div>
    </div>
  );
}
