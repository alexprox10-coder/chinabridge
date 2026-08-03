"use client";
import { useState } from "react";
import type { FinanceSetting } from "@/lib/finance/types";

export function FinanceSettingsForm({ settings }: { settings: FinanceSetting[] }) {
  const [values, setValues] = useState<Record<number, string>>(
    Object.fromEntries(settings.filter((s) => s.id != null).map((s) => [s.id!, s.value]))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const updates = settings
        .filter((s) => s.id != null)
        .map((s) => ({ id: s.id!, value: values[s.id!] ?? s.value }));
      await fetch("/api/admin/finance/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold">Курсы валют</h2>
        <p className="text-slate-500 text-xs">Обновите вручную или подключите автоматическое обновление позже</p>
      </div>

      <div className="space-y-4">
        {settings.map((s) => (
          <div key={s.id ?? s.key} className="flex items-center gap-4">
            <label className="text-slate-300 text-sm w-40 flex-shrink-0">{s.label || s.key}</label>
            <div className="relative flex-1 max-w-xs">
              <input
                type="number"
                step="0.0001"
                value={s.id != null ? (values[s.id] ?? s.value) : s.value}
                onChange={(e) => {
                  if (s.id != null) setValues((v) => ({ ...v, [s.id!]: e.target.value }));
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
            {s.updated_at && (
              <span className="text-slate-600 text-xs">{s.updated_at.slice(0, 10)}</span>
            )}
          </div>
        ))}
      </div>

      {settings.length === 0 && (
        <p className="text-slate-500 text-sm">Настройки не загружены</p>
      )}

      <div className="pt-4 border-t border-slate-800 bg-slate-900/50 rounded-b-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
              saved
                ? "bg-emerald-600 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white"
            }`}
          >
            {saved ? "✓ Сохранено" : saving ? "Сохраняем..." : "Сохранить курсы"}
          </button>
          <p className="text-slate-500 text-xs">Изменения вступят в силу немедленно</p>
        </div>
      </div>
    </div>
  );
}
