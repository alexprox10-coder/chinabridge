"use client";
import { useState, useEffect, useRef, useCallback } from "react";

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

interface Memory {
  key: string;
  value: string;
  category: string;
}

interface KPI {
  visitors: number;
  leads: number;
  payments: number;
  spend_rub: number;
  revenue_rub: number;
  cpl: number | null;
  cac: number | null;
  roas: number | null;
  avg_check_rub: number | null;
  conversion_visitor_to_lead_pct: number;
  conversion_lead_to_payment_pct: number;
}

interface FunnelStep {
  stage: string;
  label: string;
  count: number;
  pct: number;
}

interface Channel {
  name: string;
  platform: string;
  spend_rub: number;
  leads: number;
  payments: number;
  cpl: number | null;
  cac: number | null;
  isDemo: boolean;
}

interface Analytics {
  ok: boolean;
  isDemoData: boolean;
  demoNotice: string;
  channelsAreReal: boolean;
  period: string;
  periodLabel: string;
  kpi: KPI;
  funnel: FunnelStep[];
  channels: Channel[];
}

type Period = "today" | "7d" | "30d" | "90d";

/* ── Constants ─────────────────────────────────────────────────────────────── */

const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "День" },
  { id: "7d",    label: "7 дней" },
  { id: "30d",   label: "30 дней" },
  { id: "90d",   label: "90 дней" },
];

const QUICK_ACTIONS = [
  { emoji: "💰", label: "Анализ бюджета",  prompt: "Проанализируй текущее распределение маркетингового бюджета. Какой канал даёт лучший ROI? Где сократить, куда добавить?" },
  { emoji: "📊", label: "Недельный отчёт", prompt: "Составь недельный маркетинговый отчёт: ключевые метрики, что сработало, что нет, задачи на следующую неделю." },
  { emoji: "🔍", label: "Найти партнёров",  prompt: "Найди 5 конкретных Telegram-каналов или YouTube-каналов о WB, Ozon, ВЭД с аудиторией от 5 000, где можно разместить рекламу ChinaBridge. Назови реальные каналы." },
  { emoji: "📣", label: "Медиаплан",       prompt: "Составь медиаплан на следующий месяц с бюджетом 50 000 ₽: каналы, форматы, KPI, UTM-метки." },
  { emoji: "🎯", label: "Снизить CPL",     prompt: "Как снизить CPL? Проанализируй воронку, найди узкие места, предложи конкретные действия с цифрами." },
  { emoji: "💡", label: "A/B тест",         prompt: "Предложи 3 гипотезы для A/B теста: оффер, заголовок или аудитория. Как измерить результат и когда останавливать?" },
  { emoji: "📱", label: "Telegram",         prompt: "Разработай Telegram-стратегию для ChinaBridge: какие каналы покупать рекламу, контент-план, механика лидогенерации через бот." },
  { emoji: "📈", label: "Масштабирование", prompt: "Если маркетинговый бюджет вырастет вдвое — куда вложить? Обоснуй расчётами на основе текущих метрик." },
];

