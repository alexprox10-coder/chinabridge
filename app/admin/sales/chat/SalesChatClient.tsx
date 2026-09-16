"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface LeadContext {
  company_name: string;
  category: string;
  opportunity_score: number;
  consultant_context_message?: string;
}

const PROMPTS = [
  "Дай задачи на сегодня",
  "Найди горячих клиентов из базы",
  "Напиши первое сообщение для WB-продавца",
  "Как ответить на возражение 'дорого'?",
  "Сделай анализ компании: [название]",
  "Какой оффер предложить магазину электроники?",
];

export function SalesChatClient({ initialLeadId }: { initialLeadId?: string | null }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [leadContext, setLeadContext] = useState<LeadContext | null>(null);
  const [leadLoading, setLeadLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const leadLoadedRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText]);

  // §23: Load lead context when ?lead= param is present
  useEffect(() => {
    if (!initialLeadId || leadLoadedRef.current) return;
    leadLoadedRef.current = true;
    setLeadLoading(true);
    fetch(`/api/outbound/context?id=${initialLeadId}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.context) {
          const ctx = data.context as LeadContext & { consultant_context_message?: string };
          setLeadContext({ company_name: data.company_name, category: data.category, opportunity_score: data.opportunity_score, consultant_context_message: ctx.consultant_context_message });
          if (ctx.consultant_context_message) {
            setInput(ctx.consultant_context_message);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLeadLoading(false));
  }, [initialLeadId]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Message = { role: "user", content };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);
    setStreamText("");

    try {
      const res = await fetch("/api/admin/sales/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok || !res.body) {
        setMessages(prev => [...prev, { role: "assistant", content: "Ошибка соединения с AI. Попробуй ещё раз." }]);
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") continue;
          try {
            const json = JSON.parse(raw);
            const delta = json.choices?.[0]?.delta?.content ?? "";
            full += delta;
            setStreamText(full);
          } catch {}
        }
      }

      setMessages(prev => [...prev, { role: "assistant", content: full }]);
      setStreamText("");
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Ошибка. Попробуй ещё раз." }]);
    }
    setLoading(false);
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const copy = (text: string) => navigator.clipboard.writeText(text).catch(() => {});

  const renderMessage = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**")) {
        return <p key={i} className="font-semibold text-white mt-2">{line.slice(2, -2)}</p>;
      }
      if (line.startsWith("- ") || line.startsWith("• ")) {
        return <li key={i} className="ml-4 text-slate-300 text-sm">{line.slice(2)}</li>;
      }
      if (line === "") return <div key={i} className="h-2" />;
      return <p key={i} className="text-slate-300 text-sm">{line}</p>;
    });
  };

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-800 bg-slate-900 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/sales" className="text-slate-500 hover:text-white transition text-sm">← Назад</Link>
          <div className="w-px h-4 bg-slate-700" />
          <div>
            <h1 className="text-white font-semibold text-sm">🤖 AI Sales Manager</h1>
            <p className="text-slate-500 text-xs">ChinaBridge · Copilot Mode</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-green-400 text-xs">Online</span>
        </div>
      </div>

      {/* §23: Lead handoff banner */}
      {leadLoading && (
        <div className="flex-shrink-0 bg-amber-900/20 border-b border-amber-700/30 px-5 py-2 text-amber-400 text-xs">
          ⏳ Загрузка контекста лида...
        </div>
      )}
      {leadContext && !leadLoading && (
        <div className="flex-shrink-0 bg-emerald-900/20 border-b border-emerald-700/30 px-5 py-2 flex items-center justify-between">
          <div className="text-emerald-400 text-xs">
            🤝 Handoff: <span className="font-semibold text-emerald-300">{leadContext.company_name}</span> · {leadContext.category} · Opportunity {leadContext.opportunity_score}/100
          </div>
          <Link href={`/admin/outbound?lead=${initialLeadId}`} className="text-emerald-600 hover:text-emerald-400 text-xs transition">
            ← Назад к лиду
          </Link>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="max-w-2xl mx-auto mt-8">
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">🤖</div>
              <h2 className="text-white font-semibold text-lg">AI Sales Manager</h2>
              <p className="text-slate-500 text-sm mt-1">Анализирует компании, определяет оффер, пишет сообщения</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => send(prompt)}
                  className="text-left px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 text-sm transition hover:text-white"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <span className="text-lg mr-2 flex-shrink-0 mt-1">🤖</span>
            )}
            <div className={`max-w-2xl rounded-2xl px-4 py-3 group relative ${
              msg.role === "user"
                ? "bg-red-600/30 border border-red-700/50 text-white text-sm"
                : "bg-slate-800 border border-slate-700"
            }`}>
              {msg.role === "assistant" ? (
                <div className="space-y-0.5">{renderMessage(msg.content)}</div>
              ) : (
                <p className="text-sm">{msg.content}</p>
              )}
              {msg.role === "assistant" && (
                <button
                  onClick={() => copy(msg.content)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-slate-500 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-700"
                >
                  копировать
                </button>
              )}
            </div>
          </div>
        ))}

        {(loading || streamText) && (
          <div className="flex justify-start">
            <span className="text-lg mr-2 flex-shrink-0 mt-1">🤖</span>
            <div className="max-w-2xl rounded-2xl px-4 py-3 bg-slate-800 border border-slate-700">
              {streamText ? (
                <div className="space-y-0.5">{renderMessage(streamText)}<span className="inline-block w-0.5 h-4 bg-slate-400 animate-pulse ml-0.5" /></div>
              ) : (
                <div className="flex gap-1 items-center py-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-slate-800 bg-slate-900 px-4 py-3">
        <div className="max-w-2xl mx-auto flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Напиши запрос... (Enter отправить, Shift+Enter новая строка)"
            className="flex-1 resize-none bg-slate-800 border border-slate-700 focus:border-slate-500 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 outline-none transition max-h-32"
            style={{ minHeight: "44px" }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white px-4 py-3 rounded-xl transition font-medium text-sm flex-shrink-0"
          >
            ↑
          </button>
        </div>
        <p className="text-center text-slate-700 text-xs mt-2">Copilot Mode — AI советует, вы решаете</p>
      </div>
    </div>
  );
}
