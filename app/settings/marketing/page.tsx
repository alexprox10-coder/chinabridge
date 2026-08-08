"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

/* ── Settings nav ───────────────────────────────────────────────────────────── */
const SETTINGS_NAV = [
  { href: "/settings/billing",     label: "Тарифы",       icon: "💳" },
  { href: "/settings/marketing",   label: "Marketing AI", icon: "📣" },
  { href: "/settings/ai",          label: "AI",           icon: "🤖" },
  { href: "/settings/marketplace", label: "Модули",       icon: "🧩" },
  { href: "/settings/partners",    label: "Партнёры",     icon: "🤝" },
];

/* ── Quick actions ──────────────────────────────────────────────────────────── */
const QUICK_ACTIONS = [
  { emoji: "📊", label: "Медиаплан",     prompt: "Составь медиаплан на следующий месяц для моего бизнеса с бюджетом 30 000 ₽. Какие каналы, какой контент, какие KPI?" },
  { emoji: "🛒", label: "WB / Ozon",    prompt: "Как правильно продвигать товар на Wildberries? Разбери: карточка, SEO, реклама, отзывы, рейтинг продавца." },
  { emoji: "💹", label: "Юнит-экономика", prompt: "Помоги рассчитать юнит-экономику: товар стоит $5 в Китае, хочу продавать на WB. Покажи полный расчёт до чистой прибыли." },
  { emoji: "🔍", label: "Найти нишу",   prompt: "Какие ниши сейчас перспективны для импорта из Китая и продажи на WB/Ozon в 2026 году? С объёмами и конкуренцией." },
  { emoji: "📱", label: "Telegram",      prompt: "Как использовать Telegram для привлечения клиентов в мой бизнес? Стратегия, контент-план, монетизация." },
  { emoji: "🏭", label: "Поставщики",   prompt: "Как правильно работать с китайскими поставщиками: переговоры, проверка качества, условия оплаты, типичные ошибки." },
  { emoji: "📣", label: "Реклама",      prompt: "Какой рекламный канал лучше для моего товарного бизнеса: Яндекс Директ, VK, Telegram Ads или маркетплейс-реклама? Сравни." },
  { emoji: "📈", label: "Масштабирование", prompt: "Мой бизнес растёт. Как правильно масштабировать: больше товаров, больше каналов или выход на другие рынки?" },
];

