"use client";
import { useState, useCallback } from "react";
import type { StrategyDirectorReport, MarketPotential, CompetitorThreat, StrategyPriority } from "@/lib/ai-company/strategy/types";

interface Props { initialReport: StrategyDirectorReport | null }

const TABS = [
  { id: "overview",     label: "Overview",          icon: "📊" },
  { id: "markets",      label: "Market Research",   icon: "🌎" },
  { id: "competitors",  label: "Competitor AI",     icon: "🏢" },
  { id: "opportunities",label: "Opportunity AI",    icon: "🚀" },
  { id: "products",     label: "Product Innovation",icon: "💡" },
  { id: "growth",       label: "Growth Strategy",   icon: "📈" },
  { id: "trends",       label: "Trend Monitor",     icon: "⚠️" },
  { id: "director",     label: "Strategy Director", icon: "🤖" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const POTENTIAL_CFG: Record<MarketPotential, { label: string; cls: string }> = {
  VERY_HIGH: { label: "ОЧЕНЬ ВЫСОКИЙ", cls: "bg-emerald-900/40 text-emerald-300 border-emerald-700" },
  HIGH:      { label: "ВЫСОКИЙ",       cls: "bg-blue-900/40 text-blue-300 border-blue-700" },
  MEDIUM:    { label: "СРЕДНИЙ",       cls: "bg-amber-900/40 text-amber-300 border-amber-700" },
  LOW:       { label: "НИЗКИЙ",        cls: "bg-slate-800 text-slate-400 border-slate-600" },
};

const THREAT_CFG: Record<CompetitorThreat, { label: string; cls: string }> = {
  HIGH:   { label: "ВЫСОКАЯ",  cls: "bg-red-900/40 text-red-300 border-red-700" },
  MEDIUM: { label: "СРЕДНЯЯ",  cls: "bg-amber-900/40 text-amber-300 border-amber-700" },
  LOW:    { label: "НИЗКАЯ",   cls: "bg-emerald-900/40 text-emerald-300 border-emerald-700" },
};

const PRIORITY_CFG: Record<StrategyPriority, { label: string; cls: string }> = {
  HIGH:   { label: "HIGH",   cls: "bg-red-900/40 text-red-300 border-red-700" },
  MEDIUM: { label: "MEDIUM", cls: "bg-amber-900/40 text-amber-300 border-amber-700" },
  LOW:    { label: "LOW",    cls: "bg-slate-800 text-slate-400 border-slate-600" },
};

const IMPACT_CFG: Record<string, string> = {
  HIGH:   "text-red-300",
  MEDIUM: "text-amber-300",
  LOW:    "text-slate-400",
};

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = Math.round((score / max) * 100);
  const color = pct >= 70 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-300 w-8 text-right font-mono">{score}/{max}</span>
    </div>
  );
}

function Badge({ cls, children }: { cls: string; children: React.ReactNode }) {
  return <span className={`px-2 py-0.5 rounded border text-xs font-bold ${cls}`}>{children}</span>;
}