const WELCOME: Message = {
  id: 0,
  role: "assistant",
  content: `Привет! Я AI-директор по маркетингу ChinaBridge.\n\nМогу помочь с:\n- Анализом каналов и метрик\n- Составлением медиапланов и кампаний\n- Поиском партнёров и площадок\n- Созданием UTM-меток и A/B тестов\n- Еженедельными отчётами\n\nС чего начнём?`,
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

/* ── Number formatting ────────────────────────────────────────────────────── */

const fmtRub = (n: number | null) =>
  n == null ? "—" : `${Math.round(n).toLocaleString("ru-RU")} ₽`;
const fmtNum = (n: number | null) =>
  n == null ? "—" : Math.round(n).toLocaleString("ru-RU");
const fmtPct = (n: number | null) => (n == null ? "—" : `${n.toFixed(1)}%`);

/* ── KPI card ─────────────────────────────────────────────────────────────── */

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3 border ${
        accent
          ? "bg-red-900/20 border-red-800/40"
          : "bg-slate-900 border-slate-800"
      }`}
    >
      <p className="text-xs text-slate-500 mb-1 truncate">{label}</p>
      <p className={`font-bold text-base leading-none ${accent ? "text-red-300" : "text-slate-100"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-slate-600 mt-1 truncate">{sub}</p>}
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */

export function MarketingPageClient() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [period, setPeriod] = useState<Period>("30d");
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [showMemory, setShowMemory] = useState(false);
  const [newMemKey, setNewMemKey] = useState("");
  const [newMemVal, setNewMemVal] = useState("");
  const [savingMem, setSavingMem] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* Session ID */
  useEffect(() => {
    const stored = localStorage.getItem("cb_mkt_session");
    const sid = stored || `mkt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    if (!stored) localStorage.setItem("cb_mkt_session", sid);
    setSessionId(sid);
  }, []);

  /* Analytics */
  useEffect(() => {
    setAnalyticsLoading(true);
    fetch(`/api/marketing/analytics?period=${period}`)
      .then((r) => r.json())
      .then((d: Analytics) => setAnalytics(d))
      .catch(() => {})
      .finally(() => setAnalyticsLoading(false));
  }, [period]);

  /* Memories */
  const loadMemories = useCallback(() => {
    fetch("/api/marketing/memory")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setMemories(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

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
        const res = await fetch("/api/marketing/chat", {
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
      }
    },
    [sessionId, isStreaming],
  );

  /* Save memory */
  async function saveMemory() {
    if (!newMemKey.trim() || !newMemVal.trim()) return;
    setSavingMem(true);
    try {
      await fetch("/api/marketing/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: newMemKey.trim(), value: newMemVal.trim(), category: "owner" }),
      });
      setNewMemKey("");
      setNewMemVal("");
      loadMemories();
    } finally {
      setSavingMem(false);
    }
  }

  async function deleteMemory(key: string) {
    await fetch(`/api/marketing/memory?key=${encodeURIComponent(key)}`, { method: "DELETE" });
    loadMemories();
  }

  /* Handle textarea enter */
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const kpi = analytics?.kpi;
  const funnel = analytics?.funnel ?? [];
  const channels = analytics?.channels ?? [];

  return (
    /* Fixed overlay: fills viewport minus sidebar (lg:left-64) and mobile bars */
    <div className="fixed top-12 bottom-16 left-0 right-0 lg:top-0 lg:bottom-0 lg:left-64 flex flex-col bg-slate-950 overflow-hidden z-10">

      {/* ── Header ── */}
      <div className="flex-shrink-0 h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <span className="text-xl">📣</span>
          <div>
            <p className="text-sm font-bold text-slate-100 leading-none">Marketing AI</p>
            <p className="text-xs text-slate-500 mt-0.5">AI-директор по маркетингу ChinaBridge</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/admin/marketing/campaigns"
            className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
          >
            Кампании
          </a>
          <a
            href="/admin/marketing/partners"
            className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
          >
            Партнёры
          </a>
          <a
            href="/admin/marketing/integrations"
            className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors hidden sm:inline-flex"
          >
            Интеграции
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
                    📣
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
                placeholder="Напишите задачу... (Enter — отправить, Shift+Enter — перенос строки)"
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
              История диалога сохраняется автоматически
            </p>
          </div>
        </div>

        {/* ── Right: Analytics panel ── */}
        <div className="hidden xl:flex flex-col w-80 flex-shrink-0 border-l border-slate-800 overflow-y-auto bg-slate-900/30">

          {/* Period tabs */}
          <div className="flex-shrink-0 flex border-b border-slate-800">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`flex-1 text-xs py-2.5 font-medium transition-colors ${
                  period === p.id
                    ? "text-red-400 border-b-2 border-red-500 bg-red-600/5"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-4">

            {/* Demo notice */}
            {analytics?.isDemoData && (
              <div className="bg-amber-900/20 border border-amber-800/40 rounded-lg px-3 py-2 text-xs text-amber-400">
                ДЕМО-данные. Подключите GA4 / Метрику для реальных цифр.
              </div>
            )}

            {/* KPI grid */}
            {analyticsLoading ? (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 bg-slate-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : kpi ? (
              <div className="grid grid-cols-2 gap-2">
                <KpiCard label="Посетители" value={fmtNum(kpi.visitors)} />
                <KpiCard label="Лиды" value={fmtNum(kpi.leads)} sub={fmtPct(kpi.conversion_visitor_to_lead_pct)} />
                <KpiCard label="Оплаты" value={fmtNum(kpi.payments)} sub={fmtPct(kpi.conversion_lead_to_payment_pct)} />
                <KpiCard label="Расход" value={fmtRub(kpi.spend_rub)} />
                <KpiCard label="CPL" value={fmtRub(kpi.cpl)} accent />
                <KpiCard label="CAC" value={fmtRub(kpi.cac)} sub={`ROAS ${kpi.roas?.toFixed(1) ?? "—"}x`} accent />
              </div>
            ) : null}

            {/* Funnel */}
            {funnel.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Воронка</p>
                <div className="space-y-2">
                  {funnel.map((step) => (
                    <div key={step.stage}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-400 truncate">{step.label}</span>
                        <span className="text-slate-300 ml-2 shrink-0">{fmtNum(step.count)}</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-600/70 rounded-full transition-all duration-500"
                          style={{ width: `${step.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Channels */}
            {channels.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Каналы {!analytics?.channelsAreReal && <span className="text-amber-600 normal-case font-normal">(ДЕМО)</span>}
                </p>
                <div className="space-y-1.5">
                  {channels.map((ch) => (
                    <div key={ch.name} className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs font-medium text-slate-200 truncate">{ch.name}</p>
                        <span className="text-xs text-slate-500 ml-1 shrink-0">{fmtNum(ch.leads)} лид</span>
                      </div>
                      <div className="flex gap-3 text-xs text-slate-500">
                        <span>CPL {fmtRub(ch.cpl)}</span>
                        <span>CAC {fmtRub(ch.cac)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Memory */}
            <div>
              <button
                onClick={() => setShowMemory((v) => !v)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
              >
                <span>Память AI ({memories.length})</span>
                <span>{showMemory ? "▲" : "▼"}</span>
              </button>

              {showMemory && (
                <div className="mt-2 space-y-2">
                  {memories.length === 0 && (
                    <p className="text-xs text-slate-600">Нет сохранённых инструкций</p>
                  )}
                  {memories.map((m) => (
                    <div key={m.key} className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 group">
                      <div className="flex justify-between items-start gap-1">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-300 truncate">{m.key}</p>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{m.value}</p>
                        </div>
                        <button
                          onClick={() => deleteMemory(m.key)}
                          className="text-slate-700 hover:text-red-400 transition-colors shrink-0 opacity-0 group-hover:opacity-100 text-xs mt-0.5"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="space-y-1.5 pt-1 border-t border-slate-800">
                    <input
                      value={newMemKey}
                      onChange={(e) => setNewMemKey(e.target.value)}
                      placeholder="Ключ (напр. 'стратегия 2026')"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-red-600/40"
                    />
                    <input
                      value={newMemVal}
                      onChange={(e) => setNewMemVal(e.target.value)}
                      placeholder="Значение / инструкция"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-red-600/40"
                    />
                    <button
                      onClick={saveMemory}
                      disabled={savingMem || !newMemKey.trim() || !newMemVal.trim()}
                      className="w-full text-xs py-1.5 bg-red-600/20 hover:bg-red-600/30 disabled:opacity-40 border border-red-600/30 text-red-400 rounded-lg transition-colors"
                    >
                      {savingMem ? "Сохраняем…" : "Запомнить"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
