"use client";
import { useState, useCallback } from "react";
import type {
  MarketingDirectorReport, MarketingHealth, MarketingStatus,
  MarketingPriority, AdCampaign, TrafficSource, SEOQuery, SEOOpportunity,
  MarketingRecommendation, MarketingTask, ContentRequest,
} from "@/lib/ai-company/marketing/types";

interface Props { initialReport: MarketingDirectorReport | null }

const TABS = [
  { id: "overview",  label: "📊 Обзор"          },
  { id: "ads",       label: "📢 Реклама"         },
  { id: "seo",       label: "🔎 SEO"             },
  { id: "channels",  label: "📱 Каналы"          },
  { id: "director",  label: "🤖 AI Директор"     },
];

const STATUS_STYLE: Record<MarketingStatus, { badge: string; dot: string; label: string }> = {
  GOOD:     { badge: "bg-emerald-900/40 text-emerald-300 border-emerald-700", dot: "bg-emerald-400",              label: "ХОРОШО"   },
  WARNING:  { badge: "bg-amber-900/40 text-amber-300 border-amber-700",       dot: "bg-amber-400",                label: "ВНИМАНИЕ" },
  CRITICAL: { badge: "bg-red-900/40 text-red-300 border-red-700",             dot: "bg-red-400 animate-pulse",    label: "КРИТИЧНО" },
};

const PRIORITY_STYLE: Record<MarketingPriority, { cls: string; icon: string; label: string }> = {
  HIGH:   { cls: "bg-red-900/40 text-red-300 border-red-700",       icon: "⚡", label: "ВЫСОКИЙ" },
  MEDIUM: { cls: "bg-amber-900/40 text-amber-300 border-amber-700", icon: "⚠",  label: "СРЕДНИЙ" },
  LOW:    { cls: "bg-slate-800 text-slate-400 border-slate-600",    icon: "ℹ",  label: "НИЗКИЙ"  },
};

const PLATFORM_STYLE: Record<string, { label: string; cls: string }> = {
  yandex:   { label: "Яндекс",  cls: "bg-amber-900/40 text-amber-300 border-amber-700"   },
  google:   { label: "Google",  cls: "bg-blue-900/40 text-blue-300 border-blue-700"      },
  vk:       { label: "VK",      cls: "bg-indigo-900/40 text-indigo-300 border-indigo-700"},
  telegram: { label: "Telegram",cls: "bg-sky-900/40 text-sky-300 border-sky-700"         },
};

function HealthBar({ health }: { health: MarketingHealth }) {
  const color = health.score >= 70 ? "bg-emerald-500" : health.score >= 45 ? "bg-amber-500" : "bg-red-500";
  const sc = STATUS_STYLE[health.status];
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Marketing Health Score</div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${sc.dot}`} />
            <span className="text-white font-bold text-lg">{sc.label}</span>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full border text-sm font-bold ${sc.badge}`}>{health.score}/100</span>
      </div>
      <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden mb-3">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${health.score}%` }} />
      </div>
      <div className="space-y-1">
        {health.reasons.map((r, i) => (
          <div key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
            <span className={health.status === "GOOD" ? "text-emerald-400" : "text-amber-400"}>
              {health.status === "GOOD" ? "✓" : "·"}
            </span>
            {r}
          </div>
        ))}
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, sub }: { icon: string; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex flex-col gap-1">
      <div className="text-xl">{icon}</div>
      <div className="text-white text-xl font-bold">{value}</div>
      <div className="text-slate-400 text-xs">{label}</div>
      {sub && <div className="text-slate-500 text-xs">{sub}</div>}
    </div>
  );
}

