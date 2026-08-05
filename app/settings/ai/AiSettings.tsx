"use client";
import { useState, useEffect } from "react";

const PROVIDERS = [
  {
    id: "openrouter",
    name: "OpenRouter",
    icon: "🌐",
    description: "Доступ ко всем моделям через одно API",
    models: ["claude-sonnet-4-5", "gpt-4o", "gpt-4o-mini", "gemini-2.0-flash", "deepseek/deepseek-chat"],
    keyPlaceholder: "sk-or-v1-...",
  },
  {
    id: "anthropic",
    name: "Anthropic (Claude)",
    icon: "🔶",
    description: "Прямой доступ к моделям Claude",
    models: ["claude-opus-5", "claude-sonnet-5", "claude-haiku-4-5"],
    keyPlaceholder: "sk-ant-...",
  },
  {
    id: "openai",
    name: "OpenAI",
    icon: "💚",
    description: "GPT-4o и другие модели OpenAI",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o1-preview"],
    keyPlaceholder: "sk-proj-...",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    icon: "💎",
    description: "Gemini 2.0 Flash и Pro модели",
    models: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
    keyPlaceholder: "AIzaSy...",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    icon: "🌊",
    description: "Экономичные модели DeepSeek",
    models: ["deepseek-chat", "deepseek-reasoner"],
    keyPlaceholder: "sk-...",
  },
];

interface AiConfig {
  activeProvider: string;
  defaultModel:   string;
  keys:           Record<string, string>;
}

export default function AiSettings() {
  const [config, setConfig] = useState<AiConfig>({
    activeProvider: "openrouter",
    defaultModel:   "claude-sonnet-4-5",
    keys:           {},
  });
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/settings/ai")
      .then(r => r.json())
      .then(d => d.ok && setConfig(d.config))
      .catch(() => {});
  }, []);

  const setKey = (providerId: string, val: string) =>
    setConfig(c => ({ ...c, keys: { ...c.keys, [providerId]: val } }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    } finally { setSaving(false); }
  };

  const activeProvider = PROVIDERS.find(p => p.id === config.activeProvider) ?? PROVIDERS[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Settings</h1>
          <p className="text-slate-400 text-sm mt-1">Настройте AI-провайдеров для всех модулей</p>
        </div>
        <button onClick={save} disabled={saving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium">
          {saving ? "Сохранение..." : saved ? "✓ Сохранено" : "Сохранить"}
        </button>
      </div>

      {/* Active provider + model */}
      <div className="bg-slate-900 border border-blue-700/50 rounded-2xl p-6 space-y-4">
        <div className="text-white font-semibold">Активный провайдер</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {PROVIDERS.map(p => (
            <button key={p.id} onClick={() => setConfig(c => ({ ...c, activeProvider: p.id }))}
              className={`py-3 px-2 rounded-xl border text-center text-xs transition-colors ${
                config.activeProvider === p.id
                  ? "bg-blue-700/40 border-blue-500 text-white"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
              }`}>
              <div className="text-xl mb-1">{p.icon}</div>
              {p.name}
            </button>
          ))}
        </div>
        <div>
          <label className="text-slate-400 text-xs block mb-1">Модель по умолчанию</label>
          <select value={config.defaultModel}
            onChange={e => setConfig(c => ({ ...c, defaultModel: e.target.value }))}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 text-sm focus:outline-none">
            {activeProvider.models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* API Keys */}
      <div className="space-y-4">
        <div className="text-white font-semibold">API Ключи</div>
        {PROVIDERS.map(p => (
          <div key={p.id} className="bg-slate-900 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{p.icon}</span>
              <div>
                <div className="text-white text-sm font-medium">{p.name}</div>
                <div className="text-slate-500 text-xs">{p.description}</div>
              </div>
              {config.keys[p.id] && (
                <span className="ml-auto px-2 py-0.5 rounded text-xs bg-emerald-900/40 text-emerald-400 border border-emerald-700">✓</span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type={showKey[p.id] ? "text" : "password"}
                value={config.keys[p.id] ?? ""}
                onChange={e => setKey(p.id, e.target.value)}
                placeholder={p.keyPlaceholder}
                className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-blue-500 font-mono"
              />
              <button onClick={() => setShowKey(s => ({ ...s, [p.id]: !s[p.id] }))}
                className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-400 text-sm hover:text-slate-200">
                {showKey[p.id] ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800/40 rounded-xl p-4 text-xs text-slate-500">
        🔒 API ключи шифруются и никогда не передаются третьим лицам. Рекомендуем использовать OpenRouter для доступа ко всем моделям через один ключ.
      </div>
    </div>
  );
}
