import Link from "next/link";
import { cookies } from "next/headers";
import { AdminNav } from "@/components/admin/AdminNav";
import { getMILeadStats, getLatestReport } from "@/lib/market-intelligence/db";
import { getLeads } from "@/lib/crm/client";
import { analyzeDealIntelligence } from "@/lib/market-intelligence/deal-intelligence";

export const dynamic = "force-dynamic";

export default async function MarketIntelligencePage() {
  const store    = await cookies();
  const tenantId = store.get("cb_tenant_id")?.value ?? "tenant-chinabridge";

  let leadStats = { total: 0, hot: 0, warm: 0, cold: 0, google: 0, telegram: 0, vk: 0, clients: 0, avg_score: 0 };
  let dealResult = { deals: [], topDeals: [], urgentDeals: [], staleDeals: [], forecast: { d7: 0, d30: 0, d90: 0 }, totalPipeline: 0, avgScore: 0 };
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

  const modules = [
    {
      href:  "/admin/market-intelligence/leads",
      icon:  "🎯",
      title: "Lead Finder AI",
      desc:  "Поиск клиентов в Google, Telegram, VK по сигналам интереса к импорту",
      color: "from-blue-600/20 to-blue-800/10",
      border:"border-blue-600/30",
      stats: [
        { label: "Всего лидов",    value: leadStats.total },
        { label: "HOT",            value: leadStats.hot,      color: "text-red-400" },
        { label: "Средний Score",  value: `${leadStats.avg_score}/100` },
      ],
    },
    {
      href:  "/admin/market-intelligence/radar",
      icon:  "📡",
      title: "Market Radar AI",
      desc:  "Мониторинг рынка: конкуренты, тренды, Telegram-каналы, VK-сообщества",
      color: "from-purple-600/20 to-purple-800/10",
      border:"border-purple-600/30",
      stats: [
        { label: "Каналы Telegram", value: leadStats.telegram },
        { label: "Конкуренты",     value: "5" },
        { label: "Трендов",        value: "8" },
      ],
    },
    {
      href:  "/admin/market-intelligence/deals",
      icon:  "💡",
      title: "Deal Intelligence AI",
      desc:  "AI-скоринг сделок, вероятность закрытия, прогноз выручки на 7/30/90 дней",
      color: "from-emerald-600/20 to-emerald-800/10",
      border:"border-emerald-600/30",
      stats: [
        { label: "В воронке",       value: dealResult.deals.length },
        { label: "Средний Score",   value: `${dealResult.avgScore}/100` },
        { label: "Прогноз 30 дней", value: dealResult.forecast.d30 > 0 ? `${(dealResult.forecast.d30 / 1000).toFixed(0)}K ₽` : "—" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🧠</span>
            <h1 className="text-3xl font-bold text-white">Market Intelligence Platform</h1>
          </div>
          <p className="text-slate-400 ml-12">Система поиска рынков, клиентов и возможностей — стратегический модуль AI Company OS</p>
        </div>

        {/* KPI bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Лидов в базе",    value: leadStats.total,          color: "text-white" },
            { label: "HOT лиды",        value: leadStats.hot,            color: "text-red-400" },
            { label: "Пайплайн",        value: dealResult.totalPipeline > 0 ? `${(dealResult.totalPipeline/1000000).toFixed(1)}M ₽` : "—", color: "text-green-400" },
            { label: "Прогноз 7 дн.",   value: dealResult.forecast.d7 > 0 ? `${(dealResult.forecast.d7/1000).toFixed(0)}K ₽` : "—", color: "text-emerald-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* 3 modules */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {modules.map((m) => (
            <Link key={m.href} href={m.href}
              className={`bg-gradient-to-br ${m.color} border ${m.border} rounded-2xl p-6 hover:scale-[1.02] transition-transform block`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{m.icon}</span>
                <h2 className="text-white font-bold text-lg">{m.title}</h2>
              </div>
              <p className="text-slate-400 text-sm mb-5">{m.desc}</p>
              <div className="space-y-2">
                {m.stats.map(s => (
                  <div key={s.label} className="flex justify-between text-sm">
                    <span className="text-slate-500">{s.label}</span>
                    <span className={`font-semibold ${("color" in s && s.color) ? s.color : "text-white"}`}>{s.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-right text-xs text-slate-500 group-hover:text-slate-400">Открыть →</div>
            </Link>
          ))}
        </div>

        {/* Top deals + Daily report */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Top deals */}
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

          {/* Daily report */}
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
                  { label: "Лидов найдено",   value: report.leadsFound },
                  { label: "HOT лиды",         value: report.hotLeads,  color: "text-red-400" },
                  { label: "Тренд недели",     value: report.trendOfWeek ?? "—" },
                  { label: "Рост интереса",    value: report.trendGrowth ? `+${report.trendGrowth}%` : "—", color: "text-green-400" },
                  { label: "Топ сделка",       value: report.topDealCompany ?? "—" },
                  { label: "Вероятность",      value: report.topDealProbability ? `${report.topDealProbability}%` : "—" },
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
