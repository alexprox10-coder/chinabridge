"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { AdminNav } from "@/components/admin/AdminNav";

interface Message {
  id?: number;
  role: "user" | "assistant";
  content: string;
  model?: string;
  created_at?: string;
}

const MODELS = [
  { id: "anthropic/claude-opus-4-5", label: "Opus 4.5 (умнее)" },
  { id: "anthropic/claude-sonnet-4-5", label: "Sonnet 4.5 (быстрее)" },
  { id: "anthropic/claude-haiku-4-5", label: "Haiku 4.5 (дешевле)" },
  { id: "openai/gpt-4o", label: "GPT-4o" },
];

const QUICK_PROMPTS = [
  "Что сейчас приоритетнее всего по трафику?",
  "Проанализируй текущую воронку Outbound AI",
  "Помоги написать VK Ads текст для KZ авто-аксессуары",
  "Что незакончено по ChinaBridge?",
  "Какие лиды сейчас в стадии READY_TO_CONTACT?",
  "Предложи план на эту неделю",
];

function UserBubble({ msg }: { msg: Message }) {
  return (
    <div className="flex justify-end mb-4">
      <div className="max-w-[75%]">
        <div className="px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed" style={{ background: "#2563EB", color: "#fff" }}>
          {msg.content}
        </div>
        {msg.created_at && (
          <div className="text-right text-xs mt-1" style={{ color: "#9CA3AF" }}>
            {new Date(msg.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
      </div>
    </div>
  );
}

function AssistantBubble({ msg, streaming }: { msg: Message; streaming?: boolean }) {
  // Simple markdown: bold, code blocks, inline code
  const formatted = msg.content
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_: string, _lang: string, code: string) =>
      `<pre style="background:#1e293b;color:#e2e8f0;padding:12px;border-radius:8px;overflow-x:auto;font-size:12px;margin:8px 0"><code>${code.replace(/</g, "&lt;")}</code></pre>`)
    .replace(/`([^`]+)`/g, '<code style="background:#F3F4F6;padding:1px 5px;border-radius:4px;font-size:12px">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");

  return (
    <div className="flex justify-start mb-4">
      <div className="flex gap-2.5 max-w-[85%]">
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-sm" style={{ background: "#EEF2FF" }}>
          🤖
        </div>
        <div className="flex-1">
          <div className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed"
            style={{ background: "#fff", color: "#111827", border: "1px solid #E5E7EB" }}>
            {msg.content
              ? <span dangerouslySetInnerHTML={{ __html: formatted }} />
              : streaming
                ? <span className="animate-pulse" style={{ color: "#9CA3AF" }}>Думаю...</span>
                : null}
            {streaming && msg.content && <span className="animate-pulse ml-0.5" style={{ color: "#6366F1" }}>▋</span>}
          </div>
          {msg.created_at && (
            <div className="text-xs mt-1 ml-1" style={{ color: "#9CA3AF" }}>
              {new Date(msg.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
              {msg.model && ` · ${msg.model.split("/").pop()}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DateDivider({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 my-3">
      <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
      <span className="text-xs px-2" style={{ color: "#9CA3AF" }}>{date}</span>
      <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
    </div>
  );
}

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [model, setModel] = useState("anthropic/claude-opus-4-5");
  const [streamingMsg, setStreamingMsg] = useState<Message | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load history on mount
  useEffect(() => {
    fetch("/api/admin/ai-chat")
      .then(r => r.json())
      .then(d => {
        if (d.ok) setMessages(d.messages ?? []);
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMsg]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [input]);

  const send = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setLoading(true);

    const now = new Date().toISOString();
    const userMsg: Message = { role: "user", content: msg, created_at: now };
    setMessages(prev => [...prev, userMsg]);

    const streamMsg: Message = { role: "assistant", content: "", model, created_at: now };
    setStreamingMsg(streamMsg);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const res = await fetch("/api/admin/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, model }),
        signal: abort.signal,
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              fullText += parsed.text;
              setStreamingMsg(prev => prev ? { ...prev, content: fullText } : null);
            }
          } catch { /* ignore */ }
        }
      }

      const assistantMsg: Message = { role: "assistant", content: fullText, model, created_at: new Date().toISOString() };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setMessages(prev => [...prev, { role: "assistant", content: `❌ Ошибка: ${String(e)}`, created_at: new Date().toISOString() }]);
      }
    } finally {
      setLoading(false);
      setStreamingMsg(null);
      abortRef.current = null;
    }
  }, [input, model, loading]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const stop = () => { abortRef.current?.abort(); setLoading(false); setStreamingMsg(null); };

  const clearHistory = async () => {
    if (!confirm("Очистить всю историю? Это нельзя отменить.")) return;
    await fetch("/api/admin/ai-chat", { method: "DELETE" });
    setMessages([]);
  };

  const exportForClaudeCode = () => {
    const last50 = messages.slice(-50);
    const text = [
      "=== ИСТОРИЯ РАЗГОВОРОВ ИЗ ADMIN AI CHAT ===",
      `Экспортировано: ${new Date().toLocaleString("ru-RU")}`,
      `Всего сообщений: ${messages.length}`,
      "",
      "Прочитай эту историю и продолжи работу с того места где остановились:",
      "",
      ...last50.map(m =>
        `[${m.role === "user" ? "Я" : "Claude"}] ${m.created_at ? new Date(m.created_at).toLocaleString("ru-RU") : ""}:\n${m.content}`
      ),
      "",
      "=== КОНЕЦ ИСТОРИИ ==="
    ].join("\n\n");
    navigator.clipboard.writeText(text);
    alert(`Скопировано ${last50.length} сообщений. Вставь в Claude Code чтобы продолжить.`);
  };

  // Group messages by date for dividers
  let lastDate = "";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F3F4F6", color: "#111827" }}>
      <style>{`textarea{color:#111827!important;-webkit-text-fill-color:#111827!important;background:#fff!important;} pre{white-space:pre-wrap;word-break:break-word}`}</style>
      <AdminNav />

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-4" style={{ height: "calc(100vh - 64px)" }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#111827" }}>💬 AI Ассистент</h1>
            <p className="text-xs" style={{ color: "#6B7280" }}>
              {messages.length > 0 ? `${messages.length} сообщений · история сохраняется навсегда` : "история сохраняется навсегда"}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <select value={model} onChange={e => setModel(e.target.value)}
              className="text-xs px-2 py-1 border rounded-lg" style={{ color: "#374151", background: "#fff" }}>
              {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
            {messages.length > 0 && (
              <>
                <button onClick={exportForClaudeCode}
                  className="text-xs px-2 py-1 rounded-lg border"
                  style={{ color: "#7C3AED", borderColor: "#DDD6FE", background: "#F5F3FF" }}
                  title="Скопировать историю для вставки в Claude Code">
                  📋 Экспорт
                </button>
                <button onClick={clearHistory} className="text-xs px-2 py-1 rounded-lg border"
                  style={{ color: "#DC2626", borderColor: "#FECACA", background: "#FEF2F2" }}>
                  🗑
                </button>
              </>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto rounded-xl border bg-white p-4 mb-3" style={{ minHeight: 0 }}>

          {historyLoading && (
            <div className="flex items-center justify-center h-full" style={{ color: "#9CA3AF" }}>
              <span className="animate-pulse text-sm">Загружаю историю...</span>
            </div>
          )}

          {!historyLoading && messages.length === 0 && !streamingMsg && (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="text-4xl mb-3">🤖</div>
              <p className="text-sm font-medium mb-1" style={{ color: "#374151" }}>AI ассистент ChinaBridge</p>
              <p className="text-xs mb-6 text-center" style={{ color: "#9CA3AF" }}>
                Помню всё · История хранится в БД<br />Лимиты claude.ai не влияют
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {QUICK_PROMPTS.map((p) => (
                  <button key={p} onClick={() => send(p)}
                    className="text-left text-xs px-3 py-2.5 rounded-xl border hover:bg-blue-50 transition-colors"
                    style={{ color: "#374151", borderColor: "#E5E7EB" }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!historyLoading && messages.map((m, i) => {
            const msgDate = m.created_at
              ? new Date(m.created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" })
              : "";
            const showDivider = msgDate && msgDate !== lastDate;
            lastDate = msgDate;
            return (
              <div key={i}>
                {showDivider && <DateDivider date={msgDate} />}
                {m.role === "user"
                  ? <UserBubble msg={m} />
                  : <AssistantBubble msg={m} />}
              </div>
            );
          })}

          {streamingMsg && <AssistantBubble msg={streamingMsg} streaming />}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Напиши задачу или вопрос... (Enter — отправить, Shift+Enter — перенос)"
                rows={1}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border text-sm resize-none disabled:opacity-60"
                style={{ color: "#111827", backgroundColor: "#fff", borderColor: "#D1D5DB", maxHeight: 160 }}
              />
            </div>
            {loading ? (
              <button onClick={stop}
                className="px-4 py-3 rounded-xl font-medium text-sm flex-shrink-0"
                style={{ background: "#FEE2E2", color: "#991B1B" }}>
                ⏹
              </button>
            ) : (
              <button onClick={() => send()} disabled={!input.trim()}
                className="px-4 py-3 rounded-xl font-medium text-sm flex-shrink-0 disabled:opacity-40"
                style={{ background: "#2563EB", color: "#fff" }}>
                ↑
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
