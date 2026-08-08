"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { catIcon, catLabel, platIcon, statusColor, statusLabel } from "@/lib/content/labels";

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

interface Post {
  id: number;
  title: string | null;
  body: string;
  platform: string;
  category: string;
  cta_type: string | null;
  cta_url: string | null;
  audience: string | null;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  views: number;
  clicks: number;
  created_at?: string;
}

interface TodayStats {
  published: number;
  generated: number;
  approved: number;
  scheduled: number;
}

interface Analytics {
  ok: boolean;
  isDemoData: boolean;
  demoNotice?: string;
  today: TodayStats;
  topPosts: Post[];
  demoFunnel: Record<string, { views: number; clicks: number }>;
}

type PostFilter = "all" | "generated" | "approved" | "scheduled";

/* ── Constants ─────────────────────────────────────────────────────────────── */

const QUICK_ACTIONS = [
  { emoji: "📰", label: "Найти темы",      prompt: "Найди 5 актуальных тем для постов про импорт из Китая и маркетплейсы. Для каждой темы укажи категорию и приоритет." },
  { emoji: "✍️", label: "Написать пост",   prompt: "Напиши пост для Telegram в категории 'useful' про 5 ошибок при первой закупке товара в Китае. Добавь CTA калькулятора." },
  { emoji: "🗓", label: "План на день",    prompt: "Составь контент-план на сегодня: 4 поста для Telegram, 3 для VK, 1 для MAX. Распредели по времени с 8:30 до 20:00." },
  { emoji: "📊", label: "Отчёт",           prompt: "Дай отчёт по контенту за последние 7 дней: что опубликовано, какие темы дали лучший отклик, рекомендации." },
  { emoji: "🔍", label: "Площадки",        prompt: "Найди 5 Telegram-каналов для рекламы ChinaBridge: про WB, Ozon, импорт. Оцени каждый: аудитория, цена, рекомендация." },
  { emoji: "🤖", label: "AI контент",      prompt: "Напиши 3 поста для Telegram про AI-инструменты ChinaBridge: Product Finder, Supplier Finder, калькулятор. С CTA." },
  { emoji: "💰", label: "Рекламный пост",  prompt: "Напиши рекламный пост для Telegram (категория sales) про 14-дневный Trial ChinaBridge. Не агрессивно, через пользу." },
  { emoji: "🏭", label: "Поставщики",      prompt: "Напиши пост про то, как отличить фабрику от торгового посредника на 1688. Для категории supplier, аудитория: beginner." },
];

const FILTERS: { id: PostFilter; label: string }[] = [
  { id: "all",       label: "Все" },
  { id: "generated", label: "Новые" },
  { id: "approved",  label: "Одобрено" },
  { id: "scheduled", label: "В плане" },
];

const WELCOME: Message = {
  id: 0,
  role: "assistant",
  content: `Привет! Я AI-менеджер по контенту ChinaBridge.\n\nМогу помочь с:\n- Генерацией постов для Telegram, VK и MAX\n- Поиском актуальных тем\n- Контент-планом и расписанием публикаций\n- Поиском рекламных площадок\n- Отчётами по эффективности\n\nСгенерированные посты автоматически попадают в очередь справа.\n\nС чего начнём?`,
};

/* ── Simple inline markdown renderer ──────────────────────────────────────── */

function InlineMd({ text }: { text: string }) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="text-slate-100 font-semibold">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function MdLine({ line }: { line: string }) {
  if (line.startsWith("### ")) {
    return <p className="font-semibold text-slate-200 mt-3 mb-1 text-sm"><InlineMd text={line.slice(4)} /></p>;
  }
  if (line.startsWith("## ")) {
    return <p className="font-bold text-slate-100 mt-3 mb-1"><InlineMd text={line.slice(3)} /></p>;
  }
  if (line.match(/^[-*•]\s/)) {
    return (
      <div className="flex gap-2 my-0.5 leading-relaxed">
        <span className="text-slate-500 shrink-0 mt-0.5 select-none">•</span>
        <span><InlineMd text={line.slice(2)} /></span>
      </div>
    );
  }
  if (line.match(/^\d+\.\s/)) {
    const num = line.match(/^(\d+)\.\s/)![1];
    const rest = line.replace(/^\d+\.\s/, "");
    return (
      <div className="flex gap-2 my-0.5 leading-relaxed">
        <span className="text-slate-500 shrink-0 mt-0.5 select-none tabular-nums">{num}.</span>
        <span><InlineMd text={rest} /></span>
      </div>
    );
  }
  if (line === "") return <div className="h-2" />;
  return <p className="leading-relaxed"><InlineMd text={line} /></p>;
}

