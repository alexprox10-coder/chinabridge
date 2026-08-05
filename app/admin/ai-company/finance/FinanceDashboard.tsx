"use client";

import { useState, useCallback } from "react";
import type {
  FinanceDirectorReport, RevenueByChannel, CostItem, ProfitByProduct,
  ForecastScenario, FinanceRecommendation, UnitEcoRating,
} from "@/lib/ai-company/finance/types";

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) { return n.toLocaleString("ru-RU"); }
function fmtM(n: number) { return n >= 1000000 ? `${(n / 1000000).toFixed(2)} млн` : `${(n / 1000).toFixed(0)}К`; }

function statusColor(s: string) {
  return s === "GOOD" ? "text-emerald-400" : s === "WARNING" ? "text-amber-400" : "text-red-400";
}
function statusBg(s: string) {
  return s === "GOOD"
    ? "bg-emerald-500/10 border-emerald-500/30"
    : s === "WARNING"
    ? "bg-amber-500/10 border-amber-500/30"
    : "bg-red-500/10 border-red-500/30";
}
function statusLabel(s: string) {
  return s === "GOOD" ? "ХОРОШО" : s === "WARNING" ? "ВНИМАНИЕ" : "КРИТИЧНО";
}

function ratingColor(r: UnitEcoRating) {
  return r === "EXCELLENT" ? "text-violet-400" : r === "GOOD" ? "text-emerald-400" : r === "WARNING" ? "text-amber-400" : "text-red-400";
}
function priorityBadge(p: string) {
  const b = "text-xs px-2 py-0.5 rounded-full font-medium";
  return p === "HIGH" ? `${b} bg-red-500/20 text-red-400` : p === "MEDIUM" ? `${b} bg-amber-500/20 text-amber-400` : `${b} bg-slate-500/20 text-slate-400`;
}

