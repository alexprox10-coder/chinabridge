"use client";

import { useEffect, useState, useCallback } from "react";

interface Campaign { id: string; name: string; status: string; objective?: string; budget_limit?: number; }
interface LeadForm  { id: string; name: string; status?: string; leads_count?: number; }

interface AccountData { items?: Campaign[]; }
interface LeadData    { items?: LeadForm[]; }

export function VkAdsDashboard() {
  const [campaigns, setCampaigns]   = useState<Campaign[]>([]);
  const [leadForms, setLeadForms]   = useState<LeadForm[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [creating, setCreating]     = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectLog, setConnectLog] = useState("");
  const [log, setLog]               = useState<string[]>([]);
  const [budget, setBudget]         = useState("5000");

  const addLog = (msg: string) => setLog(l => [...l, msg]);

  const reconnect = async () => {
    setConnecting(true);
    setConnectLog("Запрашиваем новый токен у VK…");
    try {
      const r = await fetch("/api/vk-ads/client-auth", { method: "POST" });
      const d = await r.json();
      if (d.ok) {
        setConnectLog("✅ Токен получен! Загружаем кампании…");
        setError("");
        await loadData();
      } else {
        setConnectLog("❌ " + JSON.stringify(d.details ?? d.error));
      }
    } catch (e) { setConnectLog("❌ " + String(e)); }
    setConnecting(false);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/vk-ads/campaigns");
      if (!r.ok) { setError("Нет доступа или VK Ads не подключён"); setLoading(false); return; }
      const d = await r.json();
      setCampaigns((d.campaigns as AccountData)?.items ?? []);
      setLeadForms((d.lead_forms as LeadData)?.items ?? []);
    } catch (e) {
      setError("Ошибка загрузки данных");
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const createFull = async () => {
    setCreating("all");
    setLog([]);
    addLog("Создаём кампанию…");

    // 1. Создаём кампанию
    const cRes = await fetch("/api/vk-ads/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_campaign", budget: parseInt(budget) }),
    });
    const cData = await cRes.json();
    if (!cData.ok || !cData.campaign?.id) {
      addLog("❌ Ошибка создания кампании: " + JSON.stringify(cData.campaign ?? cData));
      setCreating(null);
      return;
    }
    const campaignId = cData.campaign.id;
    addLog(`✅ Кампания создана: #${campaignId} (бюджет ${budget}₽)`);

    // 2. Создаём лид-форму
    addLog("Создаём лид-форму…");
    const fRes = await fetch("/api/vk-ads/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_lead_form", campaign_id: campaignId }),
    });
    const fData = await fRes.json();
    if (!fData.ok) {
      addLog("⚠️ Лид-форма: " + JSON.stringify(fData.lead_form ?? fData));
    } else {
      addLog(`✅ Лид-форма создана: #${fData.lead_form?.id}`);
    }

    // 3. Создаём группу объявлений
    addLog("Создаём группу объявлений (Москва, 25-55, бизнес)…");
    const gRes = await fetch("/api/vk-ads/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_ad_group", campaign_id: campaignId, budget: Math.min(parseInt(budget), 2000) }),
    });
    const gData = await gRes.json();
    if (!gData.ok) {
      addLog("⚠️ Группа: " + JSON.stringify(gData.ad_group ?? gData));
    } else {
      addLog(`✅ Группа объявлений создана: #${gData.ad_group?.id}`);
    }

    addLog("🎉 Готово! Обновляем данные…");
    await loadData();
    setCreating(null);
  };

  if (loading) return (
    <div className="px-4 lg:px-8 py-6 text-sm text-slate-500 animate-pulse">Загрузка данных VK Рекламы…</div>
  );

  return (
    <div className="px-4 lg:px-8 py-6 max-w-4xl space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">VK Реклама — Кампании</h1>
          <p className="text-sm text-slate-500 mt-0.5">Управление рекламными кампаниями и лид-формами</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={reconnect}
              disabled={connecting}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {connecting ? "Подключаем…" : "⚡ Переподключить VK"}
            </button>
            <a href="/admin/marketing/integrations" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              ← Интеграции
            </a>
          </div>
          {connectLog && <p className="text-xs font-mono text-slate-400">{connectLog}</p>}
        </div>
      </div>

      {error && (
        <div className="bg-slate-900 border border-blue-700/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔌</span>
            <div>
              <p className="text-sm font-semibold text-slate-200">VK Ads не подключён</p>
              <p className="text-xs text-slate-500 mt-0.5">Нажмите кнопку ниже для автоматической авторизации через client_credentials</p>
            </div>
          </div>
          <button
            onClick={async () => {
              setConnecting(true);
              setConnectLog("Запрашиваем токен у VK…");
              try {
                const r = await fetch("/api/vk-ads/client-auth", { method: "POST" });
                const d = await r.json();
                if (d.ok) {
                  setConnectLog("✅ Подключено! Загружаем данные…");
                  setError("");
                  await loadData();
                } else {
                  setConnectLog("❌ Ошибка: " + JSON.stringify(d.details ?? d.error));
                }
              } catch (e) {
                setConnectLog("❌ " + String(e));
              }
              setConnecting(false);
            }}
            disabled={connecting}
            className="w-full py-2.5 bg-blue-700 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {connecting ? "Подключаем…" : "⚡ Подключить VK Ads"}
          </button>
          {connectLog && <p className="text-xs font-mono text-slate-400">{connectLog}</p>}
        </div>
      )}

      {/* Создать РК */}
      <div className="bg-slate-900 border border-blue-700/30 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">Создать рекламную кампанию</h2>
        <p className="text-xs text-slate-500">
          Автоматически создаст: кампанию (цель — лиды) + лид-форму «Доставка из Китая» + группу объявлений
          с таргетингом на предпринимателей 25–55 лет
        </p>

        {/* Параметры */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 space-y-1">
            <p className="text-xs text-slate-500">Цель</p>
            <p className="text-sm text-slate-200">Лидогенерация</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 space-y-1">
            <p className="text-xs text-slate-500">Аудитория</p>
            <p className="text-sm text-slate-200">Предприниматели, 25–55 лет</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 space-y-1">
            <p className="text-xs text-slate-500">Гео</p>
            <p className="text-sm text-slate-200">Москва (расширяемо)</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 space-y-1">
            <p className="text-xs text-slate-500">Бюджет кампании (₽)</p>
            <input
              type="number"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              min={1000}
              step={1000}
              className="w-full bg-transparent text-sm text-blue-300 font-mono outline-none"
            />
          </div>
        </div>

        <button
          onClick={createFull}
          disabled={!!creating}
          className="w-full py-2.5 bg-blue-700 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          {creating ? "Создаём…" : "🚀 Создать кампанию"}
        </button>

        {log.length > 0 && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
            {log.map((l, i) => (
              <p key={i} className="text-xs font-mono text-slate-400">{l}</p>
            ))}
          </div>
        )}
      </div>

      {/* Существующие кампании */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">Кампании ({campaigns.length})</h2>
          <button onClick={loadData} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">↻ Обновить</button>
        </div>
        {campaigns.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-sm text-slate-500">
            Кампаний пока нет — создайте выше
          </div>
        ) : (
          campaigns.map(c => (
            <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-200">{c.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">#{c.id} · {c.objective ?? "—"}</p>
              </div>
              <div className="flex items-center gap-3">
                {c.budget_limit && <span className="text-xs text-slate-400">{c.budget_limit.toLocaleString()}₽</span>}
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  c.status === "ACTIVE" ? "bg-green-900/40 text-green-300 border border-green-700/30" :
                  "bg-slate-800 text-slate-500"
                }`}>{c.status === "ACTIVE" ? "Активна" : c.status}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Лид-формы */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">Лид-формы ({leadForms.length})</h2>
        {leadForms.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-sm text-slate-500">
            Лид-форм пока нет
          </div>
        ) : (
          leadForms.map(f => (
            <div key={f.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-200">{f.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">#{f.id}</p>
              </div>
              <span className="text-xs text-slate-400">{f.leads_count ?? 0} лидов</span>
            </div>
          ))
        )}
      </div>

      <p className="text-xs text-slate-600 text-center">
        После пополнения баланса кампания запустится автоматически · Лиды синхронизируются ежедневно в 08:00
      </p>
    </div>
  );
}