/* ── Simple inline markdown ─────────────────────────────────────────────────── */
function InlineMd({ text }: { text: string }) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="text-white font-semibold">{p.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function MdLine({ line }: { line: string }) {
  if (line.startsWith("### ")) return <p className="font-semibold text-slate-200 mt-3 mb-1 text-sm"><InlineMd text={line.slice(4)} /></p>;
  if (line.startsWith("## "))  return <p className="font-bold text-white mt-3 mb-1"><InlineMd text={line.slice(3)} /></p>;
  if (line.match(/^[-*•]\s/)) return (
    <div className="flex gap-2 my-0.5 leading-relaxed">
      <span className="text-slate-500 shrink-0 mt-0.5">•</span>
      <span><InlineMd text={line.slice(2)} /></span>
    </div>
  );
  if (line.match(/^\d+\.\s/)) {
    const num = line.match(/^(\d+)\.\s/)![1];
    return (
      <div className="flex gap-2 my-0.5 leading-relaxed">
        <span className="text-slate-500 shrink-0 mt-0.5 tabular-nums">{num}.</span>
        <span><InlineMd text={line.replace(/^\d+\.\s/, "")} /></span>
      </div>
    );
  }
  if (line === "") return <div className="h-2" />;
  return <p className="leading-relaxed"><InlineMd text={line} /></p>;
}

function MarkdownBlock({ content }: { content: string }) {
  if (!content) return <span className="inline-block w-2 h-4 bg-slate-500 animate-pulse rounded-sm" />;
  return (
    <div className="text-sm text-slate-300 space-y-0.5">
      {content.split("\n").map((line, i) => <MdLine key={i} line={line} />)}
    </div>
  );
}

const WELCOME: Message = {
  id: 0,
  role: "assistant",
  content: `Привет! Я AI-директор по маркетингу вашего бизнеса.\n\nПомогу с:\n- Стратегией продвижения товаров на WB, Ozon, Kaspi\n- Медиапланом и рекламными каналами\n- Юнит-экономикой и ценообразованием\n- Поиском ниш и анализом конкурентов\n- Контентом для соцсетей и Telegram\n\nС чего начнём?`,
};

/* ── Main component ─────────────────────────────────────────────────────────── */
export default function MarketingAiPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [company, setCompany] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    /* Try to read company name from settings */
    try {
      const saved = localStorage.getItem("cb_company_name");
      if (saved) setCompany(saved);
    } catch {}
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const msgId = Date.now();
    const history = messages
      .slice(-10)
      .filter((m) => m.id !== 0)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { id: msgId, role: "user", content: text.trim() }]);
    setInput("");
    setIsStreaming(true);

    const aiId = msgId + 1;
    setMessages((prev) => [...prev, { id: aiId, role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/settings/marketing-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), history, company }),
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
            setMessages((prev) => prev.map((m) => m.id === aiId ? { ...m, content: full } : m));
          } catch {}
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) => m.id === aiId ? { ...m, content: "❌ Ошибка соединения. Попробуйте ещё раз." } : m),
      );
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }, [messages, isStreaming, company]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-20 bg-slate-900 border-b border-slate-800">
        {/* Settings nav */}
        <div className="flex items-center gap-1 px-4 overflow-x-auto scrollbar-hide py-2.5">
          <Link href="/settings/billing" className="shrink-0 text-xs text-slate-400 hover:text-slate-200 px-1 py-0.5 mr-2 transition-colors font-semibold">
            ← Кабинет
          </Link>
          {SETTINGS_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                item.href === "/settings/marketing"
                  ? "bg-violet-600/20 text-violet-300 border-violet-600/40"
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Page header */}
        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📣</span>
            <div>
              <p className="text-sm font-bold text-slate-100">Marketing AI</p>
              <p className="text-xs text-slate-500">AI-директор по маркетингу вашего бизнеса</p>
            </div>
          </div>
          {/* Company name input */}
          <input
            value={company}
            onChange={(e) => { setCompany(e.target.value); localStorage.setItem("cb_company_name", e.target.value); }}
            placeholder="Название вашего бизнеса"
            className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-600/40 w-48 hidden sm:block"
          />
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div className="flex gap-2 overflow-x-auto px-4 py-2.5 border-b border-slate-800 bg-slate-900/30 scrollbar-hide">
        {QUICK_ACTIONS.map((qa) => (
          <button
            key={qa.label}
            onClick={() => sendMessage(qa.prompt)}
            disabled={isStreaming}
            className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-slate-300 rounded-full transition-colors"
          >
            <span>{qa.emoji}</span>
            <span className="whitespace-nowrap">{qa.label}</span>
          </button>
        ))}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-4xl mx-auto w-full">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-600/30 flex items-center justify-center text-base shrink-0 mr-2 mt-0.5">
                📣
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-violet-600/20 border border-violet-600/30 text-slate-200 text-sm"
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

      {/* ── Input ── */}
      <div className="sticky bottom-0 bg-slate-950/95 backdrop-blur border-t border-slate-800 px-4 py-4">
        <div className="max-w-4xl mx-auto flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            rows={2}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-600/50 focus:border-violet-600/50 resize-none disabled:opacity-50 transition-colors"
            placeholder="Задайте вопрос о маркетинге вашего бизнеса... (Enter — отправить)"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isStreaming || !input.trim()}
            className="shrink-0 w-10 h-10 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors"
          >
            {isStreaming ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="text-sm">↑</span>
            )}
          </button>
        </div>
        <p className="text-xs text-slate-700 mt-1.5 max-w-4xl mx-auto">
          Powered by ChinaBridge AI · <Link href="/settings/ai" className="hover:text-slate-500 transition-colors">Настройки AI</Link>
        </p>
      </div>
    </div>
  );
}
