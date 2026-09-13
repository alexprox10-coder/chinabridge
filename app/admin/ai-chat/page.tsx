"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { AdminNav } from "@/components/admin/AdminNav";

interface Message {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

const MODELS = [
  { id: "anthropic/claude-opus-4-5", label: "Opus 4.5 (умнее)" },
  { id: "anthropic/claude-sonnet-4-5", label: "Sonnet 4.5 (быстрее)" },
  { id: "anthropic/claude-haiku-4-5", label: "Haiku 4.5 (дешевле)" },
  { id: "openai/gpt-4o", label: "GPT-4o" },
];

const QUICK_PROMPTS = [
  "Проверь chinabridge.pro и скажи что можно улучшить",
  "Покажи статистику лидов в outbound",
  "Что приоритетнее всего сделать по трафику?",
  "Проанализируй текущую воронку продаж",
  "Какие задачи ещё не выполнены по ChinaBridge?",
  "Помоги написать VK Ads текст для авто-аксессуаров KZ",
];

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end mb-3">
      <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-tr-sm text-sm" style={{ background: "#2563EB", color: "#fff" }}>
        {text}
      </div>
    </div>
  );
}

function AssistantBubble({ text, loading }: { text: string; loading?: boolean }) {
  return (
    <div className="flex justify-start mb-3">
      <div className="flex gap-2 max-w-[85%]">
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-sm" style={{ background: "#F3F4F6" }}>
          🤖
        </div>
        <div className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed whitespace-pre-wrap" style={{ background: "#fff", color: "#111827", border: "1px solid #E5E7EB" }}>
          {text || (loading ? <span className="animate-pulse" style={{ color: "#9CA3AF" }}>Думаю...</span> : "")}
          {loading && text && <span className="animate-pulse" style={{ color: "#9CA3AF" }}>▋</span>}
        </div>
      </div>
    </div>
  );
}

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState("anthropic/claude-opus-4-5");
  const [streamingText, setStreamingText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Auto-resize textarea
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
    setStreamingText("");

    const newMessages: Message[] = [...messages, { role: "user", content: msg, ts: Date.now() }];
    setMessages(newMessages);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const res = await fetch("/api/admin/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
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
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              fullText += parsed.text;
              setStreamingText(fullText);
            }
          } catch { /* ignore parse errors */ }
        }
      }

      setMessages(prev => [...prev, { role: "assistant", content: fullText, ts: Date.now() }]);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setMessages(prev => [...prev, { role: "assistant", content: `❌ Ошибка: ${String(e)}`, ts: Date.now() }]);
      }
    } finally {
      setLoading(false);
      setStreamingText("");
      abortRef.current = null;
    }
  }, [input, messages, model, loading]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const stop = () => { abortRef.current?.abort(); setLoading(false); };

  const clear = () => { setMessages([]); setStreamingText(""); };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F3F4F6", color: "#111827" }}>
      <style>{`textarea { color: #111827 !important; -webkit-text-fill-color: #111827 !important; background: #fff !important; }`}</style>
      <AdminNav />

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-4" style={{ height: "calc(100vh - 64px)" }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#111827" }}>🤖 AI Assistant</h1>
            <p className="text-xs" style={{ color: "#6B7280" }}>Прямой доступ через API · без лимитов claude.ai</p>
          </div>
          <div className="flex gap-2 items-center">
            <select value={model} onChange={e => setModel(e.target.value)}
              className="text-xs px-2 py-1 border rounded-lg" style={{ color: "#374151" }}>
              {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
            {messages.length > 0 && (
              <button onClick={clear} className="text-xs px-2 py-1 rounded-lg border" style={{ color: "#6B7280" }}>
                Очистить
              </button>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto rounded-xl border bg-white p-4 mb-3"
          style={{ border: "1px solid #E5E7EB", minHeight: 0 }}>

          {messages.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="text-4xl mb-3">🤖</div>
              <p className="text-sm font-medium mb-1" style={{ color: "#374151" }}>AI ассистент ChinaBridge</p>
              <p className="text-xs mb-6 text-center" style={{ color: "#9CA3AF" }}>
                Работает через API напрямую.<br />Лимиты claude.ai не влияют.
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

          {messages.map((m, i) =>
            m.role === "user"
              ? <UserBubble key={i} text={m.content} />
              : <AssistantBubble key={i} text={m.content} />
          )}

          {loading && (
            <AssistantBubble text={streamingText} loading />
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Напиши задачу или вопрос... (Enter — отправить, Shift+Enter — перенос)"
                rows={1}
                className="w-full px-4 py-3 rounded-xl border text-sm resize-none"
                style={{
                  color: "#111827", backgroundColor: "#fff",
                  borderColor: "#D1D5DB", outline: "none",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  maxHeight: 160,
                }}
              />
            </div>
            {loading ? (
              <button onClick={stop}
                className="px-4 py-3 rounded-xl font-medium text-sm flex-shrink-0"
                style={{ background: "#FEE2E2", color: "#991B1B" }}>
                ⏹ Стоп
              </button>
            ) : (
              <button onClick={() => send()} disabled={!input.trim()}
                className="px-4 py-3 rounded-xl font-medium text-sm flex-shrink-0 disabled:opacity-40"
                style={{ background: "#2563EB", color: "#fff" }}>
                Отправить
              </button>
            )}
          </div>
          <p className="text-xs mt-1.5 text-center" style={{ color: "#9CA3AF" }}>
            Модель: {MODELS.find(m => m.id === model)?.label} · API ключ: {process.env.NEXT_PUBLIC_HAS_API_KEY === "true" ? "✓" : "из env"}
          </p>
        </div>
      </div>
    </div>
  );
}
