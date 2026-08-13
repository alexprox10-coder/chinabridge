"use client";

import { useState, useEffect, useCallback } from "react";
import type { ImportLead } from "@/lib/import-leads/types";

interface Recommendation {
  lead_id: string;
  priority: number;
  urgency: "HOT" | "WARM" | "COLD";
  contactToday: boolean;
  reason: string;
  action: "Позвонить" | "WhatsApp" | "Telegram" | "Email";
  openingMessage: string;
  estimatedDeal: string;
  dealScore: number;
  lead: ImportLead | null;
}

interface Stats {
  total: number;
  hot: number;
  new: number;
  contacted: number;
}

const URGENCY_STYLE = {
  HOT:  { badge: "bg-red-900/50 text-red-300 border-red-700",  border: "border-red-800/50" },
  WARM: { badge: "bg-amber-900/50 text-amber-300 border-amber-700", border: "border-amber-800/40" },
  COLD: { badge: "bg-slate-700/50 text-slate-400 border-slate-600", border: "border-slate-800" },
};

const ACTION_ICON: Record<string, string> = {
  "Позвонить": "📞",
  "WhatsApp":  "💬",
  "Telegram":  "✈️",
  "Email":     "📧",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="text-xs text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-500 px-2 py-0.5 rounded transition"
    >
      {copied ? "✅ Скопировано" : "Копировать"}
    </button>
  );
}

function ScoreMeter({ score }: { score: number }) {
  const color = score >= 75 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-blue-500";
  const textColor = score >= 75 ? "text-green-400" : score >= 50 ? "text-yellow-400" : "text-blue-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-bold ${textColor} w-7 text-right`}>{score}</span>
    </div>
  );
}

