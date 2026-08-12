"use client";

import { useState, useEffect, useCallback } from "react";
import type { ImportLead } from "@/lib/import-leads/types";

interface HhExtra {
  employerId?: string;
  employerUrl?: string;
  vacancyName?: string;
  vacancyCount?: number;
  inn?: string;
  director?: string;
  address?: string;
  fullName?: string;
  isActive?: boolean;
  website?: string;
  description?: string;
  leadScore?: number;
  searchCategory?: string;
}

function parseExtra(message: string): HhExtra {
  try { return JSON.parse(message); } catch { return {}; }
}

const КАТ_LABEL: Record<string, string> = {
  wb:     "Wildberries",
  ozon:   "Ozon",
  china:  "Поставщик Китай",
  import: "Импорт",
};

const КАТ_COLOR: Record<string, string> = {
  wb:     "bg-violet-900/40 text-violet-300 border-violet-700",
  ozon:   "bg-blue-900/40 text-blue-300 border-blue-700",
  china:  "bg-red-900/40 text-red-300 border-red-700",
  import: "bg-amber-900/40 text-amber-300 border-amber-700",
};

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-blue-500";
  const text  = score >= 70 ? "text-green-400" : score >= 50 ? "text-yellow-400" : "text-blue-400";
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-bold ${text} w-6 text-right`}>{score}</span>
    </div>
  );
}

type Filter = "ВСЕ" | "HOT" | "WARM";

export default function HhLeadsClient() {
  const [лиды,      setЛиды]      = useState<ImportLead[]>([]);
  const [загрузка,  setЗагрузка]  = useState(true);
  const [запуск,    setЗапуск]    = useState(false);
  const [сообщение, setSообщение] = useState("");
  const [фильтр,    setФильтр]    = useState<Filter>("ВСЕ");
  const [раскрытый, setРаскрытый] = useState<string | null>(null);

  const загрузить = useCallback(async () => {
    setЗагрузка(true);
    try {
      const r = await fetch("/api/admin/hh-leads");
      const d = await r.json();
      setЛиды(Array.isArray(d.leads) ? d.leads : []);
    } catch { setЛиды([]); }
    setЗагрузка(false);
  }, []);

  useEffect(() => { загрузить(); }, [загрузить]);

  async function запустить() {
    setЗапуск(true); setSообщение("");
    try {
      const r = await fetch("/api/admin/hh-leads", { method: "POST" });
      const d = await r.json();
      if (d.ok) {
        setSообщение("✅ Парсер запущен — лиды появятся через 2–4 минуты");
        setTimeout(() => загрузить(), 240000);
      } else {
        setSообщение("⚠️ Ошибка: " + (d.error ?? "неизвестна"));
      }
    } catch { setSообщение("⚠️ Ошибка сети"); }
    setЗапуск(false);
  }

  const видимые = лиды.filter(л => {
    const ext = parseExtra(л.message ?? "");
    const score = ext.leadScore ?? л.score * 20;
    if (фильтр === "HOT")  return score >= 70;
    if (фильтр === "WARM") return score >= 45 && score < 70;
    return true;
  });

  const стат = {
    всего: лиды.length,
    hot:  лиды.filter(л => (parseExtra(л.message ?? "").leadScore ?? л.score * 20) >= 70).length,
    warm: лиды.filter(л => { const s = parseExtra(л.message ?? "").leadScore ?? л.score * 20; return s >= 45 && s < 70; }).length,
    сСайтом: лиды.filter(л => parseExtra(л.message ?? "").website).length,
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">

      {/* Заголовок */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>💼</span> HH.ru — AI Лид Finder
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Парсер вакансий маркетплейсов → dadata → Lead Score → CRM
          </p>
        </div>
        <button
          onClick={запустить}
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
          { метка: "Всего найдено",  значение: стат.всего,   цвет: "text-white" },
          { метка: "HOT (≥70)",      значение: стат.hot,     цвет: "text-red-400" },
          { метка: "WARM (45–69)",   значение: стат.warm,    цвет: "text-amber-400" },
          { метка: "С сайтом",       значение: стат.сСайтом, цвет: "text-[#00A86B]" },
        ].map(s => (
          <div key={s.метка} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.цвет}`}>{s.значение}</p>
            <p className="text-slate-500 text-xs mt-0.5">{s.метка}</p>
          </div>
        ))}
      </div>

      {/* Фильтры */}
      <div className="flex gap-2 mb-5">
        {(["ВСЕ", "HOT", "WARM"] as Filter[]).map(p => (
          <button key={p} onClick={() => setФильтр(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
              фильтр === p ? "bg-slate-700 border-slate-500 text-white" : "border-slate-800 text-slate-500 hover:border-slate-600"
            }`}>
            {p === "ВСЕ" ? "Все лиды" : p === "HOT" ? "🔥 HOT" : "🟡 WARM"}
          </button>
        ))}
        <span className="ml-auto text-slate-600 text-sm self-center">{видимые.length} лидов</span>
      </div>

      {/* Список */}
      {загрузка ? (
        <div className="text-center py-20 text-slate-600">Загрузка...</div>
      ) : видимые.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">💼</div>
          <p className="text-slate-500 mb-2">Лидов пока нет</p>
          <p className="text-slate-600 text-sm">
            Нажмите «Запустить парсер» — он найдёт компании,<br />
            ищущие менеджеров по маркетплейсам
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {видимые.map(лид => {
            const ext   = parseExtra(лид.message ?? "");
            const score = ext.leadScore ?? лид.score * 20;
            const priority = score >= 70 ? "HOT" : score >= 45 ? "WARM" : "COLD";
            const откр  = раскрытый === лид.lead_id;
            const кат   = ext.searchCategory ?? лид.category ?? "";

            return (
              <div key={лид.lead_id}
                className={`bg-slate-900 border rounded-xl overflow-hidden transition ${
                  priority === "HOT" ? "border-red-800/60" : "border-slate-800"
                }`}>

                {/* Строка */}
                <div className="p-4 cursor-pointer hover:bg-slate-800/40 transition"
                  onClick={() => setРаскрытый(откр ? null : лид.lead_id)}>
                  <div className="flex items-center gap-3 flex-wrap">

                    <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${
                      priority === "HOT" ? "bg-red-900/50 text-red-300 border-red-700" :
                      priority === "WARM" ? "bg-amber-900/50 text-amber-300 border-amber-700" :
                      "bg-slate-700/50 text-slate-400 border-slate-600"
                    }`}>{priority}</span>

                    <div className="shrink-0 w-28">
                      <ScoreBar score={score} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{лид.company}</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {ext.vacancyName ?? ""}
                        {ext.inn ? ` · ИНН ${ext.inn}` : ""}
                      </p>
                    </div>

                    <div className="hidden sm:flex items-center gap-2">
                      {кат && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${КАТ_COLOR[кат] ?? "bg-slate-800 text-slate-400 border-slate-700"}`}>
                          {КАТ_LABEL[кат] ?? кат}
                        </span>
                      )}
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-slate-400 text-xs">Вакансий</p>
                      <p className="text-white text-sm font-bold">{ext.vacancyCount ?? 1}</p>
                    </div>

                    <span className="text-slate-700 text-xs shrink-0">{откр ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* Раскрытая панель */}
                {откр && (
                  <div className="border-t border-slate-800 p-5 bg-slate-900/70 space-y-4">

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 text-xs mb-0.5">Компания</p>
                        <p className="text-white">{ext.fullName || лид.company}</p>
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
                        <p className="text-slate-500 text-xs mb-0.5">Статус</p>
                        <p className={ext.isActive ? "text-green-400" : "text-slate-500"}>
                          {ext.isActive ? "✅ Активна" : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-0.5">Город</p>
                        <p className="text-white">{лид.city || "—"}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-0.5">Lead Score</p>
                        <p className={`font-bold ${score >= 70 ? "text-red-400" : score >= 45 ? "text-amber-400" : "text-slate-400"}`}>
                          {score}/100
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-0.5">Вакансий на HH</p>
                        <p className="text-white">{ext.vacancyCount ?? 1}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-0.5">Категория</p>
                        <p className="text-white">{КАТ_LABEL[кат] ?? кат || "—"}</p>
                      </div>
                    </div>

                    {ext.address && (
                      <div>
                        <p className="text-slate-500 text-xs mb-0.5">Адрес</p>
                        <p className="text-slate-300 text-sm">{ext.address}</p>
                      </div>
                    )}

                    {ext.description && (
                      <div>
                        <p className="text-slate-500 text-xs mb-1">О компании</p>
                        <p className="text-slate-400 text-sm leading-relaxed">{ext.description}</p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2 flex-wrap">
                      {ext.employerUrl && (
                        <a href={ext.employerUrl} target="_blank" rel="noopener noreferrer"
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs rounded-lg transition">
                          Открыть на HH →
                        </a>
                      )}
                      {ext.website && (
                        <a href={ext.website.startsWith("http") ? ext.website : `https://${ext.website}`}
                          target="_blank" rel="noopener noreferrer"
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs rounded-lg transition">
                          Сайт компании →
                        </a>
                      )}
                      <a href="/admin/import-leads"
                        className="px-4 py-2 bg-[#00A86B]/20 hover:bg-[#00A86B]/30 border border-[#00A86B]/40 text-[#00A86B] text-xs rounded-lg transition">
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
