"use client";
import { useState, useRef } from "react";

export default function Backup() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message,   setMessage]   = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showMsg = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const res  = await fetch("/api/backup/export");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `chinabridge-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showMsg("success", "Бэкап успешно создан и скачан");
    } catch (e) {
      showMsg("error", String(e));
    } finally { setExporting(false); }
  };

  const importData = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res  = await fetch("/api/backup/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.ok) showMsg("success", `Данные восстановлены: ${result.restored ?? "OK"}`);
      else           showMsg("error", result.error ?? "Ошибка импорта");
    } catch (e) {
      showMsg("error", `Ошибка: ${String(e)}`);
    } finally { setImporting(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Backup & Restore</h1>
        <p className="text-slate-400 text-sm mt-1">Экспортируйте и восстанавливайте данные компании</p>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm ${
          message.type === "success"
            ? "bg-emerald-900/40 border border-emerald-700 text-emerald-300"
            : "bg-red-900/40 border border-red-700 text-red-300"
        }`}>
          {message.type === "success" ? "✓ " : "✗ "}{message.text}
        </div>
      )}

      {/* Export */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📤</span>
          <div>
            <div className="text-white font-semibold">Экспорт данных</div>
            <div className="text-slate-400 text-sm">Скачайте все данные компании в формате JSON</div>
          </div>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-4 space-y-1.5 text-xs text-slate-400">
          <div className="text-slate-300 font-medium mb-2">Включает в себя:</div>
          {[
            "✓ Настройки компании и профиль",
            "✓ Лиды и сделки (CRM)",
            "✓ Документы и шаблоны",
            "✓ Задачи и решения CEO AI",
            "✓ AI-настройки (без ключей)",
            "✓ KPI и метрики",
          ].map(t => <div key={t}>{t}</div>)}
        </div>
        <button onClick={exportData} disabled={exporting}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold">
          {exporting ? "Создание бэкапа..." : "⬇️ Скачать бэкап (JSON)"}
        </button>
      </div>

      {/* Import */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📥</span>
          <div>
            <div className="text-white font-semibold">Восстановление данных</div>
            <div className="text-slate-400 text-sm">Загрузите файл бэкапа для восстановления</div>
          </div>
        </div>
        <div className="bg-amber-900/20 border border-amber-800/50 rounded-xl p-3 text-xs text-amber-300">
          ⚠️ Восстановление перезапишет текущие данные. Рекомендуем сначала сделать экспорт.
        </div>
        <div
          className="border-2 border-dashed border-slate-600 hover:border-slate-400 rounded-xl p-8 text-center cursor-pointer transition-colors"
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) importData(f); }}>
          <div className="text-3xl mb-2">📂</div>
          <div className="text-slate-400 text-sm">Перетащите файл сюда или нажмите для выбора</div>
          <div className="text-slate-600 text-xs mt-1">Поддерживаются файлы .json</div>
          <input ref={fileRef} type="file" accept=".json" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) importData(f); }} />
        </div>
        {importing && (
          <div className="text-center text-slate-400 text-sm animate-pulse">Импорт данных...</div>
        )}
      </div>

      {/* Schedule */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">⏰</span>
          <div className="text-white font-semibold">Автоматические бэкапы</div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-slate-300 text-sm">Еженедельный бэкап</div>
            <div className="text-slate-500 text-xs">Каждое воскресенье в 03:00 МСК</div>
          </div>
          <span className="px-2 py-1 rounded text-xs bg-slate-800 text-slate-500">Скоро</span>
        </div>
      </div>
    </div>
  );
}