function KpiCard({ icon, label, value, sub, highlight }: { icon: string; label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`bg-slate-900 border rounded-xl p-4 text-center ${highlight ? "border-violet-500/40" : "border-slate-700"}`}>
      <p className="text-lg mb-1">{icon}</p>
      <p className={`text-xl font-bold ${highlight ? "text-violet-400" : "text-white"}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Tab 1: Overview ────────────────────────────────────────────────────────

function OverviewTab({ report }: { report: FinanceDirectorReport }) {
  const { health, revenue, profit, unitEconomics } = report;
  return (
    <div className="space-y-5">
      {/* Health */}
      <div className={`rounded-xl border p-5 ${statusBg(health.status)}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-slate-400 mb-1">Finance Health Score</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">{health.score}</span>
              <span className="text-slate-400">/100</span>
              <span className={`text-sm font-semibold ml-1 ${statusColor(health.status)}`}>{statusLabel(health.status)}</span>
            </div>
          </div>
          {!revenue.connected && (
            <span className="text-xs bg-amber-900/40 border border-amber-700 text-amber-300 px-2 py-1 rounded-lg">
              Smart-mock данные
            </span>
          )}
        </div>
        <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full rounded-full ${health.score >= 80 ? "bg-emerald-500" : health.score >= 55 ? "bg-amber-500" : "bg-red-500"}`}
            style={{ width: `${health.score}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {health.positives.map((p, i) => <p key={i} className="text-xs text-emerald-300 flex gap-1.5"><span>✓</span>{p}</p>)}
          {health.problems.map((p, i) => <p key={i} className="text-xs text-red-300 flex gap-1.5"><span>✗</span>{p}</p>)}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard icon="💰" label="Выручка / мес"  value={`${fmtM(revenue.total)}₽`}   />
        <KpiCard icon="💸" label="Расходы / мес"  value={`${fmtM(profit.costs)}₽`}    />
        <KpiCard icon="📈" label="Прибыль / мес"  value={`${fmtM(profit.profit)}₽`}   highlight />
        <KpiCard icon="%" label="Маржа"           value={`${profit.margin}%`}          />
        <KpiCard icon="📅" label="MRR"             value={`${fmtM(revenue.mrr)}₽`}    highlight />
        <KpiCard icon="📆" label="ARR"             value={`${fmtM(revenue.arr)}₽`}    />
        <KpiCard icon="🔄" label="ROI"             value={`${profit.roi}%`}            />
        <KpiCard icon="💹" label="Рост выручки"   value={`+${revenue.growth}%`}       />
      </div>

      {/* Revenue by channel */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Выручка по каналам</h3>
        <div className="space-y-2">
          {revenue.byChannel.map((c: RevenueByChannel) => {
            const pct = Math.round((c.revenue / revenue.total) * 100);
            return (
              <div key={c.channel}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">{c.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">{c.deals} сделок</span>
                    <span className="text-emerald-400 font-medium">{c.margin}% маржа</span>
                    <span className="text-white font-semibold">{fmt(c.revenue)}₽</span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick unit-eco */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-white">{fmt(unitEconomics.cac)}₽</p>
          <p className="text-xs text-slate-400 mt-1">CAC</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-white">{fmt(unitEconomics.ltv)}₽</p>
          <p className="text-xs text-slate-400 mt-1">LTV</p>
        </div>
        <div className={`rounded-xl p-4 text-center border ${statusBg(unitEconomics.ltvToCac >= 5 ? "GOOD" : "WARNING")}`}>
          <p className={`text-xl font-bold ${ratingColor(unitEconomics.rating)}`}>{unitEconomics.ltvToCac}x</p>
          <p className="text-xs text-slate-400 mt-1">LTV/CAC</p>
        </div>
      </div>
    </div>
  );
}

// ── Tab 2: Revenue AI ──────────────────────────────────────────────────────

function RevenueTab({ report }: { report: FinanceDirectorReport }) {
  const { revenue } = report;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Сделок за месяц",  value: revenue.deals,                    suffix: "" },
          { label: "Средний чек",      value: `${fmt(revenue.avgDeal)}₽`,       suffix: "" },
          { label: "Рост выручки",     value: `+${revenue.growth}%`,            suffix: "" },
          { label: "Повторные продажи", value: `${fmtM(revenue.repeatRevenue)}₽`, suffix: "" },
        ].map(m => (
          <div key={m.label} className="bg-slate-900 border border-slate-700 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{m.value}</p>
            <p className="text-xs text-slate-400 mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-4">Детализация по каналам</h3>
        <div className="space-y-3">
          {revenue.byChannel.map((c: RevenueByChannel) => (
            <div key={c.channel} className="border-b border-slate-800 pb-3 last:border-0 last:pb-0">
              <div className="flex justify-between items-start mb-1.5">
                <div>
                  <p className="text-sm font-medium text-white">{c.label}</p>
                  <p className="text-xs text-slate-500">{c.deals} сделок · ср. чек {fmt(c.avgDeal)}₽</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{fmt(c.revenue)}₽</p>
                  <p className="text-xs text-emerald-400">+{c.growth}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-lg font-bold text-white">{fmtM(revenue.newRevenue)}₽</p>
          <p className="text-xs text-slate-400 mt-1">Новые клиенты</p>
        </div>
        <div className="bg-slate-900 border border-violet-500/30 rounded-xl p-4 text-center">
          <p className="text-lg font-bold text-violet-400">{fmtM(revenue.repeatRevenue)}₽</p>
          <p className="text-xs text-slate-400 mt-1">Повторные продажи</p>
        </div>
      </div>
    </div>
  );
}

// ── Tab 3: Cost AI ─────────────────────────────────────────────────────────

function CostTab({ report }: { report: FinanceDirectorReport }) {
  const { costs } = report;
  const maxAmt = Math.max(...costs.byCategory.map(c => c.amount));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-red-400">{fmtM(costs.total)}₽</p>
          <p className="text-xs text-slate-400 mt-1">Всего расходов</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-white">{fmtM(costs.fixedCosts)}₽</p>
          <p className="text-xs text-slate-400 mt-1">Постоянные</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-white">{fmtM(costs.variableCosts)}₽</p>
          <p className="text-xs text-slate-400 mt-1">Переменные</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-4">Расходы по категориям</h3>
        <div className="space-y-3">
          {costs.byCategory.map((c: CostItem) => {
            const pct = Math.round((c.amount / maxAmt) * 100);
            const overBudget = c.overspend;
            return (
              <div key={c.category}>
                <div className="flex justify-between text-xs mb-1">
                  <span className={`text-slate-300 ${overBudget ? "text-red-300" : ""}`}>
                    {c.label}{overBudget ? " ⚠" : ""}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">бюджет {fmt(c.budget)}₽</span>
                    <span className={`font-semibold ${overBudget ? "text-red-400" : "text-white"}`}>
                      {fmt(c.amount)}₽
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${overBudget ? "bg-red-500" : "bg-slate-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {costs.byCategory.some(c => c.overspend) && (
        <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-3">
          <p className="text-sm text-red-400 font-medium mb-1">Перерасход бюджета</p>
          {costs.byCategory.filter(c => c.overspend).map(c => (
            <p key={c.category} className="text-xs text-slate-300">
              {c.label}: {fmt(c.amount)}₽ vs план {fmt(c.budget)}₽ (+{fmt(c.amount - c.budget)}₽)
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab 4: Profit AI ───────────────────────────────────────────────────────

function ProfitTab({ report }: { report: FinanceDirectorReport }) {
  const { profit } = report;
  return (
    <div className="space-y-5">
      {/* P&L summary */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">P&L Summary</h3>
        <div className="space-y-2">
          {[
            { label: "Выручка",       value: profit.revenue,    color: "text-white",        sign: "" },
            { label: "- Расходы",     value: -profit.costs,     color: "text-red-400",      sign: "-" },
            { label: "= Валовая прибыль", value: profit.grossProfit, color: "text-emerald-400", sign: "", border: true },
            { label: "- Налоги (~13%)", value: -(profit.grossProfit - profit.netProfit), color: "text-slate-400", sign: "-" },
            { label: "= Чистая прибыль", value: profit.netProfit, color: "text-violet-400",  sign: "", bold: true },
          ].map(r => (
            <div key={r.label} className={`flex justify-between py-2 ${r.border ? "border-t border-slate-700 mt-2 pt-3" : ""}`}>
              <span className={`text-sm ${r.bold ? "font-semibold" : ""} text-slate-300`}>{r.label}</span>
              <span className={`text-sm font-semibold ${r.color}`}>{fmt(Math.abs(r.value))}₽</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-slate-700 flex justify-between">
          <span className="text-sm text-slate-400">Маржинальность</span>
          <span className="text-sm font-bold text-violet-400">{profit.margin}%</span>
        </div>
      </div>

      {/* By product */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Прибыль по направлениям</h3>
        <div className="space-y-2">
          {profit.byProduct.map((p: ProfitByProduct) => (
            <div key={p.product} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
              <span className="text-sm text-slate-300">{p.product}</span>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-500">{p.margin}% маржа</span>
                <span className="text-sm font-semibold text-emerald-400">{fmt(p.profit)}₽</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Best channel */}
      <div className="bg-violet-950/30 border border-violet-500/30 rounded-xl p-4">
        <p className="text-xs text-violet-400 mb-1">Лучший канал по марже</p>
        <p className="text-lg font-bold text-white">{profit.bestChannel}</p>
        <div className="flex gap-6 mt-2">
          <div>
            <p className="text-xs text-slate-500">CAC</p>
            <p className="text-sm text-white font-medium">{fmt(profit.bestChannelCAC)}₽</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">LTV</p>
            <p className="text-sm text-white font-medium">{fmt(profit.bestChannelLTV)}₽</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">LTV/CAC</p>
            <p className="text-sm text-violet-400 font-bold">
              {(profit.bestChannelLTV / profit.bestChannelCAC).toFixed(0)}x
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab 5: Forecast AI ─────────────────────────────────────────────────────

function ForecastTab({ report }: { report: FinanceDirectorReport }) {
  const { forecast } = report;
  const scenarios: ForecastScenario[] = [forecast.optimistic, forecast.base, forecast.pessimistic];
  const colors = ["bg-emerald-500/10 border-emerald-500/30", "bg-blue-500/10 border-blue-500/30", "bg-slate-800 border-slate-700"];
  const textColors = ["text-emerald-400", "text-blue-400", "text-slate-400"];

  return (
    <div className="space-y-5">
      {/* Current MRR */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center">
        <p className="text-xs text-slate-400 mb-1">Текущий MRR</p>
        <p className="text-3xl font-bold text-white">{fmtM(forecast.currentMRR)}₽</p>
      </div>

      {/* Scenarios */}
      <div className="space-y-3">
        {scenarios.map((s, i) => (
          <div key={s.label} className={`rounded-xl border p-4 ${colors[i]}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className={`text-sm font-semibold ${textColors[i]}`}>{s.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.description}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">MRR через 3 мес.</p>
                <p className={`text-lg font-bold ${textColors[i]}`}>{fmtM(s.mrr3m)}₽</p>
              </div>
            </div>
            <div className="flex gap-4 text-xs text-slate-400">
              <span>ARR: {fmtM(s.arr)}₽</span>
              <span>Рост: +{s.growthRate}%/мес</span>
            </div>
            {i === 0 && (
              <div className="mt-3 pt-2 border-t border-white/10">
                <p className="text-xs text-slate-500 mb-1">Условия:</p>
                {s.conditions.map((c, j) => (
                  <p key={j} className="text-xs text-slate-300">· {c}</p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Timeline */}
      {forecast.timeline.length > 0 && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Прогноз MRR (базовый)</h3>
          <div className="flex items-end gap-3">
            {forecast.timeline.map(p => {
              const maxMRR = Math.max(...forecast.timeline.map(t => t.mrr));
              const h = Math.round((p.mrr / maxMRR) * 80) + 20;
              return (
                <div key={p.month} className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-xs text-slate-300">{fmtM(p.mrr)}</p>
                  <div className="w-full bg-violet-600 rounded-t" style={{ height: `${h}px` }} />
                  <p className="text-xs text-slate-500">{p.month}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3">
        <p className="text-xs text-amber-400 font-medium mb-1">Ключевой драйвер роста</p>
        <p className="text-sm text-amber-300">{forecast.keyDriver}</p>
      </div>
    </div>
  );
}

// ── Tab 6: Unit Economics AI ───────────────────────────────────────────────

function UnitEcoTab({ report }: { report: FinanceDirectorReport }) {
  const { unitEconomics } = report;
  return (
    <div className="space-y-5">
      {/* Rating */}
      <div className={`rounded-xl border p-5 text-center ${unitEconomics.rating === "EXCELLENT" ? "bg-violet-900/20 border-violet-500/30" : "bg-slate-900 border-slate-700"}`}>
        <p className={`text-4xl font-bold mb-1 ${ratingColor(unitEconomics.rating)}`}>
          {unitEconomics.rating}
        </p>
        <p className="text-sm text-slate-300">{unitEconomics.ratingReason}</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "CAC",            value: `${fmt(unitEconomics.cac)}₽`,       sub: "стоимость привлечения" },
          { label: "LTV",            value: `${fmt(unitEconomics.ltv)}₽`,       sub: "ценность клиента" },
          { label: "LTV/CAC",        value: `${unitEconomics.ltvToCac}x`,       sub: "норма > 3x" },
          { label: "ARPU",           value: `${fmt(unitEconomics.arpu)}₽`,      sub: "ср. доход на клиента" },
          { label: "Окупаемость",    value: `${unitEconomics.paybackDays} дн.`, sub: "окупаемость CAC" },
          { label: "Отток",          value: `${unitEconomics.churn}%`,          sub: "отток клиентов" },
        ].map(m => (
          <div key={m.label} className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center">
            <p className="text-xl font-bold text-white">{m.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{m.label}</p>
            <p className="text-xs text-slate-600">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* CAC by channel */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">CAC по каналам</h3>
        <div className="space-y-2">
          {unitEconomics.byChannel.map(c => (
            <div key={c.channel} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
              <span className="text-sm text-slate-300">{c.channel}</span>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-500">CAC {fmt(c.cac)}₽</span>
                <span className={`text-sm font-bold ${c.ratio >= 10 ? "text-violet-400" : c.ratio >= 5 ? "text-emerald-400" : "text-amber-400"}`}>
                  {c.ratio}x
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab 7: SaaS Metrics ─────────────────────────────────────────────────────

function SaasTab({ report }: { report: FinanceDirectorReport }) {
  const { saas } = report;
  return (
    <div className="space-y-5">
      <div className="bg-violet-950/30 border border-violet-500/30 rounded-xl p-4">
        <p className="text-xs text-violet-400 mb-2">SaaS Module — пилот запущен</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-bold text-white">{saas.paidCustomers}</p>
            <p className="text-xs text-slate-400">Платных клиентов</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-violet-400">{fmtM(saas.mrr)}₽</p>
            <p className="text-xs text-slate-400">SaaS MRR</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Компаний всего",   value: saas.activeCompanies },
          { label: "Пробных",          value: saas.trials },
          { label: "Платных",          value: saas.paidCustomers },
          { label: "MRR",              value: `${fmtM(saas.mrr)}₽` },
          { label: "ARR",              value: `${fmtM(saas.arr)}₽` },
          { label: "Отток",            value: `${saas.churn}%` },
          { label: "NPS",              value: saas.nps },
          { label: "Расширение",       value: `${fmtM(saas.expansionRevenue)}₽` },
        ].map(m => (
          <div key={m.label} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-white">{m.value}</p>
            <p className="text-xs text-slate-500">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <p className="text-sm font-semibold text-white mb-3">Цель SaaS: 10 платных клиентов</p>
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-violet-500 rounded-full" style={{ width: `${saas.paidCustomers * 10}%` }} />
        </div>
        <p className="text-xs text-slate-500">{saas.paidCustomers}/10 клиентов · Потенциальный MRR: {fmtM(saas.mrr * 10)}₽</p>
      </div>
    </div>
  );
}

// ── Tab 8 (Director) ───────────────────────────────────────────────────────

function DirectorTab({
  report, onGenerate, generating,
}: {
  report: FinanceDirectorReport;
  onGenerate: () => void;
  generating: boolean;
}) {
  const { ceoSummary } = report;
  return (
    <div className="space-y-5">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">💼</span>
            <p className="text-sm font-semibold text-white">Finance Director AI</p>
          </div>
          <button
            onClick={onGenerate}
            disabled={generating}
            className="text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50"
          >
            {generating ? "Генерация..." : "Обновить отчёт"}
          </button>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{report.summary}</p>
      </div>

      {/* CEO Summary block */}
      <div className="bg-violet-950/30 border border-violet-500/30 rounded-xl p-4">
        <p className="text-xs text-violet-400 mb-3">📊 CEO Daily Financial Brief</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div><p className="text-xs text-slate-500">Выручка</p><p className="text-white font-semibold">{fmtM(ceoSummary.revenue)}₽</p></div>
          <div><p className="text-xs text-slate-500">Прибыль</p><p className="text-emerald-400 font-semibold">{fmtM(ceoSummary.profit)}₽</p></div>
          <div><p className="text-xs text-slate-500">Маржа</p><p className="text-white font-semibold">{ceoSummary.margin}%</p></div>
          <div><p className="text-xs text-slate-500">MRR</p><p className="text-violet-400 font-semibold">{fmtM(ceoSummary.mrr)}₽</p></div>
        </div>
        <div className="bg-slate-900/60 rounded-lg p-3">
          <p className="text-xs text-amber-400 mb-1">Главное решение CEO</p>
          <p className="text-sm text-amber-300">{ceoSummary.topDecision}</p>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <p className="text-sm font-semibold text-white mb-3">Рекомендации</p>
        <div className="space-y-3">
          {report.recommendations.map((r: FinanceRecommendation, i) => (
            <div key={r.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white">{i + 1}. {r.problem}</p>
                <span className={priorityBadge(r.priority)}>{r.priority}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-800 rounded-lg p-2.5">
                  <p className="text-xs text-slate-500 mb-1">Решение</p>
                  <p className="text-xs text-slate-300">{r.solution}</p>
                </div>
                <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-lg p-2.5">
                  <p className="text-xs text-emerald-500 mb-1">Эффект</p>
                  <p className="text-xs text-emerald-300">{r.impact}</p>
                </div>
              </div>
              <p className="text-xs text-slate-600">Срок: {r.deadline}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-600 text-center">
        Обновлено: {new Date(report.generatedAt).toLocaleString("ru-RU")}
      </p>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",  label: "Обзор",           icon: "📊" },
  { id: "revenue",   label: "Выручка",          icon: "💰" },
  { id: "costs",     label: "Расходы",          icon: "💸" },
  { id: "profit",    label: "Прибыль",          icon: "📈" },
  { id: "forecast",  label: "Прогноз",          icon: "🔮" },
  { id: "uniteco",   label: "Юнит-экономика",   icon: "📐" },
  { id: "saas",      label: "SaaS",             icon: "🚀" },
  { id: "director",  label: "AI Директор",      icon: "🤖" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function FinanceDashboard({
  initialReport,
}: {
  initialReport: FinanceDirectorReport | null;
}) {
  const [tab, setTab]       = useState<TabId>("overview");
  const [report, setReport] = useState<FinanceDirectorReport | null>(initialReport);
  const [generating, setGenerating] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const generate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      const res  = await fetch("/api/ai-company/finance/report");
      const json = await res.json();
      if (json.ok) setReport(json.report);
      else setError(json.error ?? "Ошибка генерации");
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setGenerating(false);
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <a href="/admin/ai-company" className="hover:text-white transition-colors">🤖 AI OS</a>
        <span>›</span>
        <span className="text-white">💼 Финансы</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Finance Department AI</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Revenue · Costs · Profit · Forecast · Unit Economics · SaaS
          </p>
        </div>
        {report && (
          <div className={`px-3 py-1.5 rounded-lg border text-sm font-semibold ${statusBg(report.health.status)} ${statusColor(report.health.status)}`}>
            {report.health.score}/100
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-violet-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">{error}</div>
      )}

      {!report && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <span className="text-5xl">💼</span>
          <p className="text-white font-semibold">Finance Module</p>
          <button onClick={generate} className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm">
            Загрузить данные
          </button>
        </div>
      )}

      {report && (
        <>
          {tab === "overview"  && <OverviewTab   report={report} />}
          {tab === "revenue"   && <RevenueTab    report={report} />}
          {tab === "costs"     && <CostTab       report={report} />}
          {tab === "profit"    && <ProfitTab     report={report} />}
          {tab === "forecast"  && <ForecastTab   report={report} />}
          {tab === "uniteco"   && <UnitEcoTab    report={report} />}
          {tab === "saas"      && <SaasTab       report={report} />}
          {tab === "director"  && (
            <DirectorTab report={report} onGenerate={generate} generating={generating} />
          )}
        </>
      )}
    </div>
  );
}
