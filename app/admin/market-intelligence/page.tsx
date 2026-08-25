import Link from "next/link";
import { cookies } from "next/headers";
import { AdminNav } from "@/components/admin/AdminNav";
import { getMILeadStats, getLatestReport } from "@/lib/market-intelligence/db";
import { getLeads } from "@/lib/crm/client";
import { analyzeDealIntelligence } from "@/lib/market-intelligence/deal-intelligence";
import type { DealIntelligenceResult } from "@/lib/market-intelligence/types";
import UnifiedLeadsDashboard from "@/app/admin/import-leads/UnifiedLeadsDashboard";

export const dynamic = "force-dynamic";

export default async function MarketIntelligencePage() {
  const store    = await cookies();
  const tenantId = store.get("cb_tenant_id")?.value ?? "tenant-chinabridge";

  let leadStats = { total: 0, hot: 0, warm: 0, cold: 0, google: 0, telegram: 0, vk: 0, clients: 0, avg_score: 0 };
  let dealResult: DealIntelligenceResult = { deals: [], topDeals: [], urgentDeals: [], staleDeals: [], forecast: { d7: 0, d30: 0, d90: 0 }, totalPipeline: 0, avgScore: 0 };
  let report = null;

  try {
    const [ls, crmLeads, r] = await Promise.all([
      getMILeadStats(tenantId),
      getLeads({ tenantId }),
      getLatestReport(tenantId),
    ]);
    leadStats  = ls as typeof leadStats;
    dealResult = analyzeDealIntelligence(crmLeads) as typeof dealResult;
    report     = r;
  } catch {}

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-10">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎯</span>
              <h1 className="text-3xl font-bold text-white">Лид поиск и аналитика</h1>
            </div>
            <p className="text-slate-400 ml-12 mt-1">AI-поиск клиентов + мониторинг рынка + скоринг сделок</p>
          </div>
        </div>

        {/* ═══ UNIFIED LEADS SEARCH ═══ */}
        <UnifiedLeadsDashboard />

        {/* ═══ ANALYTICS MODULES ═══ */}
        <div>
          <h2 className="text-slate-400 text-xs uppercase tracking-widest mb-4 font-semibold">Аналитические модули</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Market Radar */}
            <Link href="/admin/market-intelligence/radar"
              className="bg-gradient-to-br from-purple-600/20 to-purple-800/10 border border-purple-600/30 rounded-2xl p-6 hover:scale-[1.01] transition-transform block">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">📡</span>
                <h3 className="text-white font-bold text-base">Радар рынка AI</h3>
              </div>
              <p className="text-slate-400 text-sm mb-4">Мониторинг рынка: конкуренты, тренды, Telegram-каналы, VK-сообщества</p>
              <div className="space-y-1.5">
                {[
                  { label: "Каналы Telegram", value: leadStats.telegram },
                  { label: "Конкуренты",      value: 5 },
                  { label: "Трендов",         value: 8 },
                ].map(s => (
                  <div key={s.label} className="flex justify-between text-sm">
                    <span className="text-slate-500">{s.label}</span>
                    <span className="text-white font-semibold">{s.value}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-right text-xs text-slate-500">Открыть →</p>
            </Link>

            {/* WB Seller AI */}
            <Link href="/admin/market-intelligence/wb-sellers"
              className="bg-gradient-to-br from-[#00A86B]/20 to-[#00A86B]/5 border border-[#00A86B]/30 rounded-2xl p-6 hover:scale-[1.01] transition-transform block">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">🛒</span>
                <h3 className="text-white font-bold text-base">WB Продавцы — AI Лид Finder</h3>
              </div>
              <p className="text-slate-400 text-sm mb-4">Парсер WB → dadata → GPT-4o: находит продавцов, считает экономию, генерирует персональный оффер</p>
              <div className="space-y-1.5">
                {[
                  { label: "Категории",     value: "Электроника, Одежда, Дом, Авто" },
                  { label: "Lead Score",    value: "AI скоринг 0–100" },
                  { label: "Оффер",         value: "Персональный + экономия ₽/шт" },
                ].map(s => (
                  <div key={s.label} className="flex justify-between text-sm">
                    <span className="text-slate-500">{s.label}</span>
                    <span className="text-white font-medium text-xs">{s.value}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-right text-xs text-slate-500">Открыть →</p>
            </Link>

            {/* HH.ru Leads */}
            <Link href="/admin/market-intelligence/hh-leads"
              className="bg-gradient-to-br from-amber-600/20 to-amber-800/10 border border-amber-600/30 rounded-2xl p-6 hover:scale-[1.01] transition-transform block">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">💼</span>
                <h3 className="text-white font-bold text-base">HH.ru — AI Лид Finder</h3>
              </div>
              <p className="text-slate-400 text-sm mb-4">Компании, ищущие менеджеров по маркетплейсам → обогащение dadata → Lead Score</p>
              <div className="space-y-1.5">
                {[
                  { label: "Источник",    value: "hh.ru API (бесплатно)" },
                  { label: "Запросы",     value: "WB, Ozon, Китай, Импорт" },
                  { label: "Lead Score",  value: "Скоринг по ИНН + сайт + вакансии" },
                ].map(s => (
                  <div key={s.label} className="flex justify-between text-sm">
                    <span className="text-slate-500">{s.label}</span>
                    <span className="text-white font-medium text-xs">{s.value}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-right text-xs text-slate-500">Открыть →</p>
            </Link>

            {/* AI Sales Agent */}
            <Link href="/admin/market-intelligence/ai-sales-agent"
              className="bg-gradient-to-br from-green-600/20 to-green-800/10 border border-green-600/30 rounded-2xl p-6 hover:scale-[1.01] transition-transform block">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">🤖</span>
                <h3 className="text-white font-bold text-base">AI Sales Agent</h3>
              </div>
              <p className="text-slate-400 text-sm mb-4">AI анализирует лиды, расставляет приоритеты и готовит персональные первые сообщения</p>
              <div className="space-y-1.5">
                {[
                  { label: "Анализ",     value: "Score + причина + действие" },
                  { label: "Оффер",      value: "Готовое первое сообщение" },
                  { label: "Приоритет",  value: "HOT / WARM / COLD" },
                ].map(s => (
                  <div key={s.label} className="flex justify-between text-sm">
                    <span className="text-slate-500">{s.label}</span>
                    <span className="text-white font-medium text-xs">{s.value}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-right text-xs text-slate-500">Открыть →</p>
            </Link>

            {/* VK Intent Leads */}
            <Link href="/admin/market-intelligence/vk-intent"
              className="bg-gradient-to-br from-blue-600/20 to-blue-800/10 border border-blue-600/30 rounded-2xl p-6 hover:scale-[1.01] transition-transform block">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">📡</span>
                <h3 className="text-white font-bold text-base">VK Intent Leads</h3>
              </div>
              <p className="text-slate-400 text-sm mb-4">Ищет в ВКонтакте пользователей, которые прямо сейчас хотят карго из Китая или поставщика на 1688</p>
              <div className="space-y-1.5">
                {[
                  { label: "Источник",   value: "ВКонтакте (Apify)" },
                  { label: "Запросов",   value: "14 интент-фраз" },
                  { label: "Скоринг",    value: "Claude Haiku · HOT/WARM" },
                ].map(s => (
                  <div key={s.label} className="flex justify-between text-sm">
                    <span className="text-slate-500">{s.label}</span>
                    <span className="text-white font-medium text-xs">{s.value}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-right text-xs text-slate-500">Открыть →</p>
            </Link>

            {/* Deal Intelligence */}
            <Link href="/admin/market-intelligence/deals"
              className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/10 border border-emerald-600/30 rounded-2xl p-6 hover:scale-[1.01] transition-transform block">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">💡</span>
                <h3 className="text-white font-bold text-base">Сделки — AI Аналитика</h3>
              </div>
              <p className="text-slate-400 text-sm mb-4">AI-скоринг сделок, вероятность закрытия, прогноз выручки на 7/30/90 дней</p>
              <div className="space-y-1.5">
                {[
                  { label: "В воронке",       value: dealResult.deals.length },
                  { label: "Средний Score",   value: `${dealResult.avgScore}/100` },
                  { label: "Прогноз 30 дней", value: dealResult.forecast.d30 > 0 ? `${(dealResult.forecast.d30 / 1000).toFixed(0)}K ₽` : "—" },
                ].map(s => (
                  <div key={s.label} className="flex justify-between text-sm">
                    <span className="text-slate-500">{s.label}</span>
                    <span className="text-white font-semibold">{s.value}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-right text-xs text-slate-500">Открыть →</p>
            </Link>
          </div>
        </div>

        {/* ═══ TOP DEALS + DAILY REPORT ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">🏆 Топ сделок по AI Score</h3>
              <Link href="/admin/market-intelligence/deals" className="text-xs text-blue-400 hover:text-blue-300">Все →</Link>
            </div>
            {dealResult.topDeals.length === 0 ? (
              <p className="text-slate-600 text-sm">Нет данных. Перейдите в Deal Intelligence.</p>
            ) : (
              <div className="space-y-3">
                {dealResult.topDeals.slice(0, 5).map((d, i) => (
                  <div key={d.leadId} className="flex items-center gap-3">
                    <span className="text-slate-600 text-xs w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{d.company}</p>
                      <p className="text-slate-500 text-xs">{d.product}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold text-sm">{d.score}</div>
                      <div className="text-slate-500 text-xs">{d.winProbability}%</div>
                    </div>
                    <div className={`w-2 h-8 rounded-full ${d.score >= 70 ? "bg-green-500" : d.score >= 45 ? "bg-yellow-500" : "bg-slate-600"}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">📋 Ежедневный отчёт CEO</h3>
              <span className="text-xs text-slate-600">{report?.date ?? "Нет отчёта"}</span>
            </div>
            {!report ? (
              <div>
                <p className="text-slate-500 text-sm mb-4">Отчёт ещё не сформирован на сегодня.</p>
                <form action="/api/market-intelligence/report" method="POST">
                  <button type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition">
                    Сформировать отчёт AI →
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: "Лидов найдено",  value: report.leadsFound },
                  { label: "HOT лиды",        value: report.hotLeads,        color: "text-red-400" },
                  { label: "Тренд недели",    value: report.trendOfWeek ?? "—" },
                  { label: "Рост интереса",   value: report.trendGrowth ? `+${report.trendGrowth}%` : "—", color: "text-green-400" },
                  { label: "Топ сделка",      value: report.topDealCompany ?? "—" },
                  { label: "Вероятность",     value: report.topDealProbability ? `${report.topDealProbability}%` : "—" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-slate-500">{label}</span>
                    <span className={`font-medium ${color ?? "text-white"}`}>{value}</span>
                  </div>
                ))}
                {report.recommendations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <p className="text-slate-500 text-xs mb-2">Рекомендации:</p>
                    <ul className="space-y-1">
                      {report.recommendations.slice(0, 3).map((r, i) => (
                        <li key={i} className="text-xs text-slate-300">• {r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
