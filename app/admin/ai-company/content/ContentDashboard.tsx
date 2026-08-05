"use client";
import { useState, useCallback } from "react";
import type {
  ContentDirectorReport, ContentHealth, ContentStatus, ContentPriority,
  TelegramPostTemplate, ScriptIdea, ShortsIdea, PromptTemplate,
  ContentRecommendation, ContentTask,
} from "@/lib/ai-company/content/types";

interface Props { initialReport: ContentDirectorReport | null }

const TABS = [
  { id: "overview",  label: "📊 Обзор"               },
  { id: "seo",       label: "📝 SEO AI"               },
  { id: "telegram",  label: "📱 Telegram AI"          },
  { id: "youtube",   label: "🎬 YouTube AI"           },
  { id: "shorts",    label: "⚡ Shorts AI"            },
  { id: "image",     label: "🎨 Image AI"             },
  { id: "director",  label: "🤖 Content Director AI"  },
];

const STATUS_STYLE: Record<ContentStatus, { badge: string; dot: string; label: string }> = {
  GOOD:     { badge: "bg-emerald-900/40 text-emerald-300 border-emerald-700", dot: "bg-emerald-400",           label: "GOOD"     },
  WARNING:  { badge: "bg-amber-900/40 text-amber-300 border-amber-700",       dot: "bg-amber-400",             label: "WARNING"  },
  CRITICAL: { badge: "bg-red-900/40 text-red-300 border-red-700",             dot: "bg-red-400 animate-pulse", label: "CRITICAL" },
};

const PRI: Record<ContentPriority, { cls: string; icon: string; label: string }> = {
  HIGH:   { cls: "bg-red-900/40 text-red-300 border-red-700",       icon: "⚡", label: "ВЫСОКИЙ" },
  MEDIUM: { cls: "bg-amber-900/40 text-amber-300 border-amber-700", icon: "⚠",  label: "СРЕДНИЙ" },
  LOW:    { cls: "bg-slate-800 text-slate-400 border-slate-600",    icon: "ℹ",  label: "НИЗКИЙ"  },
};

const CHANNEL_COLORS: Record<string, string> = {
  telegram: "text-sky-400", youtube: "text-red-400", vk: "text-indigo-400",
  blog: "text-emerald-400", ads: "text-amber-400", max: "text-purple-400",
};

const TYPE_ICONS: Record<string, string> = {
  article: "📝", post: "💬", shorts: "⚡", video: "🎬", image: "🎨", prompt: "✨",
};

const SOURCE_LABEL: Record<string, string> = {
  director: "Content Director", marketing: "Marketing AI", seo: "SEO AI", sales: "Sales AI",
};

// ── Shared components ──────────────────────────────────────────────────────

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