function Funnel({ funnel }: { funnel: MarketingDirectorReport["funnel"] }) {
  const max = funnel.visits;
  const steps = [
    { label: "Посетители",      val: funnel.visits,     color: "bg-blue-500"    },
    { label: "Клики на CTA",    val: funnel.clicks,     color: "bg-indigo-500"  },
    { label: "Лиды",            val: funnel.leads,      color: "bg-amber-500"   },
    { label: "Квалифицировано", val: funnel.qualified,  color: "bg-orange-500"  },
    { label: "Сделки",          val: funnel.deals,      color: "bg-emerald-500" },
  ];
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
      <div className="text-slate-400 text-xs uppercase tracking-wider mb-4">Маркетинговая воронка</div>
      <div className="space-y-3">
        {steps.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <div className="text-slate-400 text-xs w-36 flex-shrink-0">{s.label}</div>
            <div className="flex-1 h-5 bg-slate-800 rounded overflow-hidden">
              <div
                className={`h-full ${s.color} rounded transition-all duration-500 flex items-center pl-2`}
                style={{ width: `${Math.max(4, (s.val / max) * 100)}%` }}
              />
            </div>
            <div className="text-slate-200 font-medium text-sm w-16 text-right flex-shrink-0">
              {s.val.toLocaleString("ru")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrafficTable({ sources }: { sources: TrafficSource[] }) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-800">
        <span className="text-slate-400 text-xs uppercase tracking-wider">Источники трафика</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-4 py-2.5 text-left text-slate-500 font-medium text-xs">Канал</th>
              <th className="px-4 py-2.5 text-right text-slate-500 font-medium text-xs">Сессии</th>
              <th className="px-4 py-2.5 text-right text-slate-500 font-medium text-xs">Лиды</th>
              <th className="px-4 py-2.5 text-right text-slate-500 font-medium text-xs">Конв.</th>
              <th className="px-4 py-2.5 text-right text-slate-500 font-medium text-xs">CPL</th>
              <th className="px-4 py-2.5 text-center text-slate-500 font-medium text-xs">Тренд</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.name} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-2.5 text-slate-200 font-medium">{s.label}</td>
                <td className="px-4 py-2.5 text-right text-slate-300">{s.sessions.toLocaleString("ru")}</td>
                <td className="px-4 py-2.5 text-right text-slate-300">{s.leads}</td>
                <td className="px-4 py-2.5 text-right text-slate-400">{s.conversionRate}%</td>
                <td className="px-4 py-2.5 text-right text-slate-400">{s.cpl > 0 ? `${s.cpl}₽` : "—"}</td>
                <td className="px-4 py-2.5 text-center">
                  <span className={s.trend === "up" ? "text-emerald-400" : s.trend === "down" ? "text-red-400" : "text-slate-500"}>
                    {s.trend === "up" ? "↑" : s.trend === "down" ? "↓" : "→"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdCard({ ad }: { ad: AdCampaign }) {
  const [open, setOpen] = useState(false);
  const sc = STATUS_STYLE[ad.status];
  const pl = PLATFORM_STYLE[ad.platform] ?? { label: ad.platform, cls: "bg-slate-800 text-slate-300 border-slate-600" };
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div>
            <div className="text-slate-100 font-semibold text-sm">{ad.name}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded border text-xs font-medium ${pl.cls}`}>{pl.label}</span>
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${sc.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                {sc.label}
              </span>
            </div>
          </div>
        </div>
        <span className={ad.trend === "up" ? "text-emerald-400 text-lg" : ad.trend === "down" ? "text-red-400 text-lg" : "text-slate-500 text-lg"}>
          {ad.trend === "up" ? "↑" : ad.trend === "down" ? "↓" : "→"}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-800/60 rounded-lg p-3">
          <div className="text-slate-400 text-xs mb-1">Расход</div>
          <div className="text-slate-100 font-semibold">{ad.spend.toLocaleString("ru")}₽</div>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3">
          <div className="text-slate-400 text-xs mb-1">Лидов</div>
          <div className="text-slate-100 font-semibold">{ad.leads}</div>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3">
          <div className="text-slate-400 text-xs mb-1">CPL</div>
          <div className={`font-semibold ${ad.cpl <= 2000 ? "text-emerald-300" : "text-amber-300"}`}>{ad.cpl.toLocaleString("ru")}₽</div>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3">
          <div className="text-slate-400 text-xs mb-1">Конверсия</div>
          <div className="text-slate-100 font-semibold">{ad.conversion}%</div>
        </div>
      </div>

      <button onClick={() => setOpen(!open)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
        {open ? "Скрыть анализ ↑" : "AI анализ →"}
      </button>
      {open && (
        <div className="space-y-3">
          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
            <div className="text-xs text-blue-400 font-medium mb-1">🤖 AI Анализ:</div>
            <div className="text-slate-300 text-sm leading-relaxed">{ad.aiAnalysis}</div>
          </div>
          <div className="bg-slate-800/60 rounded-lg p-3 border border-emerald-900/40">
            <div className="text-xs text-emerald-400 font-medium mb-1">💡 Рекомендация:</div>
            <div className="text-slate-300 text-sm leading-relaxed">{ad.recommendation}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function SEOTab({ seo }: { seo: MarketingDirectorReport["seo"] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <KPICard icon="📝" label="Статей в блоге" value={seo.articles} />
        <KPICard icon="🔍" label="Органических визитов" value={seo.organicVisits.toLocaleString("ru")} sub={`+${seo.growthPercent}% к прошлому месяцу`} />
        <KPICard icon="🎯" label="Топ запросов в ТОП-10" value={seo.topQueries.filter(q => q.position <= 10).length} sub={`из ${seo.topQueries.length} отслеживаемых`} />
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800">
          <span className="text-slate-400 text-xs uppercase tracking-wider">Топ запросы</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-2.5 text-left text-slate-500 font-medium text-xs">Запрос</th>
                <th className="px-4 py-2.5 text-right text-slate-500 font-medium text-xs">Позиция</th>
                <th className="px-4 py-2.5 text-right text-slate-500 font-medium text-xs">Клики</th>
                <th className="px-4 py-2.5 text-right text-slate-500 font-medium text-xs">Показы</th>
              </tr>
            </thead>
            <tbody>
              {seo.topQueries.map((q: SEOQuery, i) => (
                <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-2.5 text-slate-200">{q.query}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`font-medium ${q.position <= 10 ? "text-emerald-300" : q.position <= 20 ? "text-amber-300" : "text-slate-400"}`}>
                      #{q.position}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-300">{q.clicks}</td>
                  <td className="px-4 py-2.5 text-right text-slate-400">{q.impressions.toLocaleString("ru")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center gap-2">
          <span className="text-slate-400 text-xs uppercase tracking-wider">SEO Возможности</span>
          <span className="bg-amber-900/40 text-amber-300 border border-amber-700 text-xs px-2 py-0.5 rounded-full">{seo.opportunities.length} запросов</span>
        </div>
        <div className="divide-y divide-slate-800">
          {seo.opportunities.map((o: SEOOpportunity, i) => (
            <div key={i} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className="text-slate-100 font-medium text-sm">{o.query}</span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-slate-500 text-xs">Позиция #{o.currentPosition}</span>
                    <span className="text-slate-500 text-xs">·</span>
                    <span className="text-slate-500 text-xs">{o.volume.toLocaleString("ru")} запросов/мес</span>
                  </div>
                </div>
              </div>
              <div className="text-slate-400 text-xs leading-relaxed bg-slate-800/40 rounded-lg px-3 py-2">
                💡 {o.recommendation}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChannelCard({ icon, name, stats }: { icon: string; name: string; stats: { subscribers: number; growth: number; reach: number; leads: number; bestContent: string; posts?: number; videos?: number } }) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <div className="text-slate-100 font-semibold">{name}</div>
          <div className="text-slate-500 text-xs">+{stats.growth}/мес</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-white font-bold text-lg">{stats.subscribers.toLocaleString("ru")}</div>
          <div className="text-slate-500 text-xs">Подписчиков</div>
        </div>
        <div className="text-center">
          <div className="text-white font-bold text-lg">{stats.reach.toLocaleString("ru")}</div>
          <div className="text-slate-500 text-xs">Охват</div>
        </div>
        <div className="text-center">
          <div className={`font-bold text-lg ${stats.leads > 0 ? "text-emerald-300" : "text-slate-500"}`}>{stats.leads}</div>
          <div className="text-slate-500 text-xs">Лидов</div>
        </div>
      </div>
      {(stats.posts !== undefined || stats.videos !== undefined) && (
        <div className="text-slate-500 text-xs">
          {stats.posts !== undefined ? `${stats.posts} постов` : ""}
          {stats.videos !== undefined ? `${stats.videos} видео` : ""}
        </div>
      )}
      <div className="bg-slate-800/60 rounded-lg px-3 py-2 text-xs text-slate-400">
        🏆 {stats.bestContent}
      </div>
    </div>
  );
}

function RecCard({ rec }: { rec: MarketingRecommendation }) {
  const pc = PRIORITY_STYLE[rec.priority];
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded border text-xs font-bold ${pc.cls}`}>{pc.icon} {pc.label}</span>
        <span className="text-slate-400 text-xs">{rec.owner}</span>
      </div>
      <div className="text-slate-100 font-semibold text-sm">{rec.problem}</div>
      <div className="text-slate-400 text-xs leading-relaxed">{rec.analysis}</div>
      <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
        <div className="text-xs text-emerald-400 font-medium mb-0.5">Действие:</div>
        <div className="text-slate-200 text-sm">{rec.action}</div>
      </div>
    </div>
  );
}

function TaskRow({ task }: { task: MarketingTask }) {
  const pc = PRIORITY_STYLE[task.priority];
  const deptColor = task.department === "Content" ? "text-purple-400" : task.department === "Sales" ? "text-emerald-400" : "text-blue-400";
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-800 last:border-0">
      <span className={`mt-0.5 px-2 py-0.5 rounded border text-xs font-bold flex-shrink-0 ${pc.cls}`}>{task.priority}</span>
      <div className="flex-1 min-w-0">
        <div className="text-slate-100 text-sm font-medium">{task.title}</div>
        <div className="text-slate-400 text-xs mt-0.5">{task.description}</div>
      </div>
      <div className="flex-shrink-0 text-right">
        <div className="text-slate-300 text-xs font-medium">{task.deadline}</div>
        <div className={`text-xs font-medium ${deptColor}`}>{task.department}</div>
      </div>
    </div>
  );
}

