"use client";

import { useState, useEffect, useCallback } from "react";
import type { ImportLead } from "@/lib/import-leads/types";

type Приоритет = "ВСЕ" | "HOT" | "WARM";

interface РасширенныеДанные {
  inn?: string;
  director?: string;
  address?: string;
  leadScore?: number;
  chinaProb?: number;
  skuCount?: number;
  supplierRating?: number;
  offer?: string;
  reason?: string;
  estimatedSavings?: number;
  supplierId?: string;
}

function parseExtra(message: string): РасширенныеДанные {
  try { return JSON.parse(message); } catch { return {}; }
}

function ШкалаСкора({ score }: { score: number }) {
  const цвет = score >= 70 ? "bg-green-500" : score >= 45 ? "bg-yellow-500" : "bg-blue-500";
  const текст = score >= 70 ? "text-green-400" : score >= 45 ? "text-yellow-400" : "text-blue-400";
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${цвет} rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-bold ${текст} w-6 text-right`}>{score}</span>
    </div>
  );
}

const BADGE: Record<string, string> = {
  HOT:  "bg-red-900/50 text-red-300 border-red-700",
  WARM: "bg-amber-900/50 text-amber-300 border-amber-700",
  COLD: "bg-slate-700/50 text-slate-400 border-slate-600",
};

const КАТ_LABEL: Record<string, string> = {
  elektronika: "Электроника",
  odezhda:     "Одежда",
  dom:         "Дом и дача",
  avto:        "Автотовары",
};

export default function WbSellersClient() {
  const [лиды,       setЛиды]       = useState<ImportLead[]>([]);
  const [загрузка,   setЗагрузка]   = useState(true);
  const [запуск,     setЗапуск]     = useState(false);
  const [сообщение,  setSообщение]  = useState("");
  const [фильтр,     setФильтр]     = useState<Приоритет>("ВСЕ");
  const [раскрытый,  setРаскрытый]  = useState<string | null>(null);

  const загрузитьЛиды = useCallback(async () => {
    setЗагрузка(true);
    try {
      const r = await fetch("/api/admin/wb-leads");
      const d = await r.json();
      setЛиды(Array.isArray(d.leads) ? d.leads : []);
    } catch { setЛиды([]); }
    setЗагрузка(false);
  }, []);

  useEffect(() => { загрузитьЛиды(); }, [загрузитьЛиды]);

  async function запуститьПарсер() {
    setЗапуск(true); setSообщение("");
    try {
      const r = await fetch("/api/admin/wb-leads", { method: "POST" });
      const d = await r.json();
      if (d.ok) {
        setSообщение("✅ Парсер запущен — лиды появятся через 3–5 минут");
        setTimeout(() => загрузитьЛиды(), 180000);
      } else {
        setSообщение("⚠️ Ошибка запуска: " + (d.error ?? "неизвестна"));
      }
    } catch { setSообщение("⚠️ Ошибка сети"); }
    setЗапуск(false);
  }

  const видимыеЛиды = лиды.filter(l => {
    if (фильтр === "ВСЕ") return true;
    const ext = parseExtra(l.message ?? "");
    const score = ext.leadScore ?? (l.score * 20);
    if (фильтр === "HOT")  return score >= 70;
    if (фильтр === "WARM") return score >= 40 && score < 70;
    return true;
  });

  const стат = {
    всего: лиды.length,
    hot:   лиды.filter(l => { const e = parseExtra(l.message ?? ""); return (e.leadScore ?? l.score * 20) >= 70; }).length,
    warm:  лиды.filter(l => { const e = parseExtra(l.message ?? ""); const s = e.leadScore ?? l.score * 20; return s >= 40 && s < 70; }).length,
    avgScore: лиды.length ? Math.round(
      лиды.reduce((sum, l) => sum + (parseExtra(l.message ?? "").leadScore ?? l.score * 20), 0) / лиды.length
    ) : 0,
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">

      {/* Заголовок */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>🛒</span> WB Продавцы — AI Лид Finder
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Парсер Wildberries → dadata → GPT-4o → персональный оффер + Lead Score
          </p>
        </div>
        <button
          onClick={запуститьПарсер}
          disabled={запуск}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#00A86B] hover:bg-[#008f59] disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition"
        >
          {запуск ? "⏳ Запускаем..." : "🚀 Запустить парсер"}
        </button>
      </div>

      {сообщение && (
        <div className="mb-5 px-4 py-3 bg-blue-900/30 border border-blue-700/50 rounded-xl text-blue-300 text-sm">
          {сообщение}
        </div>
      )}

      {/* Статистика */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { метка: "Всего найдено",  значение: стат.всего,    цвет: "text-white" },
          { метка: "HOT (≥70)",      значение: стат.hot,      цвет: "text-red-400" },
          { метка: "WARM (40–69)",   значение: стат.warm,     цвет: "text-amber-400" },
          { метка: "Средний Score",  значение: стат.avgScore, цвет: "text-[#00A86B]" },
        ].map(s => (
          <div key={s.метка} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.цвет}`}>{s.значение}</p>
            <p className="text-slate-500 text-xs mt-0.5">{s.метка}</p>
          </div>
        ))}
      </div>

      {/* Фильтры */}
      <div className="flex gap-2 mb-5">
        {(["ВСЕ", "HOT", "WARM"] as Приоритет[]).map(p => (
          <button key={p} onClick={() => setФильтр(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
              фильтр === p ? "bg-slate-700 border-slate-500 text-white" : "border-slate-800 text-slate-500 hover:border-slate-600"
            }`}>
            {p === "ВСЕ" ? "Все лиды" : p === "HOT" ? "🔥 HOT" : "🟡 WARM"}
          </button>
        ))}
        <span className="ml-auto text-slate-600 text-sm self-center">{видимыеЛиды.length} лидов</span>
      </div>

      {/* Таблица лидов */}
      {загрузка ? (
        <div className="text-center py-20 text-slate-600">Загрузка...</div>
      ) : видимыеЛиды.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🛒</div>
          <p className="text-slate-500 mb-2">Лидов пока нет</p>
          <p className="text-slate-600 text-sm">Нажмите «Запустить парсер» — он найдёт WB-продавцов<br/>и проанализирует их через AI</p>
        </div>
      ) : (
        <div className="space-y-2">
          {видимыеЛиды.map(лид => {
            const ext  = parseExtra(лид.message ?? "");
            const score = ext.leadScore ?? лид.score * 20;
            const prior = score >= 70 ? "HOT" : score >= 40 ? "WARM" : "COLD";
            const откр  = раскрытый === лид.lead_id;

            return (
              <div key={лид.lead_id}
                className={`bg-slate-900 border rounded-xl overflow-hidden transition ${
                  prior === "HOT" ? "border-red-800/60" : "border-slate-800"
                }`}>

                {/* Строка */}
                <div className="p-4 cursor-pointer hover:bg-slate-800/40 transition"
                  onClick={() => setРаскрытый(откр ? null : лид.lead_id)}>
                  <div className="flex items-center gap-3 flex-wrap">

                    {/* Приоритет */}
                    <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${BADGE[prior]}`}>
                      {prior}
                    </span>

                    {/* Score */}
                    <div className="shrink-0 w-28">
                      <ШкалаСкора score={score} />
                    </div>

                    {/* Компания */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{лид.company}</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {КАТ_LABEL[лид.category] ?? лид.category}
                        {ext.inn ? ` · ИНН ${ext.inn}` : ""}
                        {ext.director ? ` · ${ext.director}` : ""}
                      </p>
                    </div>

                    {/* Товар */}
                    <div className="hidden sm:block min-w-0 max-w-[200px]">
                      <p className="text-slate-400 text-xs truncate">{ext.topProduct ?? ""}</p>
                      {ext.estimatedSavings && ext.estimatedSavings > 0 ? (
                        <p className="text-[#00A86B] text-xs font-semibold">
                          экономия ~{ext.estimatedSavings.toLocaleString("ru")}₽/шт
                        </p>
                      ) : null}
                    </div>

                    {/* Вероятность Китая */}
                    <div className="shrink-0 text-right">
                      <p className="text-slate-400 text-xs">Китай</p>
                      <p className="text-white text-sm font-bold">{ext.chinaProb ?? "—"}%</p>
                    </div>

                    <span className="text-slate-700 text-xs shrink-0">{откр ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* Раскрытая панель */}
                {откр && (
                  <div className="border-t border-slate-800 p-5 bg-slate-900/70 space-y-4">

                    {/* Основные данные */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 text-xs mb-0.5">Компания</p>
                        <p className="text-white">{лид.company}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-0.5">ИНН</p>
                        <p className="text-white font-mono">{ext.inn || "—"}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-0.5">Директор</p>
                        <p className="text-white">{ext.director || "—"}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-0.5">Рейтинг WB</p>
                        <p className="text-white">⭐ {ext.supplierRating ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-0.5">Товаров на WB</p>
                        <p className="text-white">{ext.skuCount ?? "—"} SKU</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-0.5">Lead Score</p>
                        <p className={`font-bold ${score >= 70 ? "text-red-400" : score >= 40 ? "text-amber-400" : "text-slate-400"}`}>
                          {score}/100
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-0.5">Вероятность Китая</p>
                        <p className="text-white">{ext.chinaProb ?? "—"}%</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-0.5">Экономия (оценка)</p>
                        <p className="text-[#00A86B] font-semibold">
                          {ext.estimatedSavings ? `~${ext.estimatedSavings.toLocaleString("ru")}₽/шт` : "—"}
                        </p>
                      </div>
                    </div>

                    {/* Адрес */}
                    {лид.city && (
                      <div>
                        <p className="text-slate-500 text-xs mb-0.5">Адрес</p>
                        <p className="text-slate-300 text-sm">{лид.city}</p>
                      </div>
                    )}

                    {/* Персональный оффер */}
                    {(ext.offer || лид.offer) && (
                      <div className="bg-[#00A86B]/10 border border-[#00A86B]/30 rounded-xl p-4">
                        <p className="text-[#00A86B] text-xs font-semibold mb-1">💬 Персональный оффер</p>
                        <p className="text-slate-200 text-sm leading-relaxed">{ext.offer || лид.offer}</p>
                      </div>
                    )}

                    {/* Обоснование */}
                    {(ext.reason || лид.why) && (
                      <div>
                        <p className="text-slate-500 text-xs mb-0.5">Обоснование AI</p>
                        <p className="text-slate-400 text-sm">{ext.reason || лид.why}</p>
                      </div>
                    )}

                    {/* Кнопки */}
                    <div className="flex gap-3 pt-2">
                      {ext.supplierId && (
                        <a
                          href={`https://www.wildberries.ru/seller/${ext.supplierId}`}
                          target="_blank" rel="noopener noreferrer"
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs rounded-lg transition"
                        >
                          Открыть на WB →
                        </a>
                      )}
                      <a
                        href="/admin/import-leads"
                        className="px-4 py-2 bg-[#00A86B]/20 hover:bg-[#00A86B]/30 border border-[#00A86B]/40 text-[#00A86B] text-xs rounded-lg transition"
                      >
                        Все лиды в CRM →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
