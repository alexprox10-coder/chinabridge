"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { DealIntelligenceResult, DealScore } from "@/lib/market-intelligence/types";

const RISK_COLORS = { low: "text-green-400", medium: "text-amber-400", high: "text-red-400" };
const ALERT_COLORS = {
  hot:     "border-red-600/50 bg-red-950/10",
  closing: "border-emerald-600/40 bg-emerald-950/10",
  urgent:  "border-amber-600/40 bg-amber-950/10",
  stale:   "border-slate-600/40",
};

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? "#22c55e" : score >= 45 ? "#f59e0b" : "#64748b";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e293b" strokeWidth="4" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="11" fontWeight="700">{score}</text>
    </svg>
  );
}

function WinBar({ prob }: { prob: number }) {
  const color = prob >= 70 ? "bg-green-500" : prob >= 40 ? "bg-yellow-500" : "bg-slate-600";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${prob}%` }} />
      </div>
      <span className="text-xs text-white w-8 text-right">{prob}%</span>
    </div>
  );
}

function DealCard({ deal }: { deal: DealScore }) {
  const [open, setOpen] = useState(false);
  const alertClass = deal.alert ? ALERT_COLORS[deal.alert] : "border-slate-800";
  return (
    <div className={`border rounded-xl overflow-hidden transition ${alertClass}`}>
      <div className="p-4 cursor-pointer hover:bg-slate-800/30" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-4">
          <ScoreRing score={deal.score} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-semibold">{deal.company}</span>
              {deal.alert === "hot"     && <span className="text-xs px-1.5 py-0.5 bg-red-900/40 text-red-300 border border-red-700 rounded-full">🔥 HOT</span>}
              {deal.alert === "closing" && <span className="text-xs px-1.5 py-0.5 bg-emerald-900/40 text-emerald-300 border border-emerald-700 rounded-full">✅ Закрывается</span>}
              {deal.alert === "urgent"  && <span className="text-xs px-1.5 py-0.5 bg-amber-900/40 text-amber-300 border border-amber-700 rounded-full">⚠️ Срочно</span>}
              {deal.alert === "stale"   && <span className="text-xs px-1.5 py-0.5 bg-slate-700 text-slate-400 border border-slate-600 rounded-full">💤 Завис</span>}
            </div>
            <p className="text-slate-400 text-xs mt-0.5 truncate">{deal.product}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-slate-600 text-xs">{deal.status}</span>
              {deal.manager && <span className="text-slate-600 text-xs">👤 {deal.manager}</span>}
              {deal.daysInStatus > 0 && <span className="text-slate-600 text-xs">{deal.daysInStatus}д. в статусе</span>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-white font-bold text-sm">{deal.expectedRevenue > 0 ? `${(deal.expectedRevenue/1000).toFixed(0)}K ₽` : "—"}</div>
            <div className="text-slate-500 text-xs">ожид. выручка</div>
            <div className={`text-xs mt-1 ${RISK_COLORS[deal.risk]}`}>риск: {deal.risk}</div>
          </div>
        </div>
        <div className="mt-3">
          <WinBar prob={deal.winProbability} />
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-800 p-4 bg-slate-900/40">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div><p className="text-slate-500 text-xs mb-1">Стоимость сделки</p><p className="text-white font-semibold">{deal.estimatedValue > 0 ? `${deal.estimatedValue.toLocaleString("ru")} ₽` : "—"}</p></div>
            <div><p className="text-slate-500 text-xs mb-1">Ожид. маржа</p><p className="text-green-400 font-semibold">{deal.estimatedMargin > 0 ? `${deal.estimatedMargin.toLocaleString("ru")} ₽` : "—"}</p></div>
            <div><p className="text-slate-500 text-xs mb-1">Win probability</p><p className="text-white font-semibold">{deal.winProbability}%</p></div>
            <div><p className="text-slate-500 text-xs mb-1">Дата решения</p><p className="text-white font-semibold">{deal.decisionDate ?? "—"}</p></div>
          </div>

          <div className="bg-blue-900/20 border border-blue-700/40 rounded-xl p-3 mb-3">
            <p className="text-blue-300 text-xs font-medium mb-1">🤖 Следующий шаг AI</p>
            <p className="text-blue-200 text-sm">{deal.nextAction}</p>
          </div>

          {deal.reasons.length > 0 && (
            <div>
              <p className="text-slate-500 text-xs mb-2">Факторы оценки:</p>
              <div className="flex flex-wrap gap-1.5">
                {deal.reasons.map((r, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-full text-slate-300">{r}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DealIntelligenceClient() {
  const [result,  setResult]  = useState<DealIntelligenceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [view,    setView]    = useState<"top" | "all" | "urgent" | "stale">("top");

  useEffect(() => {
    fetch("/api/market-intelligence/deals").then(r => r.json()).then(d => {
      setResult(d); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const deals: DealScore[] = result
    ? (view === "top"    ? result.topDeals
      : view === "urgent" ? result.urgentDeals
      : view === "stale"  ? result.staleDeals
      : result.deals)
    : [];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/admin/market-intelligence" className="text-slate-500 text-sm hover:text-slate-300 flex items-center gap-1 mb-1">← Market Intelligence</Link>
        <h1 className="text-2xl font-bold text-white">💡 Deal Intelligence AI</h1>
        <p className="text-slate-500 text-sm mt-0.5">AI-скоринг сделок, вероятность закрытия, прогноз выручки</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-600">Анализируем сделки...</div>
      ) : !result ? (
        <div className="text-center py-20">
          <p className="text-slate-500">Нет данных. Добавьте лиды в CRM.</p>
          <Link href="/admin/leads" className="mt-4 inline-block text-blue-400 hover:text-blue-300 text-sm">Перейти в CRM →</Link>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Сделок в работе</p>
              <p className="text-2xl font-bold text-white">{result.deals.length}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Средний Score</p>
              <p className="text-2xl font-bold text-white">{result.avgScore}/100</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Пайплайн</p>
              <p className="text-2xl font-bold text-green-400">
                {result.totalPipeline > 0 ? `${(result.totalPipeline/1000000).toFixed(1)}M ₽` : "—"}
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Срочных</p>
              <p className={`text-2xl font-bold ${result.urgentDeals.length > 0 ? "text-amber-400" : "text-slate-400"}`}>
                {result.urgentDeals.length}
              </p>
            </div>
          </div>

          {/* Revenue forecast */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
            <h2 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">📅 Revenue Forecast</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "7 дней",  value: result.forecast.d7,  color: "text-blue-400" },
                { label: "30 дней", value: result.forecast.d30, color: "text-green-400" },
                { label: "90 дней", value: result.forecast.d90, color: "text-emerald-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center">
                  <p className="text-slate-500 text-xs mb-1">{label}</p>
                  <p className={`text-xl font-bold ${value > 0 ? color : "text-slate-600"}`}>
                    {value > 0 ? `${(value/1000).toFixed(0)}K ₽` : "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* View tabs */}
          <div className="flex gap-2 mb-5">
            {[
              { id: "top" as const,    label: `🏆 Топ ${result.topDeals.length}` },
              { id: "urgent" as const, label: `⚠️ Срочные ${result.urgentDeals.length}` },
              { id: "stale" as const,  label: `💤 Зависшие ${result.staleDeals.length}` },
              { id: "all" as const,    label: `📋 Все ${result.deals.length}` },
            ].map(v => (
              <button key={v.id} onClick={() => setView(v.id)}
                className={`px-3 py-1.5 rounded-lg text-sm transition border ${view === v.id ? "bg-blue-600 border-blue-600 text-white" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}>
                {v.label}
              </button>
            ))}
          </div>

          {/* Deal cards */}
          {deals.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              {view === "urgent" ? "Нет срочных сделок 🎉" : view === "stale" ? "Нет зависших сделок 🎉" : "Нет сделок в CRM"}
            </div>
          ) : (
            <div className="space-y-3">
              {deals.map(d => <DealCard key={d.leadId} deal={d} />)}
            </div>
          )}
        </>
      )}
    </main>
  );
}
