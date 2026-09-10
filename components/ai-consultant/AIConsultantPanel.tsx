"use client";
import { useState, useRef, useEffect } from "react";
import type { CalcContext } from "@/lib/ai/agents/import-consultant";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const INITIAL_CTАС = [
  { id: "order",    icon: "🚀", label: "Хочу привезти этот товар",     msg: "Хочу заказать доставку этого товара. Что нужно сделать?" },
  { id: "consult",  icon: "💬", label: "Нужна консультация по схеме",  msg: "Расскажите подробнее о схеме работы. Как выглядит процесс закупки?" },
  { id: "delivery", icon: "📦", label: "Сколько стоит доставка?",      msg: "Сколько будет стоить доставка этой партии? Какие сроки?" },
];

interface Props {
  calcContext: CalcContext;
  sessionId: string;
  onClose?: () => void;
}

export default function AIConsultantPanel({ calcContext, sessionId, onClose }: Props) {
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [started,    setStarted]    = useState(false);
  const [leadDone,   setLeadDone]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setStarted(true);

    try {
      const res = await fetch("/api/ai-consultant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: text,
          calcContext: messages.length === 0 ? calcContext : undefined,
        }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages(prev => [...prev, { role: "assistant", text: data.message }]);
      }
      if (data.isLeadReady) {
        setLeadDone(true);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Ошибка соединения. Попробуйте ещё раз." }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const isKZ = calcContext.country_to === "KZ" || calcContext.marketplace === "kaspi";
  const currency = isKZ ? "₸" : "₽";
  const verdictColor = calcContext.verdict === "green" ? "text-[#00A86B]" : calcContext.verdict === "yellow" ? "text-yellow-400" : "text-red-400";

  return (
    <div className="rounded-2xl border border-[#1a3a5e] bg-gradient-to-b from-[#070f1d] to-[#04090f] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a3a5e]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#00A86B]/20 border border-[#00A86B]/40 flex items-center justify-center text-sm">
            🤖
          </div>
          <div>
            <p className="text-xs font-bold text-white">Алексей · AI-консультант</p>
            <p className="text-[10px] text-[#4a7a9b]">ChinaBridge · онлайн</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-[#5a7899] hover:text-white text-xl leading-none transition-colors">×</button>
        )}
      </div>

      {/* Context chip */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
          <span className="text-sm">{calcContext.verdict === "green" ? "🟢" : calcContext.verdict === "yellow" ? "🟡" : "🔴"}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{calcContext.product_name}</p>
            <p className="text-[10px] text-[#8899aa]">
              Маржа <span className={`font-bold ${verdictColor}`}>{calcContext.margin_pct.toFixed(1)}%</span>
              {" · "}Прибыль {Math.round(calcContext.net_profit_per_unit).toLocaleString("ru-RU")} {currency}/шт
              {" · "}{calcContext.marketplace.toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      {/* CTA buttons (only before first message) */}
      {!started && (
        <div className="px-4 py-2 flex flex-col gap-2">
          <p className="text-[10px] text-[#5a7899] text-center mb-1">Выберите, что вас интересует:</p>
          {INITIAL_CTАС.map(cta => (
            <button
              key={cta.id}
              onClick={() => send(cta.msg)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[#1e3a5e] hover:border-[#00A86B]/50 hover:bg-[#00A86B]/5 transition-all text-left group"
            >
              <span className="text-base shrink-0">{cta.icon}</span>
              <span className="text-xs text-[#aab8cc] group-hover:text-white transition-colors">{cta.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      {started && (
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-72 min-h-[120px]">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="w-6 h-6 rounded-full bg-[#00A86B]/20 border border-[#00A86B]/40 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  🤖
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-[#00A86B]/20 border border-[#00A86B]/30 text-white rounded-tr-sm"
                    : "bg-white/5 border border-white/10 text-[#ccddee] rounded-tl-sm"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2 justify-start">
              <div className="w-6 h-6 rounded-full bg-[#00A86B]/20 border border-[#00A86B]/40 flex items-center justify-center text-[10px] shrink-0">
                🤖
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-3 py-2">
                <span className="flex gap-1">
                  {[0,1,2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#5a7899] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Lead done */}
      {leadDone && (
        <div className="mx-4 mb-3 rounded-xl bg-[#00A86B]/10 border border-[#00A86B]/30 p-3 text-center">
          <p className="text-[#00A86B] font-semibold text-xs">✅ Заявка принята!</p>
          <p className="text-[#8899aa] text-[10px] mt-0.5">Менеджер свяжется в течение 5 минут</p>
        </div>
      )}

      {/* Input */}
      {started && !leadDone && (
        <div className="px-4 pb-4 pt-2 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Напишите вопрос..."
            className="flex-1 min-w-0 bg-[#0a1a2e] border border-[#243a5e] focus:border-[#00A86B]/60 rounded-xl px-3 py-2.5 text-xs placeholder:text-[#445566] outline-none transition-colors text-white"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 bg-[#00A86B] hover:bg-[#008f59] disabled:opacity-30 text-white font-bold rounded-xl text-xs shrink-0 transition-all active:scale-95"
          >
            →
          </button>
        </div>
      )}

      {/* Footer */}
      <p className="text-center text-[10px] text-[#334455] pb-2.5">
        AI · ChinaBridge · отвечает мгновенно
      </p>
    </div>
  );
}