function MarkdownBlock({ content }: { content: string }) {
  if (!content) return <span className="inline-block w-2 h-4 bg-slate-400 animate-pulse rounded-sm" />;
  return (
    <div className="text-sm text-slate-300 space-y-0.5">
      {content.split("\n").map((line, i) => (
        <MdLine key={i} line={line} />
      ))}
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */

export function ContentPageClient() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [postFilter, setPostFilter] = useState<PostFilter>("all");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [tgConfigured, setTgConfigured] = useState(false);
  const [notice, setNotice] = useState("");
  const [schedulingId, setSchedulingId] = useState<number | null>(null);
  const [schedulingTime, setSchedulingTime] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* Session ID */
  useEffect(() => {
    const stored = localStorage.getItem("cb_content_session");
    const sid = stored || `cnt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    if (!stored) localStorage.setItem("cb_content_session", sid);
    setSessionId(sid);
  }, []);

  /* Posts */
  const loadPosts = useCallback(() => {
    fetch("/api/content/posts?limit=60")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setPosts(d))
      .catch(() => {});
  }, []);

  /* Analytics */
  const loadAnalytics = useCallback(() => {
    fetch("/api/content/analytics")
      .then((r) => r.json())
      .then((d: Analytics) => d?.ok && setAnalytics(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadPosts();
    loadAnalytics();
    fetch("/api/content/publish")
      .then((r) => r.json())
      .then((d) => setTgConfigured(Boolean(d?.telegramConfigured)))
      .catch(() => {});
  }, [loadPosts, loadAnalytics]);

  /* Auto-scroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* Send message */
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming || !sessionId) return;

      const msgId = Date.now();
      setMessages((prev) => [...prev, { id: msgId, role: "user", content: text.trim() }]);
      setInput("");
      setIsStreaming(true);

      const aiId = msgId + 1;
      setMessages((prev) => [...prev, { id: aiId, role: "assistant", content: "" }]);

      try {
        const res = await fetch("/api/content/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text.trim(), sessionId }),
        });

        if (!res.ok || !res.body) throw new Error("api_error");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let full = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (!data || data === "[DONE]") continue;
            try {
              const delta = JSON.parse(data) as string;
              full += delta;
              setMessages((prev) =>
                prev.map((m) => (m.id === aiId ? { ...m, content: full } : m)),
              );
            } catch {}
          }
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiId ? { ...m, content: "❌ Ошибка соединения. Попробуйте ещё раз." } : m,
          ),
        );
      } finally {
        setIsStreaming(false);
        inputRef.current?.focus();
        loadPosts();
        loadAnalytics();
      }
    },
    [sessionId, isStreaming, loadPosts, loadAnalytics],
  );

  /* Post actions */
  async function updatePostStatus(id: number, status: string) {
    await fetch(`/api/content/posts?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadPosts();
    loadAnalytics();
  }

  async function copyPost(post: Post) {
    const text = post.cta_url ? `${post.body}\n\n${post.cta_url}` : post.body;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(post.id);
      setTimeout(() => setCopiedId((c) => (c === post.id ? null : c)), 1500);
    } catch {
      setNotice("Не удалось скопировать — выделите текст вручную.");
    }
  }

  async function publishToTelegram(post: Post) {
    setNotice("");
    try {
      const res = await fetch("/api/content/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, platform: "telegram" }),
      });
      const data = await res.json();
      if (data?.ok) {
        setNotice(`✅ Опубликовано в ${data.channel ?? "@chinabridgeline"}`);
        loadPosts();
        loadAnalytics();
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

  async function schedulePost(post: Post, isoTime: string) {
    setNotice("");
    try {
      const res = await fetch(`/api/content/posts?id=${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "scheduled", scheduled_at: isoTime }),
      });
      const data = await res.json();
      if (data?.ok) {
        setNotice(`Запланировано: ${new Date(isoTime).toLocaleString("ru-RU")}`);
      } else {
        setNotice("Ошибка планирования. Попробуйте ещё раз.");
      }
    } catch {
      setNotice("Ошибка сети при планировании.");
    } finally {
      setSchedulingId(null);
      setSchedulingTime("");
      loadPosts();
      loadAnalytics();
    }
  }

  /* Handle textarea enter */
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const visiblePosts = posts.filter((p) => {
    if (postFilter === "all") return p.status !== "rejected";
    return p.status === postFilter;
  });

  const today = analytics?.today;

  return (
    /* Fixed overlay: fills viewport minus sidebar (lg:left-64) and mobile bars */
    <div className="fixed top-12 bottom-16 left-0 right-0 lg:top-0 lg:bottom-0 lg:left-64 flex flex-col bg-slate-950 overflow-hidden z-10">

      {/* ── Header ── */}
      <div className="flex-shrink-0 h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <span className="text-xl">📝</span>
          <div>
            <p className="text-sm font-bold text-slate-100 leading-none">Content AI</p>
            <p className="text-xs text-slate-500 mt-0.5">AI-менеджер по контенту ChinaBridge</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/admin/content/queue"
            className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
          >
            Очередь
          </a>
          <a
            href="/admin/content/calendar"
            className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
          >
            Календарь
          </a>
          <a
            href="/admin/content/channels"
            className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors hidden sm:inline-flex"
          >
            Площадки
          </a>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: Chat ── */}
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">

          {/* Quick actions */}
          <div className="flex-shrink-0 flex gap-2 overflow-x-auto px-4 py-2.5 border-b border-slate-800 scrollbar-hide">
            {QUICK_ACTIONS.map((qa) => (
              <button
                key={qa.label}
                onClick={() => sendMessage(qa.prompt)}
                disabled={isStreaming}
                className="flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-slate-300 rounded-full transition-colors cursor-pointer"
              >
                <span>{qa.emoji}</span>
                <span className="whitespace-nowrap">{qa.label}</span>
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-red-600/20 border border-red-600/30 flex items-center justify-center text-sm shrink-0 mr-2 mt-0.5">
                    📝
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-red-600/20 border border-red-600/30 text-slate-200 text-sm"
                      : "bg-slate-900 border border-slate-800"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <MarkdownBlock content={msg.content} />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 p-4 border-t border-slate-800 bg-slate-900/50">
            <div className="flex gap-3 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
                rows={2}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-600/50 focus:border-red-600/50 resize-none disabled:opacity-50 transition-colors"
                placeholder="Тема поста или задача... (Enter — отправить, Shift+Enter — перенос строки)"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={isStreaming || !input.trim()}
                className="flex-shrink-0 w-10 h-10 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors"
              >
                {isStreaming ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="text-sm">↑</span>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-1.5">
              Посты из ответов AI сохраняются в очередь автоматически
            </p>
          </div>
        </div>

        {/* ── Right: Content queue ── */}
        <div className="hidden lg:flex flex-col w-80 xl:w-96 flex-shrink-0 border-l border-slate-800 overflow-y-auto bg-slate-900/30">

          {/* Today stats */}
          <div className="flex-shrink-0 p-4 border-b border-slate-800">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Статистика сегодня
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: "Новых",  value: today?.generated ?? 0, color: "text-slate-200" },
                { label: "Одобр.", value: today?.approved ?? 0,  color: "text-blue-300" },
                { label: "В плане",value: today?.scheduled ?? 0, color: "text-green-300" },
                { label: "Опубл.", value: today?.published ?? 0, color: "text-emerald-300" },
              ].map((s) => (
                <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-center">
                  <p className={`font-bold text-base leading-none ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-slate-500 mt-1 truncate">{s.label}</p>
                </div>
              ))}
            </div>
            {analytics?.isDemoData && (
              <p className="text-[10px] text-amber-600/80 mt-2 leading-snug">
                Счётчики постов реальные. Воронка показов — ДЕМО.
              </p>
            )}
          </div>

          {/* Queue header + filters */}
          <div className="flex-shrink-0 px-4 pt-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Очередь постов
            </p>
          </div>
          <div className="flex-shrink-0 flex border-b border-slate-800 px-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setPostFilter(f.id)}
                className={`flex-1 text-xs py-2 font-medium transition-colors ${
                  postFilter === f.id
                    ? "text-red-400 border-b-2 border-red-500"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Notice */}
          {notice && (
            <div className="mx-4 mt-3 bg-amber-900/20 border border-amber-800/40 rounded-lg px-3 py-2 text-xs text-amber-300 leading-snug">
              {notice}
              <button
                onClick={() => setNotice("")}
                className="ml-2 text-amber-600 hover:text-amber-300"
              >
                ✕
              </button>
            </div>
          )}

          {/* Posts */}
          <div className="p-4 space-y-2.5">
            {visiblePosts.length === 0 && (
              <p className="text-xs text-slate-600">
                Постов пока нет. Попросите AI написать пост — он появится здесь.
              </p>
            )}

            {visiblePosts.map((p) => (
              <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                    {catIcon(p.category)} {catLabel(p.category)}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                    {platIcon(p.platform)}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-md ml-auto ${statusColor(p.status)}`}>
                    {statusLabel(p.status)}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-2.5 whitespace-pre-wrap">
                  {p.body.length > 100 ? `${p.body.slice(0, 100)}…` : p.body}
                </p>

                <div className="flex flex-wrap gap-1">
                  {p.status !== "approved" && p.status !== "published" && (
                    <button
                      onClick={() => updatePostStatus(p.id, "approved")}
                      className="text-[11px] px-2 py-1 rounded-md bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 border border-blue-800/40 transition-colors"
                    >
                      Одобрить
                    </button>
                  )}
                  {p.status !== "scheduled" && p.status !== "published" && (
                    <button
                      onClick={() => updatePostStatus(p.id, "scheduled")}
                      className="text-[11px] px-2 py-1 rounded-md bg-green-900/25 hover:bg-green-900/45 text-green-300 border border-green-800/40 transition-colors"
                    >
                      В очередь
                    </button>
                  )}
                  {p.status === "approved" && (
                    schedulingId === p.id ? (
                      <div className="flex items-center gap-1 w-full mt-1">
                        <input
                          type="datetime-local"
                          value={schedulingTime}
                          onChange={(e) => setSchedulingTime(e.target.value)}
                          className="flex-1 text-[11px] bg-slate-800 border border-slate-600 rounded-md px-1.5 py-1 text-white focus:outline-none focus:ring-1 focus:ring-green-600/50"
                        />
                        <button
                          onClick={() => schedulingTime && schedulePost(p, new Date(schedulingTime).toISOString())}
                          disabled={!schedulingTime}
                          className="text-[11px] px-2 py-1 rounded-md bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white border border-green-700 transition-colors whitespace-nowrap"
                        >
                          OK
                        </button>
                        <button
                          onClick={() => { setSchedulingId(null); setSchedulingTime(""); }}
                          className="text-[11px] px-1.5 py-1 rounded-md text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSchedulingId(p.id);
                          // Pre-fill with 1 hour from now
                          const d = new Date(Date.now() + 3600_000);
                          const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                          setSchedulingTime(local);
                        }}
                        className="text-[11px] px-2 py-1 rounded-md bg-violet-900/30 hover:bg-violet-900/50 text-violet-300 border border-violet-800/40 transition-colors"
                      >
                        Запланировать
                      </button>
                    )
                  )}
                  <button
                    onClick={() => copyPost(p)}
                    className="text-[11px] px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                  >
                    {copiedId === p.id ? "Скопировано" : "Копировать"}
                  </button>
                  {p.platform === "telegram" && p.status !== "published" && (
                    <button
                      onClick={() => publishToTelegram(p)}
                      title={
                        tgConfigured
                          ? "Опубликовать в @chinabridgeline"
                          : "Требуется TELEGRAM_BOT_TOKEN"
                      }
                      className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${
                        tgConfigured
                          ? "bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-300 border-emerald-800/40"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-500 border-slate-700"
                      }`}
                    >
                      ✈️ Опубликовать
                    </button>
                  )}
                  {p.status !== "rejected" && (
                    <button
                      onClick={() => updatePostStatus(p.id, "rejected")}
                      className="text-[11px] px-2 py-1 rounded-md bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-800/30 transition-colors"
                    >
                      Отклонить
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
