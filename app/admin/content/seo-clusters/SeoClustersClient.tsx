"use client";

import { useState, useEffect, useCallback } from "react";
import type { SeoKeyword } from "@/lib/seo/clusters";

interface ClusterGroup {
  id: string; label: string;
  group: "geo" | "category" | "commercial" | "informational";
  count: number; color: string;
}

interface Stats {
  total: number; pending: number; briefReady: number;
  pageCreated: number; indexed: number;
  highPriority: number; commercial: number;
}

interface Brief {
  title: string; metaTitle: string; metaDescription: string; h1: string;
  intent: string; audience: string; structure: string[]; keyPoints: string[];
  lsi: string[]; cta: string; wordCount: number; unique_angle: string;
}

const TRAFFIC_COLOR: Record<string, string> = {
  high:   "text-green-400",
  medium: "text-yellow-400",
  low:    "text-slate-500",
};
const TRAFFIC_LABEL: Record<string, string> = { high: "Высокий", medium: "Средний", low: "Низкий" };

const COMP_COLOR: Record<string, string> = {
  high:   "text-red-400",
  medium: "text-yellow-400",
  low:    "text-green-400",
};
const COMP_LABEL: Record<string, string> = { high: "Высокая", medium: "Средняя", low: "Низкая" };

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  pending:      { label: "Ждёт",        cls: "bg-slate-800 text-slate-400 border-slate-700" },
  brief_ready:  { label: "ТЗ готово",   cls: "bg-blue-900/40 text-blue-300 border-blue-700/50" },
  page_created: { label: "Страница",    cls: "bg-amber-900/40 text-amber-300 border-amber-700/50" },
  indexed:      { label: "Проиндекс.",  cls: "bg-green-900/40 text-green-300 border-green-700/50" },
};

const TEMPLATE_LABEL: Record<string, string> = {
  landing: "Лендинг", blog: "Статья", faq: "FAQ", category: "Категория",
};

const GROUP_LABELS: Record<string, string> = {
  geo: "Гео", category: "Товарный", commercial: "Коммерческий", informational: "Инфо",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="text-xs text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-500 px-2 py-0.5 rounded transition shrink-0">
      {copied ? "✅" : "Копировать"}
    </button>
  );
}