function OverviewTab({ r }: { r: StrategyDirectorReport }) {
  const h = r.health;
  const color = h.score >= 70 ? "bg-emerald-500" : h.score >= 45 ? "bg-amber-500" : "bg-red-500";
  const statusCls = h.status === "GOOD" ? "text-emerald-400" : h.status === "WARNING" ? "text-amber-400" : "text-red-400";
  const topOpps = [...r.opportunities].sort((a, b) => b.score - a.score).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Health */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Strategy Health Score</div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">{h.score}</span>
              <span className="text-slate-400 text-lg">/100</span>
              <span className={`text-sm font-bold ml-1 ${statusCls}`}>{h.status}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Market", val: h.marketScore },
              { label: "Innovation", val: h.innovationScore },
              { label: "Competitive", val: h.competitiveScore },
            ].map(({ label, val }) => (
              <div key={label} className="bg-slate-800 rounded-lg px-3 py-2">
                <div className="text-slate-100 font-bold text-lg">{val}</div>
                <div className="text-slate-400 text-xs">{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${h.score}%` }} />
          </div>
          <span className="text-xs text-slate-400">{h.opportunitiesCount} возможностей</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: "🎯", label: "Возможностей",     val: r.opportunities.length },
          { icon: "🏢", label: "Конкурентов",      val: r.competitors.length },
          { icon: "💡", label: "Идей продуктов",   val: r.productIdeas.length },
          { icon: "📈", label: "Действий роста",   val: r.growthActions.length },
          { icon: "🌎", label: "Рынков",            val: r.markets.length },
          { icon: "⚠️", label: "Трендов",           val: r.trends.length },
          { icon: "🏆", label: "Лучший рынок",      val: [...r.markets].sort((a, b) => b.score - a.score)[0]?.name ?? "—" },
          { icon: "🚀", label: "SaaS готовность",   val: `${r.ceoInsight.saasReadiness}%` },
        ].map(({ icon, label, val }) => (
          <div key={label} className="bg-slate-900 border border-slate-700 rounded-xl p-3 flex flex-col gap-1">
            <div className="text-base">{icon}</div>
            <div className="text-white font-bold text-lg">{val}</div>
            <div className="text-slate-400 text-xs">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Opportunities */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
          <div className="text-emerald-400 text-xs font-medium uppercase tracking-wider mb-3">🚀 Главные возможности</div>
          <div className="space-y-3">
            {topOpps.map(o => (
              <div key={o.id} className="flex items-start gap-2">
                <Badge cls={POTENTIAL_CFG[o.potential].cls}>{o.score}/10</Badge>
                <div>
                  <div className="text-slate-200 text-sm font-medium">{o.title}</div>
                  <div className="text-slate-500 text-xs">{o.timeToMarket} · {o.revenueEstimate}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risks & Strengths */}
        <div className="space-y-3">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
            <div className="text-red-400 text-xs font-medium uppercase tracking-wider mb-2">⚠️ Риски</div>
            {h.risks.map((r, i) => (
              <div key={i} className="text-slate-400 text-xs py-1 border-b border-slate-800 last:border-0 pl-2 border-l border-l-red-800">— {r}</div>
            ))}
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
            <div className="text-emerald-400 text-xs font-medium uppercase tracking-wider mb-2">💪 Сильные стороны</div>
            {h.strengths.map((s, i) => (
              <div key={i} className="text-slate-400 text-xs py-1 border-b border-slate-800 last:border-0 pl-2 border-l border-l-emerald-800">+ {s}</div>
            ))}
          </div>
        </div>
      </div>

      {/* CEO Insight */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-4">
        <div className="text-blue-400 text-xs font-medium uppercase tracking-wider mb-3">🤖 CEO Стратегическая разведка</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="text-emerald-400 text-xs mb-1">Главная возможность</div>
            <div className="text-slate-200 text-sm">{r.ceoInsight.topOpportunity}</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="text-red-400 text-xs mb-1">Главный риск</div>
            <div className="text-slate-200 text-sm">{r.ceoInsight.topRisk}</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="text-blue-400 text-xs mb-1">Главное решение</div>
            <div className="text-slate-200 text-sm">{r.ceoInsight.topDecision}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketsTab({ r }: { r: StrategyDirectorReport }) {
  const sorted = [...r.markets].sort((a, b) => b.score - a.score);
  const diffCls: Record<string, string> = {
    HIGH: "text-red-400", MEDIUM: "text-amber-400", LOW: "text-emerald-400",
  };
  const compCls: Record<string, string> = {
    HIGH: "text-red-400", MEDIUM: "text-amber-400", LOW: "text-emerald-400",
  };

  return (
    <div className="space-y-4">
      <div className="text-slate-400 text-sm">Анализ {sorted.length} целевых рынков по потенциалу и сложности входа</div>
      {sorted.map(m => (
        <div key={m.id} className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="text-white font-bold text-lg">{m.name}</div>
              <div className="text-slate-400 text-sm">Размер рынка: {m.size} · Рост +{m.growth}%/год</div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge cls={POTENTIAL_CFG[m.potential].cls}>{POTENTIAL_CFG[m.potential].label}</Badge>
              <span className="text-slate-400 text-sm font-mono">{m.score}/10</span>
            </div>
          </div>

          <ScoreBar score={m.score} />

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <div className="text-slate-500 text-xs uppercase mb-1">Конкуренция</div>
              <div className={`text-sm font-medium ${compCls[m.competition]}`}>{m.competition}</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs uppercase mb-1">Сложность входа</div>
              <div className={`text-sm font-medium ${diffCls[m.entryDifficulty]}`}>{m.entryDifficulty}</div>
            </div>
          </div>

          <div className="mt-3">
            <div className="text-slate-500 text-xs uppercase mb-1">Почему входить</div>
            <div className="flex flex-wrap gap-1">
              {m.whyEnter.map((w, i) => (
                <span key={i} className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full">+ {w}</span>
              ))}
            </div>
          </div>

          <div className="mt-3 bg-blue-900/20 border border-blue-800/40 rounded-lg p-3">
            <div className="text-blue-400 text-xs mb-1">Рекомендация Market Research AI</div>
            <div className="text-slate-200 text-sm">{m.recommendation}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CompetitorsTab({ r }: { r: StrategyDirectorReport }) {
  const catLabel: Record<string, string> = {
    cargo: "Карго", logistics: "Логистика", saas: "SaaS", marketplace: "Маркетплейс",
  };

  return (
    <div className="space-y-4">
      <div className="text-slate-400 text-sm">Анализ {r.competitors.length} ключевых конкурентов</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {r.competitors.map(c => (
          <div key={c.id} className="bg-slate-900 border border-slate-700 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-white font-bold">{c.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded">{catLabel[c.category]}</span>
                  {c.marketShare && <span className="text-slate-500 text-xs">доля {c.marketShare}</span>}
                </div>
              </div>
              <Badge cls={THREAT_CFG[c.threat].cls}>Угроза: {THREAT_CFG[c.threat].label}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-slate-500 text-xs uppercase mb-1">Сильные стороны</div>
                {c.strengths.map((s, i) => (
                  <div key={i} className="text-slate-300 text-xs py-0.5">+ {s}</div>
                ))}
              </div>
              <div>
                <div className="text-slate-500 text-xs uppercase mb-1">Слабые стороны</div>
                {c.weaknesses.map((w, i) => (
                  <div key={i} className="text-red-400/80 text-xs py-0.5">— {w}</div>
                ))}
              </div>
            </div>

            <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-lg p-3">
              <div className="text-emerald-400 text-xs mb-1">Возможность для ChinaBridge</div>
              <div className="text-slate-200 text-sm">{c.opportunity}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OpportunitiesTab({ r }: { r: StrategyDirectorReport }) {
  const sorted = [...r.opportunities].sort((a, b) => b.score - a.score);
  const catLabel: Record<string, string> = {
    market: "Рынок", product: "Продукт", partnership: "Партнёрство", technology: "Технология",
  };
  const effortCls: Record<string, string> = {
    HIGH: "text-red-400", MEDIUM: "text-amber-400", LOW: "text-emerald-400",
  };

  return (
    <div className="space-y-4">
      <div className="text-slate-400 text-sm">
        {sorted.length} возможностей отсортированы по потенциалу — от высшего к низшему
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map((o, idx) => (
          <div key={o.id} className="bg-slate-900 border border-slate-700 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-xs font-mono w-5">#{idx + 1}</span>
                <div>
                  <div className="text-white font-semibold">{o.title}</div>
                  <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded mt-1 inline-block">
                    {catLabel[o.category]}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <Badge cls={POTENTIAL_CFG[o.potential].cls}>{o.score}/10</Badge>
                <Badge cls={POTENTIAL_CFG[o.potential].cls}>{POTENTIAL_CFG[o.potential].label}</Badge>
              </div>
            </div>

            <ScoreBar score={o.score} />

            <div className="text-slate-400 text-sm">{o.why}</div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-slate-800 rounded p-2">
                <div className="text-slate-500 mb-0.5">Срок</div>
                <div className="text-slate-200 font-medium">{o.timeToMarket}</div>
              </div>
              <div className="bg-slate-800 rounded p-2">
                <div className="text-slate-500 mb-0.5">Выручка</div>
                <div className="text-slate-200 font-medium">{o.revenueEstimate}</div>
              </div>
              <div className="bg-slate-800 rounded p-2">
                <div className="text-slate-500 mb-0.5">Усилие</div>
                <div className={`font-medium ${effortCls[o.effort]}`}>{o.effort}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductsTab({ r }: { r: StrategyDirectorReport }) {
  const srcLabel: Record<string, string> = {
    clients: "Клиенты", market: "Рынок", competitors: "Конкуренты", team: "Команда",
  };
  const effortCls: Record<string, string> = {
    HIGH: "text-red-400", MEDIUM: "text-amber-400", LOW: "text-emerald-400",
  };

  return (
    <div className="space-y-4">
      <div className="text-slate-400 text-sm">{r.productIdeas.length} идей продуктов и функций</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {r.productIdeas.map(p => (
          <div key={p.id} className="bg-slate-900 border border-slate-700 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="text-white font-semibold">{p.title}</div>
              <Badge cls={PRIORITY_CFG[p.priority].cls}>{p.priority}</Badge>
            </div>

            <div className="text-slate-400 text-sm">{p.description}</div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800 rounded p-2">
                <div className="text-slate-500 mb-0.5">Источник</div>
                <div className="text-slate-300">{srcLabel[p.source]}</div>
              </div>
              <div className="bg-slate-800 rounded p-2">
                <div className="text-slate-500 mb-0.5">Усилие</div>
                <div className={`font-medium ${effortCls[p.effort]}`}>{p.effort}</div>
              </div>
            </div>

            <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-lg p-3">
              <div className="text-emerald-400 text-xs mb-0.5">Эффект</div>
              <div className="text-slate-200 text-sm">{p.impact}</div>
            </div>

            {p.revenueModel && (
              <div className="text-blue-400 text-xs">💰 {p.revenueModel}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function GrowthTab({ r }: { r: StrategyDirectorReport }) {
  const groups: Record<string, typeof r.growthActions> = { "30d": [], "60d": [], "90d": [] };
  r.growthActions.forEach(a => groups[a.timeframe].push(a));

  const tfLabel: Record<string, string> = {
    "30d": "🔥 Первые 30 дней",
    "60d": "📅 30–60 дней",
    "90d": "🎯 60–90 дней",
  };

  return (
    <div className="space-y-6">
      <div className="text-slate-400 text-sm">Growth Strategy AI · план на 90 дней</div>
      {(["30d", "60d", "90d"] as const).map(tf => (
        <div key={tf}>
          <div className="text-slate-300 font-semibold text-sm mb-3">{tfLabel[tf]}</div>
          <div className="space-y-3">
            {groups[tf].map((a, i) => (
              <div key={a.id} className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex gap-4">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-sm font-bold">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="text-white font-semibold text-sm">{a.title}</div>
                    <Badge cls={PRIORITY_CFG[a.priority].cls}>{a.priority}</Badge>
                  </div>
                  <div className="text-slate-400 text-sm mb-2">{a.description}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-800 rounded p-2">
                      <div className="text-slate-500 mb-0.5">Ответственный</div>
                      <div className="text-slate-300">{a.owner}</div>
                    </div>
                    <div className="bg-slate-800 rounded p-2">
                      <div className="text-slate-500 mb-0.5">KPI</div>
                      <div className="text-slate-300">{a.kpi}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TrendsTab({ r }: { r: StrategyDirectorReport }) {
  const catLabel: Record<string, string> = {
    ai: "AI", logistics: "Логистика", marketplace: "Маркетплейсы",
    trade: "Торговля", legal: "Законы",
  };
  const catCls: Record<string, string> = {
    ai: "bg-purple-900/40 text-purple-300 border-purple-700",
    logistics: "bg-blue-900/40 text-blue-300 border-blue-700",
    marketplace: "bg-emerald-900/40 text-emerald-300 border-emerald-700",
    trade: "bg-amber-900/40 text-amber-300 border-amber-700",
    legal: "bg-red-900/40 text-red-300 border-red-700",
  };

  return (
    <div className="space-y-4">
      <div className="text-slate-400 text-sm">Trend Monitor AI следит за {r.trends.length} трендами</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {r.trends.map(t => (
          <div key={t.id} className="bg-slate-900 border border-slate-700 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-white font-semibold">{t.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge cls={catCls[t.category]}>{catLabel[t.category]}</Badge>
                  <span className={`text-xs font-medium ${IMPACT_CFG[t.impact]}`}>Impact: {t.impact}</span>
                </div>
              </div>
              <Badge cls={PRIORITY_CFG[t.priority].cls}>{t.priority}</Badge>
            </div>

            <div className="text-slate-400 text-sm">{t.description}</div>

            <div className="bg-blue-900/20 border border-blue-800/40 rounded-lg p-3">
              <div className="text-blue-400 text-xs mb-1">Возможность</div>
              <div className="text-slate-200 text-sm">{t.opportunity}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DirectorTab({ r, onGenerate, loading }: { r: StrategyDirectorReport; onGenerate: () => void; loading: boolean }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Strategy Director AI · ChinaBridge</div>
            <div className="text-xl font-bold text-white">Стратегический отчёт CEO</div>
          </div>
          <button
            onClick={onGenerate}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white rounded-lg text-xs font-medium transition-colors"
          >
            {loading ? <><span className="animate-spin">⟳</span> Анализ...</> : "🔄 Обновить"}
          </button>
        </div>
        <div className="text-slate-300 text-sm leading-relaxed">{r.summary}</div>
      </div>

      {/* CEO Strategic Intelligence */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/20 border border-blue-700/50 rounded-xl p-5">
        <div className="text-blue-400 text-xs font-medium uppercase tracking-wider mb-4">🤖 CEO Strategic Intelligence</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-slate-900/60 rounded-lg p-4">
            <div className="text-emerald-400 text-xs mb-2">🎯 Главная возможность месяца</div>
            <div className="text-white text-sm font-medium">{r.ceoInsight.topOpportunity}</div>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-4">
            <div className="text-red-400 text-xs mb-2">⚠️ Главный риск</div>
            <div className="text-white text-sm font-medium">{r.ceoInsight.topRisk}</div>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-4">
            <div className="text-blue-400 text-xs mb-2">💡 Главное решение</div>
            <div className="text-white text-sm font-medium">{r.ceoInsight.topDecision}</div>
          </div>
        </div>
        <div>
          <div className="text-slate-400 text-xs mb-2">SaaS Readiness — {r.ceoInsight.saasReadiness}%</div>
          <div className="h-3 bg-slate-700/60 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
              style={{ width: `${r.ceoInsight.saasReadiness}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {r.recommendations.length > 0 && (
        <div>
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-3">Стратегические рекомендации</div>
          <div className="space-y-3">
            {r.recommendations.map((rec, i) => (
              <div key={rec.id ?? i} className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex gap-4">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-sm font-bold">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <div className="text-white font-semibold text-sm">{rec.title}</div>
                    <Badge cls={PRIORITY_CFG[rec.priority]?.cls ?? "bg-slate-800 text-slate-400 border-slate-600"}>
                      {rec.priority}
                    </Badge>
                    <span className="text-slate-500 text-xs">· {rec.timeline}</span>
                  </div>
                  <div className="text-slate-400 text-sm mb-2">{rec.description}</div>
                  <div className="bg-emerald-900/20 border border-emerald-800/40 rounded px-3 py-2">
                    <div className="text-emerald-400 text-xs mb-0.5">Эффект</div>
                    <div className="text-slate-200 text-sm">{rec.impact}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Growth actions summary */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <div className="text-slate-400 text-xs uppercase tracking-wider mb-3">Следующие 90 дней — топ действия</div>
        <div className="space-y-2">
          {r.growthActions.filter(a => a.priority === "HIGH").slice(0, 4).map((a, i) => (
            <div key={a.id} className="flex items-start gap-3 text-sm">
              <span className="text-slate-500 font-mono w-4">{i + 1}.</span>
              <div>
                <span className="text-slate-200 font-medium">{a.title}</span>
                <span className="text-slate-500 text-xs ml-2">({a.timeframe})</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-slate-600 text-xs text-right">
        Сгенерировано: {new Date(r.generatedAt).toLocaleString("ru-RU")}
      </div>
    </div>
  );
}

export default function StrategyDashboard({ initialReport }: Props) {
  const [tab,     setTab]     = useState<TabId>("overview");
  const [report,  setReport]  = useState<StrategyDirectorReport | null>(initialReport);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-company/strategy/report");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Ошибка");
      setReport(data.report);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <a href="/admin/ai-company" className="hover:text-slate-200 transition-colors">AI Company OS</a>
            <span>›</span>
            <span className="text-slate-200">Strategy & Innovation</span>
          </div>
          <h1 className="text-2xl font-bold text-white">🔭 Strategy & Innovation Department</h1>
          <p className="text-slate-400 text-sm mt-1">Мозг развития компании · Market Research · Growth · Trends</p>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:text-blue-400 text-white rounded-lg text-sm font-medium transition-colors flex-shrink-0"
        >
          {loading ? <><span className="animate-spin">⟳</span> Анализ...</> : <>🤖 Обновить отчёт</>}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm">
          Ошибка: {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap border-b border-slate-800 pb-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-t-lg transition-colors ${
              tab === t.id
                ? "bg-slate-800 text-white border-b-2 border-blue-500"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {!report && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4">🔭</div>
          <div className="text-slate-300 text-lg font-medium mb-2">Strategy AI готов к анализу</div>
          <div className="text-slate-500 text-sm mb-6 max-w-sm">
            Нажмите «Обновить отчёт» — Strategy Director AI проведёт анализ рынков, конкурентов и возможностей
          </div>
          <button onClick={generate} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors">
            🚀 Запустить анализ
          </button>
        </div>
      )}

      {loading && !report && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-4xl animate-spin mb-4">⟳</div>
          <div className="text-slate-400 text-sm">Strategy Director AI анализирует рынки...</div>
        </div>
      )}

      {report && (
        <div>
          {tab === "overview"      && <OverviewTab      r={report} />}
          {tab === "markets"       && <MarketsTab        r={report} />}
          {tab === "competitors"   && <CompetitorsTab    r={report} />}
          {tab === "opportunities" && <OpportunitiesTab  r={report} />}
          {tab === "products"      && <ProductsTab       r={report} />}
          {tab === "growth"        && <GrowthTab         r={report} />}
          {tab === "trends"        && <TrendsTab         r={report} />}
          {tab === "director"      && <DirectorTab r={report} onGenerate={generate} loading={loading} />}
        </div>
      )}
    </div>
  );
}