export default function AiSalesAgentClient() {
  const [recs,      setRecs]      = useState<Recommendation[]>([]);
  const [stats,     setStats]     = useState<Stats | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [expanded,  setExpanded]  = useState<string | null>(null);
  const [filter,    setFilter]    = useState<"ВСЕ" | "HOT" | "WARM">("ВСЕ");
  const [msg,       setMsg]       = useState("");

  const loadStats = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/ai-sales-agent");
      const d = await r.json();
      if (d.ok) setStats(d.stats);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  async function runAnalysis() {
    setAnalyzing(true); setMsg(""); setRecs([]);
    try {
      const r = await fetch("/api/admin/ai-sales-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 15 }),
      });
      const d = await r.json();
      if (d.ok) {
        setRecs(d.recommendations ?? []);
        setMsg(`✅ Проанализировано ${d.total} лидов — ${d.recommendations?.length ?? 0} рекомендаций`);
      } else {
        setMsg("⚠️ Ошибка анализа. Попробуйте ещё раз.");
      }
    } catch {
      setMsg("⚠️ Ошибка сети");
    }
    setAnalyzing(false);
  }

  const visible = recs.filter(r =>
    filter === "ВСЕ" ? true :
    filter === "HOT" ? r.urgency === "HOT" :
    r.urgency === "WARM"
  );

  const hotCount  = recs.filter(r => r.urgency === "HOT").length;
  const warmCount = recs.filter(r => r.urgency === "WARM").length;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">

      {/* Заголовок */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <span>🤖</span> AI Sales Agent
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            AI анализирует лиды → говорит кому звонить сегодня, почему и что сказать
          </p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={analyzing}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#00A86B] hover:bg-[#008f59] disabled:opacity-50 text-white rounded-xl text-sm font-bold transition"
        >
          {analyzing ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Анализирую...</>
          ) : (
            <><span>⚡</span>Запустить AI анализ</>
          )}
        </button>
      </div>

      {msg && (
        <div className="mb-5 px-4 py-3 bg-blue-900/20 border border-blue-700/40 rounded-xl text-blue-300 text-sm">
          {msg}
        </div>
      )}

      {/* Статистика CRM */}
      {loading ? (
        <div className="text-center py-10 text-slate-600">Загрузка...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Всего лидов",   value: stats?.total ?? 0,     color: "text-white" },
            { label: "HOT лидов",     value: stats?.hot ?? 0,       color: "text-red-400" },
            { label: "Новых",         value: stats?.new ?? 0,       color: "text-blue-400" },
            { label: "Связались",     value: stats?.contacted ?? 0, color: "text-green-400" },
          ].map(s => (
            <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Результаты анализа */}
      {recs.length > 0 && (
        <>
          {/* Итог анализа */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-400">Рекомендации AI:</span>
                <span className="text-red-400 font-bold">🔥 HOT: {hotCount}</span>
                <span className="text-amber-400 font-bold">🟡 WARM: {warmCount}</span>
              </div>
              <div className="flex gap-2">
                {(["ВСЕ", "HOT", "WARM"] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                      filter === f ? "bg-slate-700 border-slate-500 text-white" : "border-slate-800 text-slate-500 hover:border-slate-600"
                    }`}>
                    {f === "ВСЕ" ? "Все" : f === "HOT" ? "🔥 HOT" : "🟡 WARM"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Карточки */}
          <div className="space-y-3">
            {visible.map((rec, i) => {
              const lead = rec.lead;
              const open = expanded === rec.lead_id;
              const style = URGENCY_STYLE[rec.urgency];

              return (
                <div key={rec.lead_id}
                  className={`bg-slate-900 border rounded-xl overflow-hidden transition ${style.border}`}>

                  {/* Строка */}
                  <div className="p-4 cursor-pointer hover:bg-slate-800/40 transition"
                    onClick={() => setExpanded(open ? null : rec.lead_id)}>
                    <div className="flex items-center gap-3 flex-wrap">

                      {/* Приоритет */}
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-bold shrink-0">
                        {rec.priority}
                      </div>

                      {/* Urgency */}
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${style.badge}`}>
                        {rec.urgency}
                      </span>

                      {/* Компания */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{lead?.company ?? rec.lead_id}</p>
                        <p className="text-slate-500 text-xs mt-0.5 truncate">{rec.reason}</p>
                      </div>

                      {/* Deal score */}
                      <div className="hidden sm:block w-28 shrink-0">
                        <ScoreMeter score={rec.dealScore} />
                      </div>

                      {/* Сумма сделки */}
                      <div className="text-right shrink-0">
                        <p className="text-[#00A86B] text-xs font-bold">{rec.estimatedDeal}</p>
                        <p className="text-slate-600 text-xs">{ACTION_ICON[rec.action]} {rec.action}</p>
                      </div>

                      <span className="text-slate-700 text-xs shrink-0">{open ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {/* Раскрытая панель */}
                  {open && (
                    <div className="border-t border-slate-800 p-5 space-y-4 bg-slate-900/60">

                      {/* Детали лида */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        {[
                          { l: "Категория",  v: lead?.category || "—" },
                          { l: "Город",      v: lead?.city || "—" },
                          { l: "Источник",   v: lead?.source || "—" },
                          { l: "Deal Score", v: `${rec.dealScore}/100` },
                        ].map(({ l, v }) => (
                          <div key={l}>
                            <p className="text-slate-500 text-xs mb-0.5">{l}</p>
                            <p className="text-white text-sm">{v}</p>
                          </div>
                        ))}
                      </div>

                      {/* Причина */}
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-slate-400 text-xs mb-1">Почему контактировать сейчас</p>
                        <p className="text-slate-200 text-sm">{rec.reason}</p>
                      </div>

                      {/* Открывающее сообщение */}
                      <div className="bg-[#00A86B]/5 border border-[#00A86B]/20 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[#00A86B] text-xs font-medium">
                            {ACTION_ICON[rec.action]} Первое сообщение (готово к отправке)
                          </p>
                          <CopyButton text={rec.openingMessage} />
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed italic">"{rec.openingMessage}"</p>
                      </div>

                      {/* Кнопки действий */}
                      <div className="flex gap-3 flex-wrap">
                        {lead?.phone && (
                          <a href={`tel:${lead.phone}`}
                            className="flex items-center gap-1.5 px-4 py-2 bg-green-900/30 hover:bg-green-900/50 border border-green-700/50 text-green-400 rounded-lg text-xs font-medium transition">
                            📞 Позвонить
                          </a>
                        )}
                        {lead?.phone && (
                          <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-700/50 text-emerald-400 rounded-lg text-xs font-medium transition">
                            💬 WhatsApp
                          </a>
                        )}
                        {lead?.email && (
                          <a href={`mailto:${lead.email}`}
                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-700/50 text-blue-400 rounded-lg text-xs font-medium transition">
                            📧 Email
                          </a>
                        )}
                        {lead?.website && (
                          <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-medium transition">
                            🌐 Сайт
                          </a>
                        )}
                        <a href="/admin/market-intelligence"
                          className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 rounded-lg text-xs font-medium transition">
                          📋 В CRM
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Пустое состояние */}
      {!analyzing && recs.length === 0 && !loading && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🤖</div>
          <p className="text-slate-400 font-semibold mb-2">AI Sales Agent готов к работе</p>
          <p className="text-slate-600 text-sm mb-6">
            Нажмите «Запустить AI анализ» — AI изучит ваши лиды,<br />
            расставит приоритеты и подготовит первые сообщения
          </p>
          <button onClick={runAnalysis} disabled={analyzing}
            className="px-6 py-3 bg-[#00A86B] hover:bg-[#008f59] text-white rounded-xl text-sm font-bold transition">
            ⚡ Запустить AI анализ →
          </button>
        </div>
      )}
    </main>
  );
}