export default function SeoClustersClient() {
  const [keywords,  setKeywords]  = useState<SeoKeyword[]>([]);
  const [groups,    setGroups]    = useState<ClusterGroup[]>([]);
  const [stats,     setStats]     = useState<Stats | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [expanded,  setExpanded]  = useState<string | null>(null);
  const [brief,     setBrief]     = useState<Record<string, Brief>>({});
  const [generating,setGenerating]= useState<string | null>(null);
  const [filter, setFilter] = useState<{ cluster: string; group: string; type: string; minP: number }>({
    cluster: "", group: "", type: "", minP: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.cluster) params.set("cluster", filter.cluster);
    if (filter.group)   params.set("group",   filter.group);
    if (filter.type)    params.set("type",     filter.type);
    if (filter.minP)    params.set("priority", String(filter.minP));
    const res = await fetch(`/api/admin/seo-clusters?${params}`);
    const d = await res.json();
    if (d.ok) { setKeywords(d.keywords); setGroups(d.groups); setStats(d.stats); }
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function generateBrief(kw: SeoKeyword) {
    if (brief[kw.id]) { setExpanded(kw.id); return; }
    setGenerating(kw.id);
    try {
      const res = await fetch("/api/admin/seo-clusters", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: kw.keyword, targetUrl: kw.targetUrl, clusterLabel: kw.clusterLabel, type: kw.type }),
      });
      const d = await res.json();
      if (d.ok && d.brief) {
        setBrief(prev => ({ ...prev, [kw.id]: d.brief }));
        setExpanded(kw.id);
      }
    } catch {}
    setGenerating(null);
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">

      {/* Заголовок */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <span>🗺</span> SEO Keyword Cluster Map
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {stats?.total ?? 0}+ ключевых запросов по городам, странам и категориям — карта для создания SEO-страниц
        </p>
      </div>

      {/* Статистика */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
          {[
            { l: "Всего запросов",   v: stats.total,        c: "text-white" },
            { l: "Ждут страницы",    v: stats.pending,      c: "text-slate-400" },
            { l: "ТЗ готово",        v: stats.briefReady,   c: "text-blue-400" },
            { l: "Созданы страницы", v: stats.pageCreated,  c: "text-amber-400" },
            { l: "В индексе",        v: stats.indexed,      c: "text-green-400" },
            { l: "Приоритет 9-10",   v: stats.highPriority, c: "text-red-400" },
            { l: "Коммерческих",     v: stats.commercial,   c: "text-purple-400" },
          ].map(s => (
            <div key={s.l} className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
              <p className={`text-xl font-black ${s.c}`}>{s.v}</p>
              <p className="text-slate-600 text-xs mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>
      )}

      {/* Карта кластеров */}
      <div className="mb-8">
        <h2 className="text-slate-400 text-xs uppercase tracking-widest mb-3 font-semibold">Кластеры</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilter(f => ({ ...f, cluster: "", group: "" }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${!filter.cluster && !filter.group ? "bg-slate-700 border-slate-500 text-white" : "border-slate-800 text-slate-500 hover:border-slate-600"}`}>
            Все кластеры ({stats?.total ?? 0})
          </button>
          {(["geo", "category", "commercial", "informational"] as const).map(g => {
            const gGroups = groups.filter(gr => gr.group === g);
            const gCount = gGroups.reduce((s, gr) => s + gr.count, 0);
            if (!gGroups.length) return null;
            return (
              <div key={g} className="flex items-center gap-1 flex-wrap">
                <button onClick={() => setFilter(f => ({ ...f, group: f.group === g ? "" : g, cluster: "" }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${filter.group === g && !filter.cluster ? "bg-slate-700 border-slate-500 text-white" : "border-slate-800 text-slate-500 hover:border-slate-600"}`}>
                  {GROUP_LABELS[g]} ({gCount})
                </button>
                {gGroups.map(gr => (
                  <button key={gr.id}
                    onClick={() => setFilter(f => ({ ...f, cluster: f.cluster === gr.id ? "" : gr.id, group: "" }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${filter.cluster === gr.id ? "text-white border-transparent" : "border-slate-800 text-slate-500 hover:border-slate-600"}`}
                    style={filter.cluster === gr.id ? { background: gr.color + "33", borderColor: gr.color + "66", color: gr.color } : {}}>
                    {gr.label} ({gr.count})
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Фильтры */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}
          className="bg-slate-900 border border-slate-800 text-slate-400 rounded-lg px-3 py-1.5 text-xs">
          <option value="">Тип: все</option>
          <option value="commercial">Коммерческий</option>
          <option value="informational">Информационный</option>
        </select>
        <select value={filter.minP} onChange={e => setFilter(f => ({ ...f, minP: Number(e.target.value) }))}
          className="bg-slate-900 border border-slate-800 text-slate-400 rounded-lg px-3 py-1.5 text-xs">
          <option value={0}>Приоритет: все</option>
          <option value={9}>Приоритет 9-10 (горячие)</option>
          <option value={7}>Приоритет 7+</option>
        </select>
        <span className="text-slate-600 text-xs ml-auto">
          {loading ? "Загрузка..." : `${keywords.length} запросов`}
        </span>
      </div>

      {/* Таблица ключей */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-4 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wider w-6">#</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wider">Ключевой запрос</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wider hidden md:table-cell">Кластер</th>
                <th className="text-center px-3 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wider hidden lg:table-cell">Трафик</th>
                <th className="text-center px-3 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wider hidden lg:table-cell">Конкур.</th>
                <th className="text-center px-3 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wider">Тип</th>
                <th className="text-center px-3 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wider hidden sm:table-cell">P</th>
                <th className="text-center px-3 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wider hidden sm:table-cell">Шаблон</th>
                <th className="text-center px-3 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wider">Статус</th>
                <th className="text-right px-4 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wider">Действие</th>
              </tr>
            </thead>
            <tbody>
              {keywords.map((kw, i) => {
                const isOpen = expanded === kw.id;
                const hasBrief = !!brief[kw.id];
                const isGen = generating === kw.id;
                const st = STATUS_STYLE[kw.status];

                return (
                  <>
                    <tr key={kw.id}
                      onClick={() => setExpanded(isOpen ? null : kw.id)}
                      className={`border-b border-slate-800/50 hover:bg-slate-800/30 cursor-pointer transition ${isOpen ? "bg-slate-800/50" : ""}`}>
                      <td className="px-4 py-3 text-slate-600 text-xs">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-white text-sm">{kw.keyword}</div>
                        <div className="text-slate-600 text-xs mt-0.5 hidden sm:block">{kw.targetUrl}</div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-slate-400">{kw.clusterLabel}</span>
                      </td>
                      <td className="px-3 py-3 text-center hidden lg:table-cell">
                        <span className={`text-xs font-medium ${TRAFFIC_COLOR[kw.estimatedTraffic]}`}>
                          {TRAFFIC_LABEL[kw.estimatedTraffic]}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center hidden lg:table-cell">
                        <span className={`text-xs ${COMP_COLOR[kw.competition]}`}>
                          {COMP_LABEL[kw.competition]}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${kw.type === "commercial" ? "text-purple-400 bg-purple-900/30" : "text-slate-400 bg-slate-800"}`}>
                          {kw.type === "commercial" ? "Ком." : "Инфо"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center hidden sm:table-cell">
                        <span className={`text-xs font-bold ${kw.priority >= 9 ? "text-red-400" : kw.priority >= 7 ? "text-amber-400" : "text-slate-500"}`}>
                          {kw.priority}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center hidden sm:table-cell">
                        <span className="text-xs text-slate-500">{TEMPLATE_LABEL[kw.pageTemplate]}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={e => { e.stopPropagation(); generateBrief(kw); }}
                          disabled={isGen}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition ${
                            hasBrief
                              ? "bg-[#00A86B]/10 border-[#00A86B]/40 text-[#00A86B] hover:bg-[#00A86B]/20"
                              : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500"
                          } disabled:opacity-40`}>
                          {isGen ? (
                            <span className="flex items-center gap-1">
                              <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                              AI...
                            </span>
                          ) : hasBrief ? "✅ ТЗ готово" : "⚡ Генерировать ТЗ"}
                        </button>
                      </td>
                    </tr>

                    {/* Раскрытая панель с ТЗ */}
                    {isOpen && hasBrief && (
                      <tr key={`${kw.id}-brief`}>
                        <td colSpan={10} className="px-0 py-0">
                          <div className="bg-slate-950 border-b border-slate-800 p-6 space-y-5">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="text-white font-bold text-base">{brief[kw.id].h1}</h3>
                                <p className="text-slate-500 text-xs mt-1">{kw.targetUrl}</p>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${kw.type === "commercial" ? "text-purple-400 border-purple-700/50 bg-purple-900/20" : "text-slate-400 border-slate-700 bg-slate-800"}`}>
                                {kw.type === "commercial" ? "Коммерческий" : "Информационный"}
                              </span>
                            </div>

                            {/* Meta */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div className="bg-slate-900 rounded-xl p-4 space-y-3">
                                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">SEO-мета</p>
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-slate-500 text-xs">Title</p>
                                    <CopyButton text={brief[kw.id].metaTitle} />
                                  </div>
                                  <p className="text-white text-sm">{brief[kw.id].metaTitle}</p>
                                </div>
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-slate-500 text-xs">Description</p>
                                    <CopyButton text={brief[kw.id].metaDescription} />
                                  </div>
                                  <p className="text-slate-300 text-sm">{brief[kw.id].metaDescription}</p>
                                </div>
                              </div>

                              <div className="bg-slate-900 rounded-xl p-4 space-y-2">
                                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Контекст</p>
                                <div><span className="text-slate-500 text-xs">Интент:</span> <span className="text-white text-sm ml-1">{brief[kw.id].intent}</span></div>
                                <div><span className="text-slate-500 text-xs">Аудитория:</span> <span className="text-white text-sm ml-1">{brief[kw.id].audience}</span></div>
                                <div><span className="text-slate-500 text-xs">Объём:</span> <span className="text-white text-sm ml-1">{brief[kw.id].wordCount} слов</span></div>
                                <div><span className="text-slate-500 text-xs">CTA:</span> <span className="text-[#00A86B] text-sm ml-1">{brief[kw.id].cta}</span></div>
                              </div>
                            </div>

                            {/* USP */}
                            <div className="bg-[#00A86B]/5 border border-[#00A86B]/20 rounded-xl p-4">
                              <p className="text-[#00A86B] text-xs font-semibold mb-1">Уникальный угол / USP</p>
                              <p className="text-slate-300 text-sm">{brief[kw.id].unique_angle}</p>
                            </div>

                            {/* Структура + тезисы */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div className="bg-slate-900 rounded-xl p-4">
                                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Структура страницы</p>
                                <ol className="space-y-1.5">
                                  {brief[kw.id].structure?.map((s, si) => (
                                    <li key={si} className="text-sm text-slate-300 flex gap-2">
                                      <span className="text-slate-600 shrink-0">{si + 1}.</span>
                                      <span>{s}</span>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                              <div className="bg-slate-900 rounded-xl p-4">
                                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Ключевые тезисы</p>
                                <ul className="space-y-1.5">
                                  {brief[kw.id].keyPoints?.map((p, pi) => (
                                    <li key={pi} className="text-sm text-slate-300 flex gap-2">
                                      <span className="text-[#00A86B] shrink-0">•</span>
                                      <span>{p}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* LSI */}
                            <div>
                              <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">LSI-слова</p>
                              <div className="flex flex-wrap gap-2">
                                {brief[kw.id].lsi?.map((l, li) => (
                                  <span key={li} className="text-xs px-2 py-1 bg-slate-800 text-slate-400 rounded-lg border border-slate-700">
                                    {l}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Пустая раскрытая панель без ТЗ */}
                    {isOpen && !hasBrief && (
                      <tr key={`${kw.id}-empty`}>
                        <td colSpan={10} className="px-6 py-4 bg-slate-950 border-b border-slate-800">
                          <div className="flex items-center gap-4">
                            <div className="text-slate-500 text-sm">
                              <span className="font-medium text-white">{kw.keyword}</span>
                              {" "}→ {kw.targetUrl}
                            </div>
                            <button onClick={() => generateBrief(kw)} disabled={isGen}
                              className="ml-auto flex items-center gap-2 px-4 py-2 bg-[#00A86B] hover:bg-[#008f59] disabled:opacity-50 text-white rounded-lg text-xs font-bold transition">
                              {isGen ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Генерирую...</> : "⚡ Генерировать ТЗ через AI"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>

          {!loading && keywords.length === 0 && (
            <div className="text-center py-16 text-slate-600">Нет запросов по фильтру</div>
          )}
        </div>
      </div>
    </main>
  );
}