function ContentCard({ req }: { req: ContentRequest }) {
  const pc = PRIORITY_STYLE[req.priority];
  const typeIcon = { article: "📝", post: "💬", shorts: "🎬", video: "📹" }[req.type] ?? "📄";
  const typeLabel = { article: "Статья", post: "Пост", shorts: "Shorts", video: "Видео" }[req.type] ?? req.type;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-lg">{typeIcon}</span>
        <span className="text-slate-400 text-xs bg-slate-800 px-2 py-0.5 rounded">{typeLabel}</span>
        <span className={`px-2 py-0.5 rounded border text-xs font-bold ${pc.cls}`}>{req.priority}</span>
        <span className="text-slate-500 text-xs ml-auto">{req.channel}</span>
      </div>
      <div className="text-slate-100 font-semibold text-sm">{req.title}</div>
      <div className="text-slate-400 text-xs">Тема: {req.topic}</div>
      <div className="text-slate-500 text-xs leading-relaxed">Причина: {req.reason}</div>
    </div>
  );
}

export default function MarketingDashboard({ initialReport }: Props) {
  const [report, setReport] = useState<MarketingDirectorReport | null>(initialReport);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-company/marketing/report");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Ошибка генерации");
      setReport(data.report);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <a href="/admin/ai-company" className="hover:text-slate-300 transition-colors">🤖 AI OS</a>
            <span>→</span>
            <span className="text-slate-300">📣 Маркетинг</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Marketing Department AI</h1>
          <p className="text-slate-400 text-sm mt-1">Marketing Director AI · Ads AI · SEO AI · Channel AI · Traffic AI</p>
        </div>
        <button
          onClick={generateReport}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:text-blue-400 text-white rounded-lg text-sm font-medium transition-colors flex-shrink-0"
        >
          {loading ? <><span className="animate-spin">⟳</span> Анализирую...</> : <>🤖 Сгенерировать отчёт</>}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm">Ошибка: {error}</div>
      )}

      {!report && !loading && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-6xl mb-4">📣</div>
          <div className="text-slate-300 text-lg font-medium mb-2">Marketing Director AI готов к анализу</div>
          <div className="text-slate-500 text-sm mb-6 max-w-sm">Нажмите «Сгенерировать отчёт» — AI соберёт данные о трафике, рекламе, SEO и каналах</div>
          <button onClick={generateReport} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors">
            🚀 Запустить анализ
          </button>
        </div>
      )}

      {loading && !report && (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="text-4xl animate-spin mb-4">⟳</div>
          <div className="text-slate-400 text-sm">Marketing Director AI анализирует маркетинг...</div>
        </div>
      )}

      {report && (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <KPICard icon="👁" label="Посетители" value={report.kpis.visitors.toLocaleString("ru")} />
            <KPICard icon="🆕" label="Новые польз." value={report.kpis.newUsers.toLocaleString("ru")} />
            <KPICard icon="🔀" label="Источников" value={report.kpis.trafficSources.length} />
            <KPICard icon="🎯" label="Лидов" value={report.kpis.leads} />
            <KPICard icon="💰" label="CPL" value={`${report.kpis.costPerLead}₽`} />
            <KPICard icon="📈" label="Конверсия" value={`${report.kpis.conversion}%`} />
            <KPICard icon="🏆" label="Лучший канал" value={report.kpis.bestChannel} />
            <KPICard icon="📊" label="ROI" value={`${report.kpis.roi}%`} />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-900 border border-slate-700 rounded-xl p-1 overflow-x-auto">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                  tab === t.id ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === "overview" && (
            <div className="space-y-6">
              <HealthBar health={report.health} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Funnel funnel={report.funnel} />
                <TrafficTable sources={report.kpis.trafficSources} />
              </div>
            </div>
          )}

          {tab === "ads" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-slate-400 text-xs uppercase tracking-wider">Рекламные кампании ({report.ads.length})</div>
                <div className="text-slate-500 text-xs">
                  Общий расход: {report.ads.reduce((s, a) => s + a.spend, 0).toLocaleString("ru")}₽ · Лидов: {report.ads.reduce((s, a) => s + a.leads, 0)}
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {report.ads.map(ad => <AdCard key={ad.id} ad={ad} />)}
              </div>
              {report.ads.length === 0 && (
                <div className="text-center py-16 text-slate-500">Рекламные кампании не настроены. Подключите Яндекс Директ или Google Ads.</div>
              )}
            </div>
          )}

          {tab === "seo" && <SEOTab seo={report.seo} />}

          {tab === "channels" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ChannelCard icon="✈️" name="Telegram" stats={report.channels.telegram} />
                <ChannelCard icon="💬" name="MAX" stats={report.channels.max} />
                <ChannelCard icon="🔵" name="VK" stats={report.channels.vk} />
                <ChannelCard icon="▶️" name="YouTube" stats={report.channels.youtube} />
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
                <div className="text-slate-400 text-xs uppercase tracking-wider mb-3">Лиды из каналов</div>
                <div className="space-y-2">
                  {[
                    { name: "Telegram", leads: report.channels.telegram.leads },
                    { name: "VK",       leads: report.channels.vk.leads       },
                    { name: "YouTube",  leads: report.channels.youtube.leads  },
                    { name: "MAX",      leads: report.channels.max.leads      },
                  ].sort((a, b) => b.leads - a.leads).map(c => (
                    <div key={c.name} className="flex items-center gap-3">
                      <div className="text-slate-400 text-sm w-20">{c.name}</div>
                      <div className="flex-1 h-4 bg-slate-800 rounded overflow-hidden">
                        <div className="h-full bg-blue-500 rounded" style={{ width: `${Math.max(4, c.leads * 15)}%` }} />
                      </div>
                      <div className="text-slate-300 text-sm w-8 text-right">{c.leads}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "director" && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
                <div className="text-slate-400 text-xs uppercase tracking-wider mb-3">🤖 Marketing Director AI — Резюме</div>
                <p className="text-slate-200 leading-relaxed">{report.summary}</p>
              </div>

              {/* Recommendations */}
              {report.recommendations.length > 0 && (
                <div>
                  <div className="text-slate-400 text-xs uppercase tracking-wider mb-3">Рекомендации</div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {report.recommendations.map(rec => <RecCard key={rec.id} rec={rec} />)}
                  </div>
                </div>
              )}

              {/* Tasks */}
              {report.tasks.length > 0 && (
                <div>
                  <div className="text-slate-400 text-xs uppercase tracking-wider mb-3">Задачи</div>
                  <div className="bg-slate-900 border border-slate-700 rounded-xl px-4">
                    {report.tasks.map(task => <TaskRow key={task.id} task={task} />)}
                  </div>
                </div>
              )}

              {/* Content Requests */}
              {report.contentRequests.length > 0 && (
                <div>
                  <div className="text-slate-400 text-xs uppercase tracking-wider mb-3">
                    📋 Заявки для Контент-отдела
                    <span className="ml-2 bg-purple-900/40 text-purple-300 border border-purple-700 text-xs px-2 py-0.5 rounded-full normal-case">
                      {report.contentRequests.length} запроса
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {report.contentRequests.map((req, i) => <ContentCard key={i} req={req} />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
