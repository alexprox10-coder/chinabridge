"use client";
import { useState, useEffect, useMemo } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { catIcon, catLabel, platIcon, platLabel } from "@/lib/content/labels";

interface Post {
  id: number;
  title: string | null;
  body: string;
  platform: string;
  category: string;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  created_at?: string;
}

interface Schedule {
  platform: string;
  posts_per_day: number;
  min_interval_minutes: number;
  posting_times: string;
  is_active: boolean;
}

const CHIP_COLORS: Record<string, string> = {
  published: "bg-green-900/30 border-green-700/40 text-green-300",
  scheduled: "bg-amber-900/25 border-amber-700/40 text-amber-300",
  approved: "bg-blue-900/30 border-blue-700/40 text-blue-300",
};

const WEEKDAYS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

/* Local YYYY-MM-DD — avoids the UTC shift that toISOString() would cause. */
function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function postDate(p: Post): Date | null {
  const raw = p.published_at ?? p.scheduled_at ?? p.created_at ?? null;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseTimes(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export default function ContentCalendarPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0); // week offset in days (0 = starts today)

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/content/posts?limit=500").then((r) => r.json()),
      fetch("/api/content/schedule").then((r) => r.json()),
    ])
      .then(([p, s]) => {
        if (Array.isArray(p)) {
          setPosts(
            (p as Post[]).filter((x) =>
              ["approved", "scheduled", "published"].includes(x.status),
            ),
          );
        }
        if (Array.isArray(s)) setSchedule(s as Schedule[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* 7 days starting from today + offset */
  const days = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    base.setDate(base.getDate() + offset);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d;
    });
  }, [offset]);

  const byDay = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const p of posts) {
      const d = postDate(p);
      if (!d) continue;
      const k = dayKey(d);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(p);
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        const da = postDate(a)?.getTime() ?? 0;
        const db = postDate(b)?.getTime() ?? 0;
        return da - db;
      });
    }
    return map;
  }, [posts]);

  const todayKey = dayKey(new Date());

  return (
    <>
      <AdminNav />
      <main className="p-4 lg:p-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <span>🗓</span> Контент-календарь
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              7 дней · одобренные, запланированные и опубликованные посты
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setOffset((o) => o - 7)}
              className="text-xs px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
            >
              ← Неделя
            </button>
            <button
              onClick={() => setOffset(0)}
              className="text-xs px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
            >
              Сегодня
            </button>
            <button
              onClick={() => setOffset((o) => o + 7)}
              className="text-xs px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
            >
              Неделя →
            </button>
            <a
              href="/admin/content"
              className="text-xs px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
            >
              ← К чату
            </a>
          </div>
        </div>

        {/* Posting schedule */}
        <div className="mb-6 bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Слоты публикации
          </p>
          {schedule.length === 0 ? (
            <p className="text-xs text-slate-600">Расписание не настроено.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-3">
              {schedule.map((s) => (
                <div key={s.platform} className="bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-200">
                      {platIcon(s.platform)} {platLabel(s.platform)}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        s.is_active
                          ? "bg-green-900/40 text-green-300"
                          : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      {s.is_active ? "активен" : "выкл"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {s.posts_per_day} постов/день · интервал {s.min_interval_minutes} мин
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {parseTimes(s.posting_times).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded border border-slate-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Calendar */}
        {loading ? (
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-7">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-48 bg-slate-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-7">
            {days.map((d) => {
              const k = dayKey(d);
              const items = byDay.get(k) ?? [];
              const isToday = k === todayKey;
              return (
                <div
                  key={k}
                  className={`rounded-xl border p-2.5 min-h-[12rem] ${
                    isToday
                      ? "bg-red-950/20 border-red-800/40"
                      : "bg-slate-900 border-slate-800"
                  }`}
                >
                  <div className="flex items-baseline justify-between mb-2">
                    <span
                      className={`text-xs font-semibold ${
                        isToday ? "text-red-400" : "text-slate-300"
                      }`}
                    >
                      {isToday ? "Сегодня" : WEEKDAYS[d.getDay()]}
                    </span>
                    <span className="text-[10px] text-slate-600">
                      {String(d.getDate()).padStart(2, "0")}.
                      {String(d.getMonth() + 1).padStart(2, "0")}
                    </span>
                  </div>

                  {items.length === 0 && (
                    <p className="text-[10px] text-slate-700">Пусто</p>
                  )}

                  <div className="space-y-1.5">
                    {items.map((p) => (
                      <a
                        key={p.id}
                        href="/admin/content/queue"
                        title={p.title ?? p.body.slice(0, 200)}
                        className={`block rounded-lg border px-2 py-1.5 text-[11px] leading-snug transition-opacity hover:opacity-80 ${
                          CHIP_COLORS[p.status] ?? "bg-slate-800 border-slate-700 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-1 mb-0.5">
                          <span>{platIcon(p.platform)}</span>
                          <span className="opacity-70 truncate">
                            {catIcon(p.category)} {catLabel(p.category)}
                          </span>
                        </div>
                        <span className="block truncate opacity-90">
                          {p.title ?? `${p.body.slice(0, 40)}…`}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-5 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-green-900/40 border border-green-700/40 inline-block" />
            Опубликовано
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-900/30 border border-amber-700/40 inline-block" />
            Запланировано
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-900/30 border border-blue-700/40 inline-block" />
            Одобрено
          </span>
        </div>
      </main>
    </>
  );
}
