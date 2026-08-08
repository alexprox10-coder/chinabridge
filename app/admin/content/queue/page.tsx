"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import {
  catIcon,
  catLabel,
  platIcon,
  platLabel,
  statusColor,
  statusLabel,
  AUDIENCE_LABELS,
} from "@/lib/content/labels";

interface Post {
  id: number;
  title: string | null;
  body: string;
  platform: string;
  category: string;
  cta_type: string | null;
  cta_url: string | null;
  utm_content: string | null;
  image_prompt: string | null;
  audience: string | null;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  views: number;
  clicks: number;
  created_at?: string;
}

const FILTERS = [
  { id: "",          label: "Все" },
  { id: "generated", label: "Новые" },
  { id: "approved",  label: "Одобрено" },
  { id: "scheduled", label: "Запланировано" },
  { id: "published", label: "Опубликовано" },
  { id: "rejected",  label: "Отклонено" },
];

const PAGE_SIZE = 20;

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ContentQueuePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(0);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [tgConfigured, setTgConfigured] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadPosts = useCallback(() => {
    setLoading(true);
    fetch("/api/content/posts?limit=500")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setPosts(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadPosts();
    fetch("/api/content/publish")
      .then((r) => r.json())
      .then((d) => setTgConfigured(Boolean(d?.telegramConfigured)))
      .catch(() => {});
  }, [loadPosts]);

  useEffect(() => {
    setPage(0);
    setSelected(new Set());
  }, [filter]);

  const filtered = useMemo(
    () => (filter ? posts.filter((p) => p.status === filter) : posts),
    [posts, filter],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of posts) c[p.status] = (c[p.status] ?? 0) + 1;
    return c;
  }, [posts]);

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/content/posts?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadPosts();
  }

  async function bulkApprove() {
    if (!selected.size) return;
    setBusy(true);
    try {
      await Promise.all(
        [...selected].map((id) =>
          fetch(`/api/content/posts?id=${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "approved" }),
          }),
        ),
      );
      setSelected(new Set());
      loadPosts();
    } finally {
      setBusy(false);
    }
  }

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) =>
      prev.size === pageItems.length ? new Set() : new Set(pageItems.map((p) => p.id)),
    );
  }

  async function copyPost(p: Post) {
    const text = p.cta_url ? `${p.body}\n\n${p.cta_url}` : p.body;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(p.id);
      setTimeout(() => setCopiedId((c) => (c === p.id ? null : c)), 1500);
    } catch {
      setNotice("Не удалось скопировать — выделите текст вручную.");
    }
  }

  async function publishToTelegram(p: Post) {
    setNotice("");
    try {
      const res = await fetch("/api/content/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: p.id, platform: "telegram" }),
      });
      const data = await res.json();
      if (data?.ok) {
        setNotice(`✅ Опубликовано в ${data.channel ?? "@chinabridgeline"}`);
        loadPosts();
      } else {
        setNotice(
          data?.message ??
            "Добавьте TELEGRAM_BOT_TOKEN и TELEGRAM_CHANNEL_ID (@chinabridgeline) в переменные окружения Vercel.",
        );
      }
    } catch {
      setNotice("Ошибка сети при публикации.");
    }
  }

  return (
    <>
      <AdminNav />
      <main className="p-4 lg:p-8 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <span>🗂</span> Очередь постов
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Всего {posts.length} · одобрено {counts.approved ?? 0} · опубликовано{" "}
              {counts.published ?? 0}
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/admin/content"
              className="text-xs px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
            >
              ← К чату
            </a>
            <a
              href="/admin/content/calendar"
              className="text-xs px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
            >
              Календарь
            </a>
          </div>
        </div>

        {/* Telegram status */}
        {!tgConfigured && (
          <div className="mb-4 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-400 leading-relaxed">
            Автопубликация в Telegram отключена. Добавьте <code className="text-slate-300">TELEGRAM_BOT_TOKEN</code>{" "}
            и <code className="text-slate-300">TELEGRAM_CHANNEL_ID</code> (@chinabridgeline) в переменные окружения
            Vercel. Пока используйте «Копировать» и публикуйте вручную.
          </div>
        )}

        {/* Notice */}
        {notice && (
          <div className="mb-4 bg-amber-900/20 border border-amber-800/40 rounded-xl px-4 py-3 text-xs text-amber-300 flex items-start justify-between gap-3">
            <span className="leading-relaxed">{notice}</span>
            <button onClick={() => setNotice("")} className="text-amber-600 hover:text-amber-300 shrink-0">
              ✕
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto mb-4 pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filter === f.id
                  ? "bg-red-600/20 text-red-400 border-red-600/40"
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
              }`}
            >
              {f.label}
              {f.id && counts[f.id] ? ` (${counts[f.id]})` : ""}
            </button>
          ))}
        </div>

        {/* Bulk bar */}
        {pageItems.length > 0 && (
          <div className="flex items-center gap-3 mb-4 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5">
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.size > 0 && selected.size === pageItems.length}
                onChange={toggleSelectAll}
                className="accent-red-600"
              />
              Выбрать все на странице
            </label>
            <span className="text-xs text-slate-600">Выбрано: {selected.size}</span>
            <button
              onClick={bulkApprove}
              disabled={!selected.size || busy}
              className="ml-auto text-xs px-3 py-1.5 bg-blue-900/30 hover:bg-blue-900/50 disabled:opacity-40 text-blue-300 border border-blue-800/40 rounded-lg transition-colors"
            >
              {busy ? "Сохраняем…" : "Одобрить выбранные"}
            </button>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-slate-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : pageItems.length === 0 ? (
          <p className="text-sm text-slate-600 py-12 text-center">
            Постов с этим статусом нет.
          </p>
        ) : (
          <div className="space-y-3">
            {pageItems.map((p) => (
              <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">

                {/* Meta row */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggleSelect(p.id)}
                    className="accent-red-600"
                  />
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                    {catIcon(p.category)} {catLabel(p.category)}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                    {platIcon(p.platform)} {platLabel(p.platform)}
                  </span>
                  {p.audience && (
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-500 border border-slate-700">
                      {AUDIENCE_LABELS[p.audience] ?? p.audience}
                    </span>
                  )}
                  {p.cta_type && p.cta_type !== "none" && (
                    <span className="text-xs px-2 py-0.5 rounded-md bg-purple-900/30 text-purple-300 border border-purple-800/40">
                      CTA: {p.cta_type}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-md ml-auto ${statusColor(p.status)}`}>
                    {statusLabel(p.status)}
                  </span>
                </div>

                {p.title && (
                  <p className="text-sm font-semibold text-slate-100 mb-1.5">{p.title}</p>
                )}

                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap mb-3">
                  {p.body}
                </p>

                {p.cta_url && (
                  <p className="text-xs text-slate-500 mb-3 break-all">🔗 {p.cta_url}</p>
                )}

                {p.image_prompt && (
                  <p className="text-xs text-slate-600 italic mb-3">
                    Картинка: {p.image_prompt}
                  </p>
                )}

                <div className="flex items-center gap-3 text-xs text-slate-600 mb-3">
                  <span>#{p.id}</span>
                  <span>создан {fmtDate(p.created_at)}</span>
                  {p.published_at && <span>опубликован {fmtDate(p.published_at)}</span>}
                  {p.scheduled_at && <span>запланирован {fmtDate(p.scheduled_at)}</span>}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-1.5">
                  {p.status !== "approved" && p.status !== "published" && (
                    <button
                      onClick={() => updateStatus(p.id, "approved")}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 border border-blue-800/40 transition-colors"
                    >
                      Одобрить
                    </button>
                  )}
                  {p.status !== "scheduled" && p.status !== "published" && (
                    <button
                      onClick={() => updateStatus(p.id, "scheduled")}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-green-900/25 hover:bg-green-900/45 text-green-300 border border-green-800/40 transition-colors"
                    >
                      В очередь
                    </button>
                  )}
                  <button
                    onClick={() => copyPost(p)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                  >
                    {copiedId === p.id
                      ? "Скопировано"
                      : p.platform === "telegram"
                        ? "Копировать"
                        : "Копировать для ручной публикации"}
                  </button>
                  {p.platform === "telegram" && p.status !== "published" && (
                    <button
                      onClick={() => publishToTelegram(p)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                        tgConfigured
                          ? "bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-300 border-emerald-800/40"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-500 border-slate-700"
                      }`}
                    >
                      ✈️ Опубликовать в Telegram
                    </button>
                  )}
                  {p.status === "published" && (
                    <a
                      href="https://t.me/chinabridgeline"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                    >
                      Открыть канал
                    </a>
                  )}
                  {p.status !== "rejected" && (
                    <button
                      onClick={() => updateStatus(p.id, "rejected")}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-800/30 transition-colors ml-auto"
                    >
                      Отклонить
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 border border-slate-700 rounded-lg transition-colors"
            >
              ← Назад
            </button>
            <span className="text-xs text-slate-500">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 border border-slate-700 rounded-lg transition-colors"
            >
              Вперёд →
            </button>
          </div>
        )}
      </main>
    </>
  );
}