function HealthBar({ health }: { health: ContentHealth }) {
  const color = health.score >= 70 ? "bg-emerald-500" : health.score >= 50 ? "bg-amber-500" : "bg-red-500";
  const sc = STATUS_STYLE[health.status];
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Content Health Score</div>
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
            <span className={health.status === "GOOD" ? "text-emerald-400" : "text-amber-400"}>{health.status === "GOOD" ? "✓" : "·"}</span>
            {r}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Overview tab ───────────────────────────────────────────────────────────

function OverviewTab({ report }: { report: ContentDirectorReport }) {
  const { kpis, health } = report;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <KPICard icon="📦" label="Всего материалов"  value={kpis.totalMaterials} />
        <KPICard icon="📝" label="Статьи"            value={kpis.articles} />
        <KPICard icon="✈️" label="Telegram посты"   value={kpis.telegramPosts} />
        <KPICard icon="▶️" label="YouTube видео"    value={kpis.youtubeVideos} />
        <KPICard icon="⚡" label="Shorts"           value={kpis.shorts} />
        <KPICard icon="👁"  label="Просмотров"       value={kpis.totalViews.toLocaleString("ru")} />
        <KPICard icon="👤" label="Подписчиков"       value={kpis.subscribers.toLocaleString("ru")} />
        <KPICard icon="🏆" label="Лучший контент"    value="YouTube" sub={kpis.bestContent} />
      </div>
      <HealthBar health={health} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: "📝", label: "Блог / SEO", items: [`${report.seo.published} опубликовано из ${report.seo.totalArticles}`, `Трафик: ${report.seo.organicTraffic.toLocaleString("ru")} визитов`] },
          { icon: "✈️", label: "Telegram",   items: [`${report.telegram.totalPosts} постов всего`, `+${report.telegram.subscribersGrowth} подписчиков`] },
          { icon: "▶️", label: "YouTube",    items: [`${report.youtube.totalVideos} видео`, `${report.youtube.totalViews.toLocaleString("ru")} просмотров`] },
          { icon: "⚡", label: "Shorts",    items: [`${report.shorts.totalShorts} Shorts`, `${report.shorts.totalViews.toLocaleString("ru")} просмотров`] },
        ].map(ch => (
          <div key={ch.label} className="bg-slate-900 border border-slate-700 rounded-xl p-4">
            <div className="text-base mb-2">{ch.icon} <span className="text-slate-300 font-medium">{ch.label}</span></div>
            {ch.items.map((it, i) => <div key={i} className="text-slate-400 text-sm">{it}</div>)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SEO tab ────────────────────────────────────────────────────────────────

function SEOTab({ report }: { report: ContentDirectorReport }) {
  const { seo } = report;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <KPICard icon="📝" label="Всего статей"       value={seo.totalArticles} />
        <KPICard icon="✅" label="Опубликовано"        value={seo.published} />
        <KPICard icon="🔍" label="Органический трафик" value={seo.organicTraffic.toLocaleString("ru")} sub="визитов / месяц" />
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800">
          <span className="text-slate-400 text-xs uppercase tracking-wider">Лучшие статьи</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-2.5 text-left text-slate-500 font-medium text-xs">Статья</th>
                <th className="px-4 py-2.5 text-right text-slate-500 font-medium text-xs">Позиция</th>
                <th className="px-4 py-2.5 text-right text-slate-500 font-medium text-xs">Просмотры</th>
                <th className="px-4 py-2.5 text-right text-slate-500 font-medium text-xs">Трафик</th>
                <th className="px-4 py-2.5 text-right text-slate-500 font-medium text-xs">Дата</th>
              </tr>
            </thead>
            <tbody>
              {seo.topArticles.map((a, i) => (
                <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-2.5 text-slate-200 max-w-xs truncate">{a.title}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`font-medium ${a.position <= 10 ? "text-emerald-300" : a.position <= 20 ? "text-amber-300" : "text-slate-400"}`}>#{a.position}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-300">{a.views.toLocaleString("ru")}</td>
                  <td className="px-4 py-2.5 text-right text-slate-400">{a.traffic}</td>
                  <td className="px-4 py-2.5 text-right text-slate-500">{a.published}</td>
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
          {seo.opportunities.map((o, i) => {
            const pc = PRI[o.priority];
            return (
              <div key={i} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-slate-100 font-medium">{o.query}</span>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-slate-500 text-xs">Позиция #{o.position}</span>
                      <span className="text-slate-500 text-xs">·</span>
                      <span className="text-slate-500 text-xs">{o.volume.toLocaleString("ru")} запросов/мес</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded border text-xs font-bold flex-shrink-0 ${pc.cls}`}>{pc.icon} {o.priority}</span>
                </div>
                <div className="text-slate-400 text-xs bg-slate-800/40 rounded-lg px-3 py-2">💡 {o.recommendation}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Telegram tab ───────────────────────────────────────────────────────────

function TelegramTab({ report }: { report: ContentDirectorReport }) {
  const { telegram } = report;
  const [copied, setCopied] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const copy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard icon="📨" label="Всего постов"      value={telegram.totalPosts} />
        <KPICard icon="📅" label="Постов за месяц"   value={telegram.monthlyPosts} />
        <KPICard icon="📈" label="Рост подписчиков"  value={`+${telegram.subscribersGrowth}`} sub="за последние 30 дней" />
        <KPICard icon="🏆" label="Охват"             value={telegram.reach.toLocaleString("ru")} />
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <div className="text-slate-400 text-xs mb-1">Лучший пост</div>
        <div className="text-slate-200 text-sm font-medium">🏆 {telegram.bestPost}</div>
      </div>

      <div>
        <div className="text-slate-400 text-xs uppercase tracking-wider mb-3">Готовые шаблоны постов</div>
        <div className="space-y-4">
          {telegram.templates.map((t: TelegramPostTemplate) => {
            const isOpen = expanded === t.type;
            const typeColors: Record<string, string> = {
              expert: "bg-blue-900/40 text-blue-300 border-blue-700",
              case:   "bg-purple-900/40 text-purple-300 border-purple-700",
              sales:  "bg-emerald-900/40 text-emerald-300 border-emerald-700",
            };
            const fullText = `${t.emoji} ${t.title}\n\n${t.body}\n\n${t.cta}`;
            return (
              <div key={t.type} className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded border text-xs font-medium ${typeColors[t.type]}`}>{t.typeLabel}</span>
                    <span className="text-slate-200 font-medium text-sm">{t.emoji} {t.title}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => copy(t.type, fullText)}
                      className="text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
                    >
                      {copied === t.type ? "✓ Скопировано" : "📋 Копировать"}
                    </button>
                    <button onClick={() => setExpanded(isOpen ? null : t.type)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                      {isOpen ? "Скрыть ↑" : "Показать →"}
                    </button>
                  </div>
                </div>
                {isOpen && (
                  <div className="border-t border-slate-800 px-5 py-4 space-y-3">
                    <pre className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">{t.body}</pre>
                    <div className="bg-emerald-900/20 border border-emerald-800 rounded-lg px-3 py-2 text-emerald-300 text-sm">{t.cta}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── YouTube tab ────────────────────────────────────────────────────────────

function YouTubeTab({ report }: { report: ContentDirectorReport }) {
  const { youtube } = report;
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard icon="▶️" label="Видео"          value={youtube.totalVideos} />
        <KPICard icon="👁"  label="Просмотров"     value={youtube.totalViews.toLocaleString("ru")} />
        <KPICard icon="⏱"  label="Ср. удержание"  value={`${youtube.avgRetention}%`} />
        <KPICard icon="🏆" label="Лучшее видео"   value={youtube.bestViews.toLocaleString("ru")} sub={youtube.bestVideo} />
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
        <div className="text-slate-400 text-xs uppercase tracking-wider mb-3">Структура сценария</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "HOOK",    desc: "Первые 15 сек — зацепка", color: "border-red-700 bg-red-900/20",     icon: "🎣" },
            { label: "ПРОБЛЕМА",desc: "Боль аудитории",           color: "border-amber-700 bg-amber-900/20", icon: "⚡" },
            { label: "РЕШЕНИЕ", desc: "Наш экспертный ответ",     color: "border-blue-700 bg-blue-900/20",   icon: "💡" },
            { label: "CTA",     desc: "Призыв к действию",        color: "border-emerald-700 bg-emerald-900/20",icon:"🎯"},
          ].map(s => (
            <div key={s.label} className={`border rounded-xl p-4 ${s.color}`}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-white font-bold text-sm mb-1">{s.label}</div>
              <div className="text-slate-400 text-xs">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-slate-400 text-xs uppercase tracking-wider mb-3">Идеи для видео ({youtube.ideas.length})</div>
        <div className="space-y-3">
          {youtube.ideas.map((idea: ScriptIdea) => (
            <div key={idea.id} className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
              <div className="flex items-start justify-between px-5 py-3 gap-3">
                <div className="min-w-0">
                  <div className="text-slate-100 font-semibold text-sm">{idea.title}</div>
                  <div className="text-slate-500 text-xs mt-0.5">~{idea.estimatedViews.toLocaleString("ru")} просмотров прогноз</div>
                </div>
                <button onClick={() => setOpen(open === idea.id ? null : idea.id)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex-shrink-0">
                  {open === idea.id ? "Скрыть ↑" : "Сценарий →"}
                </button>
              </div>
              {open === idea.id && (
                <div className="border-t border-slate-800 px-5 py-4 space-y-3">
                  {[
                    { label: "🎣 HOOK",    text: idea.hook    },
                    { label: "⚡ Проблема",text: idea.problem },
                    { label: "💡 Решение", text: idea.solution},
                    { label: "🎯 CTA",     text: idea.cta     },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-800/60 rounded-lg p-3">
                      <div className="text-slate-400 text-xs font-medium mb-1">{s.label}</div>
                      <div className="text-slate-200 text-sm">{s.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Shorts tab ─────────────────────────────────────────────────────────────

function ShortsTab({ report }: { report: ContentDirectorReport }) {
  const { shorts } = report;
  const BATCH = 5;
  const [offset, setOffset] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);

  const pool = shorts.pool;
  const visible = pool.slice(offset, offset + BATCH);
  const hasMore = offset + BATCH < pool.length;

  const refresh = () => {
    setOffset(prev => (prev + BATCH) % Math.max(pool.length, 1));
    setExpanded(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <KPICard icon="⚡" label="Всего Shorts"        value={shorts.totalShorts} />
        <KPICard icon="👁"  label="Просмотров"          value={shorts.totalViews.toLocaleString("ru")} />
        <KPICard icon="📈" label="Среднее на ролик"    value={shorts.avgViews.toLocaleString("ru")} />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-slate-400 text-xs uppercase tracking-wider">
          Идеи Shorts — сегодня ({visible.length} из {pool.length})
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700"
        >
          🔄 Новые идеи
        </button>
      </div>

      <div className="space-y-3">
        {visible.map((idea: ShortsIdea, idx) => (
          <div key={idea.id} className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
            <div className="flex items-start justify-between px-5 py-3 gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs flex-shrink-0 mt-0.5">
                  {offset + idx + 1}
                </div>
                <div className="min-w-0">
                  <div className="text-slate-100 font-semibold text-sm">{idea.title}</div>
                  <div className="text-slate-500 text-xs mt-0.5">{idea.targetChannel}</div>
                </div>
              </div>
              <button onClick={() => setExpanded(expanded === idea.id ? null : idea.id)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex-shrink-0">
                {expanded === idea.id ? "↑" : "Сценарий →"}
              </button>
            </div>
            {expanded === idea.id && (
              <div className="border-t border-slate-800 px-5 py-4 space-y-3">
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
                  <div className="text-red-400 text-xs font-medium mb-1">🎣 ХУК (первые 3 секунды)</div>
                  <div className="text-slate-200 text-sm font-medium">"{idea.hook}"</div>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-3">
                  <div className="text-slate-400 text-xs font-medium mb-2">📜 Сценарий</div>
                  <pre className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">{idea.script}</pre>
                </div>
                <div className="bg-emerald-900/20 border border-emerald-800 rounded-lg p-3">
                  <div className="text-emerald-400 text-xs font-medium mb-1">🎯 CTA</div>
                  <div className="text-slate-200 text-sm">{idea.cta}</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="text-center text-slate-500 text-xs">
          Ещё {pool.length - offset - BATCH} идей — нажмите «Новые идеи»
        </div>
      )}
    </div>
  );
}

// ── Image AI tab ───────────────────────────────────────────────────────────

function ImageTab({ report }: { report: ContentDirectorReport }) {
  const { imageAI } = report;
  const [copied, setCopied] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const copy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const channelLabels: Record<string, string> = { telegram: "Telegram", youtube: "YouTube", ads: "Реклама", blog: "Блог", all: "Все" };
  const filtered = filter === "all" ? imageAI.templates : imageAI.templates.filter(t => t.channel === filter);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard icon="🎨" label="Всего промптов"   value={imageAI.totalPrompts} />
        <KPICard icon="✈️" label="Для Telegram"    value={imageAI.byChannel.telegram} />
        <KPICard icon="▶️" label="Для YouTube"     value={imageAI.byChannel.youtube} />
        <KPICard icon="📢" label="Для рекламы"     value={imageAI.byChannel.ads} />
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "telegram", "youtube", "ads", "blog"].map(ch => (
          <button
            key={ch}
            onClick={() => setFilter(ch)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === ch ? "bg-slate-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"}`}
          >
            {channelLabels[ch] ?? ch}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((tpl: PromptTemplate) => (
          <div key={tpl.id} className="bg-slate-900 border border-slate-700 rounded-xl p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="text-slate-100 font-medium text-sm">{tpl.title}</div>
                <div className={`text-xs mt-0.5 ${CHANNEL_COLORS[tpl.channel] ?? "text-slate-500"}`}>
                  #{tpl.channel} · {tpl.tags.map(t => `#${t}`).join(" ")}
                </div>
              </div>
              <button
                onClick={() => copy(tpl.id, tpl.prompt)}
                className="flex-shrink-0 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
              >
                {copied === tpl.id ? "✓ Скопировано" : "📋 Копировать"}
              </button>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-3 font-mono text-xs text-slate-300 leading-relaxed">
              {tpl.prompt}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Director tab ───────────────────────────────────────────────────────────

function RecCard({ rec }: { rec: ContentRecommendation }) {
  const pc = PRI[rec.priority];
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

function TaskRow({ task }: { task: ContentTask }) {
  const pc = PRI[task.priority];
  const srcCls = { director: "text-blue-400", marketing: "text-purple-400", seo: "text-emerald-400", sales: "text-amber-400" }[task.source] ?? "text-slate-500";
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-800 last:border-0">
      <span className="text-lg flex-shrink-0">{TYPE_ICONS[task.type] ?? "📄"}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`px-1.5 py-0.5 rounded border text-xs font-bold ${pc.cls}`}>{task.priority}</span>
          <span className="text-slate-100 text-sm font-medium">{task.title}</span>
        </div>
        <div className="text-slate-400 text-xs">{task.description}</div>
      </div>
      <div className="flex-shrink-0 text-right">
        <div className="text-slate-300 text-xs">{task.deadline}</div>
        <div className={`text-xs ${srcCls}`}>{SOURCE_LABEL[task.source] ?? task.source}</div>
        <div className={`text-xs ${CHANNEL_COLORS[task.channel] ?? "text-slate-500"}`}>#{task.channel}</div>
      </div>
    </div>
  );
}

function DirectorTab({ report }: { report: ContentDirectorReport }) {
  const marketingTasks = report.tasks.filter(t => t.source === "marketing");
  const directorTasks  = report.tasks.filter(t => t.source !== "marketing");

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
        <div className="text-slate-400 text-xs uppercase tracking-wider mb-3">🤖 Content Director AI — Резюме</div>
        <p className="text-slate-200 leading-relaxed">{report.summary}</p>
      </div>

      {report.recommendations.length > 0 && (
        <div>
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-3">Рекомендации</div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {report.recommendations.map(rec => <RecCard key={rec.id} rec={rec} />)}
          </div>
        </div>
      )}

      {marketingTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="text-slate-400 text-xs uppercase tracking-wider">Задачи от Marketing AI</div>
            <span className="bg-purple-900/40 text-purple-300 border border-purple-700 text-xs px-2 py-0.5 rounded-full">{marketingTasks.length}</span>
          </div>
          <div className="bg-slate-900 border border-purple-800/50 rounded-xl px-4">
            {marketingTasks.map(task => <TaskRow key={task.id} task={task} />)}
          </div>
        </div>
      )}

      {directorTasks.length > 0 && (
        <div>
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-3">Задачи Content Director</div>
          <div className="bg-slate-900 border border-slate-700 rounded-xl px-4">
            {directorTasks.map(task => <TaskRow key={task.id} task={task} />)}
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
        <div className="text-slate-400 text-xs uppercase tracking-wider mb-3">📊 Отчёт для CEO AI</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Создано материалов",  value: String(report.kpis.totalMaterials),            icon: "📦" },
            { label: "Лучший канал",         value: "YouTube Shorts",                              icon: "🏆" },
            { label: "Лучший материал",      value: report.kpis.bestContent.split("—")[0].trim(), icon: "⭐" },
          ].map(m => (
            <div key={m.label} className="bg-slate-800/60 rounded-lg p-3">
              <div className="text-lg mb-1">{m.icon}</div>
              <div className="text-white font-semibold text-sm">{m.value}</div>
              <div className="text-slate-500 text-xs">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ContentDashboard({ initialReport }: Props) {
  const [report, setReport] = useState<ContentDirectorReport | null>(initialReport);
  const [tab, setTab]       = useState("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const generateReport = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/ai-company/content/report");
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
            <span className="text-slate-300">🎬 Контент</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Content Department AI</h1>
          <p className="text-slate-400 text-sm mt-1">Content Director · SEO AI · Telegram AI · YouTube AI · Shorts AI · Image AI</p>
        </div>
        <button
          onClick={generateReport}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:text-blue-400 text-white rounded-lg text-sm font-medium transition-colors flex-shrink-0"
        >
          {loading ? <><span className="animate-spin">⟳</span> Анализирую...</> : <>🤖 Сгенерировать отчёт</>}
        </button>
      </div>

      {error && <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm">Ошибка: {error}</div>}

      {!report && !loading && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-6xl mb-4">🎬</div>
          <div className="text-slate-300 text-lg font-medium mb-2">Content Director AI готов</div>
          <div className="text-slate-500 text-sm mb-6 max-w-sm">Нажмите «Сгенерировать отчёт» — AI проанализирует весь контент и даст план производства</div>
          <button onClick={generateReport} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors">🚀 Запустить анализ</button>
        </div>
      )}

      {loading && !report && (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="text-4xl animate-spin mb-4">⟳</div>
          <div className="text-slate-400 text-sm">Content Director AI создаёт отчёт...</div>
        </div>
      )}

      {report && (
        <>
          <div className="flex gap-1 bg-slate-900 border border-slate-700 rounded-xl p-1 overflow-x-auto">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${tab === t.id ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "overview"  && <OverviewTab  report={report} />}
          {tab === "seo"       && <SEOTab       report={report} />}
          {tab === "telegram"  && <TelegramTab  report={report} />}
          {tab === "youtube"   && <YouTubeTab   report={report} />}
          {tab === "shorts"    && <ShortsTab    report={report} />}
          {tab === "image"     && <ImageTab     report={report} />}
          {tab === "director"  && <DirectorTab  report={report} />}
        </>
      )}
    </div>
  );
}
